import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  Grid, Card, CardContent, Typography, TextField, Button, MenuItem, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Box, Stack, Divider, Alert, CircularProgress, InputAdornment, 
  Avatar, Paper, Chip, IconButton, Tooltip, Dialog, Fade, useTheme, Zoom
} from '@mui/material';
import { 
  Payments, History, Send, CloudUpload, 
  AddCircle, RemoveCircle, Visibility, Close, Gavel, 
  ReceiptLong, CheckCircle, PendingActions, Wallet
} from '@mui/icons-material';
import axiosInstance from 'api/axiosInstance';
import { AuthContext } from "AuthContex/AuthContext";
import { gridSpacing } from 'config.js';

const KasirOperasional = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();

  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [saldo, setSaldo] = useState(0);
  const [riwayat, setRiwayat] = useState([]);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [previewImg, setPreviewImg] = useState(null);

  // Style Constant
  const PRIMARY_COLOR = '#075345'; // Hijau Tua khas kamu
  const SECONDARY_BG = '#f8fafc';

  const [formData, setFormData] = useState({
    kategori: 'operasional_toko',
    tipe_operasional: 'keluar',
    metode: 'cash',
    nominal: '',
    deskripsi: '',
    bukti_transaksi: null
  });

  const [displayNominal, setDisplayNominal] = useState('');

  const getApiUrl = (resource) => (userRole === "kasir" ? `/kasir/${resource}` : `/${resource}`);

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
    <Box sx={{ p: { xs: 0, md: 1 }, bgcolor: SECONDARY_BG, minHeight: '100vh' }}>
      <Grid container spacing={3}>
        
        {/* LEFT COLUMN: SALDO & QUICK MENU */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Card Saldo yang Lebih Eye-Catching */}
            <Card sx={{ 
              background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #0a7a66 100%)`, 
              color: '#fff', 
              borderRadius: '24px', 
              boxShadow: '0 12px 24px rgba(7, 83, 69, 0.25)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box sx={{ position: 'absolute', right: -20, top: -20, opacity: 0.1 }}>
                <Wallet sx={{ fontSize: 150 }} />
              </Box>
              <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 32, height: 32 }}>
      <Payments sx={{ fontSize: 18, color: '#ffffff' }} />
    </Avatar>
    <Typography 
      variant="subtitle2" 
      sx={{ 
        color: '#ffffff', // Paksa jadi putih
        opacity: 0.9, 
        fontWeight: 600, 
        letterSpacing: 1 
      }}
    >
      SALDO KASIR (FISIK)
    </Typography>
  </Stack>

  <Typography 
    variant="h2" 
    sx={{ 
      fontWeight: 900, 
      letterSpacing: -1, 
      color: '#ffffff' // Paksa nominal jadi putih bersih
    }}
  >
    {formatRupiah(saldo)}
  </Typography>

  <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.2)' }} />

  <Typography 
    variant="caption" 
    sx={{ 
      color: '#ffffff', // Paksa text waktu jadi putih
      opacity: 0.8,
      fontWeight: 400 
    }}
  >
    Terakhir diperbarui: {new Date().toLocaleTimeString()}
  </Typography>
