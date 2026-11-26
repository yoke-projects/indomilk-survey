import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    Box, Typography, Button, TextField, Paper, IconButton, Checkbox,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, CircularProgress, Alert, Grid, InputAdornment, Dialog,
    DialogTitle, DialogContent, DialogActions, Drawer,
    LinearProgress, Tooltip, Pagination, Collapse, Select, MenuItem, FormControl, Popover
} from '@mui/material';
import {
    Upload, Download, Trash2, Eye, ShoppingCart,
    CloudUpload, X, Check, Info, ChevronLeft, ChevronRight,
    Filter, RotateCcw, ChevronDown, ChevronUp,
    TrendingUp, DollarSign, Columns3, Search as SearchIcon,
    Calendar, Store, Building2, FileText, Image as ImageIcon
} from 'lucide-react';
import { ref, onValue, push, set, remove } from 'firebase/database';
import { db } from '../firebase';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
    PO_COLUMNS, PO_IMAGE_TO_LINK_MAPPING,
    calculateAllTotals, buildPOMapping, normalizeHeader,
    formatCurrency, formatTanggal, parseTanggal, parseInputDate, getNamaBulan
} from '../utils/poColumns';

const ROWS_PER_PAGE = 25;
const STORAGE_KEY = 'indomilk_po_visible_columns';
const ALL_PO_KEYS = PO_COLUMNS.map(c => c.key);

const EMPTY_FILTER = {
    namaKantin: '', namaSekolah: '', area: '', namaPersonil: '', userid: '',
    role: '', nomorPO: '', bulan: '', tahun: '',
    tanggalDari: '', tanggalSampai: '',
    nominalMin: '', nominalMax: '', status: ''
};

const PillButton = ({ icon: Icon, label, badge, onClick, color = 'default', endIcon: EndIcon }) => {
    const colorMap = {
        default: { border: '#d1d5db', color: '#374151', bg: 'white', hover: '#f9fafb' },
        primary: { border: '#3b82f6', color: '#3b82f6', bg: 'rgba(59,130,246,0.04)', hover: 'rgba(59,130,246,0.08)' },
    };
    const c = colorMap[color];
    return (
        <Button onClick={onClick} variant="outlined" size="small"
            startIcon={Icon ? <Icon size={15} /> : null}
            endIcon={EndIcon ? <EndIcon size={14} /> : null}
            sx={{ borderRadius: 999, borderColor: c.border, color: c.color, bgcolor: c.bg, px: 1.5, py: 0.6, fontSize: '0.82rem', fontWeight: 500, '&:hover': { bgcolor: c.hover, borderColor: c.color } }}>
            {label}
            {badge !== undefined && badge > 0 && (
                <Box sx={{ ml: 0.5, minWidth: 18, height: 18, borderRadius: 999, bgcolor: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, px: 0.5 }}>{badge}</Box>
            )}
        </Button>
    );
};

const SortIcon = () => (
    <Box component="svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4, display: 'inline-block', verticalAlign: 'middle' }}>
        <path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>
    </Box>
);

