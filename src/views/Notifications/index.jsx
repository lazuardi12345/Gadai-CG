import React, { useEffect, useState, useContext } from 'react';
import {
  Card, CardHeader, CardContent, Divider, Table, TableContainer,
  TableHead, TableBody, TableRow, TableCell, TablePagination,
  Stack, Box, CircularProgress, Paper, Typography, TextField, Chip
} from '@mui/material';
import axiosInstance from 'api/axiosInstance';
import { AuthContext } from 'AuthContex/AuthContext';

const getVisibleCatatan = (notif) => {

  if (userRole === 'hm' && notif.role === 'checker') return '-';

  if (userRole === 'checker' && notif.role === 'hm') return '-';

  return notif.catatan || '-';
};


const NotificationsPage = () => {
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || '').toLowerCase();

  const [notifications, setNotifications] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [lastIds, setLastIds] = useState([]); // untuk highlight notifikasi baru
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // fetch notifications
  const fetchNotifications = async () => {
    try {
      let url = '/notifications';
      if (userRole === 'checker') url = '/checker/notifications';
      else if (userRole === 'petugas') url = '/petugas/notifications';

      const res = await axiosInstance.get(url);
      if (res.data.success) {
        setNotifications(res.data.data);

        // highlight notifikasi baru
        const newIds = res.data.data.map(n => n.id);
        setLastIds(prev => {
          const diff = newIds.filter(id => !prev.includes(id));
          return [...prev, ...diff];
        });
      } else {
        setError(res.data.message || 'Gagal mengambil notifikasi');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan server');
    } finally {
      setLoading(false);
    }
  };

  // initial fetch + polling setiap 5 detik
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [userRole]);

  // filter search
  useEffect(() => {
    const filteredData = notifications.filter(n =>
      n.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (userRole !== 'petugas' && (n.catatan || '').toLowerCase().includes(searchTerm.toLowerCase())) ||
      (n.nasabah || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.marketing || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFiltered(filteredData);
    setPage(0);
  }, [searchTerm, notifications]);

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    if (!status) return 'default';
    if (status.includes('approved')) return 'success';
    if (status.includes('rejected')) return 'error';
    return 'default';
  };

  if (loading) return (
    <Stack alignItems="center" justifyContent="center" sx={{ height: '80vh' }}>
      <CircularProgress />
    </Stack>
  );

  if (error) return (
    <Typography color="error" variant="h6" align="center" sx={{ mt: 2 }}>
      Error: {error}
    </Typography>
  );

  return (
    <Card>
      <CardHeader
        title="Notifikasi"
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
                ).map((n, idx) => {
                  const isNew = !lastIds.includes(n.id);
                  return (
                    <TableRow
                      key={n.id}
                      hover
                      sx={{ backgroundColor: isNew ? '#fff2f0' : 'inherit', transition: '0.3s' }}
                    >
                      <TableCell align="center">{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell align="center">
                        <Chip label={n.status || '-'} color={getStatusColor(n.status)} size="small" />
                      </TableCell>
                      {userRole !== 'petugas' && (
                        <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {n.catatan || '-'}
                        </TableCell>
                      )}
                      <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{n.nasabah || '-'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{n.marketing || '-'}</TableCell>
                      <TableCell align="center">{new Date(n.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">Tidak ada notifikasi</TableCell>
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
