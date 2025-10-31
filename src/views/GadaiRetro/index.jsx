import React, { useEffect, useState } from "react";
import {
  Card, CardHeader, CardContent, Divider,
  Table, TableHead, TableBody, TableRow, TableCell,
  TablePagination, IconButton, Button,
  TableContainer, Paper, Stack, TextField, CircularProgress, Box, Typography
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

const GadaiRetroPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/gadai-retro");
      if (res.data.success) {
        setData(res.data.data);
        setFilteredData(res.data.data);
      } else {
        setError(res.data.message || "Gagal mengambil data");
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = data.filter(
      (item) =>
        item.nama_barang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type_retro?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kelengkapan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.detail_gadai?.nasabah?.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
    setPage(0);
  }, [searchTerm, data]);

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin hapus data ini?")) return;
    try {
      const res = await axiosInstance.delete(`/gadai-retro/${id}`);
      if (res.data.success) setData((prev) => prev.filter((item) => item.id !== id));
      else alert(res.data.message || "Gagal menghapus data");
    } catch (err) { alert(err.message || "Terjadi kesalahan server"); }
  };

  if (loading) return <Stack alignItems="center" justifyContent="center" sx={{ height: "80vh" }}><CircularProgress /></Stack>;
  if (error) return <Typography color="error" variant="h6" align="center" sx={{ mt: 2 }}>{error}</Typography>;

  return (
    <Card>
      <CardHeader
        title="Data Gadai Retro"
        action={
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
            <TextField
              variant="outlined"
              size="small"
              placeholder="Cari nama barang / nasabah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: { xs: "100%", sm: 300 }, mb: { xs: 1, sm: 0 } }}
            />
            <Button variant="contained" color="primary" onClick={() => navigate("/tambah-gadai-retro")}>
              + Tambah Data
            </Button>
          </Stack>
        }
      />
      <Divider />
      <CardContent>
        <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: 1000 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  {["No", "Nama Barang", "Type Retro", "Kelengkapan", "Kode Cap", "Karat", "Potongan Batu", "Berat", "Nama Nasabah", "Aksi"]
                    .map((head) => <TableCell key={head} align="center"><strong>{head}</strong></TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {(rowsPerPage > 0 ? filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : filteredData)
                  .map((row, index) => (
                    <TableRow key={row.id} hover>
                      <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>{row.nama_barang}</TableCell>
                      <TableCell>{row.type_retro}</TableCell>
                      <TableCell>{row.kelengkapan}</TableCell>
                      <TableCell>{row.kode_cap}</TableCell>
                      <TableCell>{row.karat}</TableCell>
                      <TableCell>{row.potongan_batu}</TableCell>
                      <TableCell>{row.berat || "-"}</TableCell>
                      <TableCell>{row.detail_gadai?.nasabah?.nama_lengkap || "-"}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <IconButton color="primary" onClick={() => navigate(`/edit-gadai-retro/${row.id}`)}><EditIcon /></IconButton>
                          <IconButton color="error" onClick={() => handleDelete(row.id)}><DeleteIcon /></IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center">Tidak ada data ditemukan.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Baris per halaman:"
        />
      </CardContent>
    </Card>
  );
};

export default GadaiRetroPage;
