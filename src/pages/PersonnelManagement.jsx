import React, { useState, useEffect } from 'react';
import {
        Box, Typography, Button, TextField, Dialog, DialogTitle,
        DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer,
        TableHead, TableRow, Paper, IconButton, Chip, CircularProgress, Alert, Grid, InputAdornment
} from '@mui/material';
import {
        Plus, Search, User, Edit, Trash2, X, Check, Loader2, Download, ChevronDown
} from 'lucide-react';
import { ref, onValue, push, set, remove, update } from 'firebase/database';
import { db } from '../firebase';

// ===== PILL BUTTON COMPONENT (SADATA Style) =====
const PillButton = ({ icon: Icon, label, active, badge, onClick, color = 'default', endIcon: EndIcon }) => {
    const colorMap = {
        default: { border: '#d1d5db', color: '#374151', bg: 'white', hover: '#f9fafb' },
        primary: { border: '#3b82f6', color: '#3b82f6', bg: 'rgba(59,130,246,0.04)', hover: 'rgba(59,130,246,0.08)' },
        success: { border: '#10b981', color: '#10b981', bg: 'rgba(16,185,129,0.04)', hover: 'rgba(16,185,129,0.08)' },
    };
    const c = colorMap[color];
    return (
        <Button
            onClick={onClick}
            variant="outlined"
            size="small"
            startIcon={Icon ? <Icon size={15} /> : null}
            endIcon={EndIcon ? <EndIcon size={14} /> : null}
            sx={{
                borderRadius: 999,
                borderColor: c.border,
                color: c.color,
                bgcolor: c.bg,
                px: 1.5,
                py: 0.6,
                fontSize: '0.82rem',
                fontWeight: 500,
                '&:hover': { bgcolor: c.hover, borderColor: c.color },
            }}
        >
            {label}
            {badge !== undefined && badge > 0 && (
                <Box sx={{
                    ml: 0.5, minWidth: 18, height: 18, borderRadius: 999,
                    bgcolor: '#3b82f6', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 700, px: 0.5,
                }}>
                    {badge}
                </Box>
            )}
        </Button>
    );
};

const INITIAL_FORM_DATA = { id: '', uid: '', nama: '', role: '', area: '', region: '', password: '', createdAt: '' };

