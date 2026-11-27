import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Button, TextField, Paper, IconButton, Checkbox,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, CircularProgress, Alert, Grid, InputAdornment, Dialog,
    DialogTitle, DialogContent, DialogActions,
    Tooltip, Pagination, Select, MenuItem, FormControl, Popover
} from '@mui/material';
import {
    Download, Eye, X, Info, ChevronLeft, ChevronRight,
    Filter, RotateCcw, ChevronDown, ChevronUp,
    Users, TrendingUp, Check, Columns3, Search as SearchIcon,
    Calendar, Store, Building2, ShoppingCart, Edit, Save, AlertTriangle
} from 'lucide-react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../firebase';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
    TERTARIK_PO_COLUMNS, isTertarik, isBisa, countItemBranding,
    hitungSisaHari, tambahHari, parseTanggal, formatTanggal,
    normalizeString, makeMatchKey, hitungKarton
} from '../utils/tertarikPOColumns';

const ROWS_PER_PAGE = 25;
const STORAGE_KEY = 'indomilk_tertarik_po_visible_columns';
const ALL_KEYS = TERTARIK_PO_COLUMNS.map(c => c.key);

const EMPTY_FILTER = {
    namaSekolah: '', kantinName: '', area: '', namaPersonil: '', userid: '',
    role: '', grade: '', bulan: '', tahun: '',
    tanggalDari: '', tanggalSampai: '', statusPO: ''
};

// ===== EDIT FIELD GROUPS =====
const EDIT_SURVEI_FIELDS = [
    { key: 'namaSekolah', label: 'Nama Sekolah', type: 'text', required: true },
    { key: 'kantinName', label: 'Nama Kantin', type: 'text' },
    { key: 'area', label: 'Area', type: 'text' },
    { key: 'userid', label: 'User ID', type: 'text' },
    { key: 'namaPersonil', label: 'Nama Personil', type: 'text' },
    { key: 'role', label: 'Role', type: 'select', options: ['', 'SPG', 'TEAMLEADER', 'MD', 'SUPERVISOR'] },
    { key: 'gradeSekolah', label: 'Grade Sekolah', type: 'select', options: ['', 'A', 'B', 'C'] },
    { key: 'tertarik', label: 'Tertarik Program?', type: 'select', options: ['', 'Ya', 'Tidak'] },
    { key: 'bisaStikerChiller', label: 'Stiker Chiller', type: 'select', options: ['', 'BISA', 'TIDAK BISA'] },
    { key: 'bisaBanner', label: 'Banner Kantin', type: 'select', options: ['', 'BISA', 'TIDAK BISA'] },
    { key: 'bisaTaplak', label: 'Taplak Meja', type: 'select', options: ['', 'BISA', 'TIDAK BISA'] },
    { key: 'bisaFloorMat', label: 'Floor Mat', type: 'select', options: ['', 'BISA', 'TIDAK BISA'] },
];

const EDIT_PO_FIELDS = [
    { key: 'estimasiPengiriman', label: 'Estimasi Pengiriman', type: 'date' },
    { key: 'tanggalPODatang', label: 'Tanggal PO Datang', type: 'date' },
    { key: 'tglFakturTerbit', label: 'Tanggal Faktur Terbit', type: 'date' },
    { key: 'nominalInvoice', label: 'Nominal Invoice', type: 'number' },
    { key: 'totalUHT', label: 'Total UHT', type: 'number' },
    { key: 'totalBotolCair', label: 'Total Botol Cair', type: 'number' },
    { key: 'totalYogurt', label: 'Total Yogurt', type: 'number' },
];

const PillButton = ({ label, badge, onClick, color = 'default', endIcon: EndIcon }) => {
    const colorMap = {
        default: { border: '#d1d5db', color: '#374151', bg: 'white', hover: '#f9fafb' },
        primary: { border: '#3b82f6', color: '#3b82f6', bg: 'white', hover: 'rgba(59,130,246,0.04)' },
    };
    const c = colorMap[color];
    return (
        <Button
            onClick={onClick}
            variant="outlined"
            size="small"
            startIcon={
                <Box component="svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </Box>
            }
            endIcon={EndIcon ? (
                <Box component="svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {EndIcon === ChevronUp ? (
                        <polyline points="18 15 12 9 6 15" />
                    ) : (
                        <polyline points="6 9 12 15 18 9" />
                    )}
                </Box>
            ) : null}
            sx={{
                borderRadius: 999,
                borderColor: c.border,
                color: c.color,
                bgcolor: c.bg,
                px: 1.5,
                py: 0.6,
                fontSize: '0.82rem',
                fontWeight: 500,
                minWidth: 'auto',
                width: 'auto',
                textTransform: 'none',
                borderWidth: '1.5px',
                '&:hover': {
                    bgcolor: c.hover,
                    borderColor: c.border,
                },
            }}
        >
            {label}
            {badge !== undefined && badge > 0 && (
                <Box
                    component="span"
                    sx={{
                        ml: 0.75,
                        minWidth: 20,
                        height: 20,
                        borderRadius: 999,
                        bgcolor: '#3b82f6',
                        color: 'white',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        px: 0.5,
                        lineHeight: 1,
                    }}
                >
                    {badge}
                </Box>
            )}
        </Button>
    );
};

