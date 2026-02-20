import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  Card, CardHeader, CardContent, Divider, Table, TableContainer,
  TableHead, TableBody, TableRow, TableCell, TablePagination,
  IconButton, TextField, Button, Stack, Box, CircularProgress, Typography, Paper,
  useTheme, useMediaQuery, Avatar
} from '@mui/material';

// Icons
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';

import axiosInstance from 'api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from 'AuthContex/AuthContext';

const GadaiHpPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || '').toLowerCase();

  // State Utama
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State Pagination (Server-Side)
  const [page, setPage] = useState(0); 
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  const canAdd = userRole === 'hm' || userRole === 'checker';
  const canEdit = userRole === 'checker' || userRole === 'hm';
  const canDelete = userRole === 'hm';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let url = '';
      if (userRole === 'checker') url = '/checker/gadai-hp';
      else if (userRole === 'petugas') url = '/petugas/gadai-hp';
      else if (userRole === 'hm') url = '/gadai-hp';

      if (!url) return;

      const res = await axiosInstance.get(url, { 
        params: { 
          per_page: rowsPerPage, 
          page: page + 1, // Laravel 1-based
          search: searchTerm 
        } 
      });
      
      if (res.data.success) {
        setData(res.data.data || []);
        setTotalRecords(res.data.total || 0);
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
    if (!window.confirm("Apakah yakin ingin menghapus data ini?")) return;
    try {
      await axiosInstance.delete(`/gadai-hp/${id}`);
      fetchData();
    } catch (err) {
      alert("Gagal menghapus data");
    }
  };

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Card sx={{ borderRadius: { xs: 2, md: 4 }, boxShadow: 5 }}>
        <CardHeader
          title={<Typography variant={isMobile ? "h6" : "h5"} fontWeight={700}>Data Gadai HP</Typography>}
          sx={{ p: 2 }}
          action={
            !isMobile && canAdd && (
              <Button variant="contained" sx={{ borderRadius: 3, px: 3 }} onClick={() => navigate("/tambah-gadai-hp")}>
                + Tambah
              </Button>
            )
          }
        />

        <Box sx={{ px: 2, pb: 2 }}>
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="Cari Nama/IMEI..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0); // Reset ke page 1 saat cari data
              }}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.disabled' }} /> }}
            />
            {isMobile && canAdd && (
              <Button variant="contained" onClick={() => navigate("/tambah-gadai-hp")}>+</Button>
            )}
          </Stack>
        </Box>

        <Divider />

        <CardContent sx={{ p: isMobile ? 0 : 2 }}>
          {loading ? (
            <Stack alignItems="center" py={5}><CircularProgress /></Stack>
          ) : (
            <>
              {isMobile ? (
                <Box sx={{ bgcolor: '#f5f5f5', p: 1.5 }}>
                  {data.map((item) => (
                    <Card key={item.id} sx={{ mb: 1.5, borderRadius: 2, p: 1.5 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}><PhoneIphoneIcon /></Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">{item.nama_barang || "-"}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">IMEI: {item.imei || "-"}</Typography>
                          <Typography variant="caption" color="primary" fontWeight="bold">
                            {item.detail_gadai?.nasabah?.nama_lengkap || "-"}
                          </Typography>
                        </Box>
                      </Stack>
                      <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption">{item.merk?.nama_merk} • {item.ram}/{item.rom}GB</Typography>
                        <Stack direction="row">
                          <IconButton size="small" color="info" onClick={() => navigate(`/detail-gadai-hp/${item.id}`)}><VisibilityIcon fontSize="small" /></IconButton>
                          {canEdit && <IconButton size="small" color="primary" onClick={() => navigate(`/edit-gadai-hp/${item.id}`)}><EditIcon fontSize="small" /></IconButton>}
                          {canDelete && <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}><DeleteIcon fontSize="small" /></IconButton>}
                        </Stack>
                      </Stack>
                    </Card>
                  ))}
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#ededed" }}>
                      <TableRow>
                        {["No", "Nama", "IMEI", "Merk", "RAM/ROM", "Nasabah", "Aksi"].map((h) => (
                          <TableCell key={h} sx={{ fontWeight: "bold" }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.map((item, index) => (
                        <TableRow key={item.id} hover>
                          <TableCell>{(page * rowsPerPage) + index + 1}</TableCell>
                          <TableCell>{item.nama_barang}</TableCell>
                          <TableCell>{item.imei}</TableCell>
                          <TableCell>{item.merk?.nama_merk}</TableCell>
                          <TableCell>{item.ram}/{item.rom} GB</TableCell>
                          <TableCell>{item.detail_gadai?.nasabah?.nama_lengkap}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <IconButton size="small" color="info" onClick={() => navigate(`/detail-gadai-hp/${item.id}`)}><VisibilityIcon /></IconButton>
                              {canEdit && <IconButton size="small" color="primary" onClick={() => navigate(`/edit-gadai-hp/${item.id}`)}><EditIcon /></IconButton>}
                              {canDelete && <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}><DeleteIcon /></IconButton>}
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
                count={totalRecords}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={(_, newPage) => setPage(newPage)}
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

export default GadaiHpPage;