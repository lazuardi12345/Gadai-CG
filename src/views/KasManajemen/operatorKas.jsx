import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  Grid, Card, CardContent, Typography, TextField, Button, MenuItem, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Box, Stack, Divider, Alert, CircularProgress, InputAdornment, 
  Avatar, Paper, Chip, IconButton, Tooltip,Dialog, Zoom
} from '@mui/material';
import { 
  Payments, History, Send, CloudUpload, 
  AddCircle, RemoveCircle, Visibility, Close, Gavel 
} from '@mui/icons-material';
import axiosInstance from 'api/axiosInstance';
import { AuthContext } from "AuthContex/AuthContext";
import { gridSpacing } from 'config.js';


const KasirOperasional = () => {
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();

  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [saldo, setSaldo] = useState(0);
  const [riwayat, setRiwayat] = useState([]);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [previewImg, setPreviewImg] = useState(null);

  const [formData, setFormData] = useState({
    kategori: 'operasional_toko',
    tipe_operasional: 'keluar',
    metode: 'cash',
    nominal: '',
    deskripsi: '',
    bukti_transaksi: null
  });

  // State untuk tampilan input nominal bermasker
  const [displayNominal, setDisplayNominal] = useState('');

  const getApiUrl = (resource) => (userRole === "checker" ? `/checker/${resource}` : `/${resource}`);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resSummary, resRiwayat] = await Promise.all([
        axiosInstance.get(getApiUrl("brankas")),
        axiosInstance.get(getApiUrl("brankas/riwayat"))
      ]);
      if (resSummary.data.success) {
        setSaldo(resSummary.data.summary.saldo_toko_saat_ini);
      }
      if (resRiwayat.data.success) {
        setRiwayat(resRiwayat.data.riwayat); 
      }
    } catch (err) { console.error('Fetch Error:', err); }
    finally { setLoading(false); }
  }, [userRole]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Handle Input Masking Nominal
  const handleNominalChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setFormData({ ...formData, nominal: value });
    setDisplayNominal(value ? new Intl.NumberFormat('id-ID').format(value) : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.tipe_operasional === 'keluar' && saldo < formData.nominal) {
      setStatusMsg({ type: 'error', text: 'Saldo kasir tidak mencukupi!' });
      return;
    }

    setBtnLoading(true);
    const dataToSend = new FormData();
    const finalTipe = formData.kategori === 'setor_ke_admin' ? 'keluar' : formData.tipe_operasional;

    dataToSend.append('kategori', formData.kategori);
    dataToSend.append('tipe_operasional', finalTipe);
    dataToSend.append('metode', formData.metode);
    dataToSend.append('nominal', formData.nominal);
    dataToSend.append('deskripsi', formData.deskripsi);
    if (formData.bukti_transaksi) dataToSend.append('bukti_transaksi', formData.bukti_transaksi);

    try {
      const res = await axiosInstance.post(getApiUrl("brankas/transaksi"), dataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setStatusMsg({ type: 'success', text: 'Transaksi berhasil dicatat!' });
        setFormData({ ...formData, nominal: '', deskripsi: '', bukti_transaksi: null });
        setDisplayNominal('');
        fetchData();
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Gagal menyimpan.' });
    } finally { setBtnLoading(false); }
  };

  const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  return (
    <Grid container spacing={gridSpacing}>
      <Grid item xs={12} md={4}>
        <Stack spacing={gridSpacing}>
          {/* CARD SALDO */}
          <Card sx={{ bgcolor: '#075345ff', color: '#fff', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
  <CardContent sx={{ p: 4 }}>
    <Typography variant="subtitle2" sx={{ opacity: 0.7, color: 'inherit' }}>
      SALDO KASIR (FISIK)
    </Typography>
    <Typography 
      variant="h2" 
      sx={{ 
        fontWeight: 900, 
        my: 1, 
        color: '#ffffff' 
      }}
    >
      {formatRupiah(saldo)}
    </Typography>
  </CardContent>
</Card>

          {/* MENU CEPAT */}
          <Card sx={{ borderRadius: '20px', border: '1px solid #eee' }}>
            <CardContent>
              <Typography variant="h5" fontWeight="800" gutterBottom>Menu Cepat</Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1.5}>
                <Button 
                  fullWidth variant="outlined" color="success" startIcon={<AddCircle />} 
                  onClick={() => {
                    setFormData({...formData, kategori: 'operasional_toko', tipe_operasional: 'masuk', deskripsi: 'Pemasukan Tebusan/Sewa'});
                    setDisplayNominal('');
                  }}
                >
                  Pemasukan (Tebus)
                </Button>
                <Button 
                  fullWidth variant="outlined" color="error" startIcon={<RemoveCircle />} 
                  onClick={() => {
                    setFormData({...formData, kategori: 'operasional_toko', tipe_operasional: 'keluar', deskripsi: 'Pembayaran Untuk Gadai'});
                    setDisplayNominal('');
                  }}
                >
                  Pengeluaran (Cair)
                </Button>
                <Button 
  fullWidth 
  variant="outlined" 
  color="secondary" 
  startIcon={<Gavel />} 
  onClick={() => {
    setFormData({
      ...formData, 
      kategori: 'operasional_toko', 
      tipe_operasional: 'masuk', 
      deskripsi: 'Hasil Pelelangan Barang Jaminan'
    });
    setDisplayNominal('');
  }}
>
  Hasil Lelang (Masuk)
</Button>


                <Button 
                  fullWidth variant="contained" color="warning" startIcon={<Send />} 
                  onClick={() => {
                    setFormData({...formData, kategori: 'setor_ke_admin', tipe_operasional: 'keluar', deskripsi: 'Setoran Uang ke Admin'});
                    setDisplayNominal('');
                  }}
                >
                  Setor ke Pusat
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card sx={{ borderRadius: '20px', border: '1px solid #eee' }}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
              <Avatar sx={{ bgcolor: formData.tipe_operasional === 'masuk' ? '#2e7d32' : '#075345ff' }}>
                <Payments />
              </Avatar>
              <Typography variant="h4" fontWeight="800">
                Input {formData.kategori === 'setor_ke_admin' ? 'Setoran Pusat' : (formData.tipe_operasional === 'masuk' ? 'Pemasukan' : 'Pengeluaran')}
              </Typography>
            </Stack>

            {statusMsg.text && (
              <Alert severity={statusMsg.type} sx={{ mb: 3, borderRadius: '10px' }} onClose={() => setStatusMsg({type:'', text:''})}>
                {statusMsg.text}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Kategori" value={formData.kategori} onChange={(e) => setFormData({...formData, kategori: e.target.value})}>
                    <MenuItem value="operasional_toko">Operasional Toko</MenuItem>
                    <MenuItem value="setor_ke_admin">Setor ke Pusat</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField 
                    select fullWidth label="Tipe Arus" 
                    disabled={formData.kategori === 'setor_ke_admin'}
                    value={formData.kategori === 'setor_ke_admin' ? 'keluar' : formData.tipe_operasional} 
                    onChange={(e) => setFormData({...formData, tipe_operasional: e.target.value})}
                  >
                    <MenuItem value="masuk">Pemasukan </MenuItem>
                    <MenuItem value="keluar">Pengeluaran </MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth label="Nominal" 
                    value={displayNominal} 
                    onChange={handleNominalChange}
                    required
                    placeholder="0"
                    InputProps={{ startAdornment: <InputAdornment position="start">Rp</InputAdornment> }} 
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Metode" value={formData.metode} onChange={(e) => setFormData({...formData, metode: e.target.value})}>
                    <MenuItem value="cash">Tunai (Cash)</MenuItem>
                    <MenuItem value="transfer">Transfer</MenuItem>
                  </TextField>
                </Grid>

                {formData.metode === 'transfer' && (
                  <Grid item xs={12}>
                    <Button component="label" variant="outlined" fullWidth startIcon={<CloudUpload />} sx={{ py: 1.5, borderStyle: 'dashed' }}>
                      {formData.bukti_transaksi ? formData.bukti_transaksi.name : 'Upload Bukti Transfer'}
                      <input type="file" hidden accept="image/*" onChange={(e) => setFormData({...formData, bukti_transaksi: e.target.files[0]})} />
                    </Button>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <TextField fullWidth label="Keterangan" multiline rows={2} value={formData.deskripsi} onChange={(e) => setFormData({...formData, deskripsi: e.target.value})} required />
                </Grid>

                <Grid item xs={12}>
                  <Button 
                    fullWidth size="large" variant="contained" type="submit" 
                    disabled={btnLoading || (formData.tipe_operasional === 'keluar' && saldo < formData.nominal)} 
                    sx={{ 
                      py: 2, borderRadius: '12px', fontWeight: 'bold',
                      bgcolor: formData.tipe_operasional === 'masuk' ? '#2e7d32' : '#075345ff'
                    }}
                  >
                    {btnLoading ? <CircularProgress size={24} color="inherit" /> : `SIMPAN TRANSAKSI`}
                  </Button>
                  {(formData.tipe_operasional === 'keluar' && saldo < formData.nominal) && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block', textAlign: 'center', fontWeight: 'bold' }}>
                      ⚠️ Saldo kasir tidak cukup untuk pengeluaran ini!
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>

        {/* RIWAYAT HARI INI */}
        <Box sx={{ mt: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight="800"><History /> Mutasi Hari Ini</Typography>
            <Chip label="Real-time" size="small" color="primary" variant="outlined" />
          </Stack>
          
          <TableContainer component={Paper} sx={{ borderRadius: '15px', border: '1px solid #eee', boxShadow: 'none' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#fbfbfb' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Keterangan</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>Masuk (+)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>Keluar (-)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}><CircularProgress size={24}/></TableCell></TableRow>
                ) : riwayat.length === 0 ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}>Belum ada mutasi hari ini.</TableCell></TableRow>
                ) : (
                  riwayat.map((row, i) => (
                    <TableRow key={i} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">{row.deskripsi}</Typography>
                        <Typography variant="caption" color="textSecondary">{row.waktu} • {row.metode}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        {row.pemasukan > 0 ? <Typography color="success.main" fontWeight="900">{formatRupiah(row.pemasukan)}</Typography> : '-'}
                      </TableCell>
                      <TableCell align="right">
                        {row.pengeluaran > 0 ? <Typography color="error.main" fontWeight="900">{formatRupiah(row.pengeluaran)}</Typography> : '-'}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                          <Chip 
                            label={row.status_validasi} 
                            size="small" 
                            color={row.status_validasi === 'tervalidasi' ? 'success' : 'warning'} 
                            sx={{ fontSize: '0.65rem', height: 20 }}
                          />
                          {row.bukti_transaksi && (
                            <IconButton size="small" onClick={() => setPreviewImg(row.bukti_transaksi)}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Grid>

      {/* MODAL PREVIEW GAMBAR */}
      <Dialog open={!!previewImg} onClose={() => setPreviewImg(null)} maxWidth="sm" fullWidth>
         <Box sx={{ p: 1, position: 'relative' }}>
            <IconButton onClick={() => setPreviewImg(null)} sx={{ position: 'absolute', right: 8, top: 8, bgcolor: 'rgba(0,0,0,0.5)', color: '#fff' }}>
              <Close />
            </IconButton>
            <img src={previewImg} alt="Bukti" style={{ width: '100%', borderRadius: '8px' }} />
         </Box>
      </Dialog>
    </Grid>
  );
};

export default KasirOperasional;