</CardContent>
            </Card>

            {/* Menu Cepat dengan Desain Button yang Lebih Modern */}
            <Card sx={{ borderRadius: '24px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AddCircle sx={{ color: PRIMARY_COLOR }} /> Menu Cepat
                </Typography>
                <Stack spacing={1.5}>
                  {[
                    { label: 'Pemasukan (Tebus)', color: 'success', icon: <AddCircle />, type: 'masuk', desc: 'Pemasukan Tebusan/Sewa' },
                    { label: 'Pengeluaran (Cair)', color: 'error', icon: <RemoveCircle />, type: 'keluar', desc: 'Pembayaran Untuk Gadai' },
                    { label: 'Hasil Lelang', color: 'info', icon: <Gavel />, type: 'masuk', desc: 'Hasil Pelelangan Barang' },
                    { label: 'Setor ke Pusat', color: 'warning', icon: <Send />, type: 'keluar', kat: 'setor_ke_admin', desc: 'Setoran Uang ke Admin' }
                  ].map((item, idx) => (
                    <Button 
                      key={idx}
                      fullWidth 
                      variant="soft" 
                      color={item.color} 
                      startIcon={item.icon}
                      onClick={() => {
                        setFormData({
                          ...formData, 
                          kategori: item.kat || 'operasional_toko', 
                          tipe_operasional: item.type, 
                          deskripsi: item.desc
                        });
                        setDisplayNominal('');
                      }}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        py: 1.5, 
                        px: 2, 
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 700,
                        bgcolor: theme.palette[item.color].lighter || `${theme.palette[item.color].main}15`,
                        '&:hover': { bgcolor: `${theme.palette[item.color].main}25` }
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* RIGHT COLUMN: FORM & HISTORY */}
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            {/* Form Input yang Lebih Clean */}
            <Card sx={{ borderRadius: '24px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
                  <Avatar sx={{ 
                    bgcolor: formData.tipe_operasional === 'masuk' ? 'success.main' : PRIMARY_COLOR,
                    width: 50, height: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <Payments fontSize="large" />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900 }}>Input Transaksi</Typography>
                    <Typography variant="subtitle2" color="textSecondary">Catat arus kas masuk dan keluar hari ini</Typography>
                  </Box>
                </Stack>

                {statusMsg.text && (
                  <Fade in={!!statusMsg.text}>
                    <Alert severity={statusMsg.type} sx={{ mb: 3, borderRadius: '14px', fontWeight: 600 }} onClose={() => setStatusMsg({type:'', text:''})}>
                      {statusMsg.text}
                    </Alert>
                  </Fade>
                )}

                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField select fullWidth label="Kategori" value={formData.kategori} onChange={(e) => setFormData({...formData, kategori: e.target.value})} variant="filled" sx={{ '& .MuiFilledInput-root': { borderRadius: '12px' } }}>
                        <MenuItem value="operasional_toko">Operasional Toko</MenuItem>
                        <MenuItem value="setor_ke_admin">Setor ke Pusat</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField select fullWidth label="Tipe Arus" disabled={formData.kategori === 'setor_ke_admin'} value={formData.kategori === 'setor_ke_admin' ? 'keluar' : formData.tipe_operasional} onChange={(e) => setFormData({...formData, tipe_operasional: e.target.value})} variant="filled" sx={{ '& .MuiFilledInput-root': { borderRadius: '12px' } }}>
                        <MenuItem value="masuk">Pemasukan (+)</MenuItem>
                        <MenuItem value="keluar">Pengeluaran (-)</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Nominal" value={displayNominal} onChange={handleNominalChange} required InputProps={{ startAdornment: <InputAdornment position="start" sx={{ fontWeight: 800, color: PRIMARY_COLOR }}>Rp</InputAdornment> }} variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField select fullWidth label="Metode Pembayaran" value={formData.metode} onChange={(e) => setFormData({...formData, metode: e.target.value})} variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                        <MenuItem value="cash">Tunai (Cash)</MenuItem>
                        <MenuItem value="transfer">Transfer Bank</MenuItem>
                      </TextField>
                    </Grid>
                    
                    {formData.metode === 'transfer' && (
                      <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2, borderStyle: 'dashed', borderRadius: '12px', textAlign: 'center', bgcolor: '#fafafa' }}>
                          <input type="file" id="upload-bukti" hidden onChange={(e) => setFormData({...formData, bukti_transaksi: e.target.files[0]})} />
                          <label htmlFor="upload-bukti">
                            <Button component="span" variant="text" startIcon={<CloudUpload />}>
                              {formData.bukti_transaksi ? formData.bukti_transaksi.name : 'Pilih Bukti Transfer (PNG/JPG)'}
                            </Button>
                          </label>
                        </Paper>
                      </Grid>
                    )}

                    <Grid item xs={12}>
                      <TextField fullWidth label="Keterangan Transaksi" multiline rows={3} value={formData.deskripsi} onChange={(e) => setFormData({...formData, deskripsi: e.target.value})} required variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                    </Grid>
                    <Grid item xs={12}>
                      <Button 
                        fullWidth 
                        size="large" 
                        variant="contained" 
                        type="submit" 
                        disabled={btnLoading || (formData.tipe_operasional === 'keluar' && saldo < formData.nominal)} 
                        sx={{ 
                          py: 2, 
                          borderRadius: '16px', 
                          fontWeight: 800, 
                          fontSize: '1rem',
                          bgcolor: formData.tipe_operasional === 'masuk' ? 'success.main' : PRIMARY_COLOR,
                          boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                          '&:hover': { bgcolor: formData.tipe_operasional === 'masuk' ? '#236326' : '#054035' }
                        }}
                      >
                        {btnLoading ? <CircularProgress size={26} color="inherit" /> : `KONFIRMASI SIMPAN TRANSAKSI`}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>

            {/* Mutasi List dengan Design Table yang Lebih Airy */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, px: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <History sx={{ color: PRIMARY_COLOR }} /> Mutasi Hari Ini
                </Typography>
                <Chip label="Live Updates" size="small" color="success" variant="soft" sx={{ fontWeight: 700 }} />
              </Stack>
              
              <TableContainer component={Paper} sx={{ borderRadius: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: 'none', overflow: 'hidden' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                      <TableCell sx={{ fontWeight: 800, py: 2 }}>TRANSAKSI / WAKTU</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>MASUK</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>KELUAR</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800 }}>STATUS & AKSI</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5 }}><CircularProgress color="inherit" opacity={0.5}/></TableCell></TableRow>
                    ) : riwayat.length === 0 ? (
                      <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5 }}><Typography color="textSecondary" variant="subtitle2">Belum ada mutasi tercatat hari ini.</Typography></TableCell></TableRow>
                    ) : (
                      riwayat.map((row, i) => (
                        <TableRow key={i} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#f8fafc' } }}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>{row.deskripsi}</Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>{row.waktu}</Typography>
                              <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                              <Typography variant="caption" sx={{ color: PRIMARY_COLOR, fontWeight: 700, textTransform: 'uppercase' }}>{row.metode}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            {row.pemasukan > 0 ? <Typography sx={{ color: 'success.main', fontWeight: 800 }}>+ {formatRupiah(row.pemasukan)}</Typography> : <Typography color="text.disabled">-</Typography>}
                          </TableCell>
                          <TableCell align="right">
                            {row.pengeluaran > 0 ? <Typography sx={{ color: 'error.main', fontWeight: 800 }}>- {formatRupiah(row.pengeluaran)}</Typography> : <Typography color="text.disabled">-</Typography>}
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                              <Tooltip title={row.status === 'tervalidasi' ? 'Tervalidasi oleh Admin' : 'Menunggu Validasi'}>
                                <Chip 
                                  icon={row.status === 'tervalidasi' ? <CheckCircle style={{ fontSize: 14 }} /> : <PendingActions style={{ fontSize: 14 }} />}
                                  label={row.status === 'tervalidasi' ? 'LUNAS' : 'PENDING'} 
                                  size="small" 
                                  sx={{ 
                                    fontWeight: 800, 
                                    fontSize: '0.65rem',
                                    borderRadius: '8px',
                                    bgcolor: row.status === 'tervalidasi' ? '#dcfce7' : '#fef9c3',
                                    color: row.status === 'tervalidasi' ? '#166534' : '#854d0e',
                                    border: 'none'
                                  }}
                                />
                              </Tooltip>
                              
                              <Stack direction="row">
                                {row.bukti_toko && (
                                  <IconButton size="small" onClick={() => setPreviewImg(row.bukti_toko)} sx={{ color: PRIMARY_COLOR }}>
                                    <Visibility sx={{ fontSize: 18 }} />
                                  </IconButton>
                                )}
                                {row.status === 'tervalidasi' && (row.bukti_admin || row.catatan_admin) && (
                                  <Tooltip title="Detail Validasi Admin">
                                    <IconButton size="small" color="success" onClick={() => row.bukti_admin && setPreviewImg(row.bukti_admin)}>
                                      <ReceiptLong sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Stack>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Stack>
        </Grid>
      </Grid>

      {/* Dialog Preview Image yang Lebih Smooth */}
      <Dialog 
        open={!!previewImg} 
        onClose={() => setPreviewImg(null)} 
        maxWidth="sm" 
        fullWidth
        TransitionComponent={Zoom}
        PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden' } }}
      >
         <Box sx={{ p: 0, position: 'relative', bgcolor: '#000', display: 'flex', justifyContent: 'center' }}>
            <IconButton 
              onClick={() => setPreviewImg(null)} 
              sx={{ 
                position: 'absolute', 
                right: 12, 
                top: 12, 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                zIndex: 10
              }}
            >
              <Close />
            </IconButton>
            <img src={previewImg} alt="Bukti Transaksi" style={{ maxWidth: '100%', height: 'auto', display: 'block' }} />
         </Box>
         <Box sx={{ p: 2, textAlign: 'center', bgcolor: '#fff' }}>
            <Typography variant="button" fontWeight="800" color="primary">Lampiran Bukti Transaksi</Typography>
         </Box>
      </Dialog>
    </Box>
  );
};

export default KasirOperasional;