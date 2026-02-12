import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import {
    Card, CardHeader, CardContent, Divider, Table, TableContainer,
    TableHead, TableBody, TableRow, TableCell, TablePagination,
    Stack, Box, CircularProgress, Paper, Typography, TextField, Chip,
    Avatar, useTheme, useMediaQuery
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import axiosInstance from 'api/axiosInstance';
import { AuthContext } from 'AuthContex/AuthContext';

const NotificationsPage = () => {
    const { user } = useContext(AuthContext);
    const userRole = (user?.role || '').toLowerCase();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [notifications, setNotifications] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const notifSound = useRef(new Audio('/asset/sounds/notif.mp3'));
    const lastNotifIds = useRef([]);

    const notificationEndpoint = (() => {
        if (userRole === 'checker') return '/checker/notifications';
        if (userRole === 'petugas') return '/petugas/notifications';
        return '/notifications'; 
    })();

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await axiosInstance.get(notificationEndpoint);
            if (res.data.success) {
                const newData = res.data.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                const currentIds = newData.map(n => n.id);
                const hasNew = currentIds.some(id => !lastNotifIds.current.includes(id));
                
                if (hasNew && lastNotifIds.current.length > 0) {
                    try {
                        const audio = notifSound.current;
                        audio.currentTime = 0;
                        audio.volume = 0.7;
                        audio.play().catch(() => console.warn('Autoplay diblokir browser'));
                    } catch (err) {
                        console.error('Gagal memutar suara notif:', err);
                    }
                }
                lastNotifIds.current = currentIds;
                setNotifications(newData);
            } else {
                setError(res.data.message || 'Gagal mengambil notifikasi');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan server');
        }
    }, [notificationEndpoint]);

    useEffect(() => {
        setLoading(true);
        fetchNotifications().then(() => setLoading(false));
        const interval = setInterval(fetchNotifications, 5000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

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

    const getStatusColor = (status) => {
        if (!status) return 'default';
        const lowerStatus = status.toLowerCase();
        if (lowerStatus.includes('approved')) return 'success';
        if (lowerStatus.includes('rejected')) return 'error';
        return 'primary';
    };

    if (loading) return (
        <Stack alignItems="center" justifyContent="center" sx={{ height: '80vh' }}>
            <CircularProgress />
        </Stack>
    );

    return (
        <Box sx={{ p: { xs: 1, md: 3 } }}>
            <Card sx={{ borderRadius: { xs: 2, md: 4 }, boxShadow: 3 }}>
                <CardHeader
                    title={
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <NotificationsActiveIcon color="primary" />
                            <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="bold">
                                Notifikasi ({userRole.toUpperCase()})
                            </Typography>
                        </Stack>
                    }
                    action={
                        !isMobile && (
                            <TextField
                                variant="outlined"
                                size="small"
                                placeholder="Cari..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} /> }}
                                sx={{ width: 300 }}
                            />
                        )
                    }
                />
                
                {isMobile && (
                    <Box sx={{ px: 2, pb: 2 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            size="small"
                            placeholder="Cari status, nasabah, dll..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </Box>
                )}
                
                <Divider />
                
                <CardContent sx={{ p: isMobile ? 0 : 2 }}>
                    {isMobile ? (
                        /* === MOBILE VIEW: TIMELINE LIST === */
                        <Box sx={{ bgcolor: '#f5f5f5', p: 1.5 }}>
                            {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((n) => (
                                <Card key={n.id} sx={{ mb: 1.5, borderRadius: 2, overflow: 'hidden' }}>
                                    <Box sx={{ p: 2, borderLeft: `5px solid ${theme.palette[getStatusColor(n.status)].main}` }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                            <Chip 
                                                label={n.status || '-'} 
                                                color={getStatusColor(n.status)} 
                                                size="small" 
                                                sx={{ fontWeight: 'bold' }} 
                                            />
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                                <AccessTimeIcon sx={{ fontSize: 12, mr: 0.5 }} />
                                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                        </Stack>

                                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                            Nasabah: {n.nasabah || '-'}
                                        </Typography>

                                        {userRole !== 'petugas' && n.catatan && (
                                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', bgcolor: '#fff9c4', p: 1, borderRadius: 1, my: 1 }}>
                                                "{n.catatan}"
                                            </Typography>
                                        )}

                                        <Stack direction="row" alignItems="center" spacing={0.5} mt={1}>
                                            <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                            <Typography variant="caption" color="text.secondary">
                                                Marketing: {n.marketing || '-'}
                                            </Typography>
                                        </Stack>
                                    </Box>
                                </Card>
                            ))}
                        </Box>
                    ) : (
                        /* === DESKTOP VIEW: TABLE === */
                        <TableContainer component={Paper} sx={{ boxShadow: 0 }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>No</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                        {userRole !== 'petugas' && <TableCell sx={{ fontWeight: 'bold' }}>Catatan</TableCell>}
                                        <TableCell sx={{ fontWeight: 'bold' }}>Nasabah</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Marketing</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Waktu</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((n, idx) => (
                                        <TableRow key={n.id} hover>
                                            <TableCell align="center">{page * rowsPerPage + idx + 1}</TableCell>
                                            <TableCell align="center">
                                                <Chip label={n.status || '-'} color={getStatusColor(n.status)} size="small" />
                                            </TableCell>
                                            {userRole !== 'petugas' && <TableCell sx={{ maxWidth: 250 }}>{n.catatan || '-'}</TableCell>}
                                            <TableCell>{n.nasabah || '-'}</TableCell>
                                            <TableCell>{n.marketing || '-'}</TableCell>
                                            <TableCell align="center">{new Date(n.created_at).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {filtered.length === 0 && !loading && (
                        <Typography align="center" sx={{ py: 5 }} color="text.secondary">Tidak ada notifikasi</Typography>
                    )}

                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filtered.length}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        onPageChange={(_, p) => setPage(p)}
                        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        labelRowsPerPage={isMobile ? "Baris:" : "Baris per halaman:"}
                    />
                </CardContent>
            </Card>
        </Box>
    );
};

export default NotificationsPage;