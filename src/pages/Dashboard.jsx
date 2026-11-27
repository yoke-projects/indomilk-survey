import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Paper, IconButton, Chip, Dialog, DialogTitle, DialogContent,
    DialogActions, Button, Grid, Select, MenuItem, FormControl,
    TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert, Tooltip, Collapse, CircularProgress
} from '@mui/material';
import {
    X, ChevronDown, ChevronUp, Filter, AlertTriangle, TrendingUp,
    TrendingDown, ShoppingCart, Users, DollarSign, CheckCircle,
    Clock, Truck, FileText, BarChart3
} from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
    CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    ComposedChart
} from 'recharts';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

// ===== KOSTANTA =====
const COLORS = {
    primary: '#3b82f6', success: '#10b981', warning: '#f59e0b', error: '#ef4444',
    purple: '#8b5cf6', pink: '#ec4899', cyan: '#06b6d4', orange: '#f97316', gray: '#6b7280',
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const EMPTY_FILTER = {
    area: '', role: '', grade: '', bulan: '', tahun: '',
    tanggalDari: '', tanggalSampai: '', statusPO: ''
};

// ===== HELPER LOKAL =====
const parseTanggal = (str) => {
    if (!str) return null;
    if (str instanceof Date) return isNaN(str) ? null : str;
    const isSerial = (typeof str === 'number') ||
        (typeof str === 'string' && /^\d{5}(\.\d+)?$/.test(str.trim()));
    if (isSerial) {
        const serial = Number(str);
        if (!isNaN(serial) && serial >= 30000 && serial < 60000) {
            const ms = Math.round((serial - 25569) * 86400 * 1000);
            const d = new Date(ms);
            return isNaN(d) ? null : d;
        }
    }
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
    if (str.includes('-')) {
        const parts = str.split('-');
        if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return new Date(y, m, d);
        }
    }
    const dt = new Date(str);
    return isNaN(dt) ? null : dt;
};

const formatTanggal = (date) => {
    if (!date) return '-';
    if (date instanceof Date && !isNaN(date)) {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    }
    if (typeof date === 'string' && date.includes('/')) return date;
    const parsed = parseTanggal(date);
    if (parsed) return formatTanggal(parsed);
    return date;
};

const isTertarik = (value) => {
    if (!value) return false;
    const v = String(value).toLowerCase().trim();
    return ['ya', 'tertarik', 'iya', 'yes', 'y', 'setuju', 'mau'].includes(v);
};

const isReschedule = (value) => {
    if (!value) return false;
    const v = String(value).toLowerCase().trim();
    return ['reschedule', 'nanti', 'tunda', 'pending'].includes(v);
};

const getGradeColor = (grade) => grade === 'A' ? 'success' : grade === 'B' ? 'warning' : grade === 'C' ? 'error' : 'default';

