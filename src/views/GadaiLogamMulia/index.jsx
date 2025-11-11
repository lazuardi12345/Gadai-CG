import React, { useEffect, useState, useContext } from 'react';
import {
  Card, CardHeader, CardContent, Divider, Table, TableContainer,
  TableHead, TableBody, TableRow, TableCell, TablePagination,
  IconButton, TextField, Button, Stack, Box, CircularProgress, Typography,
  Paper
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axiosInstance from 'api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from 'AuthContex/AuthContext';

const GadaiLogamMuliaPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || '').toLowerCase();

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const canAdd = ["hm", "checker"].includes(userRole);
  const canEdit = ["hm", "checker"].includes(userRole);
  const canDelete = userRole === "hm";


  const renderArrayOrString = (value) => {
    if (!value) return '-';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.join(', ');
        return value;
      } catch {
        return value;
      }
    }
    return '-';
  };



  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/gadai-logam-mulia';
      if (userRole === 'checker') url = '/checker/gadai-logam-mulia';
      if (userRole === 'petugas') url = '/petugas/gadai-logam-mulia';

      const res = await axiosInstance.get(url, { params: { per_page: 1000 } });
      if (res.data.success) {
        setData(res.data.data);
        setFilteredData(res.data.data);
      } else setError(res.data.message || "Gagal mengambil data");
    } catch (err) {
      setError(err.message || "Terjadi kesalahan server");
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
      item.type_logam_mulia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kode_cap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      const res = await axiosInstance.delete(`/gadai-logam-mulia/${id}`);
      if (res.data.success) {
        setData(prev => prev.filter(item => item.id !== id));
        setFilteredData(prev => prev.filter(item => item.id !== id));
      } else alert(res.data.message || 'Gagal menghapus data');
    } catch (err) {
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
      <Typography color="error" variant="h6" align="center" sx={{ mt: 2 }}>
        Error: {error}
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
              placeholder="Cari nama barang, type, kode cap, atau nama nasabah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: { xs: '100%', sm: 300 }, mb: { xs: 1, sm: 0 } }}
            />
            {canAdd && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/tambah-gadai-logam-mulia')}
              >
                Tambah
              </Button>
            )}
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
                  {['No', 'Nama Barang', 'Type Logam Mulia', 'Kode Cap', 'Karat', 'Berat', 'Potongan Batu', 'Kelengkapan', 'Nasabah', 'Aksi']
                    .map(head => (
                      <TableCell key={head} align="center">{head}</TableCell>
                    ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(rowsPerPage > 0
                  ? filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  : filteredData
                ).map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{item.nama_barang || '-'}</TableCell>
                    <TableCell>{item.type_logam_mulia || '-'}</TableCell>
                    <TableCell>{item.kode_cap || '-'}</TableCell>
                    <TableCell>{item.karat || '-'}</TableCell>
                    <TableCell>{item.berat || '-'}</TableCell>
                    <TableCell>{item.potongan_batu || '-'}</TableCell>
                    <TableCell>{renderArrayOrString(item.kelengkapan)}</TableCell>
                    <TableCell>{item.detail_gadai?.nasabah?.nama_lengkap || '-'}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        {/* Semua role bisa lihat detail */}
                        <IconButton color="info" onClick={() => navigate(`/detail-gadai-logam-mulia/${item.id}`)}>
                          <VisibilityIcon />
                        </IconButton>

                        {/* HM & Checker bisa edit */}
                        {["hm", "checker"].includes(userRole) && (
                          <IconButton color="primary" onClick={() => navigate(`/edit-gadai-logam-mulia/${item.id}`)}>
                            <EditIcon />
                          </IconButton>
                        )}

                        {/* HM saja bisa hapus */}
                        {userRole === "hm" && (
                          <IconButton color="error" onClick={() => handleDelete(item.id)}>
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Stack>

                    </TableCell>
                  </TableRow>
                ))}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center">Tidak ada data ditemukan.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
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
