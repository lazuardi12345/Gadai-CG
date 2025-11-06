import React, { useEffect, useState } from "react";
import {
  Card, CardHeader, CardContent, Divider, Table, TableHead,
  TableBody, TableRow, TableCell, TablePagination, IconButton,
  TextField, Button, CircularProgress, Stack, Chip, Typography,
  TableContainer, Paper
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

const PerpanjanganTempoPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const user = JSON.parse(localStorage.getItem("auth_user"));
  const userRole = user?.role?.toLowerCase() || ""; // "hm", "checker", "petugas"

  const apiBaseUrl = userRole === "checker"
    ? "/checker/perpanjangan-tempo"
    : userRole === "petugas"
    ? "/petugas/perpanjangan-tempo"
    : "/perpanjangan-tempo";

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(apiBaseUrl);
      if (res.data.success) {
        setData(res.data.data);
        setFilteredData(res.data.data);
      } else {
        setError(res.data.message || "Gagal mengambil data");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userRole]);

  // Filter realtime
  useEffect(() => {
    const filtered = data.filter(
      item =>
        item.detail_gadai?.no_gadai?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.detail_gadai?.no_nasabah?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.detail_gadai?.nasabah?.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
    setPage(0);
  }, [searchTerm, data]);

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus data perpanjangan ini?")) return;
    try {
      const res = await axiosInstance.delete(`${apiBaseUrl}/${id}`);
      if (res.data.success) setData(prev => prev.filter(item => item.id !== id));
      else alert(res.data.message || "Gagal menghapus data perpanjangan");
    } catch (err) {
      alert(err.message || "Terjadi kesalahan server");
    }
  };

  if (loading) return (
    <Stack alignItems="center" justifyContent="center" sx={{ height: "80vh" }}>
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
        title="Data Perpanjangan Tempo"
        action={
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
            <TextField
              variant="outlined"
              size="small"
              placeholder="Cari no gadai / no nasabah / nama nasabah..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              sx={{ width: { xs: "100%", sm: 300 }, mb: { xs: 1, sm: 0 } }}
            />
            {["hm", "checker", "petugas"].includes(userRole) && (
              <Button
                variant="contained"
                color="primary"
                onClick={() =>
                  navigate(
                    userRole === "checker"
                      ? "/tambah-perpanjangan-tempo"
                      : userRole === "petugas"
                      ? "/tambah-perpanjangan-tempo"
                      : "/tambah-perpanjangan-tempo"
                  )
                }
              >
                Tambah
              </Button>
            )}
          </Stack>
        }
      />
      <Divider />
      <CardContent>
        <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                {[
                  "No",
                  "No Gadai",
                  "No Nasabah",
                  "Tanggal Gadai",
                  "Jatuh Tempo Lama",
                  "Tanggal Perpanjangan",
                  "Jatuh Tempo Baru",
                  "Nasabah",
                  "Status Gadai",
                  "Aksi",
                ].map(head => (
                  <TableCell key={head} align="center">{head}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0
                ? filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : filteredData
              ).map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{item.detail_gadai?.no_gadai || "-"}</TableCell>
                  <TableCell>{item.detail_gadai?.no_nasabah || "-"}</TableCell>
                  <TableCell>{item.detail_gadai?.tanggal_gadai || "-"}</TableCell>
                  <TableCell>{item.detail_gadai?.jatuh_tempo || "-"}</TableCell>
                  <TableCell>{item.tanggal_perpanjangan || "-"}</TableCell>
                  <TableCell>{item.jatuh_tempo_baru || "-"}</TableCell>
                  <TableCell>{item.detail_gadai?.nasabah?.nama_lengkap || "-"}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={item.detail_gadai?.status?.toUpperCase() || "-"}
                      color={
                        item.detail_gadai?.status === "proses" ? "warning" :
                        item.detail_gadai?.status === "selesai" ? "info" :
                        item.detail_gadai?.status === "lunas" ? "success" : "default"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {["hm", "checker"].includes(userRole) && (
                      <>
                        <IconButton
                          color="primary"
                          onClick={() =>
                            navigate(
                              userRole === "checker"
                                ? `/edit-perpanjangan-tempo/${item.id}`
                                : userRole === "petugas"
                                ? `/edit-perpanjangan-tempo/${item.id}`
                                : `/edit-perpanjangan-tempo/${item.id}`
                            )
                          }
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(item.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    Tidak ada data perpanjangan ditemukan.
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
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </CardContent>
    </Card>
  );
};

export default PerpanjanganTempoPage;
