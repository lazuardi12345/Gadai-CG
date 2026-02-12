import React, { useState, useEffect, useCallback } from "react";
import {
  Card, CardHeader, CardContent, TextField, Button,
  Grid, Stack, CircularProgress, Box, Typography, 
  FormControl, InputLabel, Select, MenuItem, Paper, Divider, Alert,
  ToggleButton, ToggleButtonGroup, Chip
} from "@mui/material";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const DOKUMEN_SOP_EMAS = ['emas_timbangan', 'gosokan_timer', 'gosokan_ktp', 'batu', 'cap_merek', 'karatase', 'ukuran_batu'];
const TYPE_EMAS = [{ id: 2, name: 'Logam Mulia' }, { id: 3, name: 'Retro' }, { id: 4, name: 'Perhiasan' }];

const getRoleBaseUrl = () => {
  const user = JSON.parse(localStorage.getItem("auth_user") || "{}");
  const role = user?.role?.toLowerCase() || "";
  return (role === 'petugas' || role === 'checker') ? `/${role}` : '';
};

const GadaiUlangEmasPage = () => {
  const navigate = useNavigate();
  const baseUrl = getRoleBaseUrl();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [nikInput, setNikInput] = useState("");
  const [nasabah, setNasabah] = useState(null);
  const [totalGadai, setTotalGadai] = useState(0);
  const [previewJatuhTempo, setPreviewJatuhTempo] = useState("-");

  const [detail, setDetail] = useState({
    tanggal_gadai: new Date().toISOString().split('T')[0],
    tenor: 15, // Default tenor 15
    type_id: 2,
    taksiran: "",
    uang_pinjaman: ""
  });

  const [barang, setBarang] = useState({
    nama_barang: "", kode_cap: "", karat: "", potongan_batu: "", berat: "",
    dokumen_pendukung: {}
  });

  // Fungsi hitung Jatuh Tempo
  const calculateDueDate = useCallback(() => {
    if (detail.tanggal_gadai) {
      const dt = new Date(detail.tanggal_gadai);
      dt.setDate(dt.getDate() + parseInt(detail.tenor));
      setPreviewJatuhTempo(dt.toLocaleDateString('id-ID', { 
        day: '2-digit', month: 'long', year: 'numeric' 
      }));
    }
  }, [detail.tanggal_gadai, detail.tenor]);

  useEffect(() => {
    calculateDueDate();
  }, [calculateDueDate]);

  const handleCheckNasabah = async () => {
    if (!nikInput) return alert("NIK wajib diisi!");
    setLoading(true);
    try {
      const res = await axiosInstance.post(`${baseUrl}/gadai/ulang-emas/check-nasabah`, { nik: nikInput });
      if (res.data.success) {
        setNasabah(res.data.data.nasabah);
        setTotalGadai(res.data.data.total_gadai);
        setStep(1);
      }
    } catch (err) { alert(err?.response?.data?.message || "Nasabah tidak ditemukan"); }
    finally { setLoading(false); }
  };

  const handleSubmitFinal = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("nasabah[nik]", nasabah.nik);
      // Tambahkan detail termasuk tenor
      Object.entries(detail).forEach(([k, v]) => fd.append(`detail[${k}]`, v));
      
      Object.entries(barang).forEach(([k, v]) => {
        if (k !== 'dokumen_pendukung') fd.append(`barang[${k}]`, v);
      });
      
      Object.entries(barang.dokumen_pendukung).forEach(([k, f]) => {
        if (f) fd.append(`barang[dokumen_pendukung][${k}]`, f);
      });

      await axiosInstance.post(`${baseUrl}/gadai/ulang-emas`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("Berhasil! Transaksi Repeat Order telah diajukan.");
      navigate("/data-nasabah");
    } catch (err) { alert(err?.response?.data?.message || "Gagal simpan"); }
    finally { setLoading(false); }
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 800, mx: "auto" }}>
      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardHeader 
          title={<Typography variant="h6" fontWeight="bold">Gadai Ulang Emas (Repeat Order)</Typography>}
          sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #eee' }}
        />
        <CardContent>
          {loading && <Box textAlign="center" py={3}><CircularProgress /></Box>}

          {/* STEP 0: CEK NIK */}
          {step === 0 && (
            <Paper variant="outlined" sx={{ p: { xs: 2, md: 4 }, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary" mb={2}>Masukkan NIK nasabah untuk mengambil data riwayat gadai emas.</Typography>
              <TextField 
                fullWidth 
                label="NIK Nasabah" 
                variant="outlined"
                value={nikInput} 
                onChange={e => setNikInput(e.target.value)} 
                sx={{ mb: 2 }} 
              />
              <Button variant="contained" fullWidth size="large" onClick={handleCheckNasabah}>Cek Riwayat</Button>
            </Paper>
          )}

          {/* STEP 1: FORM DETAIL */}
          {step === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Nasabah: <b>{nasabah.nama_lengkap}</b> | Gadai ke-<b>{totalGadai + 1}</b>
                </Alert>
              </Grid>
              
              {/* PEMILIHAN TENOR */}
              <Grid item xs={12}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" gutterBottom>PILIH TENOR (HARI)</Typography>
                <ToggleButtonGroup
                  fullWidth
                  value={detail.tenor}
                  exclusive
                  onChange={(_, val) => val && setDetail({...detail, tenor: val})}
                  color="primary"
                  sx={{ mt: 0.5 }}
                >
                  <ToggleButton value={15} sx={{ fontWeight: 'bold' }}>15 Hari</ToggleButton>
                  <ToggleButton value={30} sx={{ fontWeight: 'bold' }}>30 Hari</ToggleButton>
                </ToggleButtonGroup>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="date" label="Tgl Gadai" value={detail.tanggal_gadai} InputLabelProps={{shrink:true}} onChange={e => setDetail({...detail, tanggal_gadai: e.target.value})} />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#f0f7ff', textAlign: 'center', borderColor: '#cfe3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <CalendarMonthIcon color="primary" fontSize="small" />
                  <Box>
                    <Typography variant="caption" display="block" sx={{ lineHeight: 1 }}>Jatuh Tempo ({detail.tenor} Hari)</Typography>
                    <Typography variant="body1" fontWeight="bold" color="primary.main">{previewJatuhTempo}</Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth><InputLabel>Tipe Emas</InputLabel>
                  <Select value={detail.type_id} label="Tipe Emas" onChange={e => setDetail({...detail, type_id: e.target.value})}>
                    {TYPE_EMAS.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Nama Barang" value={barang.nama_barang} onChange={e => setBarang({...barang, nama_barang: e.target.value})} /></Grid>
              
              <Grid item xs={4}><TextField fullWidth label="Krt" placeholder="24k" value={barang.karat} onChange={e => setBarang({...barang, karat: e.target.value})} /></Grid>
              <Grid item xs={4}><TextField fullWidth label="Berat (gr)" type="number" value={barang.berat} onChange={e => setBarang({...barang, berat: e.target.value})} /></Grid>
              <Grid item xs={4}><TextField fullWidth label="Ptg Batu" placeholder="0.1" value={barang.potongan_batu} onChange={e => setBarang({...barang, potongan_batu: e.target.value})} /></Grid>

              <Grid item xs={12} sm={6}><TextField fullWidth label="Taksiran (Rp)" type="number" value={detail.taksiran} onChange={e => setDetail({...detail, taksiran: e.target.value})} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Pinjaman (Rp)" type="number" value={detail.uang_pinjaman} onChange={e => setDetail({...detail, uang_pinjaman: e.target.value})} /></Grid>

              <Grid item xs={12} mt={1}>
                <Divider sx={{ mb: 2 }}><Chip label="Upload Foto SOP" size="small" /></Divider>
                <Grid container spacing={1}>
                  {DOKUMEN_SOP_EMAS.map(d => (
                    <Grid item xs={6} sm={4} md={3} key={d}>
                      <Button 
                        variant={barang.dokumen_pendukung[d] ? "contained" : "outlined"} 
                        component="label" 
                        fullWidth 
                        size="small"
                        sx={{ height: 45, textTransform: 'capitalize', fontSize: '0.75rem' }}
                      >
                        {d.replace(/_/g, ' ')} {barang.dokumen_pendukung[d] ? '✅' : ''}
                        <input type="file" hidden onChange={e => setBarang({...barang, dokumen_pendukung: {...barang.dokumen_pendukung, [d]: e.target.files[0]}})} />
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              <Grid item xs={12} mt={2}>
                <Button fullWidth variant="contained" size="large" onClick={() => setStep(2)} sx={{ py: 1.5, borderRadius: 2 }}>Review Transaksi</Button>
              </Grid>
            </Grid>
          )}

          {/* STEP 2: REVIEW */}
          {step === 2 && (
            <Stack spacing={2}>
              <Alert severity="warning" sx={{ borderRadius: 2 }}>Pastikan berat dan taksiran sudah sesuai hasil timbangan terbaru.</Alert>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fcfcfc' }}>
                  <Typography variant="body2" color="text.secondary">Ringkasan Gadai ({detail.tenor} Hari):</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography>Taksiran:</Typography>
                    <Typography fontWeight="bold">Rp {Number(detail.taksiran).toLocaleString('id-ID')}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" mt={1}>
                    <Typography>Pinjaman:</Typography>
                    <Typography fontWeight="bold" color="primary">Rp {Number(detail.uang_pinjaman).toLocaleString('id-ID')}</Typography>
                  </Stack>
              </Paper>
              <Button fullWidth variant="contained" color="success" size="large" onClick={handleSubmitFinal}>Simpan & Ajukan</Button>
              <Button fullWidth variant="text" color="inherit" onClick={() => setStep(1)}>Kembali Edit</Button>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default GadaiUlangEmasPage;