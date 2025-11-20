import React, { useEffect, useState, useContext, useRef } from 'react';
import {
    Card, CardHeader, CardContent, Divider, Table, TableContainer,
    TableHead, TableBody, TableRow, TableCell, TablePagination,
    Stack, Box, CircularProgress, Paper, Typography, TextField, Chip
} from '@mui/material';
import axiosInstance from 'api/axiosInstance';
import { AuthContext } from 'AuthContex/AuthContext';

const NotificationsPage = () => {
    const { user } = useContext(AuthContext);
    const userRole = (user?.role || '').toLowerCase();

    const [notifications, setNotifications] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Audio notifikasi
    const notifSound = useRef(new Audio('/asset/sounds/notif.mp3'));
    const lastNotifIds = useRef([]);

    const notificationEndpoint = (() => {
        if (userRole === 'checker') return '/checker/notifications';
        if (userRole === 'petugas') return '/petugas/notifications';
        return '/notifications'; 
    })();

    const fetchNotifications = async () => {
        try {
            const res = await axiosInstance.get(notificationEndpoint);
            if (res.data.success) {
                const newData = res.data.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                // ==== Deteksi notifikasi baru untuk bunyi ====
                const currentIds = newData.map(n => n.id);
                const hasNew = currentIds.some(id => !lastNotifIds.current.includes(id));
                if (hasNew && lastNotifIds.current.length > 0) {
                    // putar suara hanya jika bukan fetch pertama
                    try {
                        const audio = notifSound.current;
                        audio.currentTime = 0;
                        audio.volume = 0.7;
                        audio.play().catch(() => console.warn('Autoplay diblokir browser'));
                    } catch (err) {
                        console.error('Gagal memutar suara notif:', err);
                    }
                }
                lastNotifIds.current = currentIds; // update lastNotifIds

                setNotifications(newData);
            } else {
                setError(res.data.message || 'Gagal mengambil notifikasi');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan server');
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchNotifications().then(() => setLoading(false));

        const interval = setInterval(fetchNotifications, 5000); // cek tiap 5 detik
        return () => clearInterval(interval);
    }, [userRole, notificationEndpoint]);

    useEffect(() => {
        const filteredData = notifications.filter(n =>
            n.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (userRole !== 'petugas' && (n.catatan || '').toLowerCase().includes(searchTerm.toLowerCase())) ||
            (n.nasabah || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (n.marketing || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFiltered(filteredData);
        setPage(0);
    }, [searchTerm, notifications, userRole]);

    const handleChangePage = (_, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (e) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

    const getStatusColor = (status) => {
        if (!status) return 'default';
        const lowerStatus = status.toLowerCase();
        if (lowerStatus.includes('approved')) return 'success';
        if (lowerStatus.includes('rejected')) return 'error';
        return 'default';
    };

    if (loading)
        return (
            <Stack alignItems="center" justifyContent="center" sx={{ height: '80vh' }}>
                <CircularProgress />
            </Stack>
        );

    if (error)
        return (
            <Typography color="error" variant="h6" align="center" sx={{ mt: 2 }}>
                Error: {error}
            </Typography>
        );

    return (
        <Card>
            <CardHeader
                title={`Notifikasi (${userRole.toUpperCase()})`}
                action={
                    <TextField
                        variant="outlined"
                        size="small"
                        placeholder="Cari status, catatan, nasabah, marketing..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ width: { xs: '100%', sm: 350 } }}
                    />
                }
            />
            <Divider />
            <CardContent>
                <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                    <Box sx={{ minWidth: 700 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center">No</TableCell>
                                    <TableCell align="center">Status</TableCell>
                                    {userRole !== 'petugas' && <TableCell>Catatan</TableCell>}
                                    <TableCell>Nasabah</TableCell>
                                    <TableCell>Marketing</TableCell>
                                    <TableCell align="center">Waktu</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(rowsPerPage > 0
                                    ? filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    : filtered
                                ).map((n, idx) => (
                                    <TableRow key={n.id} hover>
                                        <TableCell align="center">{page * rowsPerPage + idx + 1}</TableCell>
                                        <TableCell align="center">
                                            <Chip label={n.status || '-'} color={getStatusColor(n.status)} size="small" />
                                        </TableCell>
                                        {userRole !== 'petugas' && (
                                            <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                                {n.catatan || '-'}
                                            </TableCell>
                                        )}
                                        <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                            {n.nasabah || '-'}
                                        </TableCell>
                                        <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                            {n.marketing || '-'}
                                        </TableCell>
                                        <TableCell align="center">
                                            {new Date(n.created_at).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={userRole !== 'petugas' ? 6 : 5} align="center">
                                            Tidak ada notifikasi
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Box>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filtered.length}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Baris per halaman:"
                />
            </CardContent>
        </Card>
    );
};

export default NotificationsPage;