const SortIcon = () => (
    <Box component="svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4, display: 'inline-block', verticalAlign: 'middle' }}>
        <path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" />
    </Box>
);

export default function TertarikPO() {
    const [surveiData, setSurveiData] = useState([]);
    const [poData, setPoData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [page, setPage] = useState(1);

    const [filterOpen, setFilterOpen] = useState(true);
    const [filterDraft, setFilterDraft] = useState({ ...EMPTY_FILTER });
    const [activeFilter, setActiveFilter] = useState({ ...EMPTY_FILTER });

    // ===== EDIT STATE =====
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    const [editOriginalIds, setEditOriginalIds] = useState({ surveiId: '', poId: '' });
    const [editTab, setEditTab] = useState('survei');
    const [editSelectedFields, setEditSelectedFields] = useState({});
    const [editNotification, setEditNotification] = useState(null);

    const [visibleKeys, setVisibleKeys] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) return ALL_KEYS.filter(k => parsed.includes(k)); }
        } catch { /* ignore */ }
        return ALL_KEYS;
    });
    const [columnAnchor, setColumnAnchor] = useState(null);
    const [columnSearch, setColumnSearch] = useState('');
    const columnOpen = Boolean(columnAnchor);

    useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleKeys)); } catch { /* ignore */ } }, [visibleKeys]);

    const visibleColumns = useMemo(() => TERTARIK_PO_COLUMNS.filter(c => visibleKeys.includes(c.key)), [visibleKeys]);
    const toggleColumn = (key) => setVisibleKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    const selectAllColumns = () => setVisibleKeys([...ALL_KEYS]);
    const clearAllColumns = () => setVisibleKeys([]);
    const closeColumnPopover = () => { setColumnAnchor(null); setColumnSearch(''); };

    const filteredColumnList = useMemo(() => {
        if (!columnSearch) return TERTARIK_PO_COLUMNS;
        const q = columnSearch.toLowerCase();
        return TERTARIK_PO_COLUMNS.filter(c => c.label.toLowerCase().includes(q));
    }, [columnSearch]);

    useEffect(() => {
        setLoading(true);
        const unsubSurvei = onValue(ref(db, 'survei_data'), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const arr = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
                setSurveiData(arr);
            } else { setSurveiData([]); }
        }, (err) => { console.error(err); setError('Gagal memuat data survei.'); });

        const unsubPO = onValue(ref(db, 'po_data'), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const arr = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
                setPoData(arr);
            } else { setPoData([]); }
            setLoading(false);
        }, (err) => { console.error(err); setError('Gagal memuat data PO.'); });

        return () => { unsubSurvei(); unsubPO(); };
    }, []);

    const handleFilterChange = (field, value) => { setFilterDraft(prev => ({ ...prev, [field]: value })); };
    const handleApplyFilter = () => { setActiveFilter({ ...filterDraft }); setPage(1); };
    const handleResetFilter = () => { setFilterDraft({ ...EMPTY_FILTER }); setActiveFilter({ ...EMPTY_FILTER }); setPage(1); };

    const activeFilterCount = useMemo(() =>
        Object.values(activeFilter).filter(v => v !== '' && v !== null && v !== undefined).length,
    [activeFilter]);

    const poMap = useMemo(() => {
        const map = {};
        poData.forEach(po => {
            const key = makeMatchKey(po.namaSekolah, po.namaKantin);
            if (!map[key]) map[key] = [];
            map[key].push(po);
        });
        Object.keys(map).forEach(key => {
            map[key].sort((a, b) => {
                const da = parseTanggal(a.tanggalPembuatanPO) || new Date(0);
                const db2 = parseTanggal(b.tanggalPembuatanPO) || new Date(0);
                return da - db2;
            });
        });
        return map;
    }, [poData]);

    const mergedData = useMemo(() => {
        return surveiData
            .filter(s => isTertarik(s.tertarik))
            .map(s => {
                const key = makeMatchKey(s.namaSekolah, s.kantinName);
                const relatedPOs = poMap[key] || [];
                const batch1 = relatedPOs[0] || {};
                const jumlahItemBranding = countItemBranding(s);
                const tglPODatangBatch1 = batch1.tanggalPODatang || '';
                const endTglPODatangBatch1 = tglPODatangBatch1 ? tambahHari(tglPODatangBatch1, 30) : '';
                const sisaHariBatch1 = tglPODatangBatch1 ? hitungSisaHari(endTglPODatangBatch1) : '-';
                const totalUHT = Number(batch1.totalUHT) || 0;
                const totalBotolCair = Number(batch1.totalBotolCair) || 0;
                const totalYogurt = Number(batch1.totalYogurt) || 0;
                const totalQty = Number(batch1.totalQty) || 0;
                const kartonUHT = hitungKarton(totalUHT, 40);
                const kartonBotolCair = hitungKarton(totalBotolCair, 24);
                const kartonYogurt = hitungKarton(totalYogurt, 24);
                const totalKarton = kartonUHT + kartonBotolCair + kartonYogurt;
                return {
                    ...s,
                    _poId: batch1.id || null,
                    jumlahItemBranding,
                    tglPODatangBatch1,
                    endTglPODatangBatch1,
                    sisaHariBatch1,
                    totalUHT, totalBotolCair, totalYogurt, totalQty,
                    kartonUHT, kartonBotolCair, kartonYogurt, totalKarton,
                    hasPO: relatedPOs.length > 0,
                    poCount: relatedPOs.length,
                };
            });
    }, [surveiData, poMap]);

    const filteredData = useMemo(() => {
        return mergedData.filter(d => {
            const f = activeFilter;
            if (f.namaSekolah && !(d.namaSekolah || '').toLowerCase().includes(f.namaSekolah.toLowerCase())) return false;
            if (f.kantinName && !(d.kantinName || '').toLowerCase().includes(f.kantinName.toLowerCase())) return false;
            if (f.area && !(d.area || '').toLowerCase().includes(f.area.toLowerCase())) return false;
            if (f.namaPersonil && !(d.namaPersonil || '').toLowerCase().includes(f.namaPersonil.toLowerCase())) return false;
            if (f.userid && !(d.userid || '').toLowerCase().includes(f.userid.toLowerCase())) return false;
            if (f.role && d.role !== f.role) return false;
            if (f.grade && d.gradeSekolah !== f.grade) return false;
            if (f.bulan && d.bulan !== f.bulan) return false;
            if (f.tahun && String(d.tahun) !== String(f.tahun)) return false;
            if (f.statusPO === 'ada' && !d.hasPO) return false;
            if (f.statusPO === 'belum' && d.hasPO) return false;
            if (f.statusPO === 'datang' && !d.tglPODatangBatch1) return false;
            if (f.tanggalDari) { const dari = parseTanggal(f.tanggalDari); const tgl = parseTanggal(d.tanggal); if (!tgl || !dari || tgl < dari) return false; }
            if (f.tanggalSampai) { const sampai = parseTanggal(f.tanggalSampai); const tgl = parseTanggal(d.tanggal); if (!tgl || !sampai || tgl > sampai) return false; }
            return true;
        });
    }, [mergedData, activeFilter]);

    const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE) || 1;
    const paginatedData = filteredData.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

    const stats = useMemo(() => {
        const totalTertarik = filteredData.length;
        const sudahPO = filteredData.filter(d => d.hasPO).length;
        const sudahDatang = filteredData.filter(d => d.tglPODatangBatch1).length;
        const totalKartonAll = filteredData.reduce((sum, d) => sum + (d.totalKarton || 0), 0);
        return { totalTertarik, sudahPO, sudahDatang, totalKartonAll };
    }, [filteredData]);

    // ===== EDIT HANDLERS =====
    const openEditDialog = (row) => {
        setSelectedRow(row);
        setEditOriginalIds({ surveiId: row.id, poId: row._poId || '' });
        setEditFormData({
            // Survei fields
            namaSekolah: row.namaSekolah || '',
            kantinName: row.kantinName || '',
            area: row.area || '',
            userid: row.userid || '',
            namaPersonil: row.namaPersonil || '',
            role: row.role || '',
            gradeSekolah: row.gradeSekolah || '',
            tertarik: row.tertarik || '',
            bisaStikerChiller: row.bisaStikerChiller || '',
            bisaBanner: row.bisaBanner || '',
            bisaTaplak: row.bisaTaplak || '',
            bisaFloorMat: row.bisaFloorMat || '',
            // PO fields
            estimasiPengiriman: row.estimasiPengiriman || '',
            tanggalPODatang: row.tanggalPODatang || '',
            tglFakturTerbit: row.tglFakturTerbit || '',
            nominalInvoice: row.nominalInvoice || 0,
            totalUHT: row.totalUHT || 0,
            totalBotolCair: row.totalBotolCair || 0,
            totalYogurt: row.totalYogurt || 0,
        });
        const allFields = {};
        [...EDIT_SURVEI_FIELDS, ...EDIT_PO_FIELDS].forEach(f => { allFields[f.key] = false; });
        setEditSelectedFields(allFields);
        setEditTab('survei');
        setEditNotification(null);
        setEditDialogOpen(true);
    };

    const handleEditFormChange = (field, value) => {
        setEditFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleEditField = (fieldKey) => {
        setEditSelectedFields(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
    };

    const selectAllFieldsInTab = (tabKey) => {
        const fields = tabKey === 'survei' ? EDIT_SURVEI_FIELDS : EDIT_PO_FIELDS;
        const newSelected = { ...editSelectedFields };
        fields.forEach(f => { newSelected[f.key] = true; });
        setEditSelectedFields(newSelected);
    };

    const clearAllFieldsInTab = (tabKey) => {
        const fields = tabKey === 'survei' ? EDIT_SURVEI_FIELDS : EDIT_PO_FIELDS;
        const newSelected = { ...editSelectedFields };
        fields.forEach(f => { newSelected[f.key] = false; });
        setEditSelectedFields(newSelected);
    };

    const handleSaveEdit = async () => {
        const selectedCount = Object.values(editSelectedFields).filter(Boolean).length;
        if (selectedCount === 0) {
            setEditNotification({ type: 'error', message: 'Pilih minimal 1 kolom untuk diupdate!' });
            setTimeout(() => setEditNotification(null), 3000);
            return;
        }

        const surveiFields = EDIT_SURVEI_FIELDS.map(f => f.key);
        const poFields = EDIT_PO_FIELDS.map(f => f.key);

        const surveiPayload = {};
        const poPayload = {};

        Object.keys(editSelectedFields).forEach(key => {
            if (!editSelectedFields[key]) return;
            const val = editFormData[key];
            if (surveiFields.includes(key)) {
                surveiPayload[key] = (key === 'nominalInvoice' || key.startsWith('total')) ? Number(val) || 0 : val;
            } else if (poFields.includes(key)) {
                poPayload[key] = (key === 'nominalInvoice' || key.startsWith('total')) ? Number(val) || 0 : val;
            }
        });

        setEditLoading(true);
        try {
            const promises = [];
            if (Object.keys(surveiPayload).length > 0 && editOriginalIds.surveiId) {
                surveiPayload.updatedAt = new Date().toISOString();
                promises.push(update(ref(db, `survei_data/${editOriginalIds.surveiId}`), surveiPayload));
            }
            if (Object.keys(poPayload).length > 0 && editOriginalIds.poId) {
                poPayload.updatedAt = new Date().toISOString();
                promises.push(update(ref(db, `po_data/${editOriginalIds.poId}`), poPayload));
            }
            await Promise.all(promises);
            setEditNotification({ type: 'success', message: 'Data berhasil diupdate!' });
            setTimeout(() => {
                setEditDialogOpen(false);
                setEditNotification(null);
            }, 1500);
        } catch (err) {
            console.error(err);
            setEditNotification({ type: 'error', message: 'Gagal mengupdate data: ' + err.message });
            setTimeout(() => setEditNotification(null), 4000);
        } finally {
            setEditLoading(false);
        }
    };

    const handleExport = () => {
        if (filteredData.length === 0) { alert('Tidak ada data untuk di-export.'); return; }
        const exportData = filteredData.map(d => {
            const row = {};
            TERTARIK_PO_COLUMNS.forEach(col => { row[col.label] = d[col.key] ?? ''; });
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(exportData);
        ws['!cols'] = TERTARIK_PO_COLUMNS.map(c => ({ wch: Math.max(15, c.label.length + 2) }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Tertarik PO');
        saveAs(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/octet-stream' }), `Tertarik_PO_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const getGradeColor = (grade) => grade === 'A' ? 'success' : grade === 'B' ? 'warning' : grade === 'C' ? 'error' : 'default';

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const parsed = parseTanggal(dateStr);
        return parsed ? formatTanggal(parsed) : dateStr;
    };

    const renderCellValue = (col, value, row) => {
        if (value === null || value === undefined || value === '') {
            if (col.key === 'sisaHariBatch1') return <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>-</span>;
            return <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>-</span>;
        }
        if (col.key === 'sisaHariBatch1') {
            const num = Number(value);
            if (isNaN(num)) return <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{value}</span>;
            const color = num < 0 ? '#ef4444' : num <= 7 ? '#f59e0b' : '#10b981';
            return <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>{num} hari</span>;
        }
        if (col.key === 'jumlahItemBranding') {
            const num = Number(value);
            return <Chip label={`${num}/4`} size="small" color={num === 4 ? 'success' : num >= 2 ? 'warning' : 'default'} sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, borderRadius: 999 }} />;
        }
        if (['totalUHT', 'totalBotolCair', 'totalYogurt', 'totalQty'].includes(col.key)) {
            const num = Number(value);
            return <span style={{ fontSize: '0.75rem', fontWeight: num > 0 ? 700 : 400, color: num > 0 ? '#10b981' : '#9ca3af' }}>{num.toLocaleString('en-US')}</span>;
        }
        if (col.key.startsWith('karton') || col.key === 'totalKarton') {
            const num = Number(value);
            return <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6' }}>{num}</span>;
        }
        if (col.type === 'grade' && value) {
            return <Chip label={value} color={getGradeColor(value)} size="small" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, borderRadius: 999 }} />;
        }
        if (col.type === 'url' && typeof value === 'string' && value.startsWith('http')) {
            return (
                <Box component="a" onClick={(e) => { e.preventDefault(); setImagePreview(value); }}
                    sx={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                    Lihat
                </Box>
            );
        }
        if (col.type === 'date' || col.type === 'datetime') {
            return <span style={{ fontSize: '0.75rem' }}>{formatDate(value)}</span>;
        }
        const strVal = String(value);
        if (strVal.length > 28) {
            return <Tooltip title={strVal} arrow placement="top"><span style={{ cursor: 'help', fontSize: '0.75rem' }}>{strVal.substring(0, 28)}...</span></Tooltip>;
        }
        return <span style={{ fontSize: '0.75rem' }}>{strVal}</span>;
    };

    const colMinWidth = (col) => {
        if (col.type === 'number') return 70;
        if (col.type === 'date' || col.type === 'datetime') return 100;
        if (col.type === 'url') return 60;
        if (col.key === 'jumlahItemBranding' || col.key === 'sisaHariBatch1') return 80;
        if (col.key.startsWith('karton') || col.key === 'totalKarton') return 70;
        return 100;
    };

    const fieldStyle = { '& .MuiInputBase-root': { fontSize: '0.82rem', borderRadius: 999, bgcolor: 'background.paper' } };

    // Render edit field
    const renderEditField = (field) => {
        const isSelected = editSelectedFields[field.key];
        const value = editFormData[field.key];
        const isDisabled = !isSelected;

        const renderInput = () => {
            if (field.type === 'select') {
                return (
                    <FormControl fullWidth size="small">
                        <TextField select value={value} onChange={(e) => handleEditFormChange(field.key, e.target.value)} disabled={isDisabled}
                            sx={{ '& .MuiInputBase-root': { borderRadius: 2, bgcolor: isDisabled ? '#f3f4f6' : 'white' } }}
                            slotProps={{ select: { native: true } }}>
                            {field.options.map((opt, i) => <option key={i} value={opt}>{opt || '-- Pilih --'}</option>)}
                        </TextField>
                    </FormControl>
                );
            }
            if (field.type === 'date') {
                return <TextField fullWidth size="small" type="date" value={value} onChange={(e) => handleEditFormChange(field.key, e.target.value)} disabled={isDisabled}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ '& .MuiInputBase-root': { borderRadius: 2, bgcolor: isDisabled ? '#f3f4f6' : 'white' } }} />;
            }
            if (field.type === 'number') {
                return <TextField fullWidth size="small" type="number" value={value} onChange={(e) => handleEditFormChange(field.key, e.target.value)} disabled={isDisabled}
                    inputProps={{ min: 0 }}
                    sx={{ '& .MuiInputBase-root': { borderRadius: 2, bgcolor: isDisabled ? '#f3f4f6' : 'white' } }} />;
            }
            return <TextField fullWidth size="small" value={value} onChange={(e) => handleEditFormChange(field.key, e.target.value)} disabled={isDisabled}
                required={field.required}
                sx={{ '& .MuiInputBase-root': { borderRadius: 2, bgcolor: isDisabled ? '#f3f4f6' : 'white' } }} />;
        };

        return (
            <Grid size={{ xs: 12, sm: 6 }} key={field.key}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                    <Checkbox
                        checked={isSelected}
                        onChange={() => toggleEditField(field.key)}
                        size="small"
                        sx={{ p: 0.25, color: '#f59e0b', '&.Mui-checked': { color: '#f59e0b' } }}
                    />
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: isSelected ? '#111827' : '#9ca3af' }}>
                        {field.label}{field.required && ' *'}
                    </Typography>
                </Box>
                {renderInput()}
            </Grid>
        );
    };

    return (
        <Box sx={{ width: '100%', maxWidth: '100%' }}>
            <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: '0.78rem', color: '#6b7280' }}>Home &gt; <span style={{ color: '#111827', fontWeight: 500 }}>Tertarik & PO</span></Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
                <Box>
                    <Typography variant="h4" sx={{ color: '#111827' }}>Tertarik & PO</Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>Data kantin yang tertarik dengan program + status PO</Typography>
                </Box>
            </Box>

            <Paper sx={{ p: 3, mb: 2, bgcolor: 'white', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Button variant="outlined" size="small" startIcon={<Download size={15} />} onClick={handleExport} disabled={filteredData.length === 0}
                        sx={{ borderColor: '#10b981', color: '#10b981', bgcolor: 'rgba(16,185,129,0.04)', '&:hover': { bgcolor: 'rgba(16,185,129,0.08)' }, borderRadius: 999, px: 2 }}>
                        Export Excel
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<Columns3 size={15} />} endIcon={<ChevronDown size={14} />} onClick={(e) => setColumnAnchor(e.currentTarget)}
                        sx={{ borderColor: '#d1d5db', color: '#374151', borderRadius: 999, px: 2 }}>
                        Kolom ({visibleKeys.length}/{TERTARIK_PO_COLUMNS.length})
                    </Button>
                </Box>

                {/* FILTER BUTTON - HANYA TOMBOL FILTER */}
<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5, alignItems: 'center' }}>
    <PillButton
        label="Filter"
        badge={activeFilterCount}
        color="primary"
        onClick={() => setFilterOpen(!filterOpen)}
        endIcon={filterOpen ? ChevronUp : ChevronDown}
    />
