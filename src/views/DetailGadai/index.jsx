import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Divider,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  IconButton,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Grid,
  Stack,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import axiosInstance from 'api/axiosInstance';
import { useNavigate } from 'react-router-dom';

const DetailGadaiPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    per_page: 10,
    current_page: 1,
    last_page: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async (page = 1, perPage = 10) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`/detail-gadai?page=${page}&per_page=${perPage}`);
      if (res.data.success) {
        const formattedData = res.data.data.map((item) => ({
          ...item,
          status: item.status || 'proses',
        }));
        setData(formattedData);
        setPagination(res.data.pagination);
      } else {
        setError(res.data.message || 'Gagal mengambil data');
        setData([]);
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
  }, []);

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
      const res = await axiosInstance.delete(`/detail-gadai/${id}`);
      if (res.data.success) {
        fetchData(pagination.current_page, pagination.per_page);
      } else {
        alert(res.data.message || 'Gagal menghapus data');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Terjadi kesalahan server');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'proses':
        return 'warning';
      case 'selesai':
        return 'info';
      case 'lunas':
        return 'success';
      default:
        return 'default';
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
        title="Data Detail Gadai"
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
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/tambah-detail-gadai')}
            >
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
                  'No', 'No Gadai', 'No Nasabah', 'Tanggal Gadai', 'Jatuh Tempo',
                  'Perpanjangan', 'Jatuh Tempo Terbaru', 'Taksiran', 'Uang Pinjaman',
                  'Type', 'Nasabah', 'Status', 'Print Struk', 'Aksi'
                ].map((headCell) => (
                  <TableCell key={headCell} align="center" sx={{ whiteSpace: 'nowrap' }}>
                    {headCell}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {data.length > 0 ? (
                data.map((item, index) => {
                  const jatuhTempoTerbaru =
                    item.perpanjangan_tempos?.length
                      ? item.perpanjangan_tempos[item.perpanjangan_tempos.length - 1].jatuh_tempo_baru
                      : '';

                  return (
                    <TableRow key={item.id}>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                        {(pagination.current_page - 1) * pagination.per_page + index + 1}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.no_gadai}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.no_nasabah}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.tanggal_gadai}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.jatuh_tempo}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.perpanjangan_tempos?.length || 0} kali</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{jatuhTempoTerbaru}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {item.taksiran ? `Rp ${Number(item.taksiran).toLocaleString('id-ID')}` : '-'}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {item.uang_pinjaman ? `Rp ${Number(item.uang_pinjaman).toLocaleString('id-ID')}` : '-'}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.type?.nama_type || '-'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.nasabah?.nama_lengkap || '-'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Chip label={item.status.toUpperCase()} color={getStatusColor(item.status)} size="small" />
                      </TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                        {/* Tombol Print SBG */}
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          startIcon={<PrintIcon />}
                          onClick={() => navigate(`/print-surat-bukti-gadai/${item.id}`)}
                          sx={{ mb: 0.5 }}
                        >
                          SBG
                        </Button>

                        {/* Print Struk Awal, Pelunasan, Perpanjangan */}
                        {item.status === 'selesai' && (
                          <>
                            <Button
                              size="small"
                              variant="outlined"
                              color="secondary"
                              startIcon={<PrintIcon />}
                              onClick={() => navigate(`/print-struk-awal/${item.id}`)}
                              sx={{ mb: 0.5, ml: 0.5 }}
                            >
                              Awal
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              startIcon={<PrintIcon />}
                              onClick={() => navigate(`/print-struk-pelunasan/${item.id}`)}
                              sx={{ mb: 0.5, ml: 0.5 }}
                            >
                              Pelunasan
                            </Button>
                          </>
                        )}
                        {item.perpanjangan_tempos?.length > 0 && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="warning"
                            startIcon={<PrintIcon />}
                            onClick={() => navigate(`/print-struk-perpanjangan/${item.id}`)}
                            sx={{ mt: 0.5, ml: 0.5 }}
                          >
                            Perpanjangan
                          </Button>
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                        <IconButton color="primary" onClick={() => navigate(`/edit-detail-gadai/${item.id}`)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(item.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={14} align="center">
                    Tidak ada data ditemukan.
                  </TableCell>
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

export default DetailGadaiPage;
