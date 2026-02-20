import React, { useState, useEffect } from "react";
import {
  Card, Avatar, CircularProgress, Box, Typography, Stack, Grid, Paper, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Modal, TextField, MenuItem, Snackbar, Alert, InputAdornment
} from "@mui/material";
import {
  AccountBalanceWallet as WalletIcon, Add as AddIcon, Delete as DeleteIcon,
  Edit as EditIcon, Close as CloseIcon, Save as SaveIcon
} from "@mui/icons-material";

import axiosInstance from "api/axiosInstance"; 

const BULAN_NAMA = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const formatRp = (val) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val || 0);

const OperasionalPage = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [filterBulan, setFilterBulan] = useState(new Date().getMonth() + 1);
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear());
  
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [notif, setNotif] = useState({ open: false, msg: "", sev: "success" });

  const initialForm = {
    tanggal: new Date().toISOString().slice(0, 10),
    deskripsi: "",
    nominal: "",
    keterangan: ""
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => { 
    fetchList(); 
  }, [filterBulan, filterTahun]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/operasional?bulan=${filterBulan}&tahun=${filterTahun}`);
      setList(res.data.data || []);
    } catch (err) { 
      showNotif("Gagal mengambil data operasional", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  const showNotif = (msg, sev) => setNotif({ open: true, msg, sev });

  const handleSave = async () => {
    if (!form.deskripsi || !form.nominal) return showNotif("Lengkapi deskripsi dan nominal!", "warning");

    setSubmitLoading(true);
    try {
      if (editData) {
        await axiosInstance.put(`/operasional/${editData.id}`, form);
        showNotif("Data Operasional Diperbarui!", "success");
      } else {
        await axiosInstance.post(`/operasional`, form);
        showNotif("Data Operasional Berhasil Disimpan & Dilunasi!", "success");
      }
      setOpenModal(false);
      setEditData(null);
      setForm(initialForm);
      fetchList();
    } catch (err) {
      showNotif(err.response?.data?.message || "Gagal simpan data", "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus data pengeluaran ini secara permanen?")) return;
    try {
      await axiosInstance.delete(`/operasional/${id}`);
      showNotif("Data operasional dihapus", "success");
      fetchList();
    } catch (err) { showNotif("Gagal menghapus data", "error"); }
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" py={10}>
      <CircularProgress thickness={6} size={50} sx={{ color: '#004D40' }} />
    </Box>
  );

  return (
    <Box sx={{ p: 3, background: '#F0F4F4', minHeight: '100vh' }}>
      
      {/* HEADER */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: '#004D40', width: 52, height: 52, boxShadow: '0 4px 12px rgba(0,77,64,0.2)' }}><WalletIcon /></Avatar>
          <Box>
            <Typography variant="h4" fontWeight={900} color="#004D40">Kas Operasional</Typography>
            <Typography variant="body2" fontWeight={600} color="textSecondary">Monitoring Pengeluaran Harian & Rutin Toko</Typography>
          </Box>
        </Stack>

        <Button 
          onClick={() => { setEditData(null); setForm(initialForm); setOpenModal(true); }} 
          variant="contained" 
          startIcon={<AddIcon />} 
          sx={{ 
            borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 3, 
            background: 'linear-gradient(135deg, #004D40 0%, #00796B 100%)',
            '&:hover': { background: '#00332B' }
          }}
        >
          Input Pengeluaran
        </Button>
      </Stack>

      {/* STATS */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={8}>
            <Paper sx={{ p: 3, borderRadius: '24px', background: 'linear-gradient(135deg, #004D40 0%, #00796B 100%)', color: '#fff' }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.8, fontWeight: 700 }}>Total Pengeluaran ({BULAN_NAMA[filterBulan]} {filterTahun})</Typography>
              <Typography variant="h3" fontWeight={900} sx={{ mt: 1 }}>{formatRp(list.reduce((s, i) => s + parseFloat(i.nominal), 0))}</Typography>
            </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, borderRadius: '24px', background: '#FFF', border: '1px solid #B2DFDB', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="subtitle2" color="#00796B" sx={{ fontWeight: 700 }}>Jumlah Transaksi</Typography>
              <Typography variant="h4" fontWeight={900} color="#004D40" sx={{ mt: 1 }}>{list.length} Data</Typography>
            </Paper>
        </Grid>
      </Grid>

      {/* TABLE */}
      <Card sx={{ borderRadius: '24px', border: '1px solid #B2DFDB', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
         <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFF', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" fontWeight={800} color="#004D40">Riwayat Kas Keluar</Typography>
            <Stack direction="row" spacing={2}>
              <TextField select size="small" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} sx={{ width: 140 }}>
                 {BULAN_NAMA.slice(1).map((n, i) => <MenuItem key={i+1} value={i+1}>{n}</MenuItem>)}
              </TextField>
              <TextField select size="small" value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} sx={{ width: 110 }}>
                 {[2026, 2025, 2024].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </TextField>
            </Stack>
         </Box>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#E0F2F1' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: '#004D40' }}>TANGGAL</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#004D40' }}>ITEM PENGELUARAN</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#004D40' }}>NOMINAL</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#004D40' }}>AKSI</TableCell>
              </TableRow>
            </TableHead>
            <TableBody sx={{ background: '#FFF' }}>
              {list.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 10 }}>Tidak ada catatan pengeluaran di periode ini</TableCell></TableRow>
              ) : list.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} color="textSecondary">
                      {new Date(row.tanggal).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight={800}>{row.deskripsi}</Typography>
                    <Typography variant="caption" color="textSecondary">{row.keterangan || '-'}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" fontWeight={900} color="#004D40">{formatRp(row.nominal)}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton size="small" sx={{ color: '#00796B' }} onClick={() => { setEditData(row); setForm(row); setOpenModal(true); }}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" sx={{ color: '#D32F2F' }} onClick={() => handleDelete(row.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* MODAL INPUT */}
      <Modal open={openModal} onClose={() => !submitLoading && setOpenModal(false)}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: { xs: '95%', sm: '500px' }, bgcolor: '#FFF', borderRadius: '24px',
          boxShadow: 24, overflow: 'hidden'
        }}>
          <Box sx={{ p: 3, background: '#004D40', color: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={800}>{editData ? "Perbarui Pengeluaran" : "Input Pengeluaran Baru"}</Typography>
            <IconButton onClick={() => setOpenModal(false)} sx={{ color: '#FFF' }} disabled={submitLoading}><CloseIcon /></IconButton>
          </Box>

          <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField label="Tanggal" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.tanggal} onChange={(e) => setForm({...form, tanggal: e.target.value})} />
            <TextField label="Deskripsi / Item" placeholder="Contoh: Listrik" fullWidth value={form.deskripsi} onChange={(e) => setForm({...form, deskripsi: e.target.value})} />
            
            {/* INPUT NOMINAL DENGAN PREFIX RP */}
            <TextField 
              label="Nominal" 
              type="number" 
              fullWidth 
              value={form.nominal} 
              onChange={(e) => setForm({...form, nominal: e.target.value})} 
              InputProps={{
                startAdornment: <InputAdornment position="start"><Typography fontWeight={700} color="#004D40">Rp</Typography></InputAdornment>,
              }}
            />

            <TextField label="Keterangan" multiline rows={3} fullWidth value={form.keterangan} onChange={(e) => setForm({...form, keterangan: e.target.value})} />
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={() => setOpenModal(false)} disabled={submitLoading} sx={{ color: '#004D40', fontWeight: 700 }}>Batal</Button>
              <Button 
                variant="contained" 
                onClick={handleSave} 
                disabled={submitLoading} 
                sx={{ 
                  borderRadius: '12px', 
                  bgcolor: '#004D40', 
                  px: 4,
                  '&:hover': { bgcolor: '#00332B' } 
                }}
              >
                {submitLoading ? <CircularProgress size={24} color="inherit" /> : "Simpan & Lunasi"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>

      <Snackbar open={notif.open} autoHideDuration={4000} onClose={() => setNotif({ ...notif, open: false })}>
        <Alert severity={notif.sev} variant="filled" sx={{ borderRadius: '12px' }}>{notif.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default OperasionalPage;