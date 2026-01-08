import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  Grid, Card, CardContent, Typography, TextField, Button, MenuItem, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Pagination, Box, Stack, Divider, Alert, CircularProgress, 
  InputAdornment, Avatar, Dialog, Zoom, Chip, IconButton, Tooltip, Paper
} from '@mui/material';
import { 
  AccountBalanceWallet, HistoryEdu, CloudUpload, TrendingUp, 
  AccountBalance, Close, Visibility, FilterList, AddBox, 
  ReceiptLong, CheckCircle, TrendingDown
} from '@mui/icons-material';
import axiosInstance from 'api/axiosInstance';
import { AuthContext } from "AuthContex/AuthContext"; 
import { gridSpacing } from 'config.js';

const KasManagement = () => {
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();
  const isAuthorized = userRole === 'admin' || userRole === 'hm';

  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [summary, setSummary] = useState({ 
    saldo_toko_saat_ini: 0, saldo_rekening_saat_ini: 0,
    total_modal_dari_pusat: 0, total_setoran_ke_admin: 0, total_setoran_pending: 0 
  });
  const [riwayat, setRiwayat] = useState([]);
  const [totals, setTotals] = useState({ pemasukan_keseluruhan: 0, pengeluaran_keseluruhan: 0, saldo_netto: 0 });
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [previewImg, setPreviewImg] = useState(null);
  const [openValidasi, setOpenValidasi] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [validasiData, setValidasiData] = useState({ deskripsi_validasi: '', bukti_mutasi: null });

  const today = new Date().toISOString().split('T')[0];
  const [filters, setFilters] = useState({ start_date: today, end_date: today });
  const [formData, setFormData] = useState({ kategori: 'topup_pusat', metode: 'cash', nominal: '', deskripsi: '', tipe_operasional: 'masuk', bukti_transaksi: null });
  const [displayNominal, setDisplayNominal] = useState('');

  const getApiUrl = (resource) => (userRole === "admin" ? `/admin/${resource}` : `/${resource}`);

  const fetchSummary = async () => {
    try {
      const res = await axiosInstance.get(getApiUrl("dashboard/brankas-stats"));
      if (res.data.success) setSummary(res.data.summary);
    } catch (err) { console.error(err); }
  };

const fetchRiwayat = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(getApiUrl("brankas/riwayat"), { 
        params: { page, start_date: filters.start_date, end_date: filters.end_date } 
      });
      console.log("DATA DARI API:", res.data.riwayat); 
      if (res.data.success) {
        setRiwayat(res.data.riwayat);
        setPagination(res.data.pagination);
        setTotals(res.data.grand_total); 
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
}, [filters, userRole]);

  useEffect(() => { if (isAuthorized) { fetchSummary(); fetchRiwayat(); } }, [fetchRiwayat, isAuthorized]);

  const handleNominalChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); 
    setFormData({ ...formData, nominal: value });
    setDisplayNominal(value ? new Intl.NumberFormat('id-ID').format(value) : '');
  };

  const handleFinalSubmit = async () => {
    setBtnLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    try {
      await axiosInstance.post(getApiUrl("brankas/transaksi"), data);
      setStatusMsg({ type: 'success', text: 'Berhasil!' });
      setFormData({ ...formData, nominal: '', deskripsi: '', bukti_transaksi: null });
      setDisplayNominal('');
      fetchSummary(); fetchRiwayat(1);
    } catch (err) { setStatusMsg({ type: 'error', text: 'Gagal!' }); }
    finally { setBtnLoading(false); }
  };

