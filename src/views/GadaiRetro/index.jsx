import React, { useEffect, useState, useContext } from 'react';
import {
  Card, CardHeader, CardContent, Divider,
  Table, TableContainer, TableHead, TableBody,
  TableRow, TableCell, TablePagination,
  IconButton, TextField, Stack, CircularProgress,
  Paper, Typography, Tooltip,
  useTheme, useMediaQuery
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

import axiosInstance from 'api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from 'AuthContex/AuthContext';

const GadaiRetroPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || '').toLowerCase();

  /* ===================== RESPONSIVE ===================== */
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  /* ===================== STATE ===================== */
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10); // Default ke 10 agar pas di HP

  /* ===================== ROLE ===================== */
  const canEdit = ['hm', 'checker'].includes(userRole);
  const canDelete = userRole === 'hm';
  const canView = ['petugas', 'hm', 'checker'].includes(userRole);

  /* ===================== STYLE ===================== */
  const ellipsis = {
    maxWidth: isMobile ? 120 : 180,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  };

  /* ===================== FETCH ===================== */
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/gadai-retro';
      if (userRole === 'checker') url = '/checker/gadai-retro';
      if (userRole === 'petugas') url = '/petugas/gadai-retro';

      const res = await axiosInstance.get(url, { params: { per_page: 1000 } });
      if (res.data.success) {
        setData(res.data.data);
        setFilteredData(res.data.data);
      } else {
        setError(res.data.message || 'Gagal mengambil data');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userRole]);

  /* ===================== SEARCH ===================== */
  useEffect(() => {
    const filtered = data.filter(item =>
      item.nama_barang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kode_cap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.detail_gadai?.nasabah?.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kelengkapan_list?.some(k =>
        k.nama_kelengkapan.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredData(filtered);
    setPage(0);
  }, [searchTerm, data]);

  /* ===================== DELETE ===================== */
  const handleDelete = async (id) => {
    if (!canDelete) return;
    if (!window.confirm('Yakin ingin menghapus data ini?')) return;
    try {
      const res = await axiosInstance.delete(`/gadai-retro/${id}`);
      if (res.data.success) {
        setData(prev => prev.filter(item => item.id !== id));
        setFilteredData(prev => prev.filter(item => item.id !== id));
      } else {
        alert(res.data.message || 'Gagal menghapus data');
      }
    } catch (err) {
      alert(err.message || 'Terjadi kesalahan server');
    }
  };

  if (loading) return <Stack height="80vh" alignItems="center" justifyContent="center"><CircularProgress /></Stack>;
  if (error) return <Typography color="error" align="center" sx={{ mt: 3 }}>Error: {error}</Typography>;

  return (
    <Card sx={{ m: isMobile ? 1 : 2, borderRadius: 3 }}>
      <CardHeader
        title={<Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight={700}>Data Gadai Retro</Typography>}
        action={
          <TextField
            size="small"
            placeholder="Cari..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: isMobile ? '150px' : '300px' }}
          />
        }
        sx={{ p: 2 }}
      />
      <Divider />

      <CardContent sx={{ p: isMobile ? 0 : 2 }}>
        <TableContainer
          component={Paper}
          sx={{ 
            boxShadow: 0, 
            overflowX: 'auto',
            '&::-webkit-scrollbar': { height: '5px' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: '#ccc', borderRadius: '10px' }
          }}
        >
          <Table size="small" sx={{ minWidth: isMobile ? 500 : 900 }}>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell align="center" sx={{ fontWeight: 700 }}>No</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Barang</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Kode</TableCell>
                {!isMobile && <TableCell align="right" sx={{ fontWeight: 700 }}>Karat</TableCell>}
                {!isMobile && <TableCell align="right" sx={{ fontWeight: 700 }}>Berat</TableCell>}
                <TableCell sx={{ fontWeight: 700 }}>Nasabah</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Aksi</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item, index) => (
                  <TableRow key={item.id} hover>
                    <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                    
                    <TableCell sx={ellipsis}>
                      <Typography variant="body2" fontWeight={600}>{item.nama_barang || '-'}</Typography>
                    </TableCell>

                    <TableCell align="center">{item.kode_cap || '-'}</TableCell>

                    {!isMobile && (
                      <TableCell align="right">{item.karat || '-'}</TableCell>
                    )}

                    {!isMobile && (
                      <TableCell align="right">{item.berat || '-'}</TableCell>
                    )}

                    <TableCell sx={ellipsis}>
                      {item.detail_gadai?.nasabah?.nama_lengkap || '-'}
                    </TableCell>

                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        {canView && (
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => navigate(`/detail-gadai-retro/${item.id}`)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        )}

                        {/* TOMBOL EDIT SEKARANG MUNCUL DI HP */}
                        {canEdit && (
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/edit-gadai-retro/${item.id}`)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}

                        {canDelete && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(item.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}

              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    Tidak ada data ditemukan
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredData.length}
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
  );
};

export default GadaiRetroPage;