// ===== KOMPONEN PIE CHART KARTU (reusable) =====
const PieChartCard = ({ title, data, height = 300 }) => {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    return (
        <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>{title}</Typography>
            <ResponsiveContainer width="100%" height={height}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                    >
                        {data.map((entry, i) => <Cell key={i} fill={entry.color || PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip
                        contentStyle={{ borderRadius: 8, fontSize: '0.78rem' }}
                        formatter={(value, name) => [`${value} (${((value / total) * 100).toFixed(1)}%)`, name]}
                    />
                </PieChart>
            </ResponsiveContainer>
            {/* Legend custom */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center', mt: 1 }}>
                {data.map((entry, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: entry.color || PIE_COLORS[i % PIE_COLORS.length] }} />
                        <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>
                            {entry.name}: <strong>{entry.value}</strong>
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};

export default function Dashboard() {
    const [surveiData, setSurveiData] = useState([]);
    const [poData, setPoData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [filterOpen, setFilterOpen] = useState(true);
    const [filterDraft, setFilterDraft] = useState({ ...EMPTY_FILTER });
    const [activeFilter, setActiveFilter] = useState({ ...EMPTY_FILTER });

    const [detailDialog, setDetailDialog] = useState({ open: false, title: '', data: [], type: '' });
    const [alertsDialog, setAlertsDialog] = useState({ open: false, title: '', alerts: [] });

    useEffect(() => {
        setLoading(true);
        const unsub1 = onValue(ref(db, 'survei_data'), (snap) => {
            const d = snap.val();
            setSurveiData(d ? Object.keys(d).map(k => ({ id: k, ...d[k] })) : []);
        }, (err) => { console.error(err); setError('Gagal memuat data survei.'); });

        const unsub2 = onValue(ref(db, 'po_data'), (snap) => {
            const d = snap.val();
            setPoData(d ? Object.keys(d).map(k => ({ id: k, ...d[k] })) : []);
            setLoading(false);
        }, (err) => { console.error(err); setError('Gagal memuat data PO.'); setLoading(false); });

        return () => { unsub1(); unsub2(); };
    }, []);

    const handleFilterChange = (f, v) => setFilterDraft(prev => ({ ...prev, [f]: v }));
    const handleApplyFilter = () => setActiveFilter({ ...filterDraft });
    const handleResetFilter = () => { setFilterDraft({ ...EMPTY_FILTER }); setActiveFilter({ ...EMPTY_FILTER }); };

    const activeFilterCount = useMemo(() =>
        Object.values(activeFilter).filter(v => v !== '' && v !== null && v !== undefined).length,
    [activeFilter]);

    // ===== FILTERED DATA =====
    const filteredSurvei = useMemo(() => {
        return surveiData.filter(s => {
            const f = activeFilter;
            if (f.area && !(s.area || '').toLowerCase().includes(f.area.toLowerCase())) return false;
            if (f.role && s.role !== f.role) return false;
            if (f.grade && s.gradeSekolah !== f.grade) return false;
            if (f.bulan && s.bulan !== f.bulan) return false;
            if (f.tahun && String(s.tahun) !== String(f.tahun)) return false;
            if (f.tanggalDari || f.tanggalSampai) {
                const tgl = parseTanggal(s.tanggal);
                if (f.tanggalDari && tgl && tgl < parseTanggal(f.tanggalDari)) return false;
                if (f.tanggalSampai && tgl && tgl > parseTanggal(f.tanggalSampai)) return false;
            }
            return true;
        });
    }, [surveiData, activeFilter]);

    const filteredPO = useMemo(() => {
        return poData.filter(p => {
            const f = activeFilter;
            if (f.area && !(p.area || '').toLowerCase().includes(f.area.toLowerCase())) return false;
            if (f.role && p.role !== f.role) return false;
            if (f.bulan && p.bulan !== f.bulan) return false;
            if (f.tahun && String(p.tahun) !== String(f.tahun)) return false;
            return true;
        });
    }, [poData, activeFilter]);

    // ===== SCORECARDS =====
    const scorecards = useMemo(() => {
        const totalSurvei = filteredSurvei.length;
        const tertarik = filteredSurvei.filter(s => isTertarik(s.tertarik)).length;
        const tidakTertarik = filteredSurvei.filter(s => s.tertarik && !isTertarik(s.tertarik) && !isReschedule(s.tertarik)).length;
        const reschedule = filteredSurvei.filter(s => isReschedule(s.tertarik)).length;
        const totalPO = filteredPO.length;
        const poDatang = filteredPO.filter(p => p.tanggalPODatang).length;
        const totalRevenue = filteredPO.reduce((sum, p) => sum + (Number(p.nominalInvoice) || 0), 0);
        const avgSkor = filteredSurvei.length > 0
            ? (filteredSurvei.reduce((sum, s) => sum + (Number(s.totalSkor) || 0), 0) / filteredSurvei.length).toFixed(1)
            : 0;

        return [
            { label: 'Total Survei', value: totalSurvei, color: COLORS.primary, icon: Users, type: 'survei' },
            { label: 'Tertarik', value: tertarik, color: COLORS.success, icon: CheckCircle, type: 'tertarik' },
            { label: 'Tidak Tertarik', value: tidakTertarik, color: COLORS.error, icon: TrendingDown, type: 'tidakTertarik' },
            { label: 'Reschedule', value: reschedule, color: COLORS.warning, icon: Clock, type: 'reschedule' },
            { label: 'Total PO', value: totalPO, color: COLORS.purple, icon: ShoppingCart, type: 'po' },
            { label: 'PO Datang', value: poDatang, color: COLORS.cyan, icon: Truck, type: 'poDatang' },
            { label: 'Total Revenue', value: `Rp ${(totalRevenue / 1000000).toFixed(1)}M`, color: COLORS.orange, icon: DollarSign, type: 'revenue' },
            { label: 'Avg Skor', value: avgSkor, color: COLORS.pink, icon: TrendingUp, type: 'avgSkor' },
        ];
    }, [filteredSurvei, filteredPO]);

    // ===== ALERTS =====
    const alerts = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysLater = new Date(today);
        sevenDaysLater.setDate(today.getDate() + 7);

        const result = { comingSoon: [], delivered: [], invoicePending: [], overdue: [] };

        filteredPO.forEach(po => {
            const estimasi = parseTanggal(po.estimasiPengiriman);
            const datang = parseTanggal(po.tanggalPODatang);
            const faktur = parseTanggal(po.tglFakturTerbit);

            if (datang) {
                result.delivered.push(po);
                if (!faktur) result.invoicePending.push(po);
            } else if (estimasi) {
                if (estimasi <= today) result.overdue.push(po);
                else if (estimasi <= sevenDaysLater) result.comingSoon.push(po);
            }
        });

        return result;
    }, [filteredPO]);

    const totalAlerts = alerts.comingSoon.length + alerts.delivered.length + alerts.invoicePending.length + alerts.overdue.length;

    // ===== CHART 1: Survei per Personil (Stacked Bar) =====
    const chartPersonil = useMemo(() => {
        const map = {};
        filteredSurvei.forEach(s => {
            const name = s.namaPersonil || 'Unknown';
            if (!map[name]) map[name] = { name, total: 0, tertarik: 0, tidakTertarik: 0, reschedule: 0 };
            map[name].total++;
            if (isTertarik(s.tertarik)) map[name].tertarik++;
            else if (isReschedule(s.tertarik)) map[name].reschedule++;
            else if (s.tertarik) map[name].tidakTertarik++;
        });
        return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
    }, [filteredSurvei]);

    // ===== CHART 2: Survei vs Tertarik vs PO (Composed) =====
    const chartConversion = useMemo(() => {
        const months = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
        return months.map(m => {
            const surveiBulan = filteredSurvei.filter(s => s.bulan === m);
            const tertarikBulan = surveiBulan.filter(s => isTertarik(s.tertarik));
            const poBulan = filteredPO.filter(p => p.bulan === m);
            return {
                bulan: m.substring(0, 3),
                Survei: surveiBulan.length,
                Tertarik: tertarikBulan.length,
                PO: poBulan.length,
            };
        });
    }, [filteredSurvei, filteredPO]);

    // ===== CHART 3: Komposisi Status Survei (PIE) =====
    const chartStatus = useMemo(() => {
        const tertarik = filteredSurvei.filter(s => isTertarik(s.tertarik)).length;
        const tidakTertarik = filteredSurvei.filter(s => s.tertarik && !isTertarik(s.tertarik) && !isReschedule(s.tertarik)).length;
        const reschedule = filteredSurvei.filter(s => isReschedule(s.tertarik)).length;
        const belumRespon = filteredSurvei.filter(s => !s.tertarik).length;
        return [
            { name: 'Tertarik', value: tertarik, color: COLORS.success },
            { name: 'Tidak Tertarik', value: tidakTertarik, color: COLORS.error },
            { name: 'Reschedule', value: reschedule, color: COLORS.warning },
            { name: 'Belum Respon', value: belumRespon, color: COLORS.gray },
        ].filter(x => x.value > 0);
    }, [filteredSurvei]);

    // ===== CHART 4: Grade Kantin (PIE - UBAH DARI BAR) =====
    const chartGrade = useMemo(() => {
        const grades = { A: 0, B: 0, C: 0, '-': 0 };
        filteredSurvei.forEach(s => {
            const g = s.gradeSekolah || '-';
            if (grades[g] !== undefined) grades[g]++;
            else grades['-']++;
        });
        return [
            { name: 'Grade A', value: grades.A, color: COLORS.success },
            { name: 'Grade B', value: grades.B, color: COLORS.warning },
            { name: 'Grade C', value: grades.C, color: COLORS.error },
            { name: 'Tanpa Grade', value: grades['-'], color: COLORS.gray },
        ].filter(x => x.value > 0);
    }, [filteredSurvei]);

    // ===== CHART 5: PO per Kategori (PIE - UBAH DARI AREA, AGREGAT TOTAL) =====
    const chartPOKategori = useMemo(() => {
        const totalUHT = filteredPO.reduce((sum, p) => sum + (Number(p.totalUHT) || 0), 0);
        const totalBotol = filteredPO.reduce((sum, p) => sum + (Number(p.totalBotolCair) || 0), 0);
        const totalYogurt = filteredPO.reduce((sum, p) => sum + (Number(p.totalYogurt) || 0), 0);
        return [
            { name: 'UHT', value: totalUHT, color: COLORS.primary },
            { name: 'Botol Cair', value: totalBotol, color: COLORS.success },
            { name: 'Yogurt', value: totalYogurt, color: COLORS.orange },
        ].filter(x => x.value > 0);
    }, [filteredPO]);

    // ===== HANDLERS =====
    const handleScorecardClick = (card) => {
        let data = [];
        let title = '';
        if (card.type === 'survei') { data = filteredSurvei; title = 'Detail Semua Survei'; }
        else if (card.type === 'tertarik') { data = filteredSurvei.filter(s => isTertarik(s.tertarik)); title = 'Detail Kantin Tertarik'; }
        else if (card.type === 'tidakTertarik') { data = filteredSurvei.filter(s => s.tertarik && !isTertarik(s.tertarik) && !isReschedule(s.tertarik)); title = 'Detail Kantin Tidak Tertarik'; }
        else if (card.type === 'reschedule') { data = filteredSurvei.filter(s => isReschedule(s.tertarik)); title = 'Detail Reschedule'; }
        else if (card.type === 'po') { data = filteredPO; title = 'Detail Semua PO'; }
        else if (card.type === 'poDatang') { data = filteredPO.filter(p => p.tanggalPODatang); title = 'Detail PO Sudah Datang'; }
        else if (card.type === 'revenue') { data = filteredPO.filter(p => Number(p.nominalInvoice) > 0); title = 'Detail Revenue (PO dengan Nominal)'; }
        else if (card.type === 'avgSkor') { data = [...filteredSurvei].sort((a, b) => (Number(b.totalSkor) || 0) - (Number(a.totalSkor) || 0)); title = 'Detail Survei (Sorted by Skor)'; }
        setDetailDialog({ open: true, title, data, type: card.type });
    };

    const handleAlertClick = (type) => {
        const alertMap = {
            comingSoon: { title: 'PO Coming Soon (7 Hari)', alerts: alerts.comingSoon },
            delivered: { title: 'PO Sudah Datang', alerts: alerts.delivered },
            invoicePending: { title: 'Invoice Pending (Belum Faktur)', alerts: alerts.invoicePending },
            overdue: { title: 'PO Overdue (Lewat Estimasi)', alerts: alerts.overdue },
        };
        const info = alertMap[type];
        if (info) setAlertsDialog({ open: true, ...info });
    };

    const fieldStyle = { '& .MuiInputBase-root': { fontSize: '0.82rem', borderRadius: 999, bgcolor: 'background.paper' } };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress size={40} sx={{ color: COLORS.primary }} />
                    <Typography sx={{ mt: 2, color: '#6b7280', fontSize: '0.85rem' }}>Memuat data dashboard...</Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', maxWidth: '100%' }}>
            {/* Breadcrumb */}
            <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: '0.78rem', color: '#6b7280' }}>
                    Home &gt; <span style={{ color: '#111827', fontWeight: 500 }}>Dashboard</span>
                </Typography>
            </Box>

            {/* Title */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
                <Box>
                    <Typography variant="h4" sx={{ color: '#111827', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BarChart3 size={28} color={COLORS.primary} /> Dashboard Analytics
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
                        Monitoring & Analitik Survei + Purchase Order Indomilk
                    </Typography>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

            {/* FILTER BAR */}
            <Paper sx={{ p: 2, mb: 2.5, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: filterOpen ? 1.5 : 0, flexWrap: 'wrap', gap: 1 }}>
                    <Button
                        variant="outlined" size="small"
                        startIcon={<Filter size={15} />}
                        endIcon={filterOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        onClick={() => setFilterOpen(!filterOpen)}
                        sx={{ borderRadius: 999, borderColor: COLORS.primary, color: COLORS.primary, borderWidth: '1.5px', minWidth: 120, '&:hover': { bgcolor: 'rgba(59,130,246,0.04)', borderColor: COLORS.primary } }}
                    >
                        Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </Button>
                    {activeFilterCount > 0 && (
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {Object.entries(activeFilter).map(([k, v]) => {
                                if (!v) return null;
                                const labels = { area: 'Area', role: 'Role', grade: 'Grade', bulan: 'Bulan', tahun: 'Tahun', tanggalDari: 'Dari', tanggalSampai: 'Sampai', statusPO: 'Status' };
                                return <Chip key={k} label={`${labels[k] || k}: ${v}`} size="small" onDelete={() => handleFilterChange(k, '')} sx={{ height: 24, fontSize: '0.7rem', borderRadius: 999, bgcolor: 'rgba(59,130,246,0.08)', color: COLORS.primary }} />;
                            })}
                        </Box>
                    )}
                </Box>
                <Collapse in={filterOpen}>
                    <Grid container spacing={1.5}>
                        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}><TextField fullWidth size="small" placeholder="Area" value={filterDraft.area} onChange={(e) => handleFilterChange('area', e.target.value)} sx={fieldStyle} /></Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                            <FormControl fullWidth size="small"><Select value={filterDraft.role} onChange={(e) => handleFilterChange('role', e.target.value)} displayEmpty sx={{ borderRadius: 999 }}><MenuItem value="" disabled>Role</MenuItem><MenuItem value="SPG">SPG</MenuItem><MenuItem value="TEAMLEADER">Team Leader</MenuItem><MenuItem value="MD">MD</MenuItem><MenuItem value="SUPERVISOR">Supervisor</MenuItem></Select></FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                            <FormControl fullWidth size="small"><Select value={filterDraft.grade} onChange={(e) => handleFilterChange('grade', e.target.value)} displayEmpty sx={{ borderRadius: 999 }}><MenuItem value="" disabled>Grade</MenuItem><MenuItem value="A">A</MenuItem><MenuItem value="B">B</MenuItem><MenuItem value="C">C</MenuItem></Select></FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                            <FormControl fullWidth size="small"><Select value={filterDraft.bulan} onChange={(e) => handleFilterChange('bulan', e.target.value)} displayEmpty sx={{ borderRadius: 999 }}><MenuItem value="" disabled>Bulan</MenuItem>{['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}</Select></FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                            <FormControl fullWidth size="small"><Select value={filterDraft.tahun} onChange={(e) => handleFilterChange('tahun', e.target.value)} displayEmpty sx={{ borderRadius: 999 }}><MenuItem value="" disabled>Tahun</MenuItem>{[2024, 2025, 2026, 2027].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}</Select></FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 6 }}><TextField fullWidth size="small" type="date" value={filterDraft.tanggalDari} onChange={(e) => handleFilterChange('tanggalDari', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={fieldStyle} /></Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 6 }}><TextField fullWidth size="small" type="date" value={filterDraft.tanggalSampai} onChange={(e) => handleFilterChange('tanggalSampai', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={fieldStyle} /></Grid>
                        <Grid size={12}><Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 1 }}><Button size="small" onClick={handleResetFilter} sx={{ borderRadius: 999, color: COLORS.error }}>Reset</Button><Button variant="contained" size="small" onClick={handleApplyFilter} sx={{ bgcolor: COLORS.primary, borderRadius: 999, '&:hover': { bgcolor: '#2563eb' } }}>Terapkan</Button></Box></Grid>
                    </Grid>
                </Collapse>
            </Paper>

            {/* SCORECARDS */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
                {scorecards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Grid size={{ xs: 6, sm: 6, md: 3 }} key={card.label}>
                            <Paper onClick={() => handleScorecardClick(card)} sx={{ p: 1.75, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', borderColor: card.color } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontSize: '0.68rem', color: '#6b7280', fontWeight: 500, mb: 0.4 }}>{card.label}</Typography>
                                        <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: card.color, lineHeight: 1 }}>{card.value}</Typography>
                                    </Box>
                                    <Box sx={{ width: 40, height: 40, borderRadius: 2, background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Icon size={20} color={card.color} />
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>

            {/* ALERTS PANEL */}
            <Paper sx={{ p: 2, mb: 2.5, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AlertTriangle size={18} color={COLORS.warning} /> Alerts & Tracking PO
                    {totalAlerts > 0 && <Chip label={totalAlerts} size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: COLORS.error, color: 'white', borderRadius: 999 }} />}
                </Typography>
                <Grid container spacing={1.5}>
                    {[
                        { key: 'overdue', label: 'Overdue', desc: 'Lewat estimasi, belum datang', count: alerts.overdue.length, color: COLORS.error, icon: AlertTriangle },
                        { key: 'invoicePending', label: 'Invoice Pending', desc: 'Sudah datang, belum faktur', count: alerts.invoicePending.length, color: COLORS.warning, icon: FileText },
                        { key: 'comingSoon', label: 'Coming Soon', desc: 'Estimasi 7 hari ke depan', count: alerts.comingSoon.length, color: COLORS.primary, icon: Clock },
                        { key: 'delivered', label: 'Delivered', desc: 'PO sudah datang', count: alerts.delivered.length, color: COLORS.success, icon: Truck },
                    ].map(alert => {
                        const Icon = alert.icon;
                        return (
                            <Grid size={{ xs: 6, md: 3 }} key={alert.key}>
                                <Paper onClick={() => handleAlertClick(alert.key)} sx={{ p: 1.5, cursor: 'pointer', border: `1.5px solid ${alert.color}30`, bgcolor: `${alert.color}08`, transition: 'all 0.2s', '&:hover': { border: `1.5px solid ${alert.color}`, bgcolor: `${alert.color}15` } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Icon size={20} color={alert.color} />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: alert.color }}>{alert.label}</Typography>
                                            <Typography sx={{ fontSize: '0.65rem', color: '#6b7280' }}>{alert.desc}</Typography>
                                        </Box>
                                        <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: alert.color }}>{alert.count}</Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            </Paper>

            {/* CHARTS ROW 1: Personil Bar + Status Pie */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Survei per Personil (Top 10)</Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartPersonil} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <RechartsTooltip contentStyle={{ borderRadius: 8, fontSize: '0.78rem' }} />
                                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                                <Bar dataKey="tertarik" stackId="a" fill={COLORS.success} name="Tertarik" />
                                <Bar dataKey="tidakTertarik" stackId="a" fill={COLORS.error} name="Tidak Tertarik" />
                                <Bar dataKey="reschedule" stackId="a" fill={COLORS.warning} name="Reschedule" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                    <PieChartCard title="Komposisi Status Survei" data={chartStatus} height={300} />
                </Grid>
            </Grid>

            {/* CHARTS ROW 2: Conversion Line + 2 Pie Charts */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Survei vs Tertarik vs PO (Bulanan)</Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={chartConversion} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <RechartsTooltip contentStyle={{ borderRadius: 8, fontSize: '0.78rem' }} />
                                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                                <Bar dataKey="Survei" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="Tertarik" stroke={COLORS.success} strokeWidth={2} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="PO" stroke={COLORS.purple} strokeWidth={2} dot={{ r: 4 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <PieChartCard title="Distribusi Grade Kantin" data={chartGrade} height={300} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <PieChartCard title="PO per Kategori Produk" data={chartPOKategori} height={300} />
                </Grid>
            </Grid>

            {/* SCORECARD DETAIL DIALOG */}
            <Dialog open={detailDialog.open} onClose={() => setDetailDialog({ ...detailDialog, open: false })} maxWidth="md" fullWidth>
                <DialogTitle sx={{ bgcolor: COLORS.primary, color: 'white', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                    <Box>{detailDialog.title}</Box>
                    <IconButton size="small" onClick={() => setDetailDialog({ ...detailDialog, open: false })} sx={{ color: 'white' }}><X size={20} /></IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0, maxHeight: 500, overflow: 'auto' }}>
                    <TableContainer>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 600 }}>No</TableCell>
                                    <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 600 }}>Nama Sekolah</TableCell>
                                    <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 600 }}>Kantin</TableCell>
                                    <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 600 }}>Area</TableCell>
                                    <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 600 }}>Personil</TableCell>
                                    {detailDialog.type === 'revenue' && <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 600 }}>Nominal</TableCell>}
                                    {detailDialog.type === 'avgSkor' && <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 600 }}>Skor</TableCell>}
                                    {detailDialog.type === 'avgSkor' && <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 600 }}>Grade</TableCell>}
                                    {['po', 'poDatang'].includes(detailDialog.type) && <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 600 }}>No. PO</TableCell>}
                                    {['po', 'poDatang'].includes(detailDialog.type) && <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 600 }}>Status</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {detailDialog.data.length > 0 ? detailDialog.data.map((d, i) => (
                                    <TableRow key={d.id} hover>
                                        <TableCell>{i + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{d.namaSekolah || '-'}</TableCell>
                                        <TableCell>{d.kantinName || d.namaKantin || '-'}</TableCell>
                                        <TableCell>{d.area || '-'}</TableCell>
                                        <TableCell>{d.namaPersonil || '-'}</TableCell>
                                        {detailDialog.type === 'revenue' && <TableCell sx={{ color: COLORS.success, fontWeight: 600 }}>Rp {(Number(d.nominalInvoice) || 0).toLocaleString('id-ID')}</TableCell>}
                                        {detailDialog.type === 'avgSkor' && <TableCell sx={{ fontWeight: 700 }}>{d.totalSkor || 0}</TableCell>}
                                        {detailDialog.type === 'avgSkor' && <TableCell><Chip label={d.gradeSekolah || '-'} size="small" color={getGradeColor(d.gradeSekolah)} sx={{ height: 20, fontSize: '0.7rem' }} /></TableCell>}
                                        {['po', 'poDatang'].includes(detailDialog.type) && <TableCell>{d.nomorPO || '-'}</TableCell>}
                                        {['po', 'poDatang'].includes(detailDialog.type) && <TableCell><Chip label={d.tanggalPODatang ? 'Datang' : 'Proses'} size="small" color={d.tanggalPODatang ? 'success' : 'warning'} sx={{ height: 20, fontSize: '0.7rem' }} /></TableCell>}
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: '#9ca3af' }}>Tidak ada data</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions sx={{ p: 1.5, bgcolor: '#f9fafb' }}>
                    <Button variant="contained" onClick={() => setDetailDialog({ ...detailDialog, open: false })} sx={{ bgcolor: COLORS.primary, borderRadius: 999 }}>Tutup</Button>
                </DialogActions>
            </Dialog>

            {/* ALERTS DETAIL DIALOG */}
            <Dialog open={alertsDialog.open} onClose={() => setAlertsDialog({ ...alertsDialog, open: false })} maxWidth="md" fullWidth>
                <DialogTitle sx={{ bgcolor: COLORS.warning, color: 'white', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                    <Box>{alertsDialog.title}</Box>
                    <IconButton size="small" onClick={() => setAlertsDialog({ ...alertsDialog, open: false })} sx={{ color: 'white' }}><X size={20} /></IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0, maxHeight: 500, overflow: 'auto' }}>
                    <TableContainer>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 600 }}>No</TableCell>
                                    <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 600 }}>No. PO</TableCell>
                                    <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 600 }}>Sekolah</TableCell>
                                    <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 600 }}>Kantin</TableCell>
                                    <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 600 }}>Estimasi</TableCell>
                                    <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 600 }}>Tgl Datang</TableCell>
                                    <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 600 }}>Faktur</TableCell>
                                    <TableCell sx={{ bgcolor: '#f9fafb', fontWeight: 600 }}>Nominal</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {alertsDialog.alerts.length > 0 ? alertsDialog.alerts.map((a, i) => (
                                    <TableRow key={a.id} hover>
                                        <TableCell>{i + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: COLORS.primary }}>{a.nomorPO || '-'}</TableCell>
                                        <TableCell>{a.namaSekolah || '-'}</TableCell>
                                        <TableCell>{a.namaKantin || '-'}</TableCell>
                                        <TableCell>{formatTanggal(a.estimasiPengiriman)}</TableCell>
                                        <TableCell>{formatTanggal(a.tanggalPODatang)}</TableCell>
                                        <TableCell>{formatTanggal(a.tglFakturTerbit)}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: COLORS.success }}>Rp {(Number(a.nominalInvoice) || 0).toLocaleString('id-ID')}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: '#9ca3af' }}>Tidak ada data</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions sx={{ p: 1.5, bgcolor: '#f9fafb' }}>
                    <Button variant="contained" onClick={() => setAlertsDialog({ ...alertsDialog, open: false })} sx={{ bgcolor: COLORS.primary, borderRadius: 999 }}>Tutup</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}