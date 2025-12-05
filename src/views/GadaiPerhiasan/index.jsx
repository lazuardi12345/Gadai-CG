import React, { useEffect, useState, useContext } from 'react';
import {
  Card, CardHeader, CardContent, Divider, Table, TableContainer,
  TableHead, TableBody, TableRow, TableCell, TablePagination,
  IconButton, TextField, Stack, CircularProgress, Typography, Paper, Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axiosInstance from 'api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from 'AuthContex/AuthContext';

const GadaiPerhiasanPage = () => {
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
  const canView = ["petugas", "hm", "checker"].includes(userRole);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/gadai-perhiasan';
      if (userRole === 'checker') url = '/checker/gadai-perhiasan';
      if (userRole === 'petugas') url = '/petugas/gadai-perhiasan';

      const res = await axiosInstance.get(url, { params: { per_page: 1000 } });
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

  useEffect(() => { fetchData(); }, [userRole]);

  useEffect(() => {
    const filtered = data.filter(item =>
      item.nama_barang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kode_cap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.detail_gadai?.nasabah?.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase())
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
      const res = await axiosInstance.delete(`/gadai-perhiasan/${id}`);
      if (res.data.success) {
        setData(prev => prev.filter(item => item.id !== id));
        setFilteredData(prev => prev.filter(item => item.id !== id));
      } else alert(res.data.message || 'Gagal menghapus data');
    } catch (err) {
      alert(err.message || 'Terjadi kesalahan server');
    }
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
        title="Data Gadai Perhiasan"
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
            <TextField
              variant="outlined"
              size="small"
              placeholder="Cari nama barang, kode cap, atau nama nasabah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: { xs: '100%', sm: 300 }, mb: { xs: 1, sm: 0 } }}
            />
          </Stack>
        }
      />
      <Divider />
      <CardContent>
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
          <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow>
                {['No', 'Nama Barang', 'Kode Cap', 'Karat', 'Berat', 'Potongan Batu', 'Kelengkapan', 'Nasabah', 'Aksi']
                  .map(head => (
                    <TableCell
                      key={head}
                      align={['Karat','Berat','Potongan Batu'].includes(head) ? 'right':'center'}
                      sx={{
                        fontWeight: 'bold',
                        backgroundColor: '#f0f0f0',
                        verticalAlign: 'middle',
                        paddingY: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {head}
                    </TableCell>
                  ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {(rowsPerPage > 0
                ? filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : filteredData
              ).map((item, index) => (
                <TableRow key={item.id} hover>
                  <TableCell align="center" sx={{ verticalAlign: 'middle', paddingY: 1 }}>
                    {page * rowsPerPage + index + 1}
                  </TableCell>
                  <TableCell sx={{ wordBreak: 'break-word', verticalAlign: 'middle', paddingY: 1 }}>
                    {item.nama_barang || '-'}
                  </TableCell>
                  <TableCell align="center" sx={{ verticalAlign: 'middle', paddingY: 1 }}>
                    {item.kode_cap || '-'}
                  </TableCell>
                  <TableCell align="right" sx={{ verticalAlign: 'middle', paddingY: 1 }}>
                    {item.karat || '-'}
                  </TableCell>
                  <TableCell align="right" sx={{ verticalAlign: 'middle', paddingY: 1 }}>
                    {item.berat || '-'}
                  </TableCell>
                  <TableCell align="right" sx={{ verticalAlign: 'middle', paddingY: 1 }}>
                    {item.potongan_batu || '-'}
                  </TableCell>
                  <TableCell sx={{ wordBreak: 'break-word', verticalAlign: 'middle', paddingY: 1 }}>
                    {item.kelengkapan_list && item.kelengkapan_list.length > 0
                      ? item.kelengkapan_list.map(k => k.nama_kelengkapan).join(', ')
                      : '-'}
                  </TableCell>
                  <TableCell sx={{ wordBreak: 'break-word', verticalAlign: 'middle', paddingY: 1 }}>
                    {item.detail_gadai?.nasabah?.nama_lengkap || '-'}
                  </TableCell>
                  <TableCell align="center" sx={{ verticalAlign: 'middle', paddingY: 1 }}>
                    <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                      {canView && (
                        <Tooltip title="Detail">
                          <IconButton color="info" size="small" onClick={() => navigate(`/detail-gadai-perhiasan/${item.id}`)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canEdit && (
                        <Tooltip title="Edit">
                          <IconButton color="primary" size="small" onClick={() => navigate(`/edit-gadai-perhiasan/${item.id}`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Hapus">
                          <IconButton color="error" size="small" onClick={() => handleDelete(item.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ verticalAlign: 'middle', paddingY: 2 }}>
                    Tidak ada data ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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

export default GadaiPerhiasanPage;
