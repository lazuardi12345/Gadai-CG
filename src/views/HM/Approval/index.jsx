import React, { useEffect, useState, useContext } from "react";
import {
  Box, Card, Typography, Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, Stack, CircularProgress, Paper, Tooltip,
  MenuItem, Select, FormControl, InputLabel, Snackbar, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import axiosInstance from "api/axiosInstance";
import { AuthContext } from "AuthContex/AuthContext";
import { useNavigate } from "react-router-dom";

const ApprovalHMPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("semua");
  const [notif, setNotif] = useState({ open: false, message: "", type: "success" });
  const [bulan, setBulan] = useState("");
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [openModal, setOpenModal] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [currentAction, setCurrentAction] = useState(null);

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  });

  // === FETCH DATA ===
  const fetchData = async (status = "semua", page = 1) => {
    try {
      setLoading(true);
      let endpoint = "/approvals";

      switch (status) {
        case "approved":
          endpoint = "/approvals/hm/approved";
          break;
        case "rejected":
          endpoint = "/approvals/hm/rejected";
          break;
        case "selesai":
          endpoint = "/approvals/finished/filter";
          break;
        default:
          endpoint = "/approvals";
      }

      let params = { page };

      if (status === "selesai") {
        if (!bulan || !tahun) {
          setNotif({
            open: true,
            message: "Silakan pilih bulan dan tahun.",
            type: "warning"
          });
          setLoading(false);
          return;
        }
        params.bulan = bulan;
        params.tahun = tahun;
      }

      const res = await axiosInstance.get(endpoint, { params });

      if (res.data.success) {
        let filteredData = res.data.data || [];

        // Tab Semua: tampilkan data checker yang sudah approve/reject tapi HM belum
        if (status === "semua") {
          filteredData = filteredData.filter((item) => {
            const checkerApprovedOrRejected = item.approvals?.some(
              (a) =>
                a.role === "checker" &&
                ["approved_checker", "rejected_checker"].includes(a.status)
            );
            const hmAlreadyActed = item.approvals?.some(
              (a) =>
                a.role === "hm" &&
                ["approved_hm", "rejected_hm"].includes(a.status)
            );
            return checkerApprovedOrRejected && !hmAlreadyActed;
          });
        }

        setData(filteredData);
        setPagination(
          res.data.pagination || {
            current_page: 1,
            last_page: 1,
            per_page: 10,
            total: 0
          }
        );
      }
    } catch (err) {
      console.error(err);
      setNotif({
        open: true,
        message: "Gagal memuat data approval",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(tab, 1);
  }, [tab]);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setPagination((prev) => ({ ...prev, current_page: 1 }));
    fetchData(newValue, 1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    setPagination((prev) => ({ ...prev, current_page: newPage }));
    fetchData(tab, newPage);
  };

  // === MODAL HANDLERS ===
  const handleOpenModal = (id, action) => {
    setCurrentAction({ id, action });
    setCatatan("");
    setOpenModal(true);
  };

  const handleCloseModal = () => setOpenModal(false);

  const handleApproval = async () => {
    if (!catatan.trim()) {
      setNotif({
        open: true,
        message: "Catatan wajib diisi!",
        type: "warning"
      });
      return;
    }

    const { id, action } = currentAction;
    const status = action === "approve" ? "approved_hm" : "rejected_hm";

    try {
      const res = await axiosInstance.post(`/approvals/${id}`, { status, catatan });
      if (res.data.success) {
        setNotif({ open: true, message: res.data.message, type: "success" });
        fetchData(tab, pagination.current_page);
      } else {
        setNotif({ open: true, message: res.data.message, type: "warning" });
      }
    } catch (err) {
      console.error(err);
      setNotif({
        open: true,
        message: "Gagal mengupdate status",
        type: "error"
      });
    } finally {
      setOpenModal(false);
    }
  };

  const getChip = (approvals, roleKey) => {
    const entry = approvals?.find((a) => a.role === roleKey);
    if (!entry)
      return <Chip label="Pending" color="warning" size="small" />;
    const approved = entry.status.includes("approved");
    return (
      <Chip
        label={`${approved ? "Approved" : "Rejected"} by ${roleKey.toUpperCase()}`}
        color={approved ? "success" : "error"}
        size="small"
      />
    );
  };

  const getStatusChip = (status) => {
    switch ((status || "").toLowerCase()) {
      case "proses":
        return <Chip label="Proses" color="warning" size="small" />;
      case "selesai":
        return <Chip label="Selesai" color="primary" size="small" />;
      case "lunas":
        return <Chip label="Lunas" color="secondary" size="small" />;
      default:
        return <Chip label={status || "-"} color="default" size="small" />;
    }
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Approval Data Gadai (HM)
      </Typography>

      <Card sx={{ mb: 2, borderRadius: 2, boxShadow: 2 }}>
        <Tabs value={tab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Semua" value="semua" />
          <Tab label="Approved" value="approved" />
          <Tab label="Rejected" value="rejected" />
          <Tab label="Selesai" value="selesai" />
        </Tabs>
      </Card>

      {tab === "selesai" && (
        <Stack direction="row" spacing={2} mb={2}>
          <FormControl size="small">
            <InputLabel>Bulan</InputLabel>
            <Select value={bulan} onChange={(e) => setBulan(e.target.value)} label="Bulan">
              {[...Array(12)].map((_, i) => (
                <MenuItem key={i + 1} value={i + 1}>
                  {i + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Tahun</InputLabel>
            <Select value={tahun} onChange={(e) => setTahun(e.target.value)} label="Tahun">
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={() => fetchData("selesai", 1)}>
            Filter
          </Button>
        </Stack>
      )}

      <Card sx={{ borderRadius: 3, boxShadow: 4, overflowX: "auto" }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: "#f1f5f9" }}>
              <TableRow>
                <TableCell>No Gadai</TableCell>
                <TableCell>Nama Nasabah</TableCell>
                <TableCell>Jenis Barang</TableCell>
                <TableCell>Taksiran</TableCell>
                <TableCell>Pinjaman</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Status Checker</TableCell>
                {tab !== "semua" && <TableCell>Status HM</TableCell>}
                <TableCell align="center">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length > 0 ? (
                data.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.no_gadai}</TableCell>
                    <TableCell>{item.nasabah?.nama_lengkap || "-"}</TableCell>
                    <TableCell>{item.type?.nama_type || "-"}</TableCell>
                    <TableCell>
                      Rp {Number(item.taksiran || 0).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>
                      Rp {Number(item.uang_pinjaman || 0).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>{getStatusChip(item.status)}</TableCell>
                    <TableCell>{getChip(item.approvals, "checker")}</TableCell>
                    {tab !== "semua" && <TableCell>{getChip(item.approvals, "hm")}</TableCell>}
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Lihat Detail">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => navigate(`/approval-hm-gadai-detail/${item.id}`)}
                          >
                            Detail
                          </Button>
                        </Tooltip>

                        {/* tombol edit hanya muncul di tab SEMUA dan role HM */}
                        {tab === "semua" && user?.role === "hm" && (
                          <Tooltip title="Edit Data">
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={() => navigate(`/approval-hm-gadai-edit/${item.id}`)}
                            >
                              Edit
                            </Button>
                          </Tooltip>
                        )}

                        {/* tombol approve/reject hanya muncul di tab SEMUA dan role HM */}
                        {tab === "semua" && user?.role === "hm" && (
                          <>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleOpenModal(item.id, "approve")}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<CancelIcon />}
                              onClick={() => handleOpenModal(item.id, "reject")}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography color="text.secondary">Tidak ada data.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* MODAL */}
      <Dialog open={openModal} onClose={handleCloseModal}>
        <DialogTitle>
          {currentAction?.action === "approve" ? "Approve" : "Reject"} Gadai
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Catatan"
            fullWidth
            multiline
            rows={3}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Batal</Button>
          <Button variant="contained" onClick={handleApproval}>
            {currentAction?.action === "approve" ? "Approve" : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar
        open={notif.open}
        autoHideDuration={3000}
        onClose={() => setNotif({ ...notif, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={notif.type}>{notif.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ApprovalHMPage;
