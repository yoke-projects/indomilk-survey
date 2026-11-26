import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    Box, Typography, Button, TextField, Paper, IconButton, Checkbox,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, CircularProgress, Alert, Grid, InputAdornment, Dialog,
    DialogTitle, DialogContent, DialogActions, Drawer,
    LinearProgress, Tooltip, Pagination, Collapse, Select, MenuItem, FormControl, Popover
} from '@mui/material';
import {
    Upload, Download, Trash2, Eye, BarChart3,
    CloudUpload, X, Check, Info, ChevronLeft, ChevronRight,
    Filter, RotateCcw, ChevronDown, ChevronUp, ArrowRight,
    Users, Award, TrendingUp, TrendingDown, Columns3, Search as SearchIcon
} from 'lucide-react';
import { ref, onValue, push, set, remove } from 'firebase/database';
import { db } from '../firebase';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
    SURVEY_COLUMNS, IMAGE_TO_LINK_MAPPING,
    calculateGrade, calculateTotalSkor, buildExcelMapping, normalizeHeader
} from '../utils/surveyColumns';

const ROWS_PER_PAGE = 25;
const STORAGE_KEY = 'indomilk_visible_columns';
const ALL_COLUMN_KEYS = SURVEY_COLUMNS.map(c => c.key);

const EMPTY_FILTER = {
    namaSekolah: '', area: '', namaPersonil: '', userid: '',
    role: '', grade: '', bulan: '', tahun: '',
    tanggalDari: '', tanggalSampai: '', skorMin: '', skorMax: ''
};

const parseTanggal = (str) => {
    if (!str) return null;
    if (str instanceof Date) return isNaN(str) ? null : str;
    if (typeof str !== 'string') return null;
    if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
            const d = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const y = parseInt(parts[2], 10);
            if (!isNaN(d) && !isNaN(m) && !isNaN(y)) return new Date(y, m, d);
        }
    }
    const dt = new Date(str);
    return isNaN(dt) ? null : dt;
};

const formatTanggal = (date) => {
    if (!date || isNaN(date)) return '';
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
};