export default function PersonnelManagement() {
        const [personnel, setPersonnel] = useState([]);
        const [loading, setLoading] = useState(true);
        const [searchTerm, setSearchTerm] = useState('');
        const [openDialog, setOpenDialog] = useState(false);
        const [isEditMode, setIsEditMode] = useState(false);
        const [formData, setFormData] = useState(INITIAL_FORM_DATA);
        const [submitLoading, setSubmitLoading] = useState(false);
        const [error, setError] = useState('');

        useEffect(() => {
                const personnelRef = ref(db, 'data_personil');
                const unsubscribe = onValue(personnelRef, (snapshot) => {
                        const data = snapshot.val();
                        if (data) {
                                const personilArray = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
                                setPersonnel(personilArray);
                        } else {
                                setPersonnel([]);
                        }
                        setLoading(false);
                }, (err) => {
                        console.error(err);
                        setError("Gagal memuat data. Periksa konfigurasi Firebase.");
                        setLoading(false);
                });
                return () => unsubscribe();
        }, []);

        const handleOpenDialog = (person = null) => {
                if (person) {
                        setIsEditMode(true);
                        setFormData({
                                id: person.id,
                                uid: person.uid || '',
                                nama: person.nama || '',
                                role: person.role || '',
                                area: person.area || '',
                                region: person.region || '',
                                password: person.password || '',
                                createdAt: person.createdAt || ''
                        });
                } else {
                        setIsEditMode(false);
                        setFormData(INITIAL_FORM_DATA);
                }
                setOpenDialog(true);
                setError('');
        };

        const handleCloseDialog = () => {
                setOpenDialog(false);
                setFormData(INITIAL_FORM_DATA);
                setIsEditMode(false);
        };

        const handleInputChange = (e) => {
                const { name, value } = e.target;
                setFormData((prev) => ({ ...prev, [name]: value }));
        };

        const handleSubmit = async (e) => {
                e.preventDefault();
                setSubmitLoading(true);
                try {
                        if (!formData.uid || !formData.nama || !formData.role) {
                                throw new Error("UID, Nama, dan Role wajib diisi!");
                        }
                        const finalCreatedAt = isEditMode
                                ? (formData.createdAt || new Date().toISOString())
                                : new Date().toISOString();

                        const payload = {
                                uid: formData.uid,
                                nama: formData.nama,
                                role: formData.role,
                                area: formData.area,
                                region: formData.region,
                                password: formData.password,
                                createdAt: finalCreatedAt
                        };

                        if (isEditMode) {
                                await update(ref(db, `data_personil/${formData.id}`), payload);
                        } else {
                                await set(push(ref(db, 'data_personil')), payload);
                        }
                        handleCloseDialog();
                } catch (err) {
                        setError(err.message);
                } finally {
                        setSubmitLoading(false);
                }
        };

        const handleDelete = async (id) => {
                if (window.confirm("Yakin ingin menghapus personil ini?")) {
                        try {
                                await remove(ref(db, `data_personil/${id}`));
                        } catch (err) {
                                console.error("Gagal menghapus:", err);
                                alert("Gagal menghapus data.");
                        }
                }
        };

        const filteredPersonnel = personnel.filter((p) =>
                p.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.uid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.area?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const getRoleColor = (role) => {
                if (role === 'TEAMLEADER') return 'primary';
                if (role === 'SPG') return 'success';
                if (role === 'MD') return 'info';
                return 'default';
        };

        // Sort icon untuk header tabel
        const SortIcon = () => (
                <Box component="svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4, display: 'inline-block', verticalAlign: 'middle' }}>
                        <path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>
                </Box>
        );

        return (
                <Box sx={{ width: '100%', maxWidth: '100%' }}>
                        {/* Breadcrumb */}
                        <Box sx={{ mb: 2 }}>
                                <Typography sx={{ fontSize: '0.78rem', color: '#6b7280' }}>
                                        Home <span style={{ margin: '0 6px', color: '#d1d5db' }}>&gt;</span> <span style={{ color: '#111827', fontWeight: 500 }}>Manage Personil</span>
                                </Typography>
                        </Box>

                        {/* Title */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
                                <Typography variant="h4" sx={{ color: '#111827' }}>
                                        Personil
                                </Typography>
                        </Box>

                        {/* Main Card */}
                        <Paper sx={{ p: 3, mb: 2, bgcolor: 'white', borderRadius: 2 }}>
                                {/* Action Buttons */}
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                        <Button variant="contained" size="small" startIcon={<Plus size={16} />} onClick={() => handleOpenDialog()} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, borderRadius: 999, px: 2 }}>
                                                Tambah Personil
                                        </Button>
                                        <Button variant="outlined" size="small" startIcon={<Download size={15} />} endIcon={<ChevronDown size={14} />}
                                                sx={{ borderColor: '#10b981', color: '#10b981', bgcolor: 'rgba(16,185,129,0.04)', '&:hover': { bgcolor: 'rgba(16,185,129,0.08)', borderColor: '#10b981' }, borderRadius: 999, px: 2 }}>
                                                Export
                                        </Button>
                                </Box>

                                {/* Search Bar */}
                                <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                                        <TextField
                                                fullWidth
                                                placeholder="Cari berdasarkan Nama, UID, atau Area..."
                                                variant="outlined"
                                                size="small"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                slotProps={{
                                                        input: {
                                                                startAdornment: (
                                                                        <InputAdornment position="start">
                                                                                <Search size={16} color="#9ca3af" />
                                                                        </InputAdornment>
                                                                ),
                                                        },
                                                }}
                                                sx={{
                                                        maxWidth: 400,
                                                        '& .MuiInputBase-root': { fontSize: '0.82rem', borderRadius: 999, bgcolor: 'background.paper' }
                                                }}
                                        />
                                </Box>

                                {/* Table */}
                                <Box sx={{ overflow: 'hidden', mt: 2 }}>
                                        {loading ? (
                                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                                                        <CircularProgress size={32} sx={{ color: '#3b82f6' }} />
                                                </Box>
                                        ) : error ? (
                                                <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
                                        ) : (
                                                <TableContainer sx={{ maxHeight: '65vh' }}>
                                                        <Table stickyHeader size="small" sx={{ width: '100%', '& .MuiTableCell-root': { fontSize: '0.8rem', padding: '12px 16px', whiteSpace: 'nowrap', borderBottom: '1px solid #e5e7eb' } }}>
                                                                <TableHead>
                                                                        <TableRow>
                                                                                {['UID', 'Nama', 'Role', 'Area', 'Region', 'Password', 'Aksi'].map((head) => (
                                                                                        <TableCell key={head} sx={{ bgcolor: '#f9fafb', fontWeight: 600, fontSize: '0.78rem', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>
                                                                                                {head} <SortIcon />
                                                                                        </TableCell>
                                                                                ))}
                                                                        </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                        {filteredPersonnel.length > 0 ? filteredPersonnel.map((person) => (
                                                                                <TableRow key={person.id} hover sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                                                                                        <TableCell sx={{ fontWeight: 600, color: '#3b82f6', borderBottom: '1px solid #e5e7eb' }}>{person.uid}</TableCell>
                                                                                        <TableCell sx={{ borderBottom: '1px solid #e5e7eb' }}>{person.nama}</TableCell>
                                                                                        <TableCell sx={{ borderBottom: '1px solid #e5e7eb' }}>
                                                                                                <Chip label={person.role} color={getRoleColor(person.role)} size="small" sx={{ height: 24, fontSize: '0.72rem', fontWeight: 500, borderRadius: 999 }} />
                                                                                        </TableCell>
                                                                                        <TableCell sx={{ borderBottom: '1px solid #e5e7eb' }}>{person.area}</TableCell>
                                                                                        <TableCell sx={{ borderBottom: '1px solid #e5e7eb' }}>{person.region}</TableCell>
                                                                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>
                                                                                                {person.password ? '••••••••' : '-'}
                                                                                        </TableCell>
                                                                                        <TableCell align="center" sx={{ borderBottom: '1px solid #e5e7eb', padding: '6px' }}>
                                                                                                <IconButton size="small" onClick={() => handleOpenDialog(person)} sx={{ color: '#3b82f6', padding: '4px' }}>
                                                                                                        <Edit size={16} />
                                                                                                </IconButton>
                                                                                                <IconButton size="small" onClick={() => handleDelete(person.id)} sx={{ color: '#ef4444', padding: '4px' }}>
                                                                                                        <Trash2 size={16} />
                                                                                                </IconButton>
                                                                                        </TableCell>
                                                                                </TableRow>
                                                                        )) : (
                                                                                <TableRow>
                                                                                        <TableCell colSpan={7} align="center" sx={{ py: 8, color: '#9ca3af', fontSize: '0.85rem' }}>
                                                                                                Tidak ada data personil ditemukan.
                                                                                        </TableCell>
                                                                                </TableRow>
                                                                        )}
                                                                </TableBody>
                                                        </Table>
                                                </TableContainer>
                                        )}
                                </Box>
                        </Paper>

                        {/* Dialog Form */}
                        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                                <DialogTitle sx={{ bgcolor: '#3b82f6', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, py: 1.5 }}>
                                        <User size={20} /> {isEditMode ? 'Edit Data Personil' : 'Tambah Personil Baru'}
                                </DialogTitle>
                                <form onSubmit={handleSubmit}>
                                        <DialogContent dividers>
                                                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                                                <Grid container spacing={2}>
                                                        <Grid size={{ xs: 12, sm: 6 }}>
                                                                <TextField fullWidth size="small" label="UID (Kode Personil)" name="uid" value={formData.uid} onChange={handleInputChange} required disabled={isEditMode}
                                                                        sx={{ '& .MuiInputBase-root': { borderRadius: 999 } }} />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, sm: 6 }}>
                                                                <TextField fullWidth size="small" label="Nama Lengkap" name="nama" value={formData.nama} onChange={handleInputChange} required
                                                                        sx={{ '& .MuiInputBase-root': { borderRadius: 999 } }} />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, sm: 6 }}>
                                                                <TextField fullWidth size="small" label="Role" name="role" value={formData.role} onChange={handleInputChange} required select
                                                                        sx={{ '& .MuiInputBase-root': { borderRadius: 999 } }}
                                                                        slotProps={{ select: { native: true } }}>
                                                                        <option value="">Pilih Role</option>
                                                                        <option value="SPG">SPG</option>
                                                                        <option value="TEAMLEADER">TEAMLEADER</option>
                                                                        <option value="MD">MD</option>
                                                                </TextField>
                                                        </Grid>
                                                        <Grid size={{ xs: 12, sm: 6 }}>
                                                                <TextField fullWidth size="small" label="Area" name="area" value={formData.area} onChange={handleInputChange} required
                                                                        sx={{ '& .MuiInputBase-root': { borderRadius: 999 } }} />
                                                        </Grid>
                                                        <Grid size={{ xs: 12 }}>
                                                                <TextField fullWidth size="small" label="Region" name="region" value={formData.region} onChange={handleInputChange} required
                                                                        sx={{ '& .MuiInputBase-root': { borderRadius: 999 } }} />
                                                        </Grid>
                                                        <Grid size={{ xs: 12 }}>
                                                                <TextField fullWidth size="small" label="Password" name="password" type="text" value={formData.password} onChange={handleInputChange} required
                                                                        sx={{ '& .MuiInputBase-root': { borderRadius: 999 } }} />
                                                        </Grid>
                                                </Grid>
                                        </DialogContent>
                                        <DialogActions sx={{ p: 1.5, bgcolor: '#f9fafb' }}>
                                                <Button onClick={handleCloseDialog} sx={{ borderRadius: 999, color: '#6b7280' }}>Batal</Button>
                                                <Button type="submit" variant="contained" disabled={submitLoading} startIcon={submitLoading ? <Loader2 size={16} /> : <Check size={16} />}
                                                        sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, borderRadius: 999, px: 2.5 }}>
                                                        {submitLoading ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Tambah Data')}
                                                </Button>
                                        </DialogActions>
                                </form>
                        </Dialog>
                </Box>
        );
}