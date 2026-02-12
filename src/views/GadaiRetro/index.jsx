import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  Card, CardHeader, CardContent, Divider,
  Table, TableContainer, TableHead, TableBody,
  TableRow, TableCell, TablePagination,
  IconButton, TextField, Stack, CircularProgress,
  Paper, Typography, Tooltip, Box, Avatar, Chip,
  useTheme, useMediaQuery
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History'; 

import axiosInstance from 'api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from 'AuthContex/AuthContext';

const GadaiRetroPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || '').toLowerCase();

  /* ===================== STATE ===================== */
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State Pagination Server-Side
  const [page, setPage] = useState(0); // MUI 0-based
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  /* ===================== ROLE ===================== */
  const canEdit = ['hm', 'checker'].includes(userRole);
  const canDelete = userRole === 'hm';
  const canView = ['petugas', 'hm', 'checker'].includes(userRole);

  /* ===================== FETCH (FIXED) ===================== */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/gadai-retro';
      if (userRole === 'checker') url = '/checker/gadai-retro';
      if (userRole === 'petugas') url = '/petugas/gadai-retro';

      // Kirim param page (1-based) dan per_page (10)
      const res = await axiosInstance.get(url, { 
        params: { 
          per_page: rowsPerPage, 
          page: page + 1, 
          search: searchTerm 
        } 
      });

      if (res.data.success) {
        // Ambil data dan totalRecords dari struktur pagination BE
        setData(res.data.data || []);
        setTotalRecords(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [userRole, page, rowsPerPage, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ===================== DELETE ===================== */
  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus data ini?')) return;
    try {
      const res = await axiosInstance.delete(`/gadai-retro/${id}`);
      if (res.data.success) {
        fetchData();
      } else {
        alert(res.data.message || 'Gagal menghapus data');
      }
    } catch (err) {
      alert('Terjadi kesalahan server');
    }
  };

  if (loading && data.length === 0) return <Stack height="80vh" alignItems="center" justifyContent="center"><CircularProgress /></Stack>;

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Card sx={{ borderRadius: { xs: 2, md: 4 }, boxShadow: 5 }}>
        <CardHeader
          title={<Typography variant={isMobile ? "h6" : "h5"} fontWeight={700}>Data Gadai Retro</Typography>}
          sx={{ p: 2 }}
        />

        <Box sx={{ px: 2, pb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Cari barang atau nasabah..."
            value={searchTerm}
            onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0); // Reset ke page 1 tiap search
            }}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.disabled' }} /> }}
          />
        </Box>

        <Divider />

        <CardContent sx={{ p: isMobile ? 0 : 2 }}>
          {loading && data.length === 0 ? (
            <Stack alignItems="center" py={5}><CircularProgress /></Stack>
          ) : isMobile ? (
            /* --- TAMPILAN MOBILE --- */
            <Box sx={{ bgcolor: '#f5f5f5', p: 1.5 }}>
              {/* HAPUS .slice() - Gunakan data langsung */}
              {data.map((item) => (
                <Card key={item.id} sx={{ mb: 1.5, borderRadius: 2, p: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center" mb={1.5}>
                    <Avatar sx={{ bgcolor: 'info.main', width: 40, height: 40 }}>
                      <HistoryIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold">{item.nama_barang || "-"}</Typography>
                      <Typography variant="caption" color="primary" fontWeight="bold">
                        {item.detail_gadai?.nasabah?.nama_lengkap || "-"}
                      </Typography>
                    </Box>
                    <Chip label={`${item.karat}K`} size="small" color="info" variant="outlined" />
                  </Stack>

                  <Stack direction="row" spacing={2} sx={{ bgcolor: '#fff', p: 1, borderRadius: 1, border: '1px solid #eee', mb: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Berat</Typography>
                      <Typography variant="body2" fontWeight="700">{item.berat} gr</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Kode Cap</Typography>
                      <Typography variant="body2" fontWeight="700">{item.kode_cap || "-"}</Typography>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      ID: #{item.id}
                    </Typography>
                    <Stack direction="row">
                      {canView && (
                        <IconButton size="small" color="info" onClick={() => navigate(`/detail-gadai-retro/${item.id}`)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      )}
                      {canEdit && (
                        <IconButton size="small" color="primary" onClick={() => navigate(`/edit-gadai-retro/${item.id}`)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </Stack>
                </Card>
              ))}
              {data.length === 0 && (
                <Typography align="center" sx={{ py: 4 }} color="text.secondary">Data tidak ditemukan</Typography>
              )}
            </Box>
          ) : (
            /* --- TAMPILAN DESKTOP --- */
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 0 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    {['No', 'Barang', 'Kode Cap', 'Karat', 'Berat', 'Nasabah', 'Aksi'].map((head) => (
                      <TableCell key={head} align="center" sx={{ fontWeight: 700 }}>{head}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* HAPUS .slice() - Gunakan data langsung */}
                  {data.map((item, index) => (
                    <TableRow key={item.id} hover>
                      <TableCell align="center">{(page * rowsPerPage) + index + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{item.nama_barang}</TableCell>
                      <TableCell align="center">{item.kode_cap}</TableCell>
                      <TableCell align="center">{item.karat}</TableCell>
                      <TableCell align="center">{item.berat}</TableCell>
                      <TableCell>{item.detail_gadai?.nasabah?.nama_lengkap}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          {canView && <IconButton size="small" color="info" onClick={() => navigate(`/detail-gadai-retro/${item.id}`)}><VisibilityIcon fontSize="small" /></IconButton>}
                          {canEdit && <IconButton size="small" color="primary" onClick={() => navigate(`/edit-gadai-retro/${item.id}`)}><EditIcon fontSize="small" /></IconButton>}
                          {canDelete && <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}><DeleteIcon fontSize="small" /></IconButton>}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalRecords} // Gunakan total dari Backend
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => { 
                setRowsPerPage(parseInt(e.target.value, 10)); 
                setPage(0); 
            }}
            labelRowsPerPage={isMobile ? "Baris:" : "Baris per halaman:"}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default GadaiRetroPage;