export default function POManagement() {
    const [poData, setPoData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [page, setPage] = useState(1);
    const [filterOpen, setFilterOpen] = useState(true);
    const [filterDraft, setFilterDraft] = useState({ ...EMPTY_FILTER });
    const [activeFilter, setActiveFilter] = useState({ ...EMPTY_FILTER });
    const [visibleKeys, setVisibleKeys] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) return ALL_PO_KEYS.filter(k => parsed.includes(k)); }
        } catch { /* ignore */ }
        return ALL_PO_KEYS;
    });
    const [columnAnchor, setColumnAnchor] = useState(null);
    const [columnSearch, setColumnSearch] = useState('');
    const columnOpen = Boolean(columnAnchor);
    const [scorecardDialogOpen, setScorecardDialogOpen] = useState(false);
    const [scorecardData, setScorecardData] = useState([]);
    const [scorecardTitle, setScorecardTitle] = useState('');

    useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleKeys)); } catch { /* ignore */ } }, [visibleKeys]);

    const visibleColumns = useMemo(() => PO_COLUMNS.filter(c => visibleKeys.includes(c.key)), [visibleKeys]);
    const toggleColumn = (key) => setVisibleKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    const selectAllColumns = () => setVisibleKeys([...ALL_PO_KEYS]);
    const clearAllColumns = () => setVisibleKeys([]);
    const closeColumnPopover = () => { setColumnAnchor(null); setColumnSearch(''); };

    const filteredColumnList = useMemo(() => {
        if (!columnSearch) return PO_COLUMNS;
        const q = columnSearch.toLowerCase();
        return PO_COLUMNS.filter(c => c.label.toLowerCase().includes(q) || c.excel.toLowerCase().includes(q));
    }, [columnSearch]);

    useEffect(() => {
        const poRef = ref(db, 'po_data');
        const unsubscribe = onValue(poRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const arr = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
                arr.sort((a, b) => new Date(b.timestamp || b.tanggalPembuatanPO || 0) - new Date(a.timestamp || a.tanggalPembuatanPO || 0));
                setPoData(arr);
            } else { setPoData([]); }
            setLoading(false);
        }, (err) => { console.error(err); setError('Gagal memuat data PO.'); setLoading(false); });
        return () => unsubscribe();
    }, []);

    const handleFilterChange = useCallback((field, value) => { setFilterDraft(prev => ({ ...prev, [field]: value })); }, []);

    const handleApplyFilter = useCallback(() => {
        const finalFilter = { ...filterDraft };
        if (finalFilter.tanggalDari) { const d = parseInputDate(finalFilter.tanggalDari); if (d) finalFilter.tanggalDari = formatTanggal(d); }
        if (finalFilter.tanggalSampai) { const d = parseInputDate(finalFilter.tanggalSampai); if (d) finalFilter.tanggalSampai = formatTanggal(d); }
        setActiveFilter(finalFilter); setPage(1);
    }, [filterDraft]);

    const handleResetFilter = useCallback(() => { setFilterDraft({ ...EMPTY_FILTER }); setActiveFilter({ ...EMPTY_FILTER }); setPage(1); }, []);

    const activeFilterCount = useMemo(() => Object.values(activeFilter).filter(v => v !== '' && v !== null && v !== undefined).length, [activeFilter]);

    const filteredPO = useMemo(() => {
        return poData.filter(p => {
            const f = activeFilter;
            if (f.namaKantin && !(p.namaKantin || '').toLowerCase().includes(f.namaKantin.toLowerCase())) return false;
            if (f.namaSekolah && !(p.namaSekolah || '').toLowerCase().includes(f.namaSekolah.toLowerCase())) return false;
            if (f.area && !(p.area || '').toLowerCase().includes(f.area.toLowerCase())) return false;
            if (f.namaPersonil && !(p.namaPersonil || '').toLowerCase().includes(f.namaPersonil.toLowerCase())) return false;
            if (f.userid && !(p.userid || '').toLowerCase().includes(f.userid.toLowerCase())) return false;
            if (f.nomorPO && !(p.nomorPO || '').toLowerCase().includes(f.nomorPO.toLowerCase())) return false;
            if (f.role && p.role !== f.role) return false;
            if (f.bulan && p.bulan !== f.bulan) return false;
            if (f.tahun && String(p.tahun) !== String(f.tahun)) return false;
            if (f.status === 'datang' && !p.tanggalPODatang) return false;
            if (f.status === 'belum' && p.tanggalPODatang) return false;
            if (f.tanggalDari) { const dari = parseTanggal(f.tanggalDari); const tgl = parseTanggal(p.tanggalPembuatanPO); if (!tgl || !dari || tgl < dari) return false; }
            if (f.tanggalSampai) { const sampai = parseTanggal(f.tanggalSampai); const tgl = parseTanggal(p.tanggalPembuatanPO); if (!tgl || !sampai || tgl > sampai) return false; }
            if (f.nominalMin !== '' && Number(p.nominalInvoice) < Number(f.nominalMin)) return false;
            if (f.nominalMax !== '' && Number(p.nominalInvoice) > Number(f.nominalMax)) return false;
            return true;
        });
    }, [poData, activeFilter]);

    const totalPages = Math.ceil(filteredPO.length / ROWS_PER_PAGE) || 1;
    const paginatedPO = filteredPO.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

    const stats = useMemo(() => {
        const totalQty = filteredPO.reduce((sum, p) => sum + (Number(p.totalQty) || 0), 0);
        const totalNominal = filteredPO.reduce((sum, p) => sum + (Number(p.nominalInvoice) || 0), 0);
        const sudahDatang = filteredPO.filter(p => p.tanggalPODatang).length;
        return { total: filteredPO.length, totalQty, totalNominal, sudahDatang, belumDatang: filteredPO.length - sudahDatang };
    }, [filteredPO]);

    const handleScorecardClick = (type) => {
        let data = []; let title = '';
        if (type === 'total') { data = filteredPO; title = 'Detail Semua Data PO'; }
        else if (type === 'datang') { data = filteredPO.filter(p => p.tanggalPODatang); title = 'Detail PO Sudah Datang'; }
        else if (type === 'belum') { data = filteredPO.filter(p => !p.tanggalPODatang); title = 'Detail PO Belum Datang'; }
        else if (type === 'nominal') { data = filteredPO; title = 'Detail Nominal Invoice'; }
        setScorecardData(data); setScorecardTitle(title); setScorecardDialogOpen(true);
    };

    const handleDownloadTemplate = () => {
        const headers = PO_COLUMNS.map(c => c.excel);
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        ws['!cols'] = PO_COLUMNS.map(c => ({ wch: Math.max(15, c.excel.length + 2) }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template PO');
        saveAs(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/octet-stream' }), 'Template_PO_Indomilk.xlsx');
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0]; if (!file) return;
        setUploadError(''); setPreviewData([]);
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const workbook = XLSX.read(new Uint8Array(evt.target.result), { type: 'array' });
                const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
                if (jsonData.length === 0) { setUploadError('File Excel kosong.'); return; }
                const mapping = buildPOMapping();
                const mappedData = jsonData.map((row) => {
                    const mapped = {};
                    Object.keys(row).forEach(header => { const key = mapping[normalizeHeader(header)]; if (key) mapped[key] = row[header]; });
                    Object.entries(PO_IMAGE_TO_LINK_MAPPING).forEach(([imgKey, linkKey]) => {
                        if (mapped[linkKey] && typeof mapped[linkKey] === 'string' && mapped[linkKey].startsWith('http')) mapped[imgKey] = mapped[linkKey];
                    });
                    const totals = calculateAllTotals(mapped);
                    Object.assign(mapped, totals);
                    if (mapped.tanggalPembuatanPO) {
                        const d = parseTanggal(mapped.tanggalPembuatanPO);
                        if (d) { if (!mapped.bulan) mapped.bulan = getNamaBulan(d); if (!mapped.tahun) mapped.tahun = d.getFullYear(); }
                    }
                    if (!mapped.timestamp) mapped.timestamp = new Date().toISOString();
                    return mapped;
                });
                setPreviewData(mappedData);
            } catch { setUploadError('Gagal membaca file Excel.'); }
        };
        reader.readAsArrayBuffer(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSaveToFirebase = async () => {
        if (previewData.length === 0) return;
        setUploading(true); setUploadProgress(0); setUploadError('');
        try {
            const poRef = ref(db, 'po_data');
            for (let i = 0; i < previewData.length; i++) {
                await set(push(poRef), previewData[i]);
                setUploadProgress(Math.round(((i + 1) / previewData.length) * 100));
            }
            setUploadDialogOpen(false); setPreviewData([]); setPage(1);
        } catch (err) { setUploadError('Gagal menyimpan: ' + err.message); }
        finally { setUploading(false); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Yakin ingin menghapus data PO ini?')) {
            try { await remove(ref(db, `po_data/${id}`)); } catch { alert('Gagal menghapus data.'); }
        }
    };

    const handleExport = () => {
        if (poData.length === 0) { alert('Tidak ada data untuk di-export.'); return; }
        const exportData = poData.map(p => { const row = {}; PO_COLUMNS.forEach(col => { row[col.excel] = p[col.key] ?? ''; }); return row; });
        const ws = XLSX.utils.json_to_sheet(exportData);
        ws['!cols'] = PO_COLUMNS.map(c => ({ wch: Math.max(15, c.excel.length + 2) }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data PO');
        saveAs(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/octet-stream' }), `Data_PO_Indomilk_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const formatDate = (dateStr) => { if (!dateStr) return '-'; const parsed = parseTanggal(dateStr); return parsed ? formatTanggal(parsed) : dateStr; };

    const renderCellValue = (col, value) => {
        if (value === null || value === undefined || value === '') return <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>-</span>;

        if (col.type === 'image' && typeof value === 'string' && value.startsWith('http')) {
            return (
                <Box component="img" src={value} alt={col.label} onClick={() => setImagePreview(value)}
                    sx={{ width: 36, height: 36, objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', border: '1px solid #e5e7eb', '&:hover': { opacity: 0.8, transform: 'scale(1.15)' }, transition: 'all 0.2s', display: 'block' }}
                    onError={(e) => { e.target.style.display = 'none'; }} />
            );
        }

        if (col.type === 'currency') {
            return <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981' }}>{formatCurrency(value)}</span>;
        }

        if (col.type === 'date' || col.type === 'datetime') {
            return <span style={{ fontSize: '0.75rem' }}>{formatDate(value)}</span>;
        }

        if (col.type === 'url' && typeof value === 'string' && value.startsWith('http')) {
            return (
                <Box component="a" onClick={(e) => { e.preventDefault(); setImagePreview(value); }}
                    sx={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                    Lihat
                </Box>
            );
        }

        if (col.type === 'number') {
            const num = Number(value);
            if (isNaN(num)) return <span style={{ fontSize: '0.75rem' }}>{value}</span>;
            return <span style={{ fontSize: '0.75rem', fontWeight: num > 0 ? 600 : 400, color: num > 0 ? '#374151' : '#9ca3af' }}>{num.toLocaleString('en-US')}</span>;
        }

        const strVal = String(value);
        if (strVal.length > 28) {
            return <Tooltip title={strVal} arrow placement="top"><span style={{ cursor: 'help', fontSize: '0.75rem' }}>{strVal.substring(0, 28)}...</span></Tooltip>;
        }
        return <span style={{ fontSize: '0.75rem' }}>{strVal}</span>;
    };

    const colMinWidth = (col) => {
        if (col.type === 'image') return 50;
        if (col.type === 'currency') return 90;
        if (col.type === 'number') return 70;
        if (col.type === 'date' || col.type === 'datetime') return 100;
        if (col.type === 'url') return 70;
        return 100;
    };

    const fieldStyle = { '& .MuiInputBase-root': { fontSize: '0.82rem', borderRadius: 999, bgcolor: 'background.paper' } };

    return (
        <Box sx={{ width: '100%', maxWidth: '100%' }}>
            <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: '0.78rem', color: '#6b7280' }}>Home &gt; <span style={{ color: '#111827', fontWeight: 500 }}>PO Management</span></Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
                <Typography variant="h4" sx={{ color: '#111827' }}>Purchase Order</Typography>
            </Box>

            <Paper sx={{ p: 3, mb: 2, bgcolor: 'white', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Button variant="outlined" size="small" startIcon={<Download size={15} />} onClick={handleDownloadTemplate} sx={{ borderColor: '#d1d5db', color: '#374151', borderRadius: 999, px: 2 }}>Template</Button>
                    <Button variant="outlined" size="small" startIcon={<Download size={15} />} onClick={handleExport} disabled={poData.length === 0} sx={{ borderColor: '#10b981', color: '#10b981', bgcolor: 'rgba(16,185,129,0.04)', '&:hover': { bgcolor: 'rgba(16,185,129,0.08)' }, borderRadius: 999, px: 2 }}>Export</Button>
                    <Button variant="contained" size="small" startIcon={<Upload size={16} />} onClick={() => setUploadDialogOpen(true)} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, borderRadius: 999, px: 2 }}>Upload Excel</Button>
                    <Button variant="outlined" size="small" startIcon={<Columns3 size={15} />} endIcon={<ChevronDown size={14} />} onClick={(e) => setColumnAnchor(e.currentTarget)} sx={{ borderColor: '#d1d5db', color: '#374151', borderRadius: 999, px: 2 }}>Kolom ({visibleKeys.length}/{PO_COLUMNS.length})</Button>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5, alignItems: 'center' }}>
                    <PillButton icon={Filter} label="Filter" badge={activeFilterCount} color="primary" onClick={() => setFilterOpen(!filterOpen)} endIcon={filterOpen ? ChevronUp : ChevronDown} />
                    <PillButton icon={Calendar} label="Periode" onClick={() => setFilterOpen(true)} />
                    <PillButton icon={Store} label="Area" onClick={() => setFilterOpen(true)} />
                    <PillButton icon={Building2} label="Kantin" onClick={() => setFilterOpen(true)} />
                    <PillButton icon={FileText} label="Nomor PO" onClick={() => setFilterOpen(true)} />
                </Box>

                {activeFilterCount > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.5 }}>
                        {Object.entries(activeFilter).map(([key, value]) => {
                            if (value === '' || value === null || value === undefined) return null;
                            const labelMap = { namaKantin: 'Kantin', namaSekolah: 'Sekolah', area: 'Area', namaPersonil: 'Personil', userid: 'User ID', role: 'Role', nomorPO: 'No. PO', bulan: 'Bulan', tahun: 'Tahun', tanggalDari: 'Dari', tanggalSampai: 'Sampai', nominalMin: 'Min', nominalMax: 'Max', status: 'Status' };
                            return <Chip key={key} label={`${labelMap[key] || key}: ${value}`} size="small" onDelete={() => handleFilterChange(key, '')} sx={{ bgcolor: 'rgba(59,130,246,0.08)', color: '#3b82f6', fontWeight: 500, fontSize: '0.72rem', height: 26, borderRadius: 999, border: '1px solid rgba(59,130,246,0.2)' }} />;
                        })}
                    </Box>
                )}

                <Collapse in={filterOpen}>
                    <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider', mt: 1 }}>
                        <Grid container spacing={1.5}>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" placeholder="Nomor PO" value={filterDraft.nomorPO} onChange={(e) => handleFilterChange('nomorPO', e.target.value)} sx={fieldStyle} /></Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" placeholder="Nama Kantin" value={filterDraft.namaKantin} onChange={(e) => handleFilterChange('namaKantin', e.target.value)} sx={fieldStyle} /></Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" placeholder="Nama Sekolah" value={filterDraft.namaSekolah} onChange={(e) => handleFilterChange('namaSekolah', e.target.value)} sx={fieldStyle} /></Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" placeholder="Area" value={filterDraft.area} onChange={(e) => handleFilterChange('area', e.target.value)} sx={fieldStyle} /></Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" placeholder="Nama Personil" value={filterDraft.namaPersonil} onChange={(e) => handleFilterChange('namaPersonil', e.target.value)} sx={fieldStyle} /></Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" placeholder="User ID" value={filterDraft.userid} onChange={(e) => handleFilterChange('userid', e.target.value)} sx={fieldStyle} /></Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}><FormControl fullWidth size="small"><Select value={filterDraft.role} onChange={(e) => handleFilterChange('role', e.target.value)} displayEmpty sx={{ fontSize: '0.82rem', borderRadius: 999 }}><MenuItem value="" disabled>Role</MenuItem><MenuItem value="SPG">SPG</MenuItem><MenuItem value="TEAMLEADER">Team Leader</MenuItem><MenuItem value="MD">MD</MenuItem><MenuItem value="SUPERVISOR">Supervisor</MenuItem></Select></FormControl></Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}><FormControl fullWidth size="small"><Select value={filterDraft.status} onChange={(e) => handleFilterChange('status', e.target.value)} displayEmpty sx={{ fontSize: '0.82rem', borderRadius: 999 }}><MenuItem value="" disabled>Status PO</MenuItem><MenuItem value="datang">Sudah Datang</MenuItem><MenuItem value="belum">Belum Datang</MenuItem></Select></FormControl></Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}><FormControl fullWidth size="small"><Select value={filterDraft.bulan} onChange={(e) => handleFilterChange('bulan', e.target.value)} displayEmpty sx={{ fontSize: '0.82rem', borderRadius: 999 }}><MenuItem value="" disabled>Bulan</MenuItem>{['JANUARI','FEBRUARI','MARET','APRIL','MEI','JUNI','JULI','AGUSTUS','SEPTEMBER','OKTOBER','NOVEMBER','DESEMBER'].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}</Select></FormControl></Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}><FormControl fullWidth size="small"><Select value={filterDraft.tahun} onChange={(e) => handleFilterChange('tahun', e.target.value)} displayEmpty sx={{ fontSize: '0.82rem', borderRadius: 999 }}><MenuItem value="" disabled>Tahun</MenuItem>{[2024, 2025, 2026, 2027].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}</Select></FormControl></Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" type="date" value={filterDraft.tanggalDari} onChange={(e) => handleFilterChange('tanggalDari', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={fieldStyle} /></Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" type="date" value={filterDraft.tanggalSampai} onChange={(e) => handleFilterChange('tanggalSampai', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={fieldStyle} /></Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" placeholder="Nominal Min" type="number" value={filterDraft.nominalMin} onChange={(e) => handleFilterChange('nominalMin', e.target.value)} sx={fieldStyle} slotProps={{ htmlInput: { min: 0 } }} /></Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" placeholder="Nominal Max" type="number" value={filterDraft.nominalMax} onChange={(e) => handleFilterChange('nominalMax', e.target.value)} sx={fieldStyle} slotProps={{ htmlInput: { min: 0 } }} /></Grid>
                            <Grid size={12}><Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 1 }}><Button variant="outlined" size="small" startIcon={<RotateCcw size={14} />} onClick={handleResetFilter} sx={{ borderColor: '#ef4444', color: '#ef4444', borderRadius: 999 }}>Reset</Button><Button variant="contained" size="small" startIcon={<Check size={14} />} onClick={handleApplyFilter} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, borderRadius: 999, px: 2.5 }}>Terapkan Filter</Button></Box></Grid>
                        </Grid>
                    </Box>
                </Collapse>
            </Paper>

            <Grid container spacing={2} sx={{ mb: 2.5 }}>
                {[
                    { label: 'Total PO', value: stats.total, color: '#3b82f6', icon: ShoppingCart, type: 'total' },
                    { label: 'Sudah Datang', value: stats.sudahDatang, color: '#10b981', icon: Check, type: 'datang' },
                    { label: 'Belum Datang', value: stats.belumDatang, color: '#f59e0b', icon: TrendingUp, type: 'belum' },
                    { label: 'Total Nominal', value: formatCurrency(stats.totalNominal), color: '#8b5cf6', icon: DollarSign, type: 'nominal' },
                ].map((card) => {
                    const Icon = card.icon;
                    return (
                        <Grid size={{ xs: 6, sm: 6, md: 3 }} key={card.label}>
                            <Paper onClick={() => handleScorecardClick(card.type)} sx={{ p: 2, position: 'relative', overflow: 'hidden', width: '100%', height: '100%', border: '1px solid #e5e7eb', borderRadius: 2, transition: 'all 0.2s ease', cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', borderColor: card.color } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#6b7280', mb: 0.5 }}>{card.label}</Typography>
                                        <Typography sx={{ fontSize: card.type === 'nominal' ? '1.25rem' : '1.75rem', fontWeight: 700, color: card.color, lineHeight: 1.2, letterSpacing: '-0.02em', wordBreak: 'break-all' }}>{card.value}</Typography>
                                        <Typography sx={{ fontSize: '0.68rem', color: '#9ca3af', mt: 0.5 }}>{stats.total > 0 && card.type !== 'nominal' && card.type !== 'total' ? Math.round((Number(card.value) / stats.total) * 100) : ''}% dari total</Typography>
                                    </Box>
                                    <Box sx={{ width: 44, height: 44, borderRadius: 2, flexShrink: 0, background: `${card.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={22} color={card.color} strokeWidth={2} /></Box>
                                </Box>
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>

            <Paper sx={{ overflow: 'hidden', width: '100%', border: '1px solid #e5e7eb', borderRadius: 2, bgcolor: 'white' }}>
                {loading ? (<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={32} sx={{ color: '#3b82f6' }} /></Box>) : error ? (<Alert severity="error" sx={{ m: 2 }}>{error}</Alert>) : (
                    <>
                        <TableContainer sx={{ maxHeight: 'calc(100vh - 340px)', overflowX: 'auto', overflowY: 'auto', '&::-webkit-scrollbar': { height: 8, width: 8 }, '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: 8 } }}>
                            <Table stickyHeader size="small" sx={{ width: '100%', tableLayout: 'auto', '& .MuiTableCell-root': { fontSize: '0.75rem', padding: '10px 14px', whiteSpace: 'nowrap', borderBottom: '1px solid #e5e7eb' } }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 600, fontSize: '0.78rem', color: '#374151', position: 'sticky', left: 0, zIndex: 4, minWidth: 50, textAlign: 'center' }}>No</TableCell>
                                        {visibleColumns.map((col) => (<TableCell key={col.key} sx={{ bgcolor: '#f9fafb', fontWeight: 600, fontSize: '0.78rem', color: '#374151', padding: '10px 14px', minWidth: colMinWidth(col), whiteSpace: 'normal', lineHeight: 1.3 }}><Tooltip title={col.excel} arrow placement="top"><span style={{ cursor: 'help' }}>{col.label}</span></Tooltip> <SortIcon /></TableCell>))}
                                        <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 600, fontSize: '0.78rem', color: '#374151', textAlign: 'center', position: 'sticky', right: 0, zIndex: 4, minWidth: 90 }}>Aksi</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedPO.length > 0 ? paginatedPO.map((p, idx) => (
                                        <TableRow key={p.id} hover sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                                            <TableCell sx={{ position: 'sticky', left: 0, zIndex: 2, background: 'white', fontWeight: 600, color: '#6b7280', textAlign: 'center' }}>{(page - 1) * ROWS_PER_PAGE + idx + 1}</TableCell>
                                            {visibleColumns.map((col) => (<TableCell key={col.key}>{renderCellValue(col, p[col.key])}</TableCell>))}
                                            <TableCell align="center" sx={{ position: 'sticky', right: 0, zIndex: 2, background: 'white', padding: '6px' }}>
                                                <Tooltip title="Detail"><IconButton size="small" onClick={() => { setSelectedPO(p); setDetailOpen(true); }} sx={{ color: '#3b82f6', padding: '4px' }}><Eye size={16} /></IconButton></Tooltip>
                                                <Tooltip title="Hapus"><IconButton size="small" onClick={() => handleDelete(p.id)} sx={{ color: '#ef4444', padding: '4px' }}><Trash2 size={16} /></IconButton></Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    )) : (<TableRow><TableCell colSpan={visibleColumns.length + 2} align="center" sx={{ py: 8, color: '#9ca3af', fontSize: '0.85rem' }}>Tidak ada data PO. Upload file Excel untuk memulai.</TableCell></TableRow>)}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.78rem' }}>Menampilkan {filteredPO.length === 0 ? 0 : (page - 1) * ROWS_PER_PAGE + 1}-{Math.min(page * ROWS_PER_PAGE, filteredPO.length)} dari {filteredPO.length} data</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <IconButton size="small" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}><ChevronLeft size={18} /></IconButton>
                                <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} size="small" color="primary" />
                                <IconButton size="small" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><ChevronRight size={18} /></IconButton>
                            </Box>
                        </Box>
                    </>
                )}
            </Paper>

            <Box sx={{ mt: 1.25, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">Halaman {page} dari {totalPages}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Info size={13} /> Kolom: {visibleKeys.length}/{PO_COLUMNS.length} | Filter aktif: {activeFilterCount}</Typography>
            </Box>

            <Dialog open={scorecardDialogOpen} onClose={() => setScorecardDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ bgcolor: '#3b82f6', color: 'white', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><ShoppingCart size={20} /> {scorecardTitle}</Box>
                    <IconButton size="small" onClick={() => setScorecardDialogOpen(false)} sx={{ color: 'white' }}><X size={20} /></IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0 }}>
                    <TableContainer sx={{ maxHeight: 400 }}>
                        <Table size="small" stickyHeader>
                            <TableHead><TableRow>{['No', 'Nomor PO', 'Kantin', 'Area', 'Total Qty', 'Nominal', 'Status'].map(h => <TableCell key={h} sx={{ bgcolor: '#f9fafb', fontWeight: 600, fontSize: '0.78rem' }}>{h}</TableCell>)}</TableRow></TableHead>
                            <TableBody>
                                {scorecardData.length > 0 ? scorecardData.map((p, idx) => (
                                    <TableRow key={p.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f9fafb' } }}>
                                        <TableCell sx={{ fontSize: '0.78rem' }}>{idx + 1}</TableCell>
                                        <TableCell sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#3b82f6' }}>{p.nomorPO || '-'}</TableCell>
                                        <TableCell sx={{ fontSize: '0.78rem' }}>{p.namaKantin || '-'}</TableCell>
                                        <TableCell sx={{ fontSize: '0.78rem' }}>{p.area || '-'}</TableCell>
                                        <TableCell sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{p.totalQty ?? 0}</TableCell>
                                        <TableCell sx={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>{formatCurrency(p.nominalInvoice)}</TableCell>
                                        <TableCell sx={{ fontSize: '0.78rem' }}><Chip label={p.tanggalPODatang ? 'Datang' : 'Belum'} size="small" color={p.tanggalPODatang ? 'success' : 'warning'} sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, borderRadius: 999 }} /></TableCell>
                                    </TableRow>
                                )) : (<TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: '#9ca3af' }}>Tidak ada data.</TableCell></TableRow>)}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions sx={{ p: 1.5, bgcolor: '#f9fafb' }}><Button variant="contained" size="small" onClick={() => setScorecardDialogOpen(false)} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, borderRadius: 999 }}>Tutup</Button></DialogActions>
            </Dialog>

            <Popover open={columnOpen} anchorEl={columnAnchor} onClose={closeColumnPopover} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} slotProps={{ paper: { sx: { width: 340, maxHeight: 560, display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: '0 12px 40px rgba(15,23,42,0.12)', border: '1px solid #e5e7eb' } } }}>
                <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#3b82f6', color: 'white' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Tampilkan Kolom</Typography><IconButton size="small" onClick={closeColumnPopover} sx={{ color: 'white', width: 24, height: 24 }}><X size={16} /></IconButton></Box>
                    <Typography sx={{ fontSize: '0.68rem', opacity: 0.9, mt: 0.25 }}>{visibleKeys.length} dari {PO_COLUMNS.length} kolom aktif</Typography>
                </Box>
                <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 0.5 }}><Button size="small" variant="text" onClick={selectAllColumns} sx={{ fontSize: '0.7rem', color: '#3b82f6', minWidth: 0, px: 1 }}>Tampilkan Semua</Button><Button size="small" variant="text" onClick={clearAllColumns} sx={{ fontSize: '0.7rem', color: '#ef4444', minWidth: 0, px: 1 }}>Sembunyikan Semua</Button></Box>
                <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}><TextField fullWidth size="small" placeholder="Cari kolom..." value={columnSearch} onChange={(e) => setColumnSearch(e.target.value)} slotProps={{ input: { startAdornment: (<InputAdornment position="start"><SearchIcon size={14} color="#9ca3af" /></InputAdornment>) } }} sx={{ '& .MuiInputBase-root': { fontSize: '0.78rem', borderRadius: 999 } }} /></Box>
                <Box sx={{ flex: 1, overflowY: 'auto' }}>
                    {filteredColumnList.length === 0 ? (<Box sx={{ p: 3, textAlign: 'center' }}><Typography sx={{ fontSize: '0.78rem', color: '#9ca3af' }}>Tidak ada kolom ditemukan</Typography></Box>) : (
                        filteredColumnList.map((col) => {
                            const isChecked = visibleKeys.includes(col.key);
                            return (
                                <Box key={col.key} onClick={() => toggleColumn(col.key)} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.25, py: 0.75, cursor: 'pointer', borderBottom: '1px solid', borderColor: 'rgba(229,231,235,0.6)', bgcolor: isChecked ? 'rgba(59,130,246,0.04)' : 'transparent', '&:hover': { bgcolor: 'rgba(59,130,246,0.08)' } }}>
                                    <Checkbox checked={isChecked} size="small" onClick={(e) => e.stopPropagation()} onChange={() => toggleColumn(col.key)} sx={{ color: '#3b82f6', '&.Mui-checked': { color: '#3b82f6' }, p: 0.5 }} />
                                    <Box sx={{ flex: 1, minWidth: 0 }}><Typography sx={{ fontSize: '0.75rem', fontWeight: isChecked ? 600 : 400, color: isChecked ? '#111827' : '#6b7280', lineHeight: 1.3 }} noWrap>{col.label}</Typography><Typography sx={{ fontSize: '0.62rem', color: '#9ca3af' }} noWrap>{col.excel}</Typography></Box>
                                    <Chip label={col.type} size="small" sx={{ fontSize: '0.6rem', height: 18, bgcolor: 'rgba(59,130,246,0.08)', color: '#3b82f6', fontWeight: 500, borderRadius: 999 }} />
                                </Box>
                            );
                        })
                    )}
                </Box>
                <Box sx={{ p: 1.25, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#f9fafb' }}><Button fullWidth variant="contained" size="small" onClick={closeColumnPopover} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, fontSize: '0.78rem', borderRadius: 999 }}>Selesai</Button></Box>
            </Popover>

            <Dialog open={uploadDialogOpen} onClose={() => !uploading && setUploadDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ bgcolor: '#3b82f6', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}><CloudUpload size={20} /> Upload Data PO</DialogTitle>
                <DialogContent dividers>
                    {uploadError && <Alert severity="error" sx={{ mb: 1.5 }}>{uploadError}</Alert>}
                    {!previewData.length && !uploading && (
                        <Box>
                            <Alert severity="info" sx={{ mb: 1.5 }}><strong>Panduan:</strong> Download template (40 kolom) -&gt; Isi data -&gt; Upload. Total UHT/Botol/Yogurt/Qty dihitung otomatis.</Alert>
                            <Box onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file && fileInputRef.current) { const dt = new DataTransfer(); dt.items.add(file); fileInputRef.current.files = dt.files; fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true })); } }} onClick={() => fileInputRef.current?.click()} sx={{ border: '2px dashed', borderColor: '#3b82f6', borderRadius: 2, p: 4, textAlign: 'center', bgcolor: 'rgba(59,130,246,0.03)', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(59,130,246,0.06)' } }}>
                                <CloudUpload size={44} color="#3b82f6" style={{ marginBottom: 8 }} />
                                <Typography variant="subtitle1" gutterBottom>Klik atau drag file Excel</Typography>
                                <Typography variant="caption" color="text.secondary">Format: .xlsx</Typography>
                                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFileSelect} />
                            </Box>
                        </Box>
                    )}
                    {previewData.length > 0 && !uploading && (
                        <Box>
                            <Alert severity="success" sx={{ mb: 1.5 }}><strong>{previewData.length} data</strong> berhasil dibaca. Total dihitung otomatis.</Alert>
                            <TableContainer sx={{ maxHeight: 250, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Table size="small" stickyHeader>
                                    <TableHead><TableRow>{['#', 'Nomor PO', 'Kantin', 'Area', 'Total Qty', 'Nominal'].map(h => <TableCell key={h} sx={{ bgcolor: '#f9fafb', fontWeight: 600 }}>{h}</TableCell>)}</TableRow></TableHead>
                                    <TableBody>{previewData.slice(0, 20).map((row, idx) => (<TableRow key={idx}><TableCell>{idx + 1}</TableCell><TableCell>{row.nomorPO || '-'}</TableCell><TableCell>{row.namaKantin || '-'}</TableCell><TableCell>{row.area || '-'}</TableCell><TableCell>{row.totalQty}</TableCell><TableCell>{formatCurrency(row.nominalInvoice)}</TableCell></TableRow>))}</TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                    {uploading && (<Box sx={{ py: 3 }}><Typography variant="subtitle1" align="center" gutterBottom>Menyimpan data ke Firebase...</Typography><LinearProgress variant="determinate" value={uploadProgress} sx={{ my: 2, height: 8, borderRadius: 4 }} /><Typography variant="caption" color="text.secondary" align="center" display="block">{uploadProgress}% - Mohon tunggu</Typography></Box>)}
                </DialogContent>
                <DialogActions sx={{ p: 1.5, bgcolor: '#f9fafb' }}><Button onClick={() => setUploadDialogOpen(false)} disabled={uploading} sx={{ borderRadius: 999 }}>Batal</Button>{previewData.length > 0 && !uploading && <Button variant="contained" onClick={handleSaveToFirebase} startIcon={<Check size={16} />} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, borderRadius: 999 }}>Simpan {previewData.length} Data</Button>}</DialogActions>
            </Dialog>

            <Drawer anchor="right" open={detailOpen} onClose={() => setDetailOpen(false)} sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 580, md: 680 } } }}>
                {selectedPO && (
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 2, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{selectedPO.nomorPO || 'Detail PO'}</Typography><Typography variant="caption" sx={{ opacity: 0.9 }}>{selectedPO.namaKantin} - {formatDate(selectedPO.tanggalPembuatanPO)}</Typography></Box>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Chip label={selectedPO.tanggalPODatang ? 'Sudah Datang' : 'Belum Datang'} color={selectedPO.tanggalPODatang ? 'success' : 'warning'} sx={{ bgcolor: 'white', color: selectedPO.tanggalPODatang ? '#10b981' : '#f59e0b', fontWeight: 700, borderRadius: 999 }} />
                                <IconButton onClick={() => setDetailOpen(false)} sx={{ color: 'white' }}><X size={20} /></IconButton>
                            </Box>
                        </Box>
                        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: '#3b82f6', fontWeight: 600 }}>SEMUA DATA (40 KOLOM)</Typography>
                            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                                <Grid container spacing={1.5}>
                                    {PO_COLUMNS.map(col => {
                                        const val = selectedPO[col.key];
                                        if (val === null || val === undefined || val === '') return null;
                                        return (
                                            <Grid key={col.key} size={{ xs: 12, sm: col.type === 'image' ? 4 : 6 }}>
                                                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600 }}>{col.label}</Typography>
                                                {col.type === 'image' ? <Box component="img" src={val} alt={col.label} onClick={() => setImagePreview(val)} sx={{ width: '100%', height: 110, objectFit: 'cover', cursor: 'pointer', borderRadius: 1, border: '1px solid #e5e7eb' }} onError={(e) => { e.target.style.display = 'none'; }} />
                                                    : col.type === 'currency' ? <Typography variant="body2" fontWeight={700} color="success.main">{formatCurrency(val)}</Typography>
                                                    : col.type === 'url' && typeof val === 'string' && val.startsWith('http') ? <Box component="a" onClick={(e) => { e.preventDefault(); setImagePreview(val); }} sx={{ color: '#3b82f6', fontSize: '0.8rem', cursor: 'pointer' }}>Lihat Foto</Box>
                                                    : col.type === 'date' || col.type === 'datetime' ? <Typography variant="body2" fontWeight={500}>{formatDate(val)}</Typography>
                                                    : col.type === 'number' ? <Typography variant="body2" fontWeight={600}>{Number(val).toLocaleString('en-US')}</Typography>
                                                    : <Typography variant="body2" fontWeight={500}>{String(val)}</Typography>}
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </Paper>
                        </Box>
                    </Box>
                )}
            </Drawer>

            <Dialog open={!!imagePreview} onClose={() => setImagePreview(null)} maxWidth="lg">
                <IconButton onClick={() => setImagePreview(null)} sx={{ position: 'absolute', right: 8, top: 8, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', zIndex: 1 }}><X size={20} /></IconButton>
                <Box component="img" src={imagePreview} sx={{ display: 'block', maxWidth: '90vw', maxHeight: '90vh' }} />
            </Dialog>
        </Box>
    );
}