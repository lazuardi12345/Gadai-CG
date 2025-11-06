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
import { useNavigate } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { AuthContext } from "AuthContex/AuthContext";

const DetailGadaiPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // --- Tentukan URL otomatis berdasarkan role ---
  const getApiUrl = (resource) => {
    switch (userRole) {
      case "petugas":
        return `/petugas/${resource}`;
      case "checker":
        return `/checker/${resource}`;
      case "hm":
      default:
        return `/${resource}`;
    }
  };

  // --- Fetch Data ---
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(getApiUrl("detail-gadai"), {
        params: { per_page: 1000 },
      });
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
    fetchData();
  }, []);

  // --- Filter Search ---
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

  // --- Handlers ---
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus data ini?")) return;
    try {
      const res = await axiosInstance.delete(`${getApiUrl("detail-gadai")}/${id}`);
      if (res.data.success) {
        setData((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert(res.data.message || "Gagal menghapus data");
      }
    } catch (err) {
      alert(err.message || "Terjadi kesalahan server");
    }
  };

  // --- Helpers ---
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

  const getApprovalColor = (status) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "pending":
      default:
        return "warning";
    }
  };

  const getPrintSBGRoute = (item) => {
    const typeName = item.type?.nama_type?.toLowerCase();
    if (["retro", "logam_mulia", "perhiasan"].includes(typeName))
      return `/print-surat-bukti-gadai-emas/${item.id}`;
    if (typeName === "handphone")
      return `/print-surat-bukti-gadai-hp/${item.id}`;
    return `/print-surat-bukti-gadai-emas/${item.id}`;
  };

  const getJatuhTempoTerbaru = (item) => {
    if (item.perpanjangan_tempos && item.perpanjangan_tempos.length > 0) {
      const last = item.perpanjangan_tempos[item.perpanjangan_tempos.length - 1];
      return last.jatuh_tempo_baru || last.tanggal_perpanjangan;
    }
    return item.jatuh_tempo || "-";
  };

  const cellStyle = { whiteSpace: "nowrap", padding: "8px 16px", height: 52 };

  // --- Render ---
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

  const canEdit = ["hm", "checker"].includes(userRole);
  const canDelete = userRole === "hm";

  return (
    <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
      <CardHeader
        title={<Typography variant="h6">Data Detail Gadai</Typography>}
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              variant="outlined"
              size="small"
              placeholder="Cari no gadai / nasabah / status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ backgroundColor: "white", borderRadius: 2, width: 250 }}
            />
            <Button variant="contained" color="primary" onClick={() => setPage(0)}>
              Cari
            </Button>
            {canEdit && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/tambah-detail-gadai")}
              >
                + Tambah
              </Button>
            )}
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
                    "Status Checker",
                    "Status HM",
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
                ).map((item, index) => {
                  const checkerApproval = item.approvals?.find((a) => a.role === "checker");
                  const hmApproval = item.approvals?.find((a) => a.role === "hm");

                  const checkerStatus = checkerApproval?.status || "pending";
                  const hmStatus = hmApproval?.status || "pending";

                  return (
                    <TableRow key={item.id} hover>
                      <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell sx={cellStyle}>{item.no_gadai}</TableCell>
                      <TableCell sx={cellStyle}>{item.no_nasabah}</TableCell>
                      <TableCell sx={cellStyle}>{item.tanggal_gadai}</TableCell>
                      <TableCell sx={cellStyle}>
                        <Tooltip
                          title={
                            item.perpanjangan_tempos?.length > 0
                              ? item.perpanjangan_tempos
                                  .map((p) => `Perpanjangan: ${p.jatuh_tempo_baru}`)
                                  .join("\n")
                              : ""
                          }
                        >
                          <span>{getJatuhTempoTerbaru(item)}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={cellStyle}>{item.perpanjangan_tempos?.length || 0}x</TableCell>
                      <TableCell align="right" sx={cellStyle}>
                        {item.taksiran
                          ? `Rp ${Number(item.taksiran).toLocaleString("id-ID")}`
                          : "-"}
                      </TableCell>
                      <TableCell align="right" sx={cellStyle}>
                        {item.uang_pinjaman
                          ? `Rp ${Number(item.uang_pinjaman).toLocaleString("id-ID")}`
                          : "-"}
                      </TableCell>
                      <TableCell sx={cellStyle}>{item.type?.nama_type || "-"}</TableCell>
                      <TableCell sx={cellStyle}>{item.nasabah?.nama_lengkap || "-"}</TableCell>
                      <TableCell align="center" sx={cellStyle}>
                        <Chip
                          label={item.status.toUpperCase()}
                          color={getStatusColor(item.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center" sx={cellStyle}>
                        <Chip
                          label={checkerStatus.toUpperCase()}
                          color={getApprovalColor(checkerStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center" sx={cellStyle}>
                        <Chip
                          label={hmStatus.toUpperCase()}
                          color={getApprovalColor(hmStatus)}
                          size="small"
                        />
                      </TableCell>

                      {/* --- Print Buttons --- */}
                      <TableCell align="center" sx={cellStyle}>
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          {/* Semua role bisa print SBG */}
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

                          {/* Status selesai → tampilkan struk awal & perpanjangan */}
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
                              {item.perpanjangan_tempos?.length > 0 && (
                                <Tooltip title="Struk Perpanjangan">
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="warning"
                                    startIcon={<PrintIcon />}
                                    onClick={() =>
                                      navigate(`/print-struk-perpanjangan/${item.id}`)
                                    }
                                  >
                                    Ppjg
                                  </Button>
                                </Tooltip>
                              )}
                            </>
                          )}

                          {/* Status lunas → tampilkan SBG + struk pelunasan */}
                          {item.status === "lunas" && (
                            <Tooltip title="Struk Pelunasan">
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                startIcon={<PrintIcon />}
                                onClick={() =>
                                  navigate(`/print-struk-pelunasan/${item.id}`)
                                }
                              >
                                Lunas
                              </Button>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>

                      {/* --- Aksi Edit/Delete --- */}
                      <TableCell align="center" sx={cellStyle}>
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          {canEdit && (
                            <IconButton
                              color="primary"
                              onClick={() => navigate(`/edit-detail-gadai/${item.id}`)}
                            >
                              <EditIcon />
                            </IconButton>
                          )}
                          {canDelete && (
                            <IconButton color="error" onClick={() => handleDelete(item.id)}>
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={15} align="center">
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
