import React, { useEffect, useState, useCallback } from "react";
import {
  Card, CardHeader, CardContent, Divider, Table, TableContainer,
  TableHead, TableBody, TableRow, TableCell, TablePagination,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, CircularProgress, Stack, Grid, Typography, TextField,
  Paper, Box, Avatar, useTheme, useMediaQuery, Chip
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Photo as PhotoIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  AccountCircle as AccountCircleIcon,
  AccountBalance as BankIcon
} from "@mui/icons-material";
import axiosInstance from "api/axiosInstance";

const DataNasabahPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  /* ================= USER & ROLE ================= */
  const user = JSON.parse(localStorage.getItem("auth_user"));
  const role = user?.role?.toLowerCase() || "";

  const getApiUrl = (resource) => {
    if (role === "petugas") return `/petugas/${resource}`;
    if (role === "checker") return `/checker/${resource}`;
    return `/${resource}`;
  };

  const apiUrl = getApiUrl("data-nasabah");

  /* ================= STATE ================= */
  const [nasabahData, setNasabahData] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    per_page: 10,
    current_page: 1,
    last_page: 1,
  });

  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openModal, setOpenModal] = useState(false);
  const [modalFotoSrc, setModalFotoSrc] = useState("");

  /* ================= FETCH DATA ================= */
  const fetchData = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await axiosInstance.get(apiUrl, {
        params: {
          search: searchTerm,
          page: page + 1,
          per_page: rowsPerPage,
        },
      });

      if (res.data.success) {
        setNasabahData(res.data.data);
        setPagination(res.data.pagination);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan server");
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  }, [apiUrl, page, rowsPerPage, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ================= HANDLER ================= */
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleOpenModal = (foto) => {
    setModalFotoSrc(foto);
    setOpenModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus data ini?")) return;
    try {
      await axiosInstance.delete(`${apiUrl}/${id}`);
      fetchData();
    } catch (err) {
      alert("Gagal menghapus data");
    }
  };

  if (loading) return (
    <Stack justifyContent="center" alignItems="center" sx={{ height: "80vh" }}>
      <CircularProgress />
    </Stack>
  );

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Card sx={{ borderRadius: { xs: 2, md: 3 }, boxShadow: 3 }}>
        <CardHeader
          title={<Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">Data Nasabah</Typography>}
          action={
            role !== "checker" && (
              <Button 
                variant="contained" 
                size={isMobile ? "small" : "medium"} 
                startIcon={<AddIcon />}
                onClick={() => navigate('/tambah-nasabah')} 
              >
                {isMobile ? "Tambah" : "Tambah Nasabah"}
              </Button>
            )
          }
        />
        <Divider />

        <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
          {/* SEARCH SECTION */}
          <Stack direction="row" spacing={1} mb={2}>
            <TextField
              fullWidth={isMobile}
              size="small"
              placeholder="Cari nama/NIK..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ color: 'gray', mr: 1, fontSize: 20 }} /> }}
            />
            {!isMobile && (
              <Button variant="contained" onClick={fetchData} disabled={tableLoading}>
                {tableLoading ? <CircularProgress size={20} /> : "Cari"}
              </Button>
            )}
          </Stack>

          {isMobile ? (
            /* ================= MOBILE VIEW (CARDS) ================= */
            <Stack spacing={2}>
              {nasabahData.map((nasabah) => (
                <Paper key={nasabah.id} variant="outlined" sx={{ p: 2, borderRadius: 2, position: 'relative' }}>
                  <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}><AccountCircleIcon /></Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">{nasabah.nama_lengkap}</Typography>
                      <Typography variant="caption" color="text.secondary">NIK: {nasabah.nik}</Typography>
                    </Box>
                  </Stack>

                  {role !== "petugas" && (
                    <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed #ddd' }}>
                      <Stack direction="row" justifyContent="space-between" mb={1}>
                        <Typography variant="caption">No HP: <b>{nasabah.no_hp || "-"}</b></Typography>
                        <Chip 
                          icon={<BankIcon style={{ fontSize: 14 }} />} 
                          label={nasabah.bank?.replace(/_/g, ' ') || "-"} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                      </Stack>
                      <Typography variant="caption" display="block" mb={1}>No Rek: <b>{nasabah.no_rek || "-"}</b></Typography>
                      
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton size="small" color="primary" disabled={!nasabah.foto_ktp} onClick={() => handleOpenModal(nasabah.foto_ktp)}>
                          <PhotoIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => navigate(`/detail-nasabah/${nasabah.id}`)}>
                          <VisibilityIcon fontSize="small" color="info" />
                        </IconButton>
                        {(role === "checker" || role === "hm") && (
                          <IconButton size="small" onClick={() => navigate(`/edit-nasabah/${nasabah.id}`)}>
                            <EditIcon fontSize="small" color="warning" />
                          </IconButton>
                        )}
                        {role === "hm" && (
                          <IconButton size="small" color="error" onClick={() => handleDelete(nasabah.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
                    </Box>
                  )}
                </Paper>
              ))}
            </Stack>
          ) : (
            /* ================= DESKTOP VIEW (TABLE) ================= */
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ backgroundColor: "#f8fafc" }}>
                  <TableRow>
                    <TableCell align="center"><b>No</b></TableCell>
                    <TableCell><b>Nama</b></TableCell>
                    <TableCell align="center"><b>NIK</b></TableCell>
                    {role !== "petugas" && (
                      <>
                        <TableCell align="center"><b>No HP</b></TableCell>
                        <TableCell align="center"><b>Bank</b></TableCell>
                        <TableCell align="center"><b>No Rek</b></TableCell>
                        <TableCell align="center"><b>Foto</b></TableCell>
                        <TableCell align="center"><b>Aksi</b></TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {nasabahData.map((nasabah, index) => (
                    <TableRow key={nasabah.id} hover>
                      <TableCell align="center">{(pagination.current_page - 1) * pagination.per_page + index + 1}</TableCell>
                      <TableCell><b>{nasabah.nama_lengkap}</b></TableCell>
                      <TableCell align="center">{nasabah.nik}</TableCell>
                      {role !== "petugas" && (
                        <>
                          <TableCell align="center">{nasabah.no_hp}</TableCell>
                          <TableCell align="center">
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                              {nasabah.bank ? nasabah.bank.replace(/_/g, ' ') : "-"}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{nasabah.no_rek || "-"}</TableCell>
                          <TableCell align="center">
                            <IconButton color="primary" disabled={!nasabah.foto_ktp} onClick={() => handleOpenModal(nasabah.foto_ktp)}>
                              <PhotoIcon />
                            </IconButton>
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" justifyContent="center" spacing={0.5}>
                              <IconButton size="small" onClick={() => navigate(`/detail-nasabah/${nasabah.id}`)}>
                                <VisibilityIcon fontSize="small" color="info" />
                              </IconButton>
                              {(role === "checker" || role === "hm") && (
                                <IconButton size="small" onClick={() => navigate(`/edit-nasabah/${nasabah.id}`)}>
                                  <EditIcon fontSize="small" color="warning" />
                                </IconButton>
                              )}
                              {role === "hm" && (
                                <IconButton size="small" color="error" onClick={() => handleDelete(nasabah.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Stack>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {nasabahData.length === 0 && !tableLoading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">Tidak ada data nasabah.</Typography>
            </Box>
          )}

          <TablePagination
            component="div"
            rowsPerPageOptions={[5, 10, 25]}
            count={pagination.total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage={isMobile ? "Baris:" : "Baris per halaman:"}
          />
        </CardContent>
      </Card>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Foto KTP
          <IconButton onClick={() => setOpenModal(false)}><DeleteIcon sx={{ transform: 'rotate(45deg)' }} /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box component="img" src={modalFotoSrc} alt="KTP" sx={{ width: "100%", borderRadius: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} variant="contained">Tutup</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataNasabahPage;