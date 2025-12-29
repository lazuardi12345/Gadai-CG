import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  Grid, Card, CardContent, CardHeader, Typography, TextField,
  Button, MenuItem, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Pagination, Box, Stack, Divider, 
  Alert, CircularProgress, InputAdornment, Avatar, Dialog,
  Zoom, Chip, IconButton, Tooltip, Paper
} from '@mui/material';
import { 
  AccountBalanceWallet, VerifiedUser, HistoryEdu,
  CloudUpload, TrendingUp, AccountBalance, Close, Visibility,
  FilterList, AddBox
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
    saldo_toko_saat_ini: 0, 
    total_modal_dari_pusat: 0, 
    total_setoran_ke_admin: 0,
    total_setoran_pending: 0 
  });
  const [riwayat, setRiwayat] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [openConfirm, setOpenConfirm] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);

  const today = new Date().toISOString().split('T')[0];
  const [filters, setFilters] = useState({ start_date: today, end_date: today });

  // Form Data disederhanakan: Kategori dikunci ke topup_pusat, tipe_operasional dikunci ke masuk
  const [formData, setFormData] = useState({ 
    kategori: 'topup_pusat', 
    metode: 'cash',
    nominal: '', 
    deskripsi: '',
    tipe_operasional: 'masuk',
    bukti_transaksi: null
  });

  const [displayNominal, setDisplayNominal] = useState('');

  const getApiUrl = (resource) => (userRole === "admin" ? `/admin/${resource}` : `/${resource}`);

  const fetchSummary = async () => {
    try {
      const res = await axiosInstance.get(getApiUrl("brankas"));
      if (res.data.success) setSummary(res.data.summary);
    } catch (err) { console.error("Summary error:", err); }
  };

  const fetchRiwayat = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(getApiUrl("brankas/riwayat"), { 
        params: { page, start_date: filters.start_date, end_date: filters.end_date } 
      });
      if (res.data.success) {
        setRiwayat(res.data.riwayat);
        setPagination(res.data.pagination);
      }
    } catch (err) { console.error("Riwayat error:", err); }
    finally { setLoading(false); }
  }, [userRole, filters]);

  useEffect(() => { if (isAuthorized) { fetchSummary(); fetchRiwayat(); } }, [fetchRiwayat, isAuthorized]);

  const handleNominalChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); 
    setFormData({ ...formData, nominal: value });
    setDisplayNominal(value ? new Intl.NumberFormat('id-ID').format(value) : '');
  };

  const handleFinalSubmit = async () => {
    setOpenConfirm(false);
    setBtnLoading(true);
    
    const data = new FormData();
    Object.keys(formData).forEach(key => {
        if (formData[key] !== null) data.append(key, formData[key]);
    });

    try {
      const res = await axiosInstance.post(getApiUrl("brankas/transaksi"), data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setStatusMsg({ type: 'success', text: 'Top Up Modal berhasil masuk ke Brankas Toko!' });
        setFormData({ kategori: 'topup_pusat', metode: 'cash', nominal: '', deskripsi: '', tipe_operasional: 'masuk', bukti_transaksi: null });
        setDisplayNominal('');
        fetchSummary(); fetchRiwayat(1);
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Gagal menyimpan.' });
    } finally { setBtnLoading(false); }
  };

  const handleValidasi = async (id) => {
    if(!window.confirm("Apakah Anda sudah menerima uang fisik/transfer ini?")) return;
    try {
      const res = await axiosInstance.patch(getApiUrl(`brankas/validasi/${id}`));
      if (res.data.success) {
        setStatusMsg({ type: 'success', text: 'Setoran telah divalidasi!' });
        fetchSummary(); fetchRiwayat(pagination.current_page);
      }
    } catch (err) { setStatusMsg({ type: 'error', text: 'Gagal melakukan validasi.' }); }
  };

  if (!isAuthorized) return <Box sx={{ p: 5 }}><Alert severity="error">Hanya Admin dan HM yang diizinkan.</Alert></Box>;

  const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  return (
    <Grid container spacing={gridSpacing}>
      
      {/* SUMMARY DASHBOARD */}
      <Grid item xs={12}>
        <Grid container spacing={gridSpacing}>
          {[
            { label: 'SALDO DI TOKO (FISIK)', val: summary.saldo_toko_saat_ini, icon: <AccountBalanceWallet />, color: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' },
            { label: 'TOTAL INJEKSI MODAL', val: summary.total_modal_dari_pusat, icon: <AccountBalance />, color: 'linear-gradient(135deg, #004d40 0%, #00796b 100%)' },
            { label: 'SETORAN DITERIMA', val: summary.total_setoran_ke_admin, icon: <TrendingUp />, color: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)' },
            { label: 'SETORAN BELUM DIVALIDASI', val: summary.total_setoran_pending, icon: <HistoryEdu />, color: 'linear-gradient(135deg, #ef6c00 0%, #fb8c00 100%)' }
          ].map((item, index) => (
            <Grid item lg={3} sm={6} xs={12} key={index}>
              <Card sx={{ background: item.color, color: '#fff', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle2" sx={{ opacity: 0.8, fontWeight: 600 }}>{item.label}</Typography>
                      <Typography variant="h3" sx={{ mt: 1, fontWeight: 800 }}>{formatRupiah(item.val)}</Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 50, height: 50 }}>{item.icon}</Avatar>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>

      {/* FORM INPUT MODAL (KHUSUS ADMIN) */}
      <Grid item lg={4} md={5} xs={12}>
        <Card sx={{ borderRadius: '20px', border: '1px solid #e0e0e0', position: 'sticky', top: 20 }}>
          <Box sx={{ p: 2.5, bgcolor: '#f0f4ff', borderBottom: '1px solid #dee2e6' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <AddBox color="primary" />
              <Typography variant="h5" fontWeight="800" color="primary">Injeksi Modal Toko</Typography>
            </Stack>
            <Typography variant="caption" color="textSecondary">Hanya Admin/HM yang dapat menambah modal awal toko</Typography>
          </Box>
          <CardContent sx={{ p: 3 }}>
            {statusMsg.text && <Alert severity={statusMsg.type} sx={{ mb: 3, borderRadius: '10px' }} onClose={() => setStatusMsg({type:'', text:''})}>{statusMsg.text}</Alert>}
            
            <Stack spacing={2.5}>
              {/* Kategori di-lock ke Topup */}
              <TextField 
                label="Jenis Transaksi" 
                fullWidth 
                value="Topup / Injeksi Modal (Awal)" 
                disabled 
              />

              <TextField select label="Metode Pengiriman" fullWidth value={formData.metode} onChange={(e) => setFormData({ ...formData, metode: e.target.value })}>
                <MenuItem value="cash">Tunai (Kirim Fisik)</MenuItem>
                <MenuItem value="transfer">Transfer Bank (Kirim ke Rekening Toko)</MenuItem>
              </TextField>

              <TextField 
                fullWidth label="Nominal Modal" value={displayNominal} 
                onChange={handleNominalChange}
                placeholder="0"
                required
                InputProps={{ 
                  startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                  sx: { fontWeight: 'bold', fontSize: '1.2rem' }
                }} 
              />

              {formData.metode === 'transfer' && (
                <Button component="label" variant="outlined" startIcon={<CloudUpload />} sx={{ borderStyle: 'dashed', py: 1.2 }}>
                  {formData.bukti_transaksi ? formData.bukti_transaksi.name : 'Upload Bukti Transfer'}
                  <input type="file" hidden accept="image/*" onChange={(e) => setFormData({...formData, bukti_transaksi: e.target.files[0]})} />
                </Button>
              )}

              <TextField 
                label="Memo / Catatan" 
                placeholder="Contoh: Tambahan modal awal Desember"
                multiline rows={3} 
                value={formData.deskripsi} 
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })} 
              />

              <Button 
                fullWidth variant="contained" size="large" onClick={() => setOpenConfirm(true)} 
                disabled={btnLoading || !formData.nominal} 
                sx={{ py: 1.5, borderRadius: '12px', fontWeight: 700, fontSize: '1rem', boxShadow: '0 4px 12px rgba(30, 60, 114, 0.3)' }}
              >
                {btnLoading ? <CircularProgress size={24} color="inherit" /> : 'Kirim Modal ke Toko'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* MUTASI TABLE & FILTER */}
      <Grid item lg={8} md={7} xs={12}>
        <Card sx={{ borderRadius: '20px', border: '1px solid #e0e0e0' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h5" fontWeight="800">Riwayat Kas & Validasi Setoran</Typography>
            
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField 
                type="date" size="small" label="Dari" 
                value={filters.start_date} 
                onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
              <TextField 
                type="date" size="small" label="Sampai" 
                value={filters.end_date} 
                onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
              <Button variant="contained" onClick={() => fetchRiwayat(1)}>
                <FilterList fontSize="small" />
              </Button>
            </Stack>
          </Box>
          <Divider />
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#fbfbfb' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>WAKTU</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>DETAIL TRANSAKSI</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>UANG MASUK </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>UANG KELUAR </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>AKSI / BUKTI</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow> : 
                  riwayat.map((row, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{row.waktu}</TableCell>
                    <TableCell>
                      <Chip 
                        label={row.kategori?.replace('_', ' ').toUpperCase()} 
                        size="small" 
                        color={row.kategori === 'topup_pusat' ? 'primary' : 'default'}
                        sx={{ fontSize: '0.6rem', mb: 0.5, height: 20 }} 
                      />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.deskripsi}</Typography>
                      <Typography variant="caption" color="textSecondary">{row.petugas} • {row.metode.toUpperCase()}</Typography>
                    </TableCell>
                    
                    <TableCell align="right">
                      {row.pemasukan > 0 ? (
                        <Typography variant="body2" fontWeight="800" color="success.main">
                          {formatRupiah(row.pemasukan)}
                        </Typography>
                      ) : '-'}
                    </TableCell>

                    <TableCell align="right">
                      {row.pengeluaran > 0 ? (
                        <Typography variant="body2" fontWeight="800" color="error.main">
                          {formatRupiah(row.pengeluaran)}
                        </Typography>
                      ) : '-'}
                    </TableCell>

                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                        {row.bukti_transaksi && (
                          <Tooltip title="Lihat Bukti Transfer">
                            <IconButton size="small" color="primary" onClick={() => setPreviewImg(row.bukti_transaksi)}>
                                <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {row.status_validasi === 'pending' ? (
                          <Button 
                            size="small" 
                            variant="contained" 
                            color="warning" 
                            onClick={() => handleValidasi(row.id)} 
                            sx={{ fontSize: '0.65rem', py: 0.5, fontWeight: 'bold' }}
                          >
                            VALIDASI
                          </Button>
                        ) : (
                          <Chip label="Verified" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <Pagination count={pagination.last_page} page={pagination.current_page} onChange={(e, v) => fetchRiwayat(v)} color="primary" />
          </Box>
        </Card>
      </Grid>

      {/* PREVIEW BUKTI */}
      <Dialog open={!!previewImg} onClose={() => setPreviewImg(null)} maxWidth="sm" fullWidth>
         <Box sx={{ p: 1, position: 'relative' }}>
            <IconButton 
              onClick={() => setPreviewImg(null)} 
              sx={{ position: 'absolute', right: 8, top: 8, bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', '&:hover': {bgcolor: 'black'}, zIndex: 10 }}
            >
              <Close />
            </IconButton>
            <img src={previewImg} alt="Bukti" style={{ width: '100%', borderRadius: '8px', display: 'block' }} />
         </Box>
      </Dialog>

      {/* CONFIRMATION */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)} TransitionComponent={Zoom}>
        <Box sx={{ p: 3, textAlign: 'center', maxWidth: 350 }}>
          <Typography variant="h4" fontWeight="800" gutterBottom>Konfirmasi Injeksi</Typography>
          <Typography variant="body2">
            Anda akan mengirim modal sebesar <b>{displayNominal}</b> ke Brankas Toko. Aksi ini akan menambah saldo aktif toko.
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button fullWidth variant="outlined" onClick={() => setOpenConfirm(false)}>Batal</Button>
            <Button fullWidth variant="contained" onClick={handleFinalSubmit}>Ya, Kirim Modal</Button>
          </Stack>
        </Box>
      </Dialog>
    </Grid>
  );
};

export default KasManagement;