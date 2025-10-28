import React, { useEffect, useState } from 'react';
import {
  Card, CardHeader, CardContent, Divider, Table, TableContainer, TableHead, TableBody,
  TableRow, TableCell, TablePagination, IconButton, Button, CircularProgress,
  Typography, Grid, Stack, TextField
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axiosInstance from 'api/axiosInstance';
import { useNavigate } from 'react-router-dom';

const GadaiHpPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    per_page: 5,
    current_page: 1,
    last_page: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async (page = 1, perPage = 5) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`/gadai-hp?page=${page}&per_page=${perPage}&search=${searchTerm}`);
      if (res.data.success) {
        setData(res.data.data);
        setPagination(res.data.pagination);
      } else {
        setData([]);
        setPagination({ total: 0, per_page: perPage, current_page: 1, last_page: 1 });
        setError(res.data.message || 'Gagal mengambil data');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan server');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagination.current_page, pagination.per_page);
  }, [searchTerm]);

  const handleChangePage = (_, newPage) => {
    fetchData(newPage + 1, pagination.per_page);
  };

  const handleChangeRowsPerPage = (event) => {
    const newPerPage = parseInt(event.target.value, 10);
    fetchData(1, newPerPage);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus data ini?')) return;
    try {
      const res = await axiosInstance.delete(`/gadai-hp/${id}`);
      if (res.data.success) {
        fetchData(pagination.current_page, pagination.per_page);
      } else {
        alert(res.data.message || 'Gagal menghapus data');
      }
    } catch (err) {
      alert(err.message || 'Terjadi kesalahan server');
    }
  };

  if (loading) {
    return (
      <Grid container justifyContent="center" alignItems="center" sx={{ height: '100vh' }}>
        <CircularProgress />
      </Grid>
    );
  }

  if (error) {
    return (
      <Typography color="error" variant="h6" align="center" sx={{ mt: 2 }}>
        Error: {error}
      </Typography>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Data Gadai HP"
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              variant="outlined"
              size="small"
              placeholder="Cari nama barang, IMEI, atau nasabah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: 300 }}
            />
            <Button variant="contained" color="primary" onClick={() => navigate('/tambah-gadai-hp')}>
              Tambah
            </Button>
          </Stack>
        }
      />
      <Divider />
      <CardContent>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {[
                  'No', 'Nama Barang', 'IMEI', 'Merk', 'Type HP', 'Grade',
                  'Kelengkapan', 'Kerusakan', 'Nama Nasabah', 'Aksi'
                ].map((headCell) => (
                  <TableCell key={headCell} align="center">{headCell}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length > 0 ? (
                data.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell align="center">{(pagination.current_page - 1) * pagination.per_page + index + 1}</TableCell>
                    <TableCell>{item.nama_barang}</TableCell>
                    <TableCell>{item.imei}</TableCell>
                    <TableCell>{item.merk}</TableCell>
                    <TableCell>{item.type_hp}</TableCell>
                    <TableCell>{item.grade}</TableCell>
                    <TableCell>{item.kelengkapan}</TableCell>
                    <TableCell>{item.kerusakan}</TableCell>
                    <TableCell>{item.detail_gadai?.nasabah?.nama_lengkap || '-'}</TableCell>
                    <TableCell>
                      <IconButton color="primary" onClick={() => navigate(`/edit-gadai-hp/${item.id}`)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(item.id)}>
                        <DeleteIcon />
                      </IconButton>
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
        </TableContainer>

        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.current_page - 1}
          onPageChange={handleChangePage}
          rowsPerPage={pagination.per_page}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage="Baris per halaman:"
        />
      </CardContent>
    </Card>
  );
};

export default GadaiHpPage;
