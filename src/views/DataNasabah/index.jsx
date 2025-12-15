import React, { useEffect, useState } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Stack,
  Grid,
  Typography,
  TextField,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import PhotoIcon from "@mui/icons-material/Photo";
import VisibilityIcon from "@mui/icons-material/Visibility";
import axiosInstance from "api/axiosInstance";

const DataNasabahPage = () => {
  const navigate = useNavigate();

  /* ================= USER & ROLE ================= */
  const user = JSON.parse(localStorage.getItem("auth_user"));
  const role = user?.role?.toLowerCase() || "";

  const getApiUrl = (resource) => {
    if (role === "petugas") return `/petugas/${resource}`;
    if (role === "checker") return `/checker/${resource}`;
    return `/${resource}`; // hm / admin
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
  const [page, setPage] = useState(0); // MUI mulai dari 0
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [openModal, setOpenModal] = useState(false);
  const [modalFotoSrc, setModalFotoSrc] = useState("");

  /* ================= FETCH DATA ================= */
  const fetchData = async () => {
    setTableLoading(true);
    try {
      const res = await axiosInstance.get(apiUrl, {
        params: {
          search: searchTerm,
          page: page + 1,        // Laravel mulai dari 1
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
  };

  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, searchTerm]);

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
    await axiosInstance.delete(`${apiUrl}/${id}`);
    fetchData();
  };

  /* ================= LOADING / ERROR ================= */
  if (loading) {
    return (
      <Grid container justifyContent="center" alignItems="center" sx={{ height: "100vh" }}>
        <CircularProgress />
      </Grid>
    );
  }

  if (error) {
    return (
      <Typography color="error" align="center" sx={{ mt: 2 }}>
        {error}
      </Typography>
    );
  }

  /* ================= RENDER ================= */
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardHeader
        title="Data Nasabah"
        action={
          role !== "checker" && (
            <Button variant="contained" startIcon={<AddIcon />}>
              Tambah
            </Button>
          )
        }
      />
      <Divider />

      <CardContent>
        <Stack direction="row" spacing={1} mb={2}>
          <TextField
            size="small"
            placeholder="Cari nasabah..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button variant="contained" onClick={fetchData} disabled={tableLoading}>
            {tableLoading ? <CircularProgress size={20} /> : "Cari"}
          </Button>
        </Stack>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                {["No", "Nama", "NIK", "Alamat", "No HP", "No Rek", "Foto", "Aksi"].map((h) => (
                  <TableCell key={h} align="center">
                    <b>{h}</b>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {nasabahData.map((nasabah, index) => (
                <TableRow key={nasabah.id} hover>
                  <TableCell align="center">
                    {(pagination.current_page - 1) * pagination.per_page + index + 1}
                  </TableCell>
                  <TableCell>{nasabah.nama_lengkap}</TableCell>
                  <TableCell>{nasabah.nik}</TableCell>
                  <TableCell>{nasabah.alamat}</TableCell>
                  <TableCell>{nasabah.no_hp}</TableCell>
                  <TableCell>{nasabah.no_rek || "-"}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      disabled={!nasabah.foto_ktp}
                      onClick={() => handleOpenModal(nasabah.foto_ktp)}
                    >
                      <PhotoIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => navigate(`/detail-nasabah/${nasabah.id}`)}>
                      <VisibilityIcon />
                    </IconButton>
                    {(role === "checker" || role === "hm") && (
                      <IconButton onClick={() => navigate(`/edit-nasabah/${nasabah.id}`)}>
                        <EditIcon />
                      </IconButton>
                    )}
                    {role === "hm" && (
                      <IconButton color="error" onClick={() => handleDelete(nasabah.id)}>
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}

              {nasabahData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Tidak ada data
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            rowsPerPageOptions={[5, 10, 25]}
            count={pagination.total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </CardContent>

      {/* MODAL FOTO */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Foto KTP</DialogTitle>
        <DialogContent>
          <img src={modalFotoSrc} alt="KTP" style={{ width: "100%" }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default DataNasabahPage;
