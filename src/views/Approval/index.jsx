import React, { useEffect, useState, useContext } from "react";
import {
  Box, Card, Typography, Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, Stack, CircularProgress, Snackbar, Alert,
  Paper, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import axiosInstance from "api/axiosInstance";
import { AuthContext } from "AuthContex/AuthContext";
import { useNavigate } from "react-router-dom";

const ApprovalGadaiPage = () => {
  const { user } = useContext(AuthContext);
  const role = (user?.role || "").toLowerCase();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("semua");
  const [notif, setNotif] = useState({ open: false, message: "", type: "success" });

  const [openModal, setOpenModal] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [catatan, setCatatan] = useState("");

  // Pagination
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  // 🧭 Ambil endpoint sesuai role dan tab
  const getEndpoint = (status) => {
    let base = role === "hm" ? "hm/approvals" : "checker/approvals";

    switch (status) {
      case "approved":
        return `${base}/${role}/approved`;
      case "rejected":
        return `${base}/${role}/rejected`;
      case "selesai":
        return `${base}/selesai`;
      default:
        return `${base}`;
    }
  };

  const fetchData = async (status = "semua", page = 1) => {
    try {
      setLoading(true);
      const endpoint = getEndpoint(status);
      const res = await axiosInstance.get(endpoint, { params: { page } });

      if (res.data.success) {
        setData(res.data.data || []);
        setPagination(
          res.data.pagination || {
            current_page: 1,
            last_page: 1,
            per_page: 10,
            total: 0,
          }
        );
      }
    } catch (err) {
      console.error(err);
      setNotif({
        open: true,
        message: "Gagal memuat data approval",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(tab, pagination.current_page);
  }, [tab, role]);

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

  const handleOpenModal = (detailGadaiId, action) => {
    setCurrentAction({ id: detailGadaiId, action });
    setCatatan("");
    setOpenModal(true);
  };

  const handleCloseModal = () => setOpenModal(false);

  // ✅ Perbaikan disini — endpoint per role
  const handleApproval = async () => {
    if (!catatan.trim()) {
      setNotif({
        open: true,
        message: "Catatan wajib diisi!",
        type: "warning",
      });
      return;
    }

    const { id, action } = currentAction;
    const status =
      role === "checker"
        ? action === "approve"
          ? "approved_checker"
          : "rejected_checker"
        : action === "approve"
        ? "approved_hm"
        : "rejected_hm";

    try {
      // Endpoint sesuai role
      const endpoint =
        role === "checker"
          ? `/checker/approvals/${id}`
          : `/hm/approvals/${id}`;

      const res = await axiosInstance.post(endpoint, { status, catatan });

      if (res.data.success) {
        setNotif({
          open: true,
          message: res.data.message,
          type: "success",
        });

        // Update UI tanpa reload
        setData((prev) =>
          prev.map((item) => {
            if (item.id === id) {
              const newApprovals = item.approvals ? [...item.approvals] : [];
              const idx = newApprovals.findIndex((a) => a.role === role);
              if (idx >= 0) newApprovals[idx].status = status;
              else newApprovals.push({ role, status, catatan });

              return { ...item, approvals: newApprovals, status };
            }
            return item;
          })
        );
      } else {
        setNotif({
          open: true,
          message: res.data.message,
          type: "warning",
        });
      }
    } catch (err) {
      console.error(err);
      setNotif({
        open: true,
        message: "Gagal mengupdate status",
        type: "error",
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
        label={`${approved ? "Approved" : "Rejected"} by ${
          roleKey.charAt(0).toUpperCase() + roleKey.slice(1)
        }`}
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
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <Typography variant="h5" fontWeight="bold" mb={2}>
        ✳️ Approval Data Gadai
      </Typography>

      <Card sx={{ mb: 2, borderRadius: 2, boxShadow: 2 }}>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Semua" value="semua" />
          <Tab label="Approved" value="approved" />
          <Tab label="Rejected" value="rejected" />
          <Tab label="Selesai" value="selesai" />
        </Tabs>
      </Card>

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
                {tab === "selesai" && <TableCell>Status HM</TableCell>}
                <TableCell align="center">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length > 0 ? (
                data.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{
                      "&:hover": {
                        backgroundColor: "#f8fafc",
                        transition: "0.3s",
                      },
                    }}
                  >
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
                    {tab === "selesai" && (
                      <TableCell>{getChip(item.approvals, "hm")}</TableCell>
                    )}
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                        flexWrap="wrap"
                      >
                        <Tooltip title="Lihat Detail">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() =>
                              navigate(`/approval-gadai-detail/${item.id}`)
                            }
                            startIcon={<VisibilityIcon />}
                          >
                            Detail
                          </Button>
                        </Tooltip>

                        {tab === "semua" &&
                          !item.approvals?.some((a) => a.role === role) && (
                            <>
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                startIcon={<CheckCircleIcon />}
                                onClick={() =>
                                  handleOpenModal(item.id, "approve")
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<CancelIcon />}
                                onClick={() =>
                                  handleOpenModal(item.id, "reject")
                                }
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
                  <TableCell
                    colSpan={tab === "selesai" ? 9 : 8}
                    align="center"
                  >
                    <Typography color="text.secondary">
                      Tidak ada data.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination Buttons */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1, p: 2 }}>
          <Button
            variant="outlined"
            disabled={pagination.current_page === 1}
            onClick={() => handlePageChange(pagination.current_page - 1)}
          >
            Prev
          </Button>
          <Typography sx={{ display: "flex", alignItems: "center", px: 2 }}>
            Page {pagination.current_page} / {pagination.last_page}
          </Typography>
          <Button
            variant="outlined"
            disabled={pagination.current_page === pagination.last_page}
            onClick={() => handlePageChange(pagination.current_page + 1)}
          >
            Next
          </Button>
        </Box>
      </Card>

      {/* Modal Approval */}
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

      {/* Snackbar */}
      <Snackbar
        open={notif.open}
        autoHideDuration={3000}
        onClose={() => setNotif({ ...notif, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={notif.type}
          onClose={() => setNotif({ ...notif, open: false })}
          sx={{ width: "100%" }}
        >
          {notif.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ApprovalGadaiPage;
