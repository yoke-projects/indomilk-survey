import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField,
    Alert, LinearProgress, Chip, Divider
} from '@mui/material';
import {
    Trash2, Database, ShieldAlert, Check, X, AlertTriangle,
    Users, ShoppingCart, BarChart3, RefreshCw
} from 'lucide-react';
import { ref, onValue, remove } from 'firebase/database';
import { db } from '../firebase';

const DATABASE_NODES = [
    {
        key: 'data_personil',
        label: 'Data Personil',
        description: 'Data tim lapangan (SPG, Team Leader, MD, Supervisor)',
        icon: Users,
        color: '#3b82f6',
        warning: 'Semua data personil akan dihapus permanen',
    },
    {
        key: 'po_data',
        label: 'Data Purchase Order',
        description: 'Data PO kantin sekolah (40 kolom)',
        icon: ShoppingCart,
        color: '#10b981',
        warning: 'Semua data PO termasuk foto & nominal akan hilang',
    },
    {
        key: 'survei_data',
        label: 'Data Survei',
        description: 'Data survei kantin sekolah (78 kolom)',
        icon: BarChart3,
        color: '#f59e0b',
        warning: 'Semua data survei termasuk skor & grade akan hilang',
    },
];

export default function Settings() {
    const [dbCounts, setDbCounts] = useState({});
    const [loadingCounts, setLoadingCounts] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedDb, setSelectedDb] = useState(null);
    const [confirmText, setConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [deleteProgress, setDeleteProgress] = useState(0);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        const unsubscribeList = [];
        DATABASE_NODES.forEach((node) => {
            const dbRef = ref(db, node.key);
            const unsub = onValue(dbRef, (snapshot) => {
                const data = snapshot.val();
                const count = data ? Object.keys(data).length : 0;
                setDbCounts(prev => ({ ...prev, [node.key]: count }));
            });
            unsubscribeList.push(unsub);
        });
        setLoadingCounts(false);
        return () => unsubscribeList.forEach(u => u());
    }, []);

    const handleOpenDeleteDialog = (dbNode) => {
        setSelectedDb(dbNode);
        setConfirmText('');
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setSelectedDb(null);
        setConfirmText('');
        setDeleteProgress(0);
    };

    const handleConfirmDelete = async () => {
        if (confirmText !== 'HAPUS') {
            setNotification({ type: 'error', message: 'Ketik "HAPUS" untuk konfirmasi penghapusan' });
            setTimeout(() => setNotification(null), 4000);
            return;
        }

        setDeleting(true);
        setDeleteProgress(10);

        try {
            const dbRef = ref(db, selectedDb.key);
            setDeleteProgress(50);
            await remove(dbRef);
            setDeleteProgress(100);

            setNotification({
                type: 'success',
                message: `Berhasil menghapus semua data ${selectedDb.label}`,
            });
            handleCloseDeleteDialog();
            setTimeout(() => setNotification(null), 5000);
        } catch (err) {
            console.error(err);
            setNotification({
                type: 'error',
                message: `Gagal menghapus data: ${err.message}`,
            });
            setTimeout(() => setNotification(null), 5000);
        } finally {
            setDeleting(false);
            setDeleteProgress(0);
        }
    };

    return (
        <Box sx={{ width: '100%', maxWidth: '100%' }}>
            {/* Breadcrumb */}
            <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: '0.78rem', color: '#6b7280' }}>
                    Home &gt; <span style={{ color: '#111827', fontWeight: 500 }}>Settings</span>
                </Typography>
            </Box>

            {/* Title */}
            <Box sx={{ mb: 2.5 }}>
                <Typography variant="h4" sx={{ color: '#111827', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShieldAlert size={28} strokeWidth={2} />
                    Pengaturan Database
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
                    Kelola dan hapus data dari Firebase Realtime Database
                </Typography>
            </Box>

            {/* Notification */}
            {notification && (
                <Alert
                    severity={notification.type}
                    sx={{ mb: 2, borderRadius: 2 }}
                    onClose={() => setNotification(null)}
                >
                    {notification.message}
                </Alert>
            )}

            {/* Warning Banner */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                    <Box>
                        <Typography sx={{ fontWeight: 700, color: '#92400e', fontSize: '0.85rem' }}>
                            Perhatian: Aksi Tidak Dapat Dibatalkan
                        </Typography>
                        <Typography sx={{ color: '#92400e', fontSize: '0.78rem', mt: 0.25 }}>
                            Menghapus database akan menghilangkan SEMUA data secara permanen. Pastikan Anda sudah melakukan backup/export data sebelum menghapus.
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Database Cards */}
            {loadingCounts ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <RefreshCw size={32} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {DATABASE_NODES.map((node) => {
                        const Icon = node.icon;
                        const count = dbCounts[node.key] || 0;
                        return (
                            <Paper
                                key={node.key}
                                sx={{
                                    p: 2.5,
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 2,
                                    bgcolor: 'white',
                                    transition: 'all 0.2s ease',
                                    '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                    {/* Icon */}
                                    <Box sx={{
                                        width: 56, height: 56, borderRadius: 2, flexShrink: 0,
                                        background: `${node.color}15`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Icon size={28} color={node.color} strokeWidth={2} />
                                    </Box>

                                    {/* Info */}
                                    <Box sx={{ flex: 1, minWidth: 200 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                                            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>
                                                {node.label}
                                            </Typography>
                                            <Chip
                                                label={`${count} data`}
                                                size="small"
                                                sx={{
                                                    height: 22, fontSize: '0.7rem', fontWeight: 600,
                                                    bgcolor: count > 0 ? `${node.color}15` : '#f3f4f6',
                                                    color: count > 0 ? node.color : '#6b7280',
                                                    borderRadius: 999,
                                                }}
                                            />
                                        </Box>
                                        <Typography sx={{ fontSize: '0.78rem', color: '#6b7280', mb: 0.5 }}>
                                            {node.description}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af', fontFamily: 'monospace' }}>
                                            Node: {node.key}
                                        </Typography>
                                    </Box>

                                    {/* Delete Button */}
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<Trash2 size={15} />}
                                        onClick={() => handleOpenDeleteDialog(node)}
                                        disabled={count === 0}
                                        sx={{
                                            borderColor: '#ef4444',
                                            color: '#ef4444',
                                            borderRadius: 999,
                                            px: 2,
                                            minWidth: 140,
                                            '&:hover': {
                                                bgcolor: 'rgba(239,68,68,0.08)',
                                                borderColor: '#dc2626',
                                            },
                                            '&:disabled': {
                                                borderColor: '#d1d5db',
                                                color: '#9ca3af',
                                            },
                                        }}
                                    >
                                        {count === 0 ? 'Kosong' : 'Hapus Semua'}
                                    </Button>
                                </Box>
                            </Paper>
                        );
                    })}
                </Box>
            )}

            {/* Info Footer */}
            <Box sx={{ mt: 3, p: 2, bgcolor: '#f9fafb', borderRadius: 2, border: '1px solid #e5e7eb' }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, mb: 0.5 }}>
                    Informasi Teknis
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af', lineHeight: 1.6 }}>
                    Database: Firebase Realtime Database ({db.databaseURL})<br />
                    Total node aktif: {Object.values(dbCounts).reduce((sum, c) => sum + c, 0)} records<br />
                    Terakhir sync: {new Date().toLocaleString('id-ID')}
                </Typography>
            </Box>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => !deleting && handleCloseDeleteDialog()}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ bgcolor: '#ef4444', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, py: 1.5 }}>
                    <AlertTriangle size={20} />
                    Konfirmasi Hapus Database
                </DialogTitle>

                <DialogContent sx={{ p: 3 }}>
                    {selectedDb && (
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, p: 2, bgcolor: '#fef2f2', borderRadius: 2, border: '1px solid #fecaca' }}>
                                <AlertTriangle size={24} color="#dc2626" />
                                <Box>
                                    <Typography sx={{ fontWeight: 700, color: '#991b1b', fontSize: '0.9rem' }}>
                                        Hapus {selectedDb.label}?
                                    </Typography>
                                    <Typography sx={{ color: '#991b1b', fontSize: '0.78rem', mt: 0.25 }}>
                                        {selectedDb.warning}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography sx={{ fontSize: '0.82rem', color: '#374151', mb: 1, fontWeight: 600 }}>
                                    Jumlah data yang akan dihapus:
                                </Typography>
                                <Chip
                                    label={`${dbCounts[selectedDb.key] || 0} records`}
                                    sx={{
                                        height: 32, fontSize: '0.85rem', fontWeight: 700,
                                        bgcolor: '#fef2f2', color: '#dc2626',
                                        borderRadius: 999,
                                    }}
                                />
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Typography sx={{ fontSize: '0.82rem', color: '#374151', mb: 1, fontWeight: 600 }}>
                                Untuk mengonfirmasi, ketik <strong style={{ color: '#dc2626' }}>HAPUS</strong> di bawah ini:
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Ketik HAPUS di sini..."
                                disabled={deleting}
                                sx={{ '& .MuiInputBase-root': { borderRadius: 2, fontFamily: 'monospace' } }}
                                slotProps={{
                                    input: {
                                        endAdornment: confirmText === 'HAPUS' ? (
                                            <Check size={18} color="#10b981" />
                                        ) : null,
                                    },
                                }}
                            />

                            {deleting && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography sx={{ fontSize: '0.78rem', color: '#6b7280', mb: 0.5 }}>
                                        Menghapus data... {deleteProgress}%
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={deleteProgress}
                                        sx={{ height: 8, borderRadius: 4, bgcolor: '#f3f4f6' }}
                                    />
                                </Box>
                            )}
                        </>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2, bgcolor: '#f9fafb' }}>
                    <Button
                        onClick={handleCloseDeleteDialog}
                        disabled={deleting}
                        startIcon={<X size={16} />}
                        sx={{ borderRadius: 999, color: '#6b7280' }}
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        disabled={confirmText !== 'HAPUS' || deleting}
                        startIcon={<Trash2 size={16} />}
                        sx={{
                            bgcolor: '#ef4444',
                            color: 'white',
                            borderRadius: 999,
                            px: 2.5,
                            '&:hover': { bgcolor: '#dc2626' },
                            '&:disabled': { bgcolor: '#fca5a5', color: 'white' },
                        }}
                    >
                        {deleting ? 'Menghapus...' : 'Ya, Hapus Semua'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}