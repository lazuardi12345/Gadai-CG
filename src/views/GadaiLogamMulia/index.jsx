import React, { useEffect, useState, useMemo } from 'react';
import {
  Card, CardHeader, CardContent, Divider, Table, TableContainer,
  TableHead, TableBody, TableRow, TableCell, TablePagination,
  IconButton, TextField, Button, Stack, Box, CircularProgress,
  Paper, Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axiosInstance from 'api/axiosInstance';
import { useNavigate } from 'react-router-dom';

const GadaiLogamMuliaPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/gadai-logam-mulia', { params: { per_page: 1000 } });
      if (res.data.success) setData(res.data.data);
      else { setData([]); setError(res.data.message || 'Gagal mengambil data'); }
    } catch (err) {
      console.error(err);
      setData([]);
      setError(err.message || 'Terjadi kesalahan server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item =>
      (item.nama_barang || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.type_logam_mulia || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(item.kelengkapan) ? item.kelengkapan.join(', ') : item.kelengkapan || '')
        .toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.detail_gadai?.nasabah?.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, data]);

  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus data ini?')) return;
    try {
      const res = await axiosInstance.delete(`/gadai-logam-mulia/${id}`);
      if (res.data.success) setData(prev => prev.filter(item => item.id !== id));
      else alert(res.data.message || 'Gagal menghapus data');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Terjadi kesalahan server');
    }
  };

  if (loading)
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: '80vh' }}>
        <CircularProgress />
      </Stack>
    );

  if (error)
    return (
      <Typography color="error" variant="h6" align="center">
        {error}
      </Typography>
    );

  return (
    <Card>
      <CardHeader
        title="Data Gadai Logam Mulia"
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
            <TextField
              variant="outlined"
              size="small"
              placeholder="Cari nama barang, type, kelengkapan, atau nasabah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: { xs: '100%', sm: 300 }, mb: { xs: 1, sm: 0 } }}
            />
            <Button variant="contained" color="primary" onClick={() => navigate('/tambah-gadai-logam-mulia')}>
              Tambah Data
            </Button>
          </Stack>
        }
      />
      <Divider />
      <CardContent>
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Box sx={{ minWidth: 1000 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['No', 'Nama', 'Type', 'Kelengkapan', 'Kode Cap', 'Karat', 'Potongan Batu', 'Berat', 'Nasabah', 'Aksi']
                    .map(head => <TableCell key={head} align="center">{head}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((row, index) => (
                    <TableRow key={row.id}>
                      <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>{row.nama_barang}</TableCell>
                      <TableCell>{row.type_logam_mulia}</TableCell>
                      <TableCell>
                        {Array.isArray(row.kelengkapan) ? row.kelengkapan.join(', ') : row.kelengkapan || '-'}
                      </TableCell>
                      <TableCell>{row.kode_cap}</TableCell>
                      <TableCell>{row.karat}</TableCell>
                      <TableCell>{row.potongan_batu}</TableCell>
                      <TableCell>{row.berat}</TableCell>
                      <TableCell>{row.detail_gadai?.nasabah?.nama_lengkap || '-'}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <IconButton color="primary" onClick={() => navigate(`/edit-gadai-logam-mulia/${row.id}`)}><EditIcon /></IconButton>
                          <IconButton color="error" onClick={() => handleDelete(row.id)}><DeleteIcon /></IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} align="center">Tidak ada data ditemukan.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5,10,25]}
          component="div"
          count={filteredData.length}
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

export default GadaiLogamMuliaPage;