</Box>

                {activeFilterCount > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.5 }}>
                        {Object.entries(activeFilter).map(([key, value]) => {
                            if (value === '' || value === null || value === undefined) return null;
                            const labelMap = { namaSekolah: 'Sekolah', kantinName: 'Kantin', area: 'Area', namaPersonil: 'Personil', userid: 'User ID', role: 'Role', grade: 'Grade', bulan: 'Bulan', tahun: 'Tahun', tanggalDari: 'Dari', tanggalSampai: 'Sampai', statusPO: 'Status PO' };
                            return <Chip key={key} label={`${labelMap[key] || key}: ${value}`} size="small" onDelete={() => handleFilterChange(key, '')} sx={{ bgcolor: 'rgba(59,130,246,0.08)', color: '#3b82f6', fontWeight: 500, fontSize: '0.72rem', height: 26, borderRadius: 999, border: '1px solid rgba(59,130,246,0.2)' }} />;
                        })}
                    </Box>
                )}

                {filterOpen && (
                    <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider', mt: 1 }}>
                        <Grid container spacing={1.5}>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" placeholder="Nama Sekolah" value={filterDraft.namaSekolah} onChange={(e) => handleFilterChange('namaSekolah', e.target.value)} sx={fieldStyle} /></Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" placeholder="Nama Kantin" value={filterDraft.kantinName} onChange={(e) => handleFilterChange('kantinName', e.target.value)} sx={fieldStyle} /></Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" placeholder="Area" value={filterDraft.area} onChange={(e) => handleFilterChange('area', e.target.value)} sx={fieldStyle} /></Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" placeholder="Nama Personil" value={filterDraft.namaPersonil} onChange={(e) => handleFilterChange('namaPersonil', e.target.value)} sx={fieldStyle} /></Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" placeholder="User ID" value={filterDraft.userid} onChange={(e) => handleFilterChange('userid', e.target.value)} sx={fieldStyle} /></Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <FormControl fullWidth size="small"><Select value={filterDraft.role} onChange={(e) => handleFilterChange('role', e.target.value)} displayEmpty sx={{ fontSize: '0.82rem', borderRadius: 999 }}><MenuItem value="" disabled>Role</MenuItem><MenuItem value="SPG">SPG</MenuItem><MenuItem value="TEAMLEADER">Team Leader</MenuItem><MenuItem value="MD">MD</MenuItem><MenuItem value="SUPERVISOR">Supervisor</MenuItem></Select></FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <FormControl fullWidth size="small"><Select value={filterDraft.grade} onChange={(e) => handleFilterChange('grade', e.target.value)} displayEmpty sx={{ fontSize: '0.82rem', borderRadius: 999 }}><MenuItem value="" disabled>Grade</MenuItem><MenuItem value="A">Grade A</MenuItem><MenuItem value="B">Grade B</MenuItem><MenuItem value="C">Grade C</MenuItem></Select></FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <FormControl fullWidth size="small"><Select value={filterDraft.statusPO} onChange={(e) => handleFilterChange('statusPO', e.target.value)} displayEmpty sx={{ fontSize: '0.82rem', borderRadius: 999 }}><MenuItem value="" disabled>Status PO</MenuItem><MenuItem value="ada">Sudah Ada PO</MenuItem><MenuItem value="belum">Belum Ada PO</MenuItem><MenuItem value="datang">PO Sudah Datang</MenuItem></Select></FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" type="date" value={filterDraft.tanggalDari} onChange={(e) => handleFilterChange('tanggalDari', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={fieldStyle} /></Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth size="small" type="date" value={filterDraft.tanggalSampai} onChange={(e) => handleFilterChange('tanggalSampai', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={fieldStyle} /></Grid>
                            <Grid size={12}><Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 1 }}><Button variant="outlined" size="small" startIcon={<RotateCcw size={14} />} onClick={handleResetFilter} sx={{ borderColor: '#ef4444', color: '#ef4444', borderRadius: 999 }}>Reset</Button><Button variant="contained" size="small" startIcon={<Check size={14} />} onClick={handleApplyFilter} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, borderRadius: 999, px: 2.5 }}>Terapkan Filter</Button></Box></Grid>
                        </Grid>
                    </Box>
                )}
            </Paper>

            <Grid container spacing={2} sx={{ mb: 2.5 }}>
                {[
                    { label: 'Kantin Tertarik', value: stats.totalTertarik, color: '#3b82f6', icon: Users },
                    { label: 'Sudah Ada PO', value: stats.sudahPO, color: '#10b981', icon: ShoppingCart },
                    { label: 'PO Sudah Datang', value: stats.sudahDatang, color: '#8b5cf6', icon: Check },
                    { label: 'Total Karton', value: stats.totalKartonAll.toLocaleString('en-US'), color: '#f59e0b', icon: TrendingUp },
                ].map((card) => {
                    const Icon = card.icon;
                    return (
                        <Grid size={{ xs: 6, sm: 6, md: 3 }} key={card.label}>
                            <Paper sx={{ p: 2, position: 'relative', overflow: 'hidden', width: '100%', height: '100%', border: '1px solid #e5e7eb', borderRadius: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#6b7280', mb: 0.5 }}>{card.label}</Typography>
                                        <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: card.color, lineHeight: 1, letterSpacing: '-0.02em' }}>{card.value}</Typography>
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
                                        {visibleColumns.map((col) => (<TableCell key={col.key} sx={{ bgcolor: '#f9fafb', fontWeight: 600, fontSize: '0.78rem', color: '#374151', padding: '10px 14px', minWidth: colMinWidth(col), whiteSpace: 'normal', lineHeight: 1.3 }}>{col.label} <SortIcon /></TableCell>))}
                                        <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 600, fontSize: '0.78rem', color: '#374151', textAlign: 'center', position: 'sticky', right: 0, zIndex: 4, minWidth: 90 }}>Aksi</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedData.length > 0 ? paginatedData.map((d, idx) => (
                                        <TableRow key={d.id} hover sx={{ '&:hover': { bgcolor: '#f9fafb' }, bgcolor: d.hasPO ? 'rgba(16,185,129,0.02)' : 'transparent' }}>
                                            <TableCell sx={{ position: 'sticky', left: 0, zIndex: 2, background: d.hasPO ? 'rgba(16,185,129,0.02)' : 'white', fontWeight: 600, color: '#6b7280', textAlign: 'center' }}>{(page - 1) * ROWS_PER_PAGE + idx + 1}</TableCell>
                                            {visibleColumns.map((col) => (<TableCell key={col.key}>{renderCellValue(col, d[col.key], d)}</TableCell>))}
                                            <TableCell align="center" sx={{ position: 'sticky', right: 0, zIndex: 2, background: d.hasPO ? 'rgba(16,185,129,0.02)' : 'white', padding: '6px' }}>
                                                <Tooltip title="Edit"><IconButton size="small" onClick={() => openEditDialog(d)} sx={{ color: '#f59e0b', padding: '4px' }}><Edit size={16} /></IconButton></Tooltip>
                                                <Tooltip title="Detail"><IconButton size="small" onClick={() => { setSelectedRow(d); setDetailOpen(true); }} sx={{ color: '#3b82f6', padding: '4px' }}><Eye size={16} /></IconButton></Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    )) : (<TableRow><TableCell colSpan={visibleColumns.length + 2} align="center" sx={{ py: 8, color: '#9ca3af', fontSize: '0.85rem' }}>Tidak ada data kantin yang tertarik.</TableCell></TableRow>)}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.78rem' }}>Menampilkan {filteredData.length === 0 ? 0 : (page - 1) * ROWS_PER_PAGE + 1}-{Math.min(page * ROWS_PER_PAGE, filteredData.length)} dari {filteredData.length} data</Typography>
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
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Info size={13} /> Kolom: {visibleKeys.length}/{TERTARIK_PO_COLUMNS.length} | Filter aktif: {activeFilterCount}</Typography>
            </Box>

            {/* ===== EDIT DIALOG WITH COLUMN SELECTION ===== */}
            <Dialog open={editDialogOpen} onClose={() => !editLoading && setEditDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ bgcolor: '#f59e0b', color: 'white', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Edit size={20} /> Edit Data
                    </Box>
                    <IconButton size="small" onClick={() => setEditDialogOpen(false)} sx={{ color: 'white' }}><X size={20} /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {editNotification && (
                        <Alert severity={editNotification.type} sx={{ mb: 2 }}>{editNotification.message}</Alert>
                    )}
                    <Alert severity="info" sx={{ mb: 2, fontSize: '0.78rem' }}>
                        <strong>Cara Edit:</strong> Centang kolom yang ingin diupdate. Data Survei & PO akan diupdate terpisah sesuai sumbernya.
                    </Alert>

                    <Box sx={{ display: 'flex', gap: 0.5, mb: 2, borderBottom: '1px solid #e5e7eb', pb: 1, flexWrap: 'wrap' }}>
                        <Button onClick={() => setEditTab('survei')} size="small"
                            sx={{ borderRadius: 2, bgcolor: editTab === 'survei' ? '#3b82f6' : '#f3f4f6', color: editTab === 'survei' ? 'white' : '#374151', fontWeight: 600, fontSize: '0.78rem', '&:hover': { bgcolor: editTab === 'survei' ? '#2563eb' : '#e5e7eb' } }}>
                            Data Survei
                        </Button>
                        <Button onClick={() => setEditTab('po')} size="small"
                            sx={{ borderRadius: 2, bgcolor: editTab === 'po' ? '#10b981' : '#f3f4f6', color: editTab === 'po' ? 'white' : '#374151', fontWeight: 600, fontSize: '0.78rem', '&:hover': { bgcolor: editTab === 'po' ? '#059669' : '#e5e7eb' } }}>
                            Data PO {editOriginalIds.poId ? '' : '(Belum Ada)'}
                        </Button>
                        <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                            <Button size="small" variant="text" onClick={() => selectAllFieldsInTab(editTab)} sx={{ fontSize: '0.7rem', color: '#00796B', px: 1 }}>Centang Semua</Button>
                            <Button size="small" variant="text" onClick={() => clearAllFieldsInTab(editTab)} sx={{ fontSize: '0.7rem', color: '#dc2626', px: 1 }}>Hapus Semua</Button>
                        </Box>
                    </Box>

                    {editTab === 'po' && !editOriginalIds.poId && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Kantin ini belum memiliki data PO. Edit hanya bisa dilakukan untuk data Survei.
                        </Alert>
                    )}

                    <Grid container spacing={1.5}>
                        {editTab === 'survei' && EDIT_SURVEI_FIELDS.map(renderEditField)}
                        {editTab === 'po' && editOriginalIds.poId && EDIT_PO_FIELDS.map(renderEditField)}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 1.5, bgcolor: '#f9fafb' }}>
                    <Button onClick={() => setEditDialogOpen(false)} disabled={editLoading} sx={{ borderRadius: 999, color: '#6b7280' }}>Batal</Button>
                    <Button variant="contained" onClick={handleSaveEdit} disabled={editLoading} startIcon={editLoading ? <CircularProgress size={16} /> : <Save size={16} />}
                        sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, borderRadius: 999, px: 2.5 }}>
                        {editLoading ? 'Menyimpan...' : `Simpan (${Object.values(editSelectedFields).filter(Boolean).length} kolom)`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Column Toggle Popover */}
            <Popover open={columnOpen} anchorEl={columnAnchor} onClose={closeColumnPopover} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} slotProps={{ paper: { sx: { width: 340, maxHeight: 560, display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: '0 12px 40px rgba(15,23,42,0.12)', border: '1px solid #e5e7eb' } } }}>
                <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#3b82f6', color: 'white' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Tampilkan Kolom</Typography><IconButton size="small" onClick={closeColumnPopover} sx={{ color: 'white', width: 24, height: 24 }}><X size={16} /></IconButton></Box>
                    <Typography sx={{ fontSize: '0.68rem', opacity: 0.9, mt: 0.25 }}>{visibleKeys.length} dari {TERTARIK_PO_COLUMNS.length} kolom aktif</Typography>
                </Box>
                <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 0.5 }}><Button size="small" variant="text" onClick={selectAllColumns} sx={{ fontSize: '0.7rem', color: '#3b82f6', minWidth: 0, px: 1 }}>Tampilkan Semua</Button><Button size="small" variant="text" onClick={clearAllColumns} sx={{ fontSize: '0.7rem', color: '#ef4444', minWidth: 0, px: 1 }}>Sembunyikan Semua</Button></Box>
                <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}><TextField fullWidth size="small" placeholder="Cari kolom..." value={columnSearch} onChange={(e) => setColumnSearch(e.target.value)} slotProps={{ input: { startAdornment: (<InputAdornment position="start"><SearchIcon size={14} color="#9ca3af" /></InputAdornment>) } }} sx={{ '& .MuiInputBase-root': { fontSize: '0.78rem', borderRadius: 999 } }} /></Box>
                <Box sx={{ flex: 1, overflowY: 'auto' }}>
                    {filteredColumnList.length === 0 ? (<Box sx={{ p: 3, textAlign: 'center' }}><Typography sx={{ fontSize: '0.78rem', color: '#9ca3af' }}>Tidak ada kolom ditemukan</Typography></Box>) : (
                        filteredColumnList.map((col) => {
                            const isChecked = visibleKeys.includes(col.key);
                            return (
                                <Box key={col.key} onClick={() => toggleColumn(col.key)} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.25, py: 0.75, cursor: 'pointer', borderBottom: '1px solid', borderColor: 'rgba(229,231,235,0.6)', bgcolor: isChecked ? 'rgba(59,130,246,0.04)' : 'transparent', '&:hover': { bgcolor: 'rgba(59,130,246,0.08)' } }}>
                                    <input type="checkbox" checked={isChecked} onChange={() => toggleColumn(col.key)} style={{ accentColor: '#3b82f6' }} />
                                    <Box sx={{ flex: 1, minWidth: 0 }}><Typography sx={{ fontSize: '0.75rem', fontWeight: isChecked ? 600 : 400, color: isChecked ? '#111827' : '#6b7280', lineHeight: 1.3 }} noWrap>{col.label}</Typography><Typography sx={{ fontSize: '0.62rem', color: '#9ca3af' }} noWrap>{col.source === 'survei' ? 'dari Survei' : col.source === 'po' ? 'dari PO' : 'Otomatis'}</Typography></Box>
                                </Box>
                            );
                        })
                    )}
                </Box>
                <Box sx={{ p: 1.25, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#f9fafb' }}><Button fullWidth variant="contained" size="small" onClick={closeColumnPopover} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, fontSize: '0.78rem', borderRadius: 999 }}>Selesai</Button></Box>
            </Popover>

            {/* Detail Dialog */}
            <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ bgcolor: '#3b82f6', color: 'white', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{selectedRow?.namaSekolah || 'Detail'}</Box>
                    <IconButton size="small" onClick={() => setDetailOpen(false)} sx={{ color: 'white' }}><X size={20} /></IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0, maxHeight: 600, overflow: 'auto' }}>
                    {selectedRow && (
                        <Box sx={{ p: 2 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827', mb: 1 }}>{selectedRow.namaSekolah}</Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: '#6b7280', mb: 2 }}>{selectedRow.kantinName} - {selectedRow.area} | Grade: {selectedRow.gradeSekolah}</Typography>
                            <Grid container spacing={1.5}>
                                {TERTARIK_PO_COLUMNS.map(col => {
                                    const val = selectedRow[col.key];
                                    if (val === null || val === undefined || val === '') return null;
                                    return (
                                        <Grid key={col.key} size={{ xs: 12, sm: 6 }}>
                                            <Typography sx={{ fontSize: '0.68rem', color: '#9ca3af', fontWeight: 600 }}>{col.label}</Typography>
                                            <Typography sx={{ fontSize: '0.82rem', color: '#111827', fontWeight: 500 }}>{renderCellValue(col, val, selectedRow)}</Typography>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 1.5, bgcolor: '#f9fafb' }}><Button variant="contained" size="small" onClick={() => setDetailOpen(false)} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, borderRadius: 999 }}>Tutup</Button></DialogActions>
            </Dialog>

            {/* Image Preview */}
            <Dialog open={!!imagePreview} onClose={() => setImagePreview(null)} maxWidth="lg">
                <IconButton onClick={() => setImagePreview(null)} sx={{ position: 'absolute', right: 8, top: 8, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', zIndex: 1 }}><X size={20} /></IconButton>
                <Box component="img" src={imagePreview} sx={{ display: 'block', maxWidth: '90vw', maxHeight: '90vh' }} />
            </Dialog>
        </Box>
    );
}