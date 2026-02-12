import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  Card, CardHeader, CardContent, Divider,
  Table, TableContainer, TableHead, TableBody,
  TableRow, TableCell, TablePagination,
  IconButton, TextField, Stack,
  CircularProgress, Typography, Paper,
  useTheme, useMediaQuery, Box, Avatar, Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import DiamondIcon from '@mui/icons-material/Diamond'; 

import axiosInstance from 'api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from 'AuthContex/AuthContext';

const GadaiLogamMuliaPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || '').toLowerCase();

  // State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State Pagination - Sesuaikan dengan BE kamu
  const [page, setPage] = useState(0); 
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/gadai-logam-mulia';
      if (userRole === 'checker') url = '/checker/gadai-logam-mulia';
      if (userRole === 'petugas') url = '/petugas/gadai-logam-mulia';

      const res = await axiosInstance.get(url, { 
        params: { 
          per_page: rowsPerPage, 
          page: page + 1, // Laravel pakai 1-based index
          search: searchTerm 
        } 
      });

      if (res.data.success) {
        // SESUAIKAN DENGAN STRUKTUR BE KAMU:
        // Data ada di res.data.data
        // Total ada di res.data.pagination.total
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
      const res = await axiosInstance.delete(`/gadai-logam-mulia/${id}`);
      if (res.data.success) fetchData();
    } catch (err) {
      alert('Gagal menghapus');
    }
  };

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Card sx={{ borderRadius: { xs: 2, md: 4 }, boxShadow: 5 }}>
        <CardHeader
          title={<Typography variant={isMobile ? "h6" : "h5"} fontWeight={700}>Data Logam Mulia</Typography>}
        />

        <Box sx={{ px: 2, pb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Cari Barang/Nasabah..."
            value={searchTerm}
            onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0); // Reset ke hal 1 tiap kali search
            }}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.disabled' }} /> }}
          />
        </Box>

        <Divider />

        <CardContent sx={{ p: isMobile ? 0 : 2 }}>
          {loading ? (
            <Stack alignItems="center" py={5}><CircularProgress /></Stack>
          ) : (
            <>
              {isMobile ? (
                /* VIEW MOBILE */
                <Box sx={{ bgcolor: '#f5f5f5', p: 1.5 }}>
                  {data.map((item) => (
                    <Card key={item.id} sx={{ mb: 1.5, borderRadius: 2, p: 2, boxShadow: 1 }}>
                      <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                        <Avatar sx={{ bgcolor: 'warning.main' }}><DiamondIcon /></Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">{item.nama_barang || "-"}</Typography>
                          <Typography variant="caption" color="primary" fontWeight="bold">
                            {item.detail_gadai?.nasabah?.nama_lengkap || "-"}
                          </Typography>
                        </Box>
                        <Chip label={`${item.karat}K`} size="small" color="warning" />
                      </Stack>
                      <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption">Berat: {item.berat} gr</Typography>
                        <Stack direction="row">
                          <IconButton size="small" color="info" onClick={() => navigate(`/detail-gadai-logam-mulia/${item.id}`)}><VisibilityIcon fontSize="small" /></IconButton>
                          {["hm", "checker"].includes(userRole) && <IconButton size="small" color="primary" onClick={() => navigate(`/edit-gadai-logam-mulia/${item.id}`)}><EditIcon fontSize="small" /></IconButton>}
                          {userRole === "hm" && <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}><DeleteIcon fontSize="small" /></IconButton>}
                        </Stack>
                      </Stack>
                    </Card>
                  ))}
                </Box>
              ) : (
                /* VIEW DESKTOP */
                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f0f0f0' }}>
                      <TableRow>
                        {['No', 'Nama Barang', 'Kode Cap', 'Karat', 'Berat', 'Nasabah', 'Aksi'].map(h => (
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
                          <TableCell align="center">{item.karat}K</TableCell>
                          <TableCell align="center">{item.berat} gr</TableCell>
                          <TableCell>{item.detail_gadai?.nasabah?.nama_lengkap}</TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <IconButton size="small" color="info" onClick={() => navigate(`/detail-gadai-logam-mulia/${item.id}`)}><VisibilityIcon /></IconButton>
                              {["hm", "checker"].includes(userRole) && <IconButton size="small" color="primary" onClick={() => navigate(`/edit-gadai-logam-mulia/${item.id}`)}><EditIcon /></IconButton>}
                              {userRole === "hm" && <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}><DeleteIcon /></IconButton>}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <TablePagination
                component="div"
                count={totalRecords} // Mengambil dari res.data.pagination.total
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={(_, p) => setPage(p)}
                onRowsPerPageChange={(e) => { 
                    setRowsPerPage(parseInt(e.target.value, 10)); 
                    setPage(0); 
                }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default GadaiLogamMuliaPage;