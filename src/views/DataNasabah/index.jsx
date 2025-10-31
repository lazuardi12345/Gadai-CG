import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Stack,
  Box,
  Backdrop,
  Grid,
  Typography,
  TextField,
  Paper,
  TableContainer,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import PhotoIcon from "@mui/icons-material/Photo";
import axiosInstance from "api/axiosInstance";

const DataNasabahPage = () => {
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
  const [openModal, setOpenModal] = useState(false);
  const [modalFotoSrc, setModalFotoSrc] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Form Tambah Nasabah
  const [openTambahModal, setOpenTambahModal] = useState(false);
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    nik: "",
    alamat: "",
    no_hp: "",
    foto_ktp: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(
    async (page = 1, perPage = 10, search = "") => {
      if (page === 1 && !search) setLoading(true);
      else setTableLoading(true);

      try {
        const res = await axiosInstance.get("/data-nasabah", {
          params: { page, per_page: perPage, search },
        });

        if (res.data.success) {
          setNasabahData(res.data.data || []);
          setPagination(
            res.data.pagination || {
              total: 0,
              per_page: perPage,
              current_page: page,
              last_page: 1,
            }
          );
        } else {
          setNasabahData([]);
          setError(res.data.message || "Gagal mengambil data");
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
        setTableLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchData(1, pagination.per_page);
  }, []);

  // Pagination
  const handleChangePage = (_, newPage) =>
    fetchData(newPage + 1, pagination.per_page, searchQuery);
  const handleChangeRowsPerPage = (event) =>
    fetchData(1, parseInt(event.target.value, 10), searchQuery);

  // Search
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    fetchData(1, pagination.per_page, value);
  };

  // Modal Foto
  const handleOpenModal = (fotoUrl) => {
    setModalFotoSrc(fotoUrl);
    setOpenModal(true);
  };

  // Modal Tambah Nasabah
  const handleOpenTambahModal = () => {
    setFormData({
      nama_lengkap: "",
      nik: "",
      alamat: "",
      no_hp: "",
      foto_ktp: null,
    });
    setOpenTambahModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "foto_ktp") {
      setFormData((prev) => ({ ...prev, foto_ktp: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    const { nama_lengkap, nik, alamat, no_hp, foto_ktp } = formData;
    if (!nama_lengkap || !nik || !alamat || !no_hp) {
      alert("Semua field wajib diisi!");
      return;
    }

    const fd = new FormData();
    fd.append("nama_lengkap", nama_lengkap);
    fd.append("nik", nik);
    fd.append("alamat", alamat);
    fd.append("no_hp", no_hp);
    if (foto_ktp) fd.append("foto_ktp", foto_ktp);

    try {
      setSubmitting(true);
      const res = await axiosInstance.post("/data-nasabah", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setOpenTambahModal(false);
        fetchData(1, pagination.per_page);
      } else {
        alert(res.data.message || "Gagal menambahkan nasabah");
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <Grid container justifyContent="center" alignItems="center" sx={{ height: "100vh" }}>
        <CircularProgress />
      </Grid>
    );

  if (error)
    return (
      <Typography color="error" align="center" sx={{ mt: 3 }}>
        {error}
      </Typography>
    );

  return (
    <>
      <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
        <CardHeader
          title={<Typography variant="h6">📋 Data Nasabah</Typography>}
          action={
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenTambahModal}
            >
              Tambah
            </Button>
          }
        />
        <Divider />

        <CardContent>
          {/* Search bar */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <TextField
              size="small"
              placeholder="Cari nasabah..."
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{ width: 300 }}
            />
          </Stack>

          {/* Table with horizontal scroll */}
          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell><strong>No</strong></TableCell>
                    <TableCell><strong>Nama Lengkap</strong></TableCell>
                    <TableCell><strong>NIK</strong></TableCell>
                    <TableCell><strong>Alamat</strong></TableCell>
                    <TableCell><strong>No HP</strong></TableCell>
                    <TableCell><strong>Foto</strong></TableCell>
                    <TableCell align="center"><strong>Aksi</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {nasabahData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        Tidak ada data ditemukan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    nasabahData.map((nasabah, index) => (
                      <TableRow key={nasabah.id} hover>
                        <TableCell>
                          {(pagination.current_page - 1) * pagination.per_page + index + 1}
                        </TableCell>
                        <TableCell>{nasabah.nama_lengkap}</TableCell>
                        <TableCell>{nasabah.nik}</TableCell>
                        <TableCell sx={{ maxWidth: 150, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {nasabah.alamat}
                        </TableCell>
                        <TableCell>{nasabah.no_hp}</TableCell>
                        <TableCell>
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenModal(nasabah.foto_ktp)}
                            title="Lihat Foto KTP"
                            disabled={!nasabah.foto_ktp}
                          >
                            <PhotoIcon />
                          </IconButton>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton color="primary" title="Edit" onClick={() => alert("Edit data")}>
                            <EditIcon />
                          </IconButton>
                          <IconButton color="error" title="Hapus" onClick={() => alert("Hapus data")}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <TablePagination
                component="div"
                count={pagination.total}
                page={pagination.current_page - 1}
                onPageChange={handleChangePage}
                rowsPerPage={pagination.per_page}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25]}
                labelRowsPerPage="Baris per halaman"
              />
            </TableContainer>

            {/* Loading overlay untuk table */}
            {tableLoading && (
              <Backdrop
                open
                sx={{
                  position: "absolute",
                  zIndex: 2,
                  backgroundColor: "rgba(255,255,255,0.6)",
                }}
              >
                <CircularProgress size={30} color="primary" />
              </Backdrop>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Modal Foto */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Foto KTP</DialogTitle>
        <DialogContent dividers sx={{ textAlign: "center" }}>
          <img
            src={modalFotoSrc}
            alt="Foto KTP"
            style={{ width: "100%", height: 400, borderRadius: 8, objectFit: "cover" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} color="primary">
            Tutup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Tambah Nasabah */}
      <Dialog open={openTambahModal} onClose={() => setOpenTambahModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tambah Nasabah</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Nama Lengkap"
              name="nama_lengkap"
              value={formData.nama_lengkap}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="NIK"
              name="nik"
              value={formData.nik}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Alamat"
              name="alamat"
              value={formData.alamat}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="No HP"
              name="no_hp"
              value={formData.no_hp}
              onChange={handleFormChange}
              fullWidth
            />
            <Button variant="contained" component="label">
              Upload Foto KTP
              <input type="file" hidden name="foto_ktp" onChange={handleFormChange} />
            </Button>
            {formData.foto_ktp && <Typography>{formData.foto_ktp.name}</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTambahModal(false)} color="secondary">
            Batal
          </Button>
          <Button onClick={handleSubmit} color="primary" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : "Simpan"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DataNasabahPage;
