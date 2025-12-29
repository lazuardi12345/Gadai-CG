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
  const [rowsPerPage, setRowsPerPage] = useState(5);

  /* ===================== ROLE ===================== */
  const canEdit = ['hm', 'checker'].includes(userRole);
  const canDelete = userRole === 'hm';
  const canView = ['petugas', 'hm', 'checker'].includes(userRole);

  /* ===================== STYLE ===================== */
  const ellipsis = {
    maxWidth: 180,
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

  /* ===================== LOADING / ERROR ===================== */
  if (loading) {
    return (
      <Stack height="80vh" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Stack>
    );
  }

  if (error) {
    return (
      <Typography color="error" align="center" sx={{ mt: 3 }}>
        Error: {error}
      </Typography>
    );
  }

  /* ===================== RENDER ===================== */
  return (
    <Card>
      <CardHeader
        title="Data Gadai Retro"
        action={
          <TextField
            size="small"
            placeholder="Cari data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth={isMobile}
            sx={{ minWidth: isMobile ? '100%' : 300 }}
          />
        }
      />
      <Divider />

      <CardContent>
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 2, boxShadow: 3, overflowX: 'auto' }}
        >
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell align="center">No</TableCell>
                <TableCell>Nama Barang</TableCell>

                {!isMobile && <TableCell align="center">Kode Cap</TableCell>}
                {!isTablet && <TableCell align="right">Karat</TableCell>}
                {!isTablet && <TableCell align="right">Berat</TableCell>}

                {!isMobile && <TableCell>Kelengkapan</TableCell>}
                {!isMobile && <TableCell>Nasabah</TableCell>}

                <TableCell align="center">Aksi</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item, index) => (
                  <TableRow key={item.id} hover>
                    <TableCell align="center">
                      {page * rowsPerPage + index + 1}
                    </TableCell>

                    <TableCell sx={ellipsis}>
                      {item.nama_barang || '-'}
                    </TableCell>

                    {!isMobile && (
                      <TableCell align="center">
                        {item.kode_cap || '-'}
                      </TableCell>
                    )}

                    {!isTablet && (
                      <TableCell align="right">
                        {item.karat || '-'}
                      </TableCell>
                    )}

                    {!isTablet && (
                      <TableCell align="right">
                        {item.berat || '-'}
                      </TableCell>
                    )}

                    {!isMobile && (
                      <TableCell sx={ellipsis}>
                        {item.kelengkapan_list?.map(k => k.nama_kelengkapan).join(', ') || '-'}
                      </TableCell>
                    )}

                    {!isMobile && (
                      <TableCell sx={ellipsis}>
                        {item.detail_gadai?.nasabah?.nama_lengkap || '-'}
                      </TableCell>
                    )}

                    <TableCell align="center">
                      <Stack direction="row" spacing={isMobile ? 0.5 : 1} justifyContent="center">
                        {canView && (
                          <Tooltip title="Detail">
                            <IconButton
                              size={isMobile ? 'small' : 'medium'}
                              color="info"
                              onClick={() => navigate(`/detail-gadai-retro/${item.id}`)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {!isMobile && canEdit && (
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/edit-gadai-retro/${item.id}`)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {!isMobile && canDelete && (
                          <Tooltip title="Hapus">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(item.id)}
                            >
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
                  <TableCell colSpan={9} align="center">
                    Tidak ada data
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
          labelRowsPerPage="Baris per halaman:"
        />
      </CardContent>
    </Card>
  );
};

export default GadaiRetroPage;
