import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  Card, CardHeader, CardContent, Divider,
  Table, TableContainer, TableHead, TableBody,
  TableRow, TableCell, TablePagination,
  IconButton, TextField, Stack, Box,
  CircularProgress, Typography, Paper, Tooltip,
  useTheme, useMediaQuery, Avatar, Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; 
import axiosInstance from 'api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from 'AuthContex/AuthContext';

const GadaiPerhiasanPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || '').toLowerCase();


  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [page, setPage] = useState(0); 
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  const canEdit = ['hm', 'checker'].includes(userRole);
  const canDelete = userRole === 'hm';
  const canView = ['petugas', 'hm', 'checker'].includes(userRole);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/gadai-perhiasan';
      if (userRole === 'checker') url = '/checker/gadai-perhiasan';
      if (userRole === 'petugas') url = '/petugas/gadai-perhiasan';
      const res = await axiosInstance.get(url, { 
        params: { 
          per_page: rowsPerPage, 
          page: page + 1, 
          search: searchTerm 
        } 
      });

      if (res.data.success) {
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

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus data ini?')) return;
    try {
      const res = await axiosInstance.delete(`/gadai-perhiasan/${id}`);
      if (res.data.success) {
        fetchData();
      } else {
        alert(res.data.message || 'Gagal menghapus data');
      }
    } catch {
      alert('Terjadi kesalahan server');
    }
  };

  if (loading && data.length === 0) return (
    <Stack alignItems="center" justifyContent="center" sx={{ height: '80vh' }}>
      <CircularProgress />
    </Stack>
  );

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Card sx={{ borderRadius: { xs: 2, md: 4 }, boxShadow: 5 }}>
        <CardHeader
          title={<Typography variant={isMobile ? "h6" : "h5"} fontWeight={700}>Data Gadai Perhiasan</Typography>}
          sx={{ p: 2 }}
        />

        <Box sx={{ px: 2, pb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Cari perhiasan atau nasabah..."
            value={searchTerm}
            onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0); 
            }}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.disabled' }} /> }}
          />
        </Box>

        <Divider />

        <CardContent sx={{ p: isMobile ? 0 : 2 }}>
          {loading && data.length === 0 ? (
             <Stack alignItems="center" py={5}><CircularProgress /></Stack>
          ) : isMobile ? (
            <Box sx={{ bgcolor: '#f5f5f5', p: 1.5 }}>
              {data.map((item) => (
                <Card key={item.id} sx={{ mb: 1.5, borderRadius: 2, p: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center" mb={1.5}>
                    <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
                      <AutoAwesomeIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold">{item.nama_barang || "-"}</Typography>
                      <Typography variant="caption" color="primary" fontWeight="bold">
                        {item.detail_gadai?.nasabah?.nama_lengkap || "-"}
                      </Typography>
                    </Box>
                    <Chip label={`${item.karat}K`} size="small" variant="outlined" color="secondary" />
                  </Stack>

                  <Stack direction="row" spacing={2} sx={{ bgcolor: '#f9f9f9', p: 1, borderRadius: 1, mb: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Berat</Typography>
                      <Typography variant="body2" fontWeight="700">{item.berat} gr</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Cap</Typography>
                      <Typography variant="body2" fontWeight="700">{item.kode_cap || "-"}</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block">P. Batu</Typography>
                      <Typography variant="body2" fontWeight="700">{item.potongan_batu || "0"}</Typography>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" sx={{ maxWidth: '60%' }} noWrap>
                      {item.kelengkapan_list?.map(k => k.nama_kelengkapan).join(', ') || 'Tanpa Kelengkapan'}
                    </Typography>
                    <Stack direction="row">
                      {canView && (
                        <IconButton size="small" color="info" onClick={() => navigate(`/detail-gadai-perhiasan/${item.id}`)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      )}
                      {canEdit && (
                        <IconButton size="small" color="primary" onClick={() => navigate(`/edit-gadai-perhiasan/${item.id}`)}>
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
              {data.length === 0 && <Typography align="center" sx={{ py: 3 }}>Data tidak ditemukan</Typography>}
            </Box>
          ) : (
            /* --- TAMPILAN DESKTOP --- */
            <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f0f0f0' }}>
                  <TableRow>
                    {['No','Nama Barang','Cap','Karat','Berat','P. Batu','Nasabah','Aksi'].map(h => (
                      <TableCell key={h} align="center" sx={{ fontWeight: 'bold' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((item, index) => (
                    <TableRow key={item.id} hover>
                      <TableCell align="center">{(page * rowsPerPage) + index + 1}</TableCell>
                      <TableCell>{item.nama_barang}</TableCell>
                      <TableCell align="center">{item.kode_cap}</TableCell>
                      <TableCell align="center">{item.karat}</TableCell>
                      <TableCell align="center">{item.berat}</TableCell>
                      <TableCell align="center">{item.potongan_batu}</TableCell>
                      <TableCell>{item.detail_gadai?.nasabah?.nama_lengkap}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          {canView && <IconButton size="small" color="info" onClick={() => navigate(`/detail-gadai-perhiasan/${item.id}`)}><VisibilityIcon fontSize="small" /></IconButton>}
                          {canEdit && <IconButton size="small" color="primary" onClick={() => navigate(`/edit-gadai-perhiasan/${item.id}`)}><EditIcon fontSize="small" /></IconButton>}
                          {canDelete && <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}><DeleteIcon fontSize="small" /></IconButton>}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.length === 0 && (
                      <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 3 }}>Data tidak ditemukan</TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalRecords} 
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, newPage) => setPage(newPage)}
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

export default GadaiPerhiasanPage;