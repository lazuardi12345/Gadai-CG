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
  TextField,
  Button,
  CircularProgress,
  Typography,
  Grid,
  Stack,
  Chip,
  Tooltip,
  Paper,
  Box,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PrintIcon from "@mui/icons-material/Print";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

const DetailGadaiPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination frontend
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/detail-gadai");
      if (res.data.success && Array.isArray(res.data.data)) {
        const formatted = res.data.data.map((item) => ({
          ...item,
          status: item.status || "proses",
        }));
        setData(formatted);
        setFilteredData(formatted);
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
    fetchData();
  }, []);

  // Filter real-time
  useEffect(() => {
    const filtered = data.filter(
      (item) =>
        item.no_gadai?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.no_nasabah?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nasabah?.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
    setPage(0);
  }, [searchTerm, data]);

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus data ini?")) return;
    try {
      const res = await axiosInstance.delete(`/detail-gadai/${id}`);
      if (res.data.success) {
        setData((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert(res.data.message || "Gagal menghapus data");
      }
    } catch (err) {
      alert(err.message || "Terjadi kesalahan server");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "proses":
        return "warning";
      case "selesai":
        return "info";
      case "lunas":
        return "success";
      default:
        return "default";
    }
  };

  const getPrintSBGRoute = (item) => {
    const typeName = item.type?.nama_type?.toLowerCase();
    if (["retro", "logam_mulia", "perhiasan"].includes(typeName))
      return `/print-surat-bukti-gadai-emas/${item.id}`;
    if (typeName === "handphone") return `/print-surat-bukti-gadai-hp/${item.id}`;
    return `/print-surat-bukti-gadai-emas/${item.id}`;
  };

  const cellStyle = {
    whiteSpace: "nowrap",
    padding: "8px 16px",
    height: 52,
  };

  if (loading) {
    return (
      <Grid container justifyContent="center" alignItems="center" sx={{ height: "100vh" }}>
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

  return (
    <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
      <CardHeader
        title={<Typography variant="h6">📋 Data Detail Gadai</Typography>}
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              variant="outlined"
              size="small"
              placeholder="🔍 Cari no gadai / nasabah / status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ backgroundColor: "white", borderRadius: 2, width: 250 }}
            />
            <Button variant="contained" color="primary" onClick={() => navigate("/tambah-detail-gadai")}>
              + Tambah
            </Button>
          </Stack>
        }
      />
      <Divider />

      <CardContent>
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <TableContainer component={Paper}>
            <Table size="small" sx={{ minWidth: 1200 }}>
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  {[
                    "No",
                    "No Gadai",
                    "No Nasabah",
                    "Tanggal Gadai",
                    "Jatuh Tempo",
                    "Perpanjangan",
                    "Taksiran",
                    "Uang Pinjaman",
                    "Type",
                    "Nasabah",
                    "Status",
                    "Print Struk",
                    "Aksi",
                  ].map((headCell) => (
                    <TableCell key={headCell} align="center" sx={cellStyle}>
                      <b>{headCell}</b>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {(rowsPerPage > 0
                  ? filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  : filteredData
                ).map((item, index) => (
                  <TableRow key={item.id} hover>
                    <TableCell align="center" sx={cellStyle}>
                      {page * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell sx={cellStyle}>{item.no_gadai}</TableCell>
                    <TableCell sx={cellStyle}>{item.no_nasabah}</TableCell>
                    <TableCell sx={cellStyle}>{item.tanggal_gadai}</TableCell>
                    <TableCell sx={cellStyle}>{item.jatuh_tempo}</TableCell>
                    <TableCell sx={cellStyle}>{item.perpanjangan_tempos?.length || 0}x</TableCell>
                    <TableCell align="right" sx={cellStyle}>
                      {item.taksiran ? `Rp ${Number(item.taksiran).toLocaleString("id-ID")}` : "-"}
                    </TableCell>
                    <TableCell align="right" sx={cellStyle}>
                      {item.uang_pinjaman ? `Rp ${Number(item.uang_pinjaman).toLocaleString("id-ID")}` : "-"}
                    </TableCell>
                    <TableCell sx={cellStyle}>{item.type?.nama_type || "-"}</TableCell>
                    <TableCell sx={cellStyle}>{item.nasabah?.nama_lengkap || "-"}</TableCell>
                    <TableCell align="center" sx={cellStyle}>
                      <Chip label={item.status.toUpperCase()} color={getStatusColor(item.status)} size="small" />
                    </TableCell>

                    {/* Tombol print */}
                    <TableCell align="center" sx={cellStyle}>
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Print SBG">
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            startIcon={<PrintIcon />}
                            onClick={() => navigate(getPrintSBGRoute(item))}
                          >
                            SBG
                          </Button>
                        </Tooltip>

                        {item.status === "selesai" && (
                          <>
                            <Tooltip title="Struk Awal">
                              <Button
                                size="small"
                                variant="outlined"
                                color="secondary"
                                startIcon={<PrintIcon />}
                                onClick={() => navigate(`/print-struk-awal/${item.id}`)}
                              >
                                Awal
                              </Button>
                            </Tooltip>

                            <Tooltip title="Struk Lunas">
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                startIcon={<PrintIcon />}
                                onClick={() => navigate(`/print-struk-pelunasan/${item.id}`)}
                              >
                                Lunas
                              </Button>
                            </Tooltip>
                          </>
                        )}

                        {item.perpanjangan_tempos?.length > 0 && (
                          <Tooltip title="Struk Perpanjangan">
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              startIcon={<PrintIcon />}
                              onClick={() => navigate(`/print-struk-perpanjangan/${item.id}`)}
                            >
                              Ppjg
                            </Button>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>

                    {/* Aksi */}
                    <TableCell align="center" sx={cellStyle}>
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <IconButton color="primary" onClick={() => navigate(`/edit-detail-gadai/${item.id}`)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(item.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={13} align="center">
                      Tidak ada data ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

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

export default DetailGadaiPage;
