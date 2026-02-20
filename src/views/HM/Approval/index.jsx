import React, { useEffect, useState, useCallback } from "react";
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Stack, CircularProgress, Tooltip,
  Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Avatar, IconButton, useMediaQuery, useTheme
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  AccountCircle as AccountIcon,
  History as HistoryIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon
} from "@mui/icons-material";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

const formatRp = (val) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val || 0);

const ApprovalHMPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md")); // Deteksi layar HP/Tablet

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState({ open: false, message: "", type: "success" });
  const [openModal, setOpenModal] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [currentAction, setCurrentAction] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/approvals");
      if (res.data.payload && !res.data.payload.error) {
        setData(res.data.payload.data.items || []);
      }
    } catch (err) {
      setNotif({ open: true, message: "Gagal ambil antrian", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApproval = async () => {
    if (!catatan.trim()) return setNotif({ open: true, message: "Catatan wajib diisi!", type: "warning" });
    try {
      const { id, action } = currentAction;
      await axiosInstance.post(`/approvals/${id}`, { 
        status: action === "approve" ? "approved_hm" : "rejected_hm", 
        catatan 
      });
      setNotif({ open: true, message: "Berhasil diproses", type: "success" });
      fetchData();
    } catch (err) {
      setNotif({ open: true, message: "Gagal proses approval", type: "error" });
    } finally {
      setOpenModal(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: "#F4F7F7", minHeight: "100vh" }}>
      {/* Header Responsif */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }} 
        spacing={2} 
        mb={4}
      >
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight={900} color="#004D40">Antrian Approval</Typography>
          <Typography variant="body2" color="textSecondary">Head Manager Dashboard</Typography>
        </Box>
        <Button 
          fullWidth={isMobile}
          variant="contained" 
          startIcon={<HistoryIcon />} 
          onClick={() => navigate('/approval-history-hm')}
          sx={{ bgcolor: '#004D40', borderRadius: '10px', px: 3, py: isMobile ? 1.5 : 1 }}
        >
          Lihat History
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress color="success" /></Box>
      ) : data.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: '20px' }}><Typography color="textSecondary">Tidak ada antrian</Typography></Card>
      ) : (
        <>
          {/* TAMPILAN DESKTOP (TABLE) */}
          {!isMobile && (
            <Card sx={{ borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.05)', border: '1px solid #E0EED2' }}>
              <TableContainer>
                <Table sx={{ minWidth: 1000 }}>
                  <TableHead sx={{ bgcolor: '#F8FAF8' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: '#004D40' }}>NASABAH</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#004D40' }}>UNIT</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#004D40' }}>TAKSIRAN</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#004D40' }}>PINJAMAN</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, color: '#004D40' }}>AKSI</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ bgcolor: '#E8F5E9', color: '#2E7D32' }}><AccountIcon /></Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={800} color="#000">{item.nama_nasabah}</Typography>
                              <Typography variant="caption" color="textSecondary">{item.no_gadai}</Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} color="#000">{item.jenis_barang}</Typography>
                          <Typography variant="caption" color="textSecondary">{item.detail_barang}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={900} sx={{ color: '#000' }}>{formatRp(item.taksiran)}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" fontWeight={900} sx={{ color: '#000' }}>{formatRp(item.uang_pinjaman)}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <IconButton onClick={() => navigate(`/approval-hm-gadai-detail/${item.id}`)} sx={{ color: '#000', border: '1px solid #000', borderRadius: '8px' }}><VisibilityIcon fontSize="small" /></IconButton>
                            <IconButton onClick={() => navigate(`/approval-hm-gadai-edit/${item.id}`)} sx={{ color: '#000', border: '1px solid #000', borderRadius: '8px' }}><EditIcon fontSize="small" /></IconButton>
                            <Button size="small" variant="contained" color="success" onClick={() => { setCurrentAction({id: item.id, action: 'approve'}); setCatatan(""); setOpenModal(true); }} sx={{ borderRadius: '8px', fontWeight: 700 }}>Approve</Button>
                            <Button size="small" variant="contained" color="error" onClick={() => { setCurrentAction({id: item.id, action: 'reject'}); setCatatan(""); setOpenModal(true); }} sx={{ borderRadius: '8px', fontWeight: 700 }}>Reject</Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}

          {/* TAMPILAN MOBILE (CARDS) */}
          {isMobile && (
            <Stack spacing={2}>
              {data.map((item) => (
                <Card key={item.id} sx={{ p: 2, borderRadius: '16px', border: '1px solid #E0EED2' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: '#E8F5E9', color: '#2E7D32' }}><AccountIcon /></Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={900} color="#000">{item.nama_nasabah}</Typography>
                        <Typography variant="caption" color="textSecondary">{item.no_gadai}</Typography>
                      </Box>
                    </Stack>
                  </Stack>
                  
                  <Box sx={{ bgcolor: '#F8FAF8', p: 1.5, borderRadius: '10px', mb: 2 }}>
                    <Typography variant="caption" color="textSecondary">Unit: <b>{item.jenis_barang} ({item.detail_barang})</b></Typography>
                    <Stack direction="row" justifyContent="space-between" mt={1}>
                      <Typography variant="body2">Taksiran:</Typography>
                      <Typography variant="body2" fontWeight={900} color="#000">{formatRp(item.taksiran)}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Pinjaman:</Typography>
                      <Typography variant="body2" fontWeight={900} color="#000">{formatRp(item.uang_pinjaman)}</Typography>
                    </Stack>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <Button fullWidth variant="outlined" size="small" onClick={() => navigate(`/approval-hm-gadai-detail/${item.id}`)} sx={{ color: '#000', borderColor: '#000' }}>Detail</Button>
                    <Button fullWidth variant="outlined" size="small" onClick={() => navigate(`/approval-hm-gadai-edit/${item.id}`)} sx={{ color: '#000', borderColor: '#000' }}>Edit</Button>
                  </Stack>
                  <Stack direction="row" spacing={1} mt={1}>
                    <Button fullWidth variant="contained" color="success" size="small" onClick={() => { setCurrentAction({id: item.id, action: 'approve'}); setCatatan(""); setOpenModal(true); }}>Approve</Button>
                    <Button fullWidth variant="contained" color="error" size="small" onClick={() => { setCurrentAction({id: item.id, action: 'reject'}); setCatatan(""); setOpenModal(true); }}>Reject</Button>
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </>
      )}

      {/* Modal & Snackbar tetap sama */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>{currentAction?.action === 'approve' ? 'Approve' : 'Reject'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={3} autoFocus placeholder="Catatan HM..." value={catatan} onChange={(e) => setCatatan(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)} color="inherit">Batal</Button>
          <Button variant="contained" color={currentAction?.action === 'approve' ? 'success' : 'error'} onClick={handleApproval}>Simpan</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={notif.open} autoHideDuration={3000} onClose={() => setNotif({ ...notif, open: false })}>
        <Alert severity={notif.type} variant="filled" sx={{ width: '100%' }}>{notif.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ApprovalHMPage;