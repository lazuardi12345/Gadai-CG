import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  Box, Card, Typography, Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, Stack, CircularProgress, Snackbar, Alert,
  Paper, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  useTheme, useMediaQuery, Divider, Avatar, Grid, IconButton
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  AccountCircle as AccountCircleIcon
} from "@mui/icons-material";
import axiosInstance from "api/axiosInstance";
import { AuthContext } from "AuthContex/AuthContext";
import { useNavigate } from "react-router-dom";

const ApprovalGadaiPage = () => {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const role = (user?.role || "").toLowerCase();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("semua");
  const [notif, setNotif] = useState({ open: false, message: "", type: "success" });

  const [openModal, setOpenModal] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [catatan, setCatatan] = useState("");

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const getEndpoint = useCallback((status) => {
    let base = role === "hm" ? "hm/approvals" : "checker/approvals";
    switch (status) {
      case "approved": return `${base}/${role}/approved`;
      case "rejected": return `${base}/${role}/rejected`;
      case "selesai": return `${base}/selesai`;
      default: return `${base}`;
    }
  }, [role]);

  const fetchData = useCallback(async (status = "semua", page = 1) => {
    try {
      setLoading(true);
      const endpoint = getEndpoint(status);
      const res = await axiosInstance.get(endpoint, { params: { page } });
      if (res.data.success) {
        setData(res.data.data || []);
        setPagination(res.data.pagination || { current_page: 1, last_page: 1, per_page: 10, total: 0 });
      }
    } catch (err) {
      setNotif({ open: true, message: "Gagal memuat data", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [getEndpoint]);

  useEffect(() => {
    fetchData(tab, pagination.current_page);
  }, [tab, role, fetchData]);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setPagination((prev) => ({ ...prev, current_page: 1 }));
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

  const handleApproval = async () => {
    if (!catatan.trim()) {
      setNotif({ open: true, message: "Catatan wajib diisi!", type: "warning" });
      return;
    }
    const { id, action } = currentAction;
    const status = role === "checker" 
      ? (action === "approve" ? "approved_checker" : "rejected_checker")
      : (action === "approve" ? "approved_hm" : "rejected_hm");

    try {
      const endpoint = role === "checker" ? `/checker/approvals/${id}` : `/hm/approvals/${id}`;
      const res = await axiosInstance.post(endpoint, { status, catatan });

      if (res.data.success) {
        setNotif({ open: true, message: res.data.message, type: "success" });
        fetchData(tab, pagination.current_page);
      }
    } catch (err) {
      setNotif({ open: true, message: "Gagal update status", type: "error" });
    } finally {
      setOpenModal(false);
    }
  };

  const getStatusChip = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "proses") return <Chip label="Proses" color="warning" size="small" variant="outlined" />;
    if (s === "selesai") return <Chip label="Selesai" color="primary" size="small" />;
    if (s === "lunas") return <Chip label="Lunas" color="success" size="small" />;
    return <Chip label={status || "-"} size="small" />;
  };

  const ApprovalBadge = ({ approvals, roleKey }) => {
    const entry = approvals?.find((a) => a.role === roleKey);
    if (!entry) return <Chip label={`${roleKey}: Pending`} size="small" sx={{ opacity: 0.6 }} />;
    const isApp = entry.status.includes("approved");
    return (
      <Chip 
        label={`${roleKey.toUpperCase()}: ${isApp ? 'OK' : 'X'}`} 
        color={isApp ? "success" : "error"} 
        size="small" 
      />
    );
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">Approval Gadai</Typography>
        <Chip label={role.toUpperCase()} color="primary" size="small" variant="outlined" />
      </Stack>

      <Card sx={{ mb: 2, borderRadius: 2 }}>
        <Tabs value={tab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          {["semua", "approved", "rejected", "selesai"].map((t) => (
            <Tab key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} value={t} />
          ))}
        </Tabs>
      </Card>

      {loading ? (
        <Box textAlign="center" py={10}><CircularProgress /></Box>
      ) : (
        <>
          {isMobile ? (
            /* --- MOBILE VIEW: CARDS --- */
            <Stack spacing={2}>
              {data.map((item) => (
                <Card key={item.id} sx={{ borderRadius: 2, borderLeft: `5px solid ${theme.palette.primary.main}` }}>
                  <Box sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">{item.no_gadai}</Typography>
                        <Typography variant="subtitle1" fontWeight="bold">{item.nasabah?.nama_lengkap}</Typography>
                      </Box>
                      {getStatusChip(item.status)}
                    </Stack>
                    
                    <Stack direction="row" spacing={1} mb={2}>
                      <ApprovalBadge approvals={item.approvals} roleKey="checker" />
                      <ApprovalBadge approvals={item.approvals} roleKey="hm" />
                    </Stack>

                    <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                    
                    <Grid container spacing={1} sx={{ my: 1 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Barang</Typography>
                        <Typography variant="body2" fontWeight="500">{item.type?.nama_type}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Pinjaman</Typography>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          Rp {Number(item.uang_pinjaman).toLocaleString("id-ID")}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Stack direction="row" spacing={1} mt={2}>
                      <Button fullWidth variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={() => navigate(`/approval-gadai-detail/${item.id}`)}>Detail</Button>
                      {tab === "semua" && !item.approvals?.some((a) => a.role === role) && (
                        <Button variant="contained" color="success" size="small" onClick={() => handleOpenModal(item.id, "approve")}><CheckCircleIcon fontSize="small" /></Button>
                      )}
                      {tab === "semua" && !item.approvals?.some((a) => a.role === role) && (
                        <Button variant="contained" color="error" size="small" onClick={() => handleOpenModal(item.id, "reject")}><CancelIcon fontSize="small" /></Button>
                      )}
                    </Stack>
                  </Box>
                </Card>
              ))}
            </Stack>
          ) : (
            /* --- DESKTOP VIEW: TABLE --- */
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: "#f1f5f9" }}>
                  <TableRow>
                    <TableCell>No Gadai</TableCell>
                    <TableCell>Nasabah</TableCell>
                    <TableCell>Pinjaman</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Checker</TableCell>
                    <TableCell>HM</TableCell>
                    <TableCell align="center">Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ fontWeight: 'bold' }}>{item.no_gadai}</TableCell>
                      <TableCell>{item.nasabah?.nama_lengkap}</TableCell>
                      <TableCell>Rp {Number(item.uang_pinjaman).toLocaleString("id-ID")}</TableCell>
                      <TableCell>{getStatusChip(item.status)}</TableCell>
                      <TableCell><ApprovalBadge approvals={item.approvals} roleKey="checker" /></TableCell>
                      <TableCell><ApprovalBadge approvals={item.approvals} roleKey="hm" /></TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <IconButton size="small" color="primary" onClick={() => navigate(`/approval-gadai-detail/${item.id}`)}><VisibilityIcon /></IconButton>
                          {tab === "semua" && !item.approvals?.some((a) => a.role === role) && (
                            <>
                              <IconButton size="small" color="success" onClick={() => handleOpenModal(item.id, "approve")}><CheckCircleIcon /></IconButton>
                              <IconButton size="small" color="error" onClick={() => handleOpenModal(item.id, "reject")}><CancelIcon /></IconButton>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {data.length === 0 && (
            <Box textAlign="center" py={5} bgcolor="#fff" mt={2} borderRadius={2}>
              <Typography color="text.secondary">Data tidak tersedia</Typography>
            </Box>
          )}

          {/* Pagination */}
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} sx={{ mt: 3, pb: 4 }}>
            <Button variant="outlined" size="small" disabled={pagination.current_page === 1} onClick={() => handlePageChange(pagination.current_page - 1)}>Prev</Button>
            <Typography variant="caption">Hal {pagination.current_page} / {pagination.last_page}</Typography>
            <Button variant="outlined" size="small" disabled={pagination.current_page === pagination.last_page} onClick={() => handlePageChange(pagination.current_page + 1)}>Next</Button>
          </Stack>
        </>
      )}

      {/* Modal & Snackbar tetap sama */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold' }}>{currentAction?.action === "approve" ? "Konfirmasi Setuju" : "Konfirmasi Tolak"}</DialogTitle>
        <DialogContent dividers>
          <TextField autoFocus margin="dense" label="Alasan / Catatan" fullWidth multiline rows={3} value={catatan} onChange={(e) => setCatatan(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)} color="inherit">Batal</Button>
          <Button variant="contained" color={currentAction?.action === "approve" ? "success" : "error"} onClick={handleApproval}>Eksekusi</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={notif.open} autoHideDuration={3000} onClose={() => setNotif({ ...notif, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={notif.type} variant="filled" sx={{ width: "100%" }}>{notif.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ApprovalGadaiPage;