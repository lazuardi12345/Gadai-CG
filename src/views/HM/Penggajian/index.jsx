import React, { useState, useEffect } from "react";
import {
  Card, Avatar, CircularProgress, Box, Typography, Stack, Grid, Paper, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Modal, TextField, MenuItem, Snackbar, Alert, InputAdornment
} from "@mui/material";
import {
  Payments as GajiIcon, Add as AddIcon, Delete as DeleteIcon,
  Close as CloseIcon, Save as SaveIcon
} from "@mui/icons-material";

import axiosInstance from "api/axiosInstance"; 

const BULAN_NAMA = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const formatRp = (val) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val || 0);

const PenggajianPage = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear());
  
  const [openModal, setOpenModal] = useState(false);
  const [notif, setNotif] = useState({ open: false, msg: "", sev: "success" });

  const initialForm = {
    bulan: new Date().getMonth() + 1,
    tahun: new Date().getFullYear(),
    jumlah_karyawan: "",
    total_gaji: "",
    keterangan: ""
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => { 
    fetchList(); 
  }, [filterTahun]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/penggajian?tahun=${filterTahun}`);
      setList(res.data.data || []);
    } catch (err) { 
      showNotif("Gagal mengambil data payroll", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  const showNotif = (msg, sev) => setNotif({ open: true, msg, sev });

  const handleSave = async () => {
    if (!formData.jumlah_karyawan || !formData.total_gaji) {
        return showNotif("Jumlah karyawan dan total gaji wajib diisi!", "warning");
    }

    setSubmitLoading(true);
    try {
      // POST data global langsung ke model Penggajian
      await axiosInstance.post(`/penggajian`, formData);
      showNotif("Data Penggajian Berhasil Dicatat!", "success");
      setOpenModal(false);
      setFormData(initialForm);
      fetchList();
    } catch (err) {
      showNotif(err.response?.data?.message || "Gagal simpan data", "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus rekapan payroll bulan ini?")) return;
    try {
      await axiosInstance.delete(`/penggajian/${id}`);
      showNotif("Data payroll dihapus", "success");
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
          <Avatar sx={{ bgcolor: '#004D40', width: 52, height: 52, boxShadow: '0 4px 12px rgba(0,77,64,0.2)' }}><GajiIcon /></Avatar>
          <Box>
            <Typography variant="h4" fontWeight={900} color="#004D40">Laporan Penggajian</Typography>
            <Typography variant="body2" fontWeight={600} color="textSecondary">Rekapan Pengeluaran Gaji Bulanan (Global)</Typography>
          </Box>
        </Stack>

        <Button 
          onClick={() => setOpenModal(true)} 
          variant="contained" 
          startIcon={<AddIcon />} 
          sx={{ 
            borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 3, 
            background: 'linear-gradient(135deg, #004D40 0%, #00796B 100%)',
            '&:hover': { background: '#00332B' }
          }}
        >
          Input Payroll Global
        </Button>
      </Stack>

      {/* TABLE */}
      <Card sx={{ borderRadius: '24px', border: '1px solid #B2DFDB', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
         <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFF' }}>
            <Typography variant="h6" fontWeight={800} color="#004D40">Riwayat Payroll {filterTahun}</Typography>
            <TextField select size="small" value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} sx={{ width: 120 }}>
               {[2026, 2025, 2024].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </TextField>
         </Box>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#E0F2F1' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: '#004D40' }}>PERIODE</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#004D40' }}>JUMLAH KARYAWAN</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#004D40' }}>TOTAL PENGELUARAN</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#004D40' }}>KETERANGAN</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#004D40' }}>AKSI</TableCell>
              </TableRow>
            </TableHead>
            <TableBody sx={{ background: '#FFF' }}>
              {list.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 10 }}>Tidak ada data payroll tahun {filterTahun}</TableCell></TableRow>
              ) : list.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body1" fontWeight={800}>{row.nama_bulan} {row.tahun}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body1" fontWeight={700}>{row.jumlah_karyawan} Orang</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" fontWeight={900} color="#004D40">{formatRp(row.total_gaji)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">{row.keterangan || '-'}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" sx={{ color: '#D32F2F' }} onClick={() => handleDelete(row.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* MODAL INPUT GLOBAL */}
      <Modal open={openModal} onClose={() => !submitLoading && setOpenModal(false)}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: { xs: '95%', sm: '450px' }, bgcolor: '#FFF', borderRadius: '24px',
          boxShadow: 24, overflow: 'hidden'
        }}>
          <Box sx={{ p: 3, background: '#004D40', color: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={800}>Catat Payroll Global</Typography>
            <IconButton onClick={() => setOpenModal(false)} sx={{ color: '#FFF' }} disabled={submitLoading}><CloseIcon /></IconButton>
          </Box>

          <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Grid container spacing={2}>
                <Grid item xs={7}>
                    <TextField select fullWidth label="Bulan" value={formData.bulan} onChange={(e) => setFormData({...formData, bulan: e.target.value})}>
                        {BULAN_NAMA.slice(1).map((n, i) => <MenuItem key={i+1} value={i+1}>{n}</MenuItem>)}
                    </TextField>
                </Grid>
                <Grid item xs={5}>
                    <TextField fullWidth label="Tahun" type="number" value={formData.tahun} onChange={(e) => setFormData({...formData, tahun: e.target.value})} />
                </Grid>
            </Grid>

            <TextField 
                label="Jumlah Karyawan" 
                type="number" 
                fullWidth 
                placeholder="Misal: 10"
                value={formData.jumlah_karyawan} 
                onChange={(e) => setFormData({...formData, jumlah_karyawan: e.target.value})} 
            />

            <TextField 
                label="Total Gaji Seluruhnya" 
                type="number" 
                fullWidth 
                value={formData.total_gaji} 
                onChange={(e) => setFormData({...formData, total_gaji: e.target.value})} 
                InputProps={{
                    startAdornment: <InputAdornment position="start"><Typography fontWeight={700} color="#004D40">Rp</Typography></InputAdornment>,
                }}
            />

            <TextField 
                label="Keterangan (Opsional)" 
                multiline rows={2} 
                fullWidth 
                placeholder="Catatan tambahan..."
                value={formData.keterangan} 
                onChange={(e) => setFormData({...formData, keterangan: e.target.value})} 
            />

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={() => setOpenModal(false)} disabled={submitLoading} sx={{ color: '#004D40', fontWeight: 700 }}>Batal</Button>
              <Button 
                variant="contained" 
                onClick={handleSave} 
                disabled={submitLoading} 
                startIcon={submitLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                sx={{ borderRadius: '12px', bgcolor: '#004D40', px: 4, '&:hover': { bgcolor: '#00332B' } }}
              >
                Simpan & Lunasi
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

export default PenggajianPage;