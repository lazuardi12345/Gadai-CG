import React, { useEffect, useState, useContext } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Typography,
  Grid,
  Stack,
  Paper,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axiosInstance from "api/axiosInstance";
import { AuthContext } from "AuthContex/AuthContext";

const TypePage = () => {
  const { user } = useContext(AuthContext);
  const [types, setTypes] = useState([]);
  const [filteredTypes, setFilteredTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingType, setEditingType] = useState(null);

  const [formNomorType, setFormNomorType] = useState("");
  const [formNamaType, setFormNamaType] = useState("");

  // --- LOGIKA HAK AKSES ---
  const canEditOrAdd = ["hm", "checker"].includes(user?.role);
  const canDelete = user?.role === "hm";
  const hasActionAccess = canEditOrAdd || canDelete;

  useEffect(() => {
    fetchTypes();
  }, [user]);

  const fetchTypes = async () => {
    if (!user?.role) return;

    setLoading(true);
    try {
      let endpoint = "/type";
      // Penyesuaian endpoint berdasarkan role
      if (user.role === "petugas") endpoint = "/petugas/type";
      else if (user.role === "checker") endpoint = "/checker/type";
      else endpoint = "/type";

      const response = await axiosInstance.get(endpoint);
      if (response.data.success) {
        setTypes(response.data.data);
        setFilteredTypes(response.data.data);
      } else {
        setError(response.data.message || "Gagal mengambil data");
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = types.filter(
      (type) =>
        type.nomor_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.nama_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTypes(filtered);
    setPage(0);
  }, [searchTerm, types]);

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (type = null) => {
    if (!canEditOrAdd) return; // Guard clause
    setEditingType(type);
    setFormNomorType(type?.nomor_type || "");
    setFormNamaType(type?.nama_type || "");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingType(null);
  };

  const handleSubmit = async () => {
    if (!formNomorType || !formNamaType) {
      alert("Harap isi semua field");
      return;
    }

    const payload = { nomor_type: formNomorType, nama_type: formNamaType };
    try {
      let baseEndpoint = "/type";
      if (user.role === "checker") baseEndpoint = "/checker/type";
      if (user.role === "hm") baseEndpoint = "/type";

      let res;
      if (editingType) {
        res = await axiosInstance.put(`${baseEndpoint}/${editingType.id}`, payload);
      } else {
        res = await axiosInstance.post(baseEndpoint, payload);
      }

      if (res.data.success) {
        fetchTypes();
        handleCloseDialog();
      } else {
        alert(res.data.message || "Gagal menyimpan data");
      }
    } catch (err) {
      alert("Terjadi kesalahan server");
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete) return;
    if (!window.confirm("Yakin hapus data ini?")) return;
    try {
      const res = await axiosInstance.delete(`/type/${id}`);
      if (res.data.success) {
        setTypes((prev) => prev.filter((type) => type.id !== id));
      } else {
        alert(res.data.message || "Gagal menghapus data");
      }
    } catch (err) {
      alert(err.message || "Terjadi kesalahan server");
    }
  };

  if (loading) {
    return (
      <Grid container justifyContent="center" alignItems="center" style={{ height: "100vh" }}>
        <CircularProgress />
      </Grid>
    );
  }

  return (
    <>
      <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
        <CardHeader
          title={<Typography variant="h6">📋 Data Type Barang</Typography>}
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                variant="outlined"
                size="small"
                placeholder="🔍 Cari..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ backgroundColor: "white", borderRadius: 2, width: 220 }}
              />
              {canEditOrAdd && (
                <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
                  + Tambah
                </Button>
              )}
            </Stack>
          }
        />
        <Divider />
        <CardContent>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell><strong>No</strong></TableCell>
                  <TableCell><strong>Nomor Type</strong></TableCell>
                  <TableCell><strong>Nama Type</strong></TableCell>
                  {hasActionAccess && <TableCell align="center"><strong>Aksi</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTypes
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((type, index) => (
                    <TableRow key={type.id} hover>
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>{type.nomor_type}</TableCell>
                      <TableCell>{type.nama_type}</TableCell>
                      {hasActionAccess && (
                        <TableCell align="center">
                          {canEditOrAdd && (
                            <IconButton color="primary" onClick={() => handleOpenDialog(type)}>
                              <EditIcon />
                            </IconButton>
                          )}
                          {canDelete && (
                            <IconButton color="error" onClick={() => handleDelete(type.id)}>
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredTypes.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Modal hanya bisa dibuka oleh checker/hm */}
      {canEditOrAdd && (
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editingType ? "✏️ Edit Type" : "➕ Tambah Type"}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Nomor Type"
                fullWidth
                value={formNomorType}
                onChange={(e) => setFormNomorType(e.target.value)}
              />
              <TextField
                label="Nama Type"
                fullWidth
                value={formNamaType}
                onChange={(e) => setFormNamaType(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Batal</Button>
            <Button variant="contained" color="primary" onClick={handleSubmit}>
              {editingType ? "Update" : "Simpan"}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default TypePage;