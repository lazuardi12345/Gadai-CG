import React, { useEffect, useState } from 'react';
import {
  Card, CardHeader, CardContent, Divider, Table, TableContainer,
  TableHead, TableBody, TableRow, TableCell, TablePagination,
  IconButton, TextField, Button, CircularProgress, Stack, Chip, Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axiosInstance from 'api/axiosInstance';
import { useNavigate } from 'react-router-dom';

const PerpanjanganTempoPage = () => {
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
      const res = await axiosInstance.get(`/perpanjangan-tempo?page=${page}&per_page=${perPage}&search=${searchTerm}`);
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

  const handleChangePage = (_, newPage) => fetchData(newPage + 1, pagination.per_page);
  const handleChangeRowsPerPage = (event) => fetchData(1, parseInt(event.target.value, 10));

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus data perpanjangan ini?')) return;
    try {
      const res = await axiosInstance.delete(`/perpanjangan-tempo/${id}`);
      if (res.data.success) fetchData(pagination.current_page, pagination.per_page);
      else alert(res.data.message || 'Gagal menghapus data perpanjangan');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Terjadi kesalahan server');
    }
  };

  if (loading) return <Stack alignItems="center" justifyContent="center" sx={{ height: '80vh' }}><CircularProgress /></Stack>;
  if (error) return <Typography color="error" variant="h6" align="center" sx={{ mt: 2 }}>Error: {error}</Typography>;

  return (
    <Card>
      <CardHeader
        title="Data Perpanjangan Tempo"
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              variant="outlined"
              size="small"
              placeholder="Cari no gadai atau no nasabah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: 300 }}
            />
            <Button variant="contained" color="primary" onClick={() => navigate('/tambah-perpanjangan-tempo')}>Tambah</Button>
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
                  'No','No Gadai','No Nasabah','Tanggal Gadai','Jatuh Tempo Lama',
                  'Tanggal Perpanjangan','Jatuh Tempo Baru','Nasabah','Status Gadai','Aksi'
                ].map(head => <TableCell key={head} align="center">{head}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length > 0 ? data.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell align="center">{(pagination.current_page - 1) * pagination.per_page + index + 1}</TableCell>
                  <TableCell>{item.detail_gadai?.no_gadai || '-'}</TableCell>
                  <TableCell>{item.detail_gadai?.no_nasabah || '-'}</TableCell>
                  <TableCell>{item.detail_gadai?.tanggal_gadai || '-'}</TableCell>
                  <TableCell>{item.detail_gadai?.jatuh_tempo || '-'}</TableCell>
                  <TableCell>{item.tanggal_perpanjangan || '-'}</TableCell>
                  <TableCell>{item.jatuh_tempo_baru || '-'}</TableCell>
                  <TableCell>{item.detail_gadai?.nasabah?.nama_lengkap || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.detail_gadai?.status?.toUpperCase() || '-'}
                      color={
                        item.detail_gadai?.status === 'proses' ? 'warning' :
                        item.detail_gadai?.status === 'selesai' ? 'info' :
                        item.detail_gadai?.status === 'lunas' ? 'success' : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => navigate(`/edit-perpanjangan-tempo/${item.id}`)}><EditIcon /></IconButton>
                    <IconButton color="error" onClick={() => handleDelete(item.id)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={10} align="center">Tidak ada data perpanjangan ditemukan.</TableCell>
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
          rowsPerPageOptions={[5,10,25]}
          labelRowsPerPage="Baris per halaman:"
        />
      </CardContent>
    </Card>
  );
};

export default PerpanjanganTempoPage;
