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
import { AuthContext } from "AuthContex/AuthContext"; // pastikan path benar

const TypePage = () => {
  const { user } = useContext(AuthContext); // ambil role user
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

  useEffect(() => {
    fetchTypes();
  }, []);

const fetchTypes = async () => {
  setLoading(true);
  try {
    // endpoint berbeda untuk checker dan hm
    const endpoint = user?.role === "checker" ? "/checker/type" : "/type";

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

  // Filter real-time
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
      let res;
      if (editingType) {
        res = await axiosInstance.put(`/type/${editingType.id}`, payload);
      } else {
        res = await axiosInstance.post("/type", payload);
      }

      if (res.data.success) {
        fetchTypes();
        handleCloseDialog();
      } else {
        alert(res.data.message || "Gagal menyimpan data");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan server");
    }
  };

  const handleDelete = async (id) => {
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

  if (error) {
    return (
      <Typography color="error" variant="h6" align="center" sx={{ mt: 2 }}>
        Error: {error}
      </Typography>
    );
  }

  // role checks
  const canEdit = ["hm", "checker"].includes(user?.role);
  const canDelete = user?.role === "hm";

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
                placeholder="🔍 Cari nomor / nama type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ backgroundColor: "white", borderRadius: 2, width: 200 }}
              />
              {canEdit && (
                <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
                  + Tambah
                </Button>
              )}
            </Stack>
          }
        />
        <Divider />
        <CardContent sx={{ width: "100%" }}>
          <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell><strong>No</strong></TableCell>
                  <TableCell><strong>Nomor Type</strong></TableCell>
                  <TableCell><strong>Nama Type</strong></TableCell>
                  {(canEdit || canDelete) && <TableCell align="center"><strong>Aksi</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {(rowsPerPage > 0
                  ? filteredTypes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  : filteredTypes
                ).map((type, index) => (
                  <TableRow key={type.id} hover>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{type.nomor_type}</TableCell>
                    <TableCell>{type.nama_type}</TableCell>
                    {(canEdit || canDelete) && (
                      <TableCell align="center">
                        {canEdit && (
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
                {filteredTypes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={(canEdit || canDelete) ? 4 : 3} align="center">
                      Tidak ada data ditemukan.
                    </TableCell>
                  </TableRow>
                )}
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

      {/* Modal Tambah/Edit */}
      {canEdit && (
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editingType ? "✏️ Edit Type" : "➕ Tambah Type"}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
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