const handleValidasiSubmit = async () => {
    // Validasi sederhana di frontend
    if (!validasiData.deskripsi_validasi || !validasiData.bukti_mutasi) {
      alert("Catatan dan Bukti Mutasi wajib diisi!");
      return;
    }

    setBtnLoading(true);
    
    // Bikin FormData
    const data = new FormData();
    data.append('deskripsi_validasi', validasiData.deskripsi_validasi);
    data.append('bukti_mutasi', validasiData.bukti_mutasi); 

    try {
      // WAJIB tambahin header multipart/form-data
      const res = await axiosInstance.post(getApiUrl(`brankas/validasi/${selectedId}`), data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setOpenValidasi(false);
        setValidasiData({ deskripsi_validasi: '', bukti_mutasi: null }); 
        fetchSummary(); 
        fetchRiwayat();
        alert("Status berhasil diubah jadi LUNAS!");
      }
    } catch (err) {
      console.error("Error Detail:", err.response?.data);
      alert("Gagal: " + (err.response?.data?.message || "Terjadi kesalahan pada server"));
    } finally {
      setBtnLoading(false);
    }
};

  const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  return (
    <Grid container spacing={gridSpacing}>
      {/* 1. TOP SUMMARY */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          {[
            { label: 'SALDO TUNAI', val: summary.saldo_toko_saat_ini, color: '#1e3c72', icon: <AccountBalanceWallet /> },
            { label: 'SALDO BANK', val: summary.saldo_rekening_saat_ini, color: '#0e7490', icon: <AccountBalance /> },
            { label: 'SETORAN LUNAS', val: summary.total_setoran_ke_admin, color: '#2e7d32', icon: <CheckCircle /> },
            { label: 'SETORAN PENDING', val: summary.total_setoran_pending, color: '#ef6c00', icon: <HistoryEdu /> }
          ].map((card, i) => (
            <Grid item lg={3} sm={6} xs={12} key={i}>
              <Card sx={{ bgcolor: card.color, color: '#fff', borderRadius: '12px' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>{card.label}</Typography>
                        <Typography variant="h4" fontWeight={800}>{formatRupiah(card.val)}</Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>{card.icon}</Avatar>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>

      {/* 2. REKAP PERIODE BERDASARKAN FILTER */}
      <Grid item xs={12}>
        <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', border: '1px solid #e0e0e0', bgcolor: '#fff' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} divider={<Divider orientation="vertical" flexItem />}>
            <Box>
              <Typography variant="caption" color="textSecondary" fontWeight={700}>TOTAL PEMASUKAN PERIODE</Typography>
              <Typography variant="h4" color="success.main" fontWeight={800}>{formatRupiah(totals.pemasukan_keseluruhan)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary" fontWeight={700}>TOTAL PENGELUARAN PERIODE</Typography>
              <Typography variant="h4" color="error.main" fontWeight={800}>{formatRupiah(totals.pengeluaran_keseluruhan)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary" fontWeight={700}>SALDO NETTO PERIODE</Typography>
              <Typography variant="h4" color="primary.main" fontWeight={800}>{formatRupiah(totals.saldo_netto)}</Typography>
            </Box>
          </Stack>
        </Paper>
      </Grid>

      {/* 3. FORM & TABLE */}
      <Grid item lg={4} xs={12}>
        <Card sx={{ borderRadius: '12px' }}>
          <Box sx={{ p: 2, bgcolor: '#f8f9fa' }}><Typography variant="h5" fontWeight={800}>Input Transaksi</Typography></Box>
          <CardContent>
            <Stack spacing={2}>
              <TextField select label="Kategori" fullWidth value={formData.kategori} onChange={(e) => setFormData({...formData, kategori: e.target.value})}>
                <MenuItem value="topup_pusat">Modal Pusat</MenuItem>
                <MenuItem value="operasional_toko">Operasional</MenuItem>
                <MenuItem value="setor_ke_admin">Setor ke Admin</MenuItem>
              </TextField>
              <TextField select label="Metode" fullWidth value={formData.metode} onChange={(e) => setFormData({...formData, metode: e.target.value})}>
                <MenuItem value="cash">Tunai</MenuItem>
                <MenuItem value="transfer">Transfer</MenuItem>
              </TextField>
              <TextField label="Nominal" fullWidth value={displayNominal} onChange={handleNominalChange} />
              <TextField label="Deskripsi" multiline rows={2} fullWidth value={formData.deskripsi} onChange={(e) => setFormData({...formData, deskripsi: e.target.value})} />
              <Button fullWidth variant="contained" onClick={handleFinalSubmit} disabled={btnLoading}>PROSES</Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item lg={8} xs={12}>
        <Card sx={{ borderRadius: '12px' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight={800}>Riwayat Mutasi</Typography>
            <Stack direction="row" spacing={1}>
                <TextField type="date" size="small" value={filters.start_date} onChange={(e) => setFilters({...filters, start_date: e.target.value})} />
                <TextField type="date" size="small" value={filters.end_date} onChange={(e) => setFilters({...filters, end_date: e.target.value})} />
                <Button variant="contained" onClick={() => fetchRiwayat(1)}><FilterList /></Button>
            </Stack>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f4f6f8' }}>
                <TableRow>
                  <TableCell>DETAIL TRANSAKSI</TableCell>
                  <TableCell align="right">NOMINAL</TableCell>
                  <TableCell align="center">BUKTI</TableCell>
                  <TableCell align="center">STATUS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
  <TableRow>
    <TableCell colSpan={4} align="center">
      <CircularProgress size={24} />
    </TableCell>
  </TableRow>
) : (
  riwayat.map((row, i) => (
    <TableRow key={i} hover>
      <TableCell>
        <Typography variant="caption" color="textSecondary">{row.waktu}</Typography>
        <Typography variant="body2" fontWeight={700}>{row.deskripsi}</Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
          <Chip label={row.kategori.replace('_', ' ')} size="small" sx={{ height: 18, fontSize: '0.65rem', textTransform: 'capitalize' }} />
          <Typography variant="caption" sx={{ bgcolor: '#eee', px: 0.8, borderRadius: 1 }}>{row.metode}</Typography>
        </Stack>
      </TableCell>
      
      <TableCell align="right">
        <Typography variant="body2" color={row.pemasukan > 0 ? 'success.main' : 'error.main'} fontWeight={700}>
          {row.pemasukan > 0 ? `+ ${formatRupiah(row.pemasukan)}` : `- ${formatRupiah(row.pengeluaran)}`}
        </Typography>
      </TableCell>

      <TableCell align="center">
        <Tooltip title="Klik untuk lihat bukti dari toko">
          <IconButton size="small" onClick={() => setPreviewImg(row.bukti_toko)} disabled={!row.bukti_toko}>
            <Visibility fontSize="small" color={row.bukti_toko ? "primary" : "disabled"} />
          </IconButton>
        </Tooltip>
      </TableCell>

        <TableCell align="center">
  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
    {row.status === 'pending' ? (
      userRole === 'admin' ? (
        <Button 
          variant="contained" 
          color="warning" 
          size="small" 
          onClick={() => { setSelectedId(row.id); setOpenValidasi(true); }}
        >
          VALIDASI
        </Button>
      ) : (
        <Chip label="PENDING" size="small" color="warning" />
      )
    ) : (
      <>
        <Chip label="LUNAS" size="small" color="success" />

        {row.bukti_admin ? (
          <Tooltip title="Lihat Bukti Mutasi Bank">
            <IconButton size="small" onClick={() => setPreviewImg(row.bukti_admin)}>
               <Avatar 
                  src={row.bukti_admin} 
                  variant="rounded" 
                  sx={{ width: 26, height: 26, border: '1px solid #2e7d32', cursor: 'pointer' }} 
                />
            </IconButton>
          </Tooltip>
        ) : (
          row.status === 'tervalidasi' && <Typography variant="caption" color="error" sx={{fontSize: '10px'}}>No Bukti</Typography>
        )}

        {row.catatan_admin && (
          <Tooltip title={`Catatan Admin: ${row.catatan_admin}`}>
            <IconButton size="small" color="success">
              <ReceiptLong fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </>
    )}
  </Stack>
</TableCell>
    </TableRow>
  ))
)}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}><Pagination count={pagination.last_page} page={pagination.current_page} onChange={(e, v) => fetchRiwayat(v)} color="primary" /></Box>
        </Card>
      </Grid>

      {/* DIALOGS */}
      <Dialog open={openValidasi} onClose={() => setOpenValidasi(false)} maxWidth="xs" fullWidth>
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight={800}>Konfirmasi Lunas</Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField label="Catatan Admin" fullWidth multiline rows={2} value={validasiData.deskripsi_validasi} onChange={(e) => setValidasiData({...validasiData, deskripsi_validasi: e.target.value})} />
            <Button component="label" variant="contained" startIcon={<CloudUpload />}>
              {validasiData.bukti_mutasi ? validasiData.bukti_mutasi.name : 'Upload Mutasi'}
              <input type="file" hidden onChange={(e) => setValidasiData({...validasiData, bukti_mutasi: e.target.files[0]})} />
            </Button>
            <Button fullWidth variant="contained" color="success" onClick={handleValidasiSubmit} disabled={btnLoading}>KONFIRMASI LUNAS</Button>
          </Stack>
        </Box>
      </Dialog>

      <Dialog open={!!previewImg} onClose={() => setPreviewImg(null)}><Box sx={{ p: 1 }}><img src={previewImg} alt="Bukti" style={{ width: '100%', borderRadius: '8px' }} /></Box></Dialog>
    </Grid>
  );
};

export default KasManagement;