import React, { useEffect, useState } from 'react';
import {
  Card, CardHeader, CardContent, Divider, Table, TableContainer,
  TableHead, TableBody, TableRow, TableCell, TablePagination,
  IconButton, TextField, Button, Stack, Box, CircularProgress, Typography,
  Paper
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axiosInstance from 'api/axiosInstance';
import { useNavigate } from 'react-router-dom';

const GadaiHpPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/gadai-hp', { params: { per_page: 1000 } });
      if (res.data.success) {
        setData(res.data.data);
        setFilteredData(res.data.data);
      } else setError(res.data.message || 'Gagal mengambil data');
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = data.filter(item =>
      (item.nama_barang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.merk?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type_hp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.detail_gadai?.nasabah?.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredData(filtered);
    setPage(0);
  }, [searchTerm, data]);

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus data ini?')) return;
    try {
      const res = await axiosInstance.delete(`/gadai-hp/${id}`);
      if (res.data.success) {
        const newData = data.filter(item => item.id !== id);
        setData(newData);
        setFilteredData(newData.filter(item =>
          (item.nama_barang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.merk?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.type_hp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.detail_gadai?.nasabah?.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()))
        ));
      } else alert(res.data.message || 'Gagal menghapus data');
    } catch (err) {
      alert(err.message || 'Terjadi kesalahan server');
    }
  };

  if (loading) return <Stack alignItems="center" justifyContent="center" sx={{ height: '80vh' }}><CircularProgress /></Stack>;
  if (error) return <Typography color="error" variant="h6" align="center" sx={{ mt: 2 }}>Error: {error}</Typography>;

  return (
    <Card>
      <CardHeader
        title="Data Gadai HP"
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
            <TextField
              variant="outlined"
              size="small"
              placeholder="Cari nama, IMEI, merk, atau nama nasabah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: { xs: '100%', sm: 300 }, mb: { xs: 1, sm: 0 } }}
            />
            <Button variant="contained" color="primary" onClick={() => navigate('/tambah-gadai-hp')}>
              Tambah
            </Button>
          </Stack>
        }
      />
      <Divider />
      <CardContent>
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Box sx={{ minWidth: 1400 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['No','Nama','IMEI','Merk','Type HP','Grade','Kelengkapan','Kerusakan','Warna','Kunci PW','Kunci PIN','Kunci Pola','RAM','ROM','Nasabah','Aksi']
                    .map(head => <TableCell key={head} align="center">{head}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {(rowsPerPage > 0 ? filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : filteredData)
                  .map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{item.nama_barang || '-'}</TableCell>
                    <TableCell>{item.imei || '-'}</TableCell>
                    <TableCell>{item.merk || '-'}</TableCell>
                    <TableCell>{item.type_hp || '-'}</TableCell>
                    <TableCell>{item.grade || '-'}</TableCell>
                    <TableCell>{Array.isArray(item.kelengkapan) ? item.kelengkapan.join(', ') : item.kelengkapan || '-'}</TableCell>
                    <TableCell>{Array.isArray(item.kerusakan) ? item.kerusakan.join(', ') : item.kerusakan || '-'}</TableCell>
                    <TableCell>{item.warna || '-'}</TableCell>
                    <TableCell>{item.kunci_password || '-'}</TableCell>
                    <TableCell>{item.kunci_pin || '-'}</TableCell>
                    <TableCell>{item.kunci_pola || '-'}</TableCell>
                    <TableCell>{item.ram || '-'}</TableCell>
                    <TableCell>{item.rom || '-'}</TableCell>
                    <TableCell>{item.detail_gadai?.nasabah?.nama_lengkap || '-'}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton color="primary" onClick={() => navigate(`/edit-gadai-hp/${item.id}`)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(item.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={16} align="center">Tidak ada data ditemukan.</TableCell>
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

export default GadaiHpPage;