const parseInputDate = (str) => {
    if (!str) return null;
    const parts = str.split('-');
    if (parts.length !== 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    return new Date(y, m, d);
};

export default function SurveyManagement() {
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);

    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedSurvey, setSelectedSurvey] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [page, setPage] = useState(1);

    const [filterOpen, setFilterOpen] = useState(true);
    const [filterDraft, setFilterDraft] = useState({ ...EMPTY_FILTER });
    const [activeFilter, setActiveFilter] = useState({ ...EMPTY_FILTER });

    // ===== COLUMN VISIBILITY =====
    const [visibleKeys, setVisibleKeys] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return ALL_COLUMN_KEYS.filter(k => parsed.includes(k));
            }
        } catch { /* ignore */ }
        return ALL_COLUMN_KEYS;
    });
    const [columnAnchor, setColumnAnchor] = useState(null);
    const [columnSearch, setColumnSearch] = useState('');
    const columnOpen = Boolean(columnAnchor);

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleKeys)); } catch { /* ignore */ }
    }, [visibleKeys]);

    const visibleColumns = useMemo(() => SURVEY_COLUMNS.filter(c => visibleKeys.includes(c.key)), [visibleKeys]);
    const toggleColumn = (key) => setVisibleKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    const selectAllColumns = () => setVisibleKeys([...ALL_COLUMN_KEYS]);
    const clearAllColumns = () => setVisibleKeys([]);
    const closeColumnPopover = () => { setColumnAnchor(null); setColumnSearch(''); };

    const filteredColumnList = useMemo(() => {
        if (!columnSearch) return SURVEY_COLUMNS;
        const q = columnSearch.toLowerCase();
        return SURVEY_COLUMNS.filter(c => c.label.toLowerCase().includes(q) || c.excel.toLowerCase().includes(q));
    }, [columnSearch]);

    useEffect(() => {
        const surveyRef = ref(db, 'survei_data');
        const unsubscribe = onValue(surveyRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const arr = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
                arr.sort((a, b) => new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0));
                setSurveys(arr);
            } else { setSurveys([]); }
            setLoading(false);
        }, (err) => { console.error(err); setError('Gagal memuat data survei.'); setLoading(false); });
        return () => unsubscribe();
    }, []);

    const handleFilterChange = useCallback((field, value) => { setFilterDraft(prev => ({ ...prev, [field]: value })); }, []);

    const handleApplyFilter = useCallback(() => {
        const finalFilter = { ...filterDraft };
        if (finalFilter.tanggalDari) { const d = parseInputDate(finalFilter.tanggalDari); if (d) finalFilter.tanggalDari = formatTanggal(d); }
        if (finalFilter.tanggalSampai) { const d = parseInputDate(finalFilter.tanggalSampai); if (d) finalFilter.tanggalSampai = formatTanggal(d); }
        setActiveFilter(finalFilter);
        setPage(1);
    }, [filterDraft]);

    const handleResetFilter = useCallback(() => { setFilterDraft({ ...EMPTY_FILTER }); setActiveFilter({ ...EMPTY_FILTER }); setPage(1); }, []);

    const activeFilterCount = useMemo(() => Object.values(activeFilter).filter(v => v !== '' && v !== null && v !== undefined).length, [activeFilter]);

    const filteredSurveys = useMemo(() => {
        return surveys.filter(s => {
            const f = activeFilter;
            if (f.namaSekolah && !(s.namaSekolah || '').toLowerCase().includes(f.namaSekolah.toLowerCase())) return false;
            if (f.area && !(s.area || '').toLowerCase().includes(f.area.toLowerCase())) return false;
            if (f.namaPersonil && !(s.namaPersonil || '').toLowerCase().includes(f.namaPersonil.toLowerCase())) return false;
            if (f.userid && !(s.userid || '').toLowerCase().includes(f.userid.toLowerCase())) return false;
            if (f.role && s.role !== f.role) return false;
            if (f.grade && s.gradeSekolah !== f.grade) return false;
            if (f.bulan && s.bulan !== f.bulan) return false;
            if (f.tahun && String(s.tahun) !== String(f.tahun)) return false;
            if (f.tanggalDari) { const dari = parseTanggal(f.tanggalDari); const tgl = parseTanggal(s.tanggal); if (!tgl || !dari || tgl < dari) return false; }
            if (f.tanggalSampai) { const sampai = parseTanggal(f.tanggalSampai); const tgl = parseTanggal(s.tanggal); if (!tgl || !sampai || tgl > sampai) return false; }
            if (f.skorMin !== '' && Number(s.totalSkor) < Number(f.skorMin)) return false;
            if (f.skorMax !== '' && Number(s.totalSkor) > Number(f.skorMax)) return false;
            return true;
        });
    }, [surveys, activeFilter]);

    const totalPages = Math.ceil(filteredSurveys.length / ROWS_PER_PAGE) || 1;
    const paginatedSurveys = filteredSurveys.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

    // ===== SCORECARD DETAIL STATE =====
    const [scorecardDialogOpen, setScorecardDialogOpen] = useState(false);
    const [scorecardData, setScorecardData] = useState([]);
    const [scorecardTitle, setScorecardTitle] = useState('');

    const handleScorecardClick = (type) => {
        let data = [];
        let title = '';
        if (type === 'total') {
            data = filteredSurveys;
            title = 'Detail Semua Data Survei';
        } else {
            data = filteredSurveys.filter(s => s.gradeSekolah === type);
            title = `Detail Data Grade ${type}`;
        }
        setScorecardData(data);
        setScorecardTitle(title);
        setScorecardDialogOpen(true);
    };

    const handleDownloadTemplate = () => {
        const headers = SURVEY_COLUMNS.map(c => c.excel);
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        ws['!cols'] = SURVEY_COLUMNS.map(c => ({ wch: Math.max(15, c.excel.length + 2) }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template Survei');
        saveAs(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/octet-stream' }), 'Template_Survei_Indomilk.xlsx');
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
                const mapping = buildExcelMapping();
                const mappedData = jsonData.map((row) => {
                    const mapped = {};
                    Object.keys(row).forEach(header => { const key = mapping[normalizeHeader(header)]; if (key) mapped[key] = row[header]; });
                    Object.entries(IMAGE_TO_LINK_MAPPING).forEach(([imgKey, linkKey]) => {
                        if (mapped[linkKey] && typeof mapped[linkKey] === 'string' && mapped[linkKey].startsWith('http')) mapped[imgKey] = mapped[linkKey];
                    });
                    mapped.totalSkor = calculateTotalSkor(mapped);
                    mapped.gradeSekolah = calculateGrade(mapped.totalSkor);
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
            const surveyRef = ref(db, 'survei_data');
            for (let i = 0; i < previewData.length; i++) {
                await set(push(surveyRef), previewData[i]);
                setUploadProgress(Math.round(((i + 1) / previewData.length) * 100));
            }
            setUploadDialogOpen(false); setPreviewData([]); setPage(1);
        } catch (err) { setUploadError('Gagal menyimpan: ' + err.message); }
        finally { setUploading(false); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Yakin ingin menghapus data survei ini?')) {
            try { await remove(ref(db, `survei_data/${id}`)); } catch { alert('Gagal menghapus data.'); }
        }
    };

    const handleExport = () => {
        if (surveys.length === 0) { alert('Tidak ada data untuk di-export.'); return; }
        const exportData = surveys.map(s => { const row = {}; SURVEY_COLUMNS.forEach(col => { row[col.excel] = s[col.key] ?? ''; }); return row; });
        const ws = XLSX.utils.json_to_sheet(exportData);
        ws['!cols'] = SURVEY_COLUMNS.map(c => ({ wch: Math.max(15, c.excel.length + 2) }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data Survei');
        saveAs(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/octet-stream' }), `Data_Survei_Indomilk_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const getGradeColor = (grade) => grade === 'A' ? 'success' : grade === 'B' ? 'warning' : grade === 'C' ? 'error' : 'default';

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const parsed = parseTanggal(dateStr);
        return parsed ? formatTanggal(parsed) : dateStr;
    };

    const renderCellValue = (col, value) => {
        if (value === null || value === undefined || value === '') return <span style={{ color: '#cbd5e1', fontSize: '0.72rem' }}>-</span>;
        if (col.type === 'image' && typeof value === 'string' && value.startsWith('http')) {
            return <Box component="img" src={value} alt={col.label} onClick={() => setImagePreview(value)} sx={{ width: 34, height: 34, objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(15,23,42,0.08)', '&:hover': { opacity: 0.8, transform: 'scale(1.12)' }, transition: 'all 0.2s', display: 'block' }} onError={(e) => { e.target.style.display = 'none'; }} />;
        }
        if (col.type === 'grade' && value && value !== '-') return <Chip label={value} color={getGradeColor(value)} size="small" sx={{ height: 22, fontSize: '0.7rem' }} />;
        if (col.type === 'date' || col.type === 'datetime') return <span style={{ fontSize: '0.72rem' }}>{formatDate(value)}</span>;
        if (col.type === 'url' && typeof value === 'string' && value.startsWith('http')) return <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: '#0288D1', textDecoration: 'none', fontSize: '0.72rem', fontWeight: 600 }}>Link</a>;
        const strVal = String(value);
        if (strVal.length > 26) return <Tooltip title={strVal} arrow placement="top"><span style={{ cursor: 'help', fontSize: '0.72rem' }}>{strVal.substring(0, 26)}</span></Tooltip>;
        return <span style={{ fontSize: '0.72rem' }}>{strVal}</span>;
    };

    const colMinWidth = (col) => col.type === 'image' ? 46 : col.type === 'number' || col.type === 'grade' ? 58 : col.type === 'date' || col.type === 'datetime' ? 96 : col.type === 'url' ? 60 : 92;
    const fieldStyle = { '& .MuiInputBase-root': { fontSize: '0.8rem', borderRadius: 2, bgcolor: 'background.paper' } };

    return (
        <Box sx={{ width: '100%', maxWidth: '100%' }}>

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                <Box>
                    <Typography variant="h4" color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BarChart3 size={24} strokeWidth={2.5} color="#00796B" /> Manage Survei
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>Kelola data survei kantin sekolah project Indomilk</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button variant="outlined" size="small" startIcon={<Columns3 size={16} />} onClick={(e) => setColumnAnchor(e.currentTarget)} sx={{ color: '#00796B', borderColor: '#00796B', '&:hover': { borderColor: '#004C40', bgcolor: 'rgba(0,121,107,0.04)' } }}>
                        Kolom ({visibleKeys.length}/{SURVEY_COLUMNS.length})
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<Download size={16} />} onClick={handleDownloadTemplate}>Template</Button>
                    <Button variant="outlined" size="small" startIcon={<Download size={16} />} onClick={handleExport} disabled={surveys.length === 0}>Export</Button>
                    <Button variant="contained" size="small" startIcon={<Upload size={16} />} onClick={() => setUploadDialogOpen(true)}>Upload Excel</Button>
                </Box>
            </Box>

            {/* ===== SCORECARD (CLICKABLE) ===== */}
            <Grid container spacing={1.5} sx={{ mb: 2, width: '100%' }}>
                {[
                    { label: 'Total Data', value: filteredSurveys.length, color: '#00796B', icon: Users, type: 'total' },
                    { label: 'Grade A', value: filteredSurveys.filter(s => s.gradeSekolah === 'A').length, color: '#059669', icon: Award, type: 'A' },
                    { label: 'Grade B', value: filteredSurveys.filter(s => s.gradeSekolah === 'B').length, color: '#D97706', icon: TrendingUp, type: 'B' },
                    { label: 'Grade C', value: filteredSurveys.filter(s => s.gradeSekolah === 'C').length, color: '#DC2626', icon: TrendingDown, type: 'C' },
                ].map((card) => {
                    const Icon = card.icon;
                    return (
                        <Grid size={{ xs: 6, sm: 6, md: 3 }} key={card.label}>
                            <Paper
                                onClick={() => handleScorecardClick(card.type)}
                                sx={{
                                    p: 1.25, position: 'relative', overflow: 'hidden',
                                    width: '100%', height: '100%',
                                    border: '1px solid', borderColor: 'divider',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 6px 16px rgba(15,23,42,0.1)',
                                        borderColor: card.color
                                    }
                                }}
                            >
                                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, bgcolor: card.color }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            {card.label}
                                        </Typography>
                                        <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, color: card.color, lineHeight: 1.1, letterSpacing: '-0.02em', mt: 0.25 }}>
                                            {card.value}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', mt: 0.25 }}>
                                            {surveys.length > 0 ? Math.round((card.value / surveys.length) * 100) : 0}% dari total
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                                        <Box sx={{ width: 34, height: 34, borderRadius: 2, flexShrink: 0, background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Icon size={17} color={card.color} strokeWidth={2.2} />
                                        </Box>
                                        <ArrowRight size={14} color={card.color} style={{ opacity: 0.5 }} />
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>

            {/* ===== FILTER BAR ===== */}
            <Paper sx={{ p: 1.75, mb: 2, border: '1px solid', borderColor: 'divider', width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: filterOpen ? 1.75 : 0, flexWrap: 'wrap', gap: 1 }}>
                    <Button variant="contained" size="small" startIcon={<Filter size={14} />} endIcon={filterOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />} onClick={() => setFilterOpen(!filterOpen)} sx={{ bgcolor: '#00796B', '&:hover': { bgcolor: '#00695C' }, minWidth: 110, fontSize: '0.75rem' }}>
                        Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </Button>
                    {activeFilterCount > 0 && (
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', flex: 1 }}>
                            {Object.entries(activeFilter).map(([key, value]) => {
                                if (value === '' || value === null || value === undefined) return null;
                                const labelMap = { namaSekolah: 'Sekolah', area: 'Area', namaPersonil: 'Personil', userid: 'User ID', role: 'Role', grade: 'Grade', bulan: 'Bulan', tahun: 'Tahun', tanggalDari: 'Dari', tanggalSampai: 'Sampai', skorMin: 'Min', skorMax: 'Max' };
                                return <Chip key={key} label={`${labelMap[key] || key}: ${value}`} size="small" onDelete={() => handleFilterChange(key, '')} sx={{ bgcolor: 'rgba(0,121,107,0.08)', color: '#00796B', fontWeight: 600, fontSize: '0.68rem', height: 24 }} />;
                            })}
                        </Box>
                    )}
                </Box>

                <Collapse in={filterOpen}>
                    <Grid container spacing={1.5}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" placeholder="Nama Sekolah" value={filterDraft.namaSekolah} onChange={(e) => handleFilterChange('namaSekolah', e.target.value)} sx={fieldStyle} /></Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" placeholder="Area" value={filterDraft.area} onChange={(e) => handleFilterChange('area', e.target.value)} sx={fieldStyle} /></Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" placeholder="Nama Personil" value={filterDraft.namaPersonil} onChange={(e) => handleFilterChange('namaPersonil', e.target.value)} sx={fieldStyle} /></Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" placeholder="User ID" value={filterDraft.userid} onChange={(e) => handleFilterChange('userid', e.target.value)} sx={fieldStyle} /></Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth size="small"><Select value={filterDraft.role} onChange={(e) => handleFilterChange('role', e.target.value)} displayEmpty sx={{ fontSize: '0.8rem', borderRadius: 2, bgcolor: 'background.paper' }}><MenuItem value="" disabled>Role</MenuItem><MenuItem value="SPG">SPG</MenuItem><MenuItem value="TEAMLEADER">Team Leader</MenuItem><MenuItem value="MD">MD</MenuItem><MenuItem value="SUPERVISOR">Supervisor</MenuItem></Select></FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth size="small"><Select value={filterDraft.grade} onChange={(e) => handleFilterChange('grade', e.target.value)} displayEmpty sx={{ fontSize: '0.8rem', borderRadius: 2, bgcolor: 'background.paper' }}><MenuItem value="" disabled>Grade</MenuItem><MenuItem value="A">Grade A</MenuItem><MenuItem value="B">Grade B</MenuItem><MenuItem value="C">Grade C</MenuItem></Select></FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth size="small"><Select value={filterDraft.bulan} onChange={(e) => handleFilterChange('bulan', e.target.value)} displayEmpty sx={{ fontSize: '0.8rem', borderRadius: 2, bgcolor: 'background.paper' }}><MenuItem value="" disabled>Bulan</MenuItem>{['JANUARI','FEBRUARI','MARET','APRIL','MEI','JUNI','JULI','AGUSTUS','SEPTEMBER','OKTOBER','NOVEMBER','DESEMBER'].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}</Select></FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth size="small"><Select value={filterDraft.tahun} onChange={(e) => handleFilterChange('tahun', e.target.value)} displayEmpty sx={{ fontSize: '0.8rem', borderRadius: 2, bgcolor: 'background.paper' }}><MenuItem value="" disabled>Tahun</MenuItem>{[2024, 2025, 2026, 2027].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}</Select></FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" type="date" value={filterDraft.tanggalDari} onChange={(e) => handleFilterChange('tanggalDari', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={fieldStyle} /></Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" type="date" value={filterDraft.tanggalSampai} onChange={(e) => handleFilterChange('tanggalSampai', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={fieldStyle} /></Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" placeholder="Skor Min" type="number" value={filterDraft.skorMin} onChange={(e) => handleFilterChange('skorMin', e.target.value)} sx={fieldStyle} slotProps={{ htmlInput: { min: 0 } }} /></Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" placeholder="Skor Max" type="number" value={filterDraft.skorMax} onChange={(e) => handleFilterChange('skorMax', e.target.value)} sx={fieldStyle} slotProps={{ htmlInput: { min: 0 } }} /></Grid>
                        <Grid size={12}>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                                <Button variant="outlined" size="small" startIcon={<RotateCcw size={14} />} onClick={handleResetFilter} sx={{ borderColor: '#DC2626', color: '#DC2626', '&:hover': { bgcolor: 'rgba(220,38,38,0.04)', borderColor: '#DC2626' } }}>Reset Semua</Button>
                                <Button variant="contained" size="small" startIcon={<Check size={14} />} onClick={handleApplyFilter} sx={{ bgcolor: '#00796B', '&:hover': { bgcolor: '#00695C' }, minWidth: 140 }}>Terapkan Filter</Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Collapse>
            </Paper>

            {/* ===== TABLE ===== */}
            <Paper sx={{ overflow: 'hidden', width: '100%', border: '1px solid', borderColor: 'divider' }}>
                {loading ? (<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={32} /></Box>) : error ? (<Alert severity="error" sx={{ m: 2 }}>{error}</Alert>) : (
                    <>
                        <TableContainer sx={{ maxHeight: 'calc(100vh - 340px)', overflowX: 'auto', overflowY: 'auto', '&::-webkit-scrollbar': { height: 9, width: 9 }, '&::-webkit-scrollbar-thumb': { background: '#00796B', borderRadius: 8 } }}>
                            <Table stickyHeader size="small" sx={{ width: '100%', tableLayout: 'auto', '& .MuiTableCell-root': { fontSize: '0.72rem', padding: '5px 8px', whiteSpace: 'nowrap' } }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ bgcolor: '#00796B', color: 'white', fontWeight: 700, position: 'sticky', left: 0, zIndex: 4, minWidth: 40, textAlign: 'center', borderRight: '2px solid #004C40' }}>No</TableCell>
                                        {visibleColumns.map((col) => (
                                            <TableCell key={col.key} sx={{ bgcolor: '#00796B', color: 'white', fontWeight: 600, padding: '8px 10px', minWidth: colMinWidth(col), whiteSpace: 'normal', lineHeight: 1.25 }}>
                                                <Tooltip title={col.excel} arrow placement="top"><span style={{ cursor: 'help' }}>{col.label}</span></Tooltip>
                                            </TableCell>
                                        ))}
                                        <TableCell sx={{ bgcolor: '#00796B', color: 'white', fontWeight: 700, textAlign: 'center', position: 'sticky', right: 0, zIndex: 4, minWidth: 78, borderLeft: '2px solid #004C40' }}>Aksi</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedSurveys.length > 0 ? paginatedSurveys.map((s, idx) => (
                                        <TableRow key={s.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' }, '&:hover': { bgcolor: 'rgba(0,121,107,0.05)' } }}>
                                            <TableCell sx={{ position: 'sticky', left: 0, zIndex: 2, background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', fontWeight: 700, color: '#00796B', textAlign: 'center', borderRight: '2px solid #E2E8F0' }}>{(page - 1) * ROWS_PER_PAGE + idx + 1}</TableCell>
                                            {visibleColumns.map((col) => (<TableCell key={col.key}>{renderCellValue(col, s[col.key])}</TableCell>))}
                                            <TableCell align="center" sx={{ position: 'sticky', right: 0, zIndex: 2, background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', borderLeft: '2px solid #E2E8F0', padding: '4px' }}>
                                                <Tooltip title="Detail"><IconButton size="small" onClick={() => { setSelectedSurvey(s); setDetailOpen(true); }} sx={{ color: '#00796B', padding: '4px' }}><Eye size={16} /></IconButton></Tooltip>
                                                <Tooltip title="Hapus"><IconButton size="small" onClick={() => handleDelete(s.id)} sx={{ color: '#DC2626', padding: '4px' }}><Trash2 size={16} /></IconButton></Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    )) : (<TableRow><TableCell colSpan={visibleColumns.length + 2} align="center" sx={{ py: 6, color: 'text.secondary' }}>Tidak ada data yang cocok dengan filter.</TableCell></TableRow>)}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.25, borderTop: '1px solid', borderColor: 'divider', flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">Menampilkan {filteredSurveys.length === 0 ? 0 : (page - 1) * ROWS_PER_PAGE + 1}-{Math.min(page * ROWS_PER_PAGE, filteredSurveys.length)} dari {filteredSurveys.length} data</Typography>
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
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Info size={13} /> Kolom tampil: {visibleKeys.length}/{SURVEY_COLUMNS.length}  Filter aktif: {activeFilterCount}
                </Typography>
            </Box>

            {/* ===== SCORECARD DETAIL DIALOG ===== */}
            <Dialog open={scorecardDialogOpen} onClose={() => setScorecardDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ bgcolor: '#00796B', color: 'white', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BarChart3 size={20} /> {scorecardTitle}
                    </Box>
                    <IconButton size="small" onClick={() => setScorecardDialogOpen(false)} sx={{ color: 'white' }}><X size={20} /></IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0 }}>
                    <TableContainer sx={{ maxHeight: 400 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ bgcolor: '#F1F5F9', fontWeight: 700, fontSize: '0.75rem' }}>No</TableCell>
                                    <TableCell sx={{ bgcolor: '#F1F5F9', fontWeight: 700, fontSize: '0.75rem' }}>Tanggal</TableCell>
                                    <TableCell sx={{ bgcolor: '#F1F5F9', fontWeight: 700, fontSize: '0.75rem' }}>Nama Sekolah</TableCell>
                                    <TableCell sx={{ bgcolor: '#F1F5F9', fontWeight: 700, fontSize: '0.75rem' }}>Area</TableCell>
                                    <TableCell sx={{ bgcolor: '#F1F5F9', fontWeight: 700, fontSize: '0.75rem' }}>Personil</TableCell>
                                    <TableCell sx={{ bgcolor: '#F1F5F9', fontWeight: 700, fontSize: '0.75rem' }}>Total Skor</TableCell>
                                    <TableCell sx={{ bgcolor: '#F1F5F9', fontWeight: 700, fontSize: '0.75rem' }}>Grade</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {scorecardData.length > 0 ? scorecardData.map((s, idx) => (
                                    <TableRow key={s.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
                                        <TableCell sx={{ fontSize: '0.75rem' }}>{idx + 1}</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem' }}>{formatDate(s.tanggal)}</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#00796B' }}>{s.namaSekolah || '-'}</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem' }}>{s.area || '-'}</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem' }}>{s.namaPersonil || '-'}</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{s.totalSkor ?? '-'}</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem' }}>
                                            {s.gradeSekolah && s.gradeSekolah !== '-' ? (
                                                <Chip label={s.gradeSekolah} color={getGradeColor(s.gradeSekolah)} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />
                                            ) : '-'}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary', fontSize: '0.8rem' }}>
                                            Tidak ada data untuk kategori ini.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions sx={{ p: 1.5, bgcolor: '#F8FAFC' }}>
                    <Button variant="contained" size="small" onClick={() => setScorecardDialogOpen(false)} sx={{ bgcolor: '#00796B', '&:hover': { bgcolor: '#00695C' } }}>Tutup</Button>
                </DialogActions>
            </Dialog>

            {/* ===== COLUMN TOGGLE POPOVER ===== */}
            <Popover open={columnOpen} anchorEl={columnAnchor} onClose={closeColumnPopover} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} slotProps={{ paper: { sx: { width: 340, maxHeight: 560, display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: '0 12px 40px rgba(15,23,42,0.15)' } } }}>
                <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#00796B', color: 'white' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.82rem' }}>Tampilkan Kolom</Typography>
                        <IconButton size="small" onClick={closeColumnPopover} sx={{ color: 'white', width: 24, height: 24 }}><X size={16} /></IconButton>
                    </Box>
                    <Typography sx={{ fontSize: '0.65rem', opacity: 0.9, mt: 0.25 }}>{visibleKeys.length} dari {SURVEY_COLUMNS.length} kolom aktif</Typography>
                </Box>
                <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Button size="small" variant="text" onClick={selectAllColumns} sx={{ fontSize: '0.68rem', color: '#00796B', minWidth: 0, px: 1 }}>Tampilkan Semua</Button>
                    <Button size="small" variant="text" onClick={clearAllColumns} sx={{ fontSize: '0.68rem', color: '#DC2626', minWidth: 0, px: 1 }}>Sembunyikan Semua</Button>
                    <Button size="small" variant="text" onClick={selectAllColumns} sx={{ fontSize: '0.68rem', color: '#64748B', minWidth: 0, px: 1, ml: 'auto' }}>Reset Default</Button>
                </Box>
                <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <TextField fullWidth size="small" placeholder="Cari kolom..." value={columnSearch} onChange={(e) => setColumnSearch(e.target.value)} slotProps={{ input: { startAdornment: (<InputAdornment position="start"><SearchIcon size={14} color="#00796B" /></InputAdornment>) } }} sx={{ '& .MuiInputBase-root': { fontSize: '0.75rem', borderRadius: 2 } }} />
                </Box>
                <Box sx={{ flex: 1, overflowY: 'auto' }}>
                    {filteredColumnList.length === 0 ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}><Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Tidak ada kolom ditemukan</Typography></Box>
                    ) : (
                        filteredColumnList.map((col) => {
                            const isChecked = visibleKeys.includes(col.key);
                            return (
                                <Box key={col.key} onClick={() => toggleColumn(col.key)} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.25, py: 0.75, cursor: 'pointer', borderBottom: '1px solid', borderColor: 'rgba(226,232,240,0.6)', bgcolor: isChecked ? 'rgba(0,121,107,0.03)' : 'transparent', '&:hover': { bgcolor: 'rgba(0,121,107,0.06)' } }}>
                                    <Checkbox checked={isChecked} size="small" onClick={(e) => e.stopPropagation()} onChange={() => toggleColumn(col.key)} sx={{ color: '#00796B', '&.Mui-checked': { color: '#00796B' }, p: 0.5 }} />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontSize: '0.72rem', fontWeight: isChecked ? 600 : 400, color: isChecked ? 'text.primary' : 'text.secondary', lineHeight: 1.3 }} noWrap>{col.label}</Typography>
                                        <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', opacity: 0.7 }} noWrap>{col.excel}</Typography>
                                    </Box>
                                    <Chip label={col.type} size="small" sx={{ fontSize: '0.58rem', height: 18, bgcolor: 'rgba(2,136,209,0.08)', color: '#0288D1', fontWeight: 600 }} />
                                </Box>
                            );
                        })
                    )}
                </Box>
                <Box sx={{ p: 1.25, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#F8FAFC' }}>
                    <Button fullWidth variant="contained" size="small" onClick={closeColumnPopover} sx={{ bgcolor: '#00796B', '&:hover': { bgcolor: '#00695C' }, fontSize: '0.75rem' }}>Selesai</Button>
                </Box>
            </Popover>

            {/* Upload Dialog */}
            <Dialog open={uploadDialogOpen} onClose={() => !uploading && setUploadDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ bgcolor: '#00796B', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}><CloudUpload size={20} /> Upload Data Survei</DialogTitle>
                <DialogContent dividers>
                    {uploadError && <Alert severity="error" sx={{ mb: 1.5 }}>{uploadError}</Alert>}
                    {!previewData.length && !uploading && (
                        <Box>
                            <Alert severity="info" sx={{ mb: 1.5 }}><strong>Panduan:</strong> Download template (78 kolom) ? Isi data ? Upload.</Alert>
                            <Box onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file && fileInputRef.current) { const dt = new DataTransfer(); dt.items.add(file); fileInputRef.current.files = dt.files; fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true })); } }} onClick={() => fileInputRef.current?.click()} sx={{ border: '2px dashed', borderColor: 'primary.light', borderRadius: 3, p: 4, textAlign: 'center', bgcolor: 'rgba(0,121,107,0.03)', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(0,121,107,0.06)' } }}>
                                <CloudUpload size={44} color="#00796B" style={{ marginBottom: 8 }} />
                                <Typography variant="subtitle1" gutterBottom>Klik atau drag file Excel</Typography>
                                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFileSelect} />
                            </Box>
                        </Box>
                    )}
                    {previewData.length > 0 && !uploading && (
                        <Box>
                            <Alert severity="success" sx={{ mb: 1.5 }}><strong>{previewData.length} data</strong> berhasil dibaca.</Alert>
                            <TableContainer sx={{ maxHeight: 250, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Table size="small" stickyHeader>
                                    <TableHead><TableRow>{['#', 'Tanggal', 'Nama Sekolah', 'Area', 'Total Skor', 'Grade'].map(h => <TableCell key={h} sx={{ bgcolor: '#F1F5F9', fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
                                    <TableBody>{previewData.slice(0, 20).map((row, idx) => (<TableRow key={idx}><TableCell>{idx + 1}</TableCell><TableCell>{formatDate(row.tanggal)}</TableCell><TableCell>{row.namaSekolah || '-'}</TableCell><TableCell>{row.area || '-'}</TableCell><TableCell>{row.totalSkor}</TableCell><TableCell><Chip label={row.gradeSekolah} color={getGradeColor(row.gradeSekolah)} size="small" sx={{ height: 20, fontSize: '0.7rem' }} /></TableCell></TableRow>))}</TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                    {uploading && (<Box sx={{ py: 3 }}><Typography variant="subtitle1" align="center" gutterBottom>Menyimpan data ke Firebase...</Typography><LinearProgress variant="determinate" value={uploadProgress} sx={{ my: 2, height: 8, borderRadius: 4 }} /><Typography variant="caption" color="text.secondary" align="center" display="block">{uploadProgress}% - Mohon tunggu</Typography></Box>)}
                </DialogContent>
                <DialogActions sx={{ p: 1.5, bgcolor: '#F8FAFC' }}>
                    <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>Batal</Button>
                    {previewData.length > 0 && !uploading && <Button variant="contained" onClick={handleSaveToFirebase} startIcon={<Check size={16} />}>Simpan {previewData.length} Data</Button>}
                </DialogActions>
            </Dialog>

            {/* Detail Drawer */}
            <Drawer anchor="right" open={detailOpen} onClose={() => setDetailOpen(false)} sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 560, md: 660 } } }}>
                {selectedSurvey && (
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 2, background: 'linear-gradient(135deg, #00796B 0%, #0288D1 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{selectedSurvey.namaSekolah || 'Detail Survei'}</Typography><Typography variant="caption" sx={{ opacity: 0.9 }}>{selectedSurvey.area}  {formatDate(selectedSurvey.tanggal)}</Typography></Box>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                {selectedSurvey.gradeSekolah && selectedSurvey.gradeSekolah !== '-' && <Chip label={`Grade ${selectedSurvey.gradeSekolah}`} color={getGradeColor(selectedSurvey.gradeSekolah)} sx={{ bgcolor: 'white', color: '#00796B', fontWeight: 700 }} />}
                                <IconButton onClick={() => setDetailOpen(false)} sx={{ color: 'white' }}><X size={20} /></IconButton>
                            </Box>
                        </Box>
                        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                            <Typography variant="subtitle2" color="primary.main" sx={{ mb: 1 }}>SEMUA DATA (78 KOLOM)</Typography>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <Grid container spacing={1.5}>
                                    {SURVEY_COLUMNS.map(col => {
                                        const val = selectedSurvey[col.key];
                                        if (val === null || val === undefined || val === '') return null;
                                        return (
                                            <Grid key={col.key} size={{ xs: 12, sm: col.type === 'image' ? 4 : 6 }}>
                                                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600 }}>{col.label}</Typography>
                                                {col.type === 'image' ? <Box component="img" src={val} alt={col.label} onClick={() => setImagePreview(val)} sx={{ width: '100%', height: 100, objectFit: 'cover', cursor: 'pointer', borderRadius: 2, border: '1px solid #E2E8F0' }} onError={(e) => { e.target.style.display = 'none'; }} />
                                                    : col.type === 'grade' ? <Chip label={`Grade ${val}`} color={getGradeColor(val)} size="small" sx={{ fontWeight: 700 }} />
                                                    : col.type === 'url' && typeof val === 'string' && val.startsWith('http') ? <a href={val} target="_blank" rel="noopener noreferrer" style={{ color: '#0288D1', fontSize: '0.8rem' }}>Buka Link</a>
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

            {/* Image Preview */}
            <Dialog open={!!imagePreview} onClose={() => setImagePreview(null)} maxWidth="lg">
                <IconButton onClick={() => setImagePreview(null)} sx={{ position: 'absolute', right: 8, top: 8, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', zIndex: 1 }}><X size={20} /></IconButton>
                <Box component="img" src={imagePreview} sx={{ display: 'block', maxWidth: '90vw', maxHeight: '90vh' }} />
            </Dialog>
        </Box>
    );
}
