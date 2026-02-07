import React, { useState, useEffect } from "react";
import {
  Card, CardHeader, CardContent, TextField, Button,
  Grid, Stack, CircularProgress, Box, Typography, 
  FormControl, InputLabel, Select, MenuItem, Paper, Divider, Alert
} from "@mui/material";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

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
    type_id: 2,
    taksiran: "",
    uang_pinjaman: ""
  });

  const [barang, setBarang] = useState({
    nama_barang: "", kode_cap: "", karat: "", potongan_batu: "", berat: "",
    dokumen_pendukung: {}
  });

  // Sinkronisasi Logic Tenor 15 Hari sesuai BE
  useEffect(() => {
    if (detail.tanggal_gadai) {
      const dt = new Date(detail.tanggal_gadai);
      dt.setDate(dt.getDate() + 15);
      setPreviewJatuhTempo(dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }));
    }
  }, [detail.tanggal_gadai]);

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
      alert("Berhasil! Status transaksi saat ini: PROSES.");
      navigate("/data-nasabah");
    } catch (err) { alert(err?.response?.data?.message || "Gagal simpan"); }
    finally { setLoading(false); }
  };

  return (
    <Card sx={{ p: 2 }}>
      <CardHeader title="Gadai Ulang Emas (Repeat Order)" />
      <CardContent>
        {loading && <Box textAlign="center" py={3}><CircularProgress /></Box>}

        {step === 0 && (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <TextField fullWidth label="NIK Nasabah" value={nikInput} onChange={e => setNikInput(e.target.value)} sx={{ mb: 2 }} />
            <Button variant="contained" fullWidth onClick={handleCheckNasabah}>Cek Riwayat</Button>
          </Paper>
        )}

        {step === 1 && (
          <Grid container spacing={2}>
            <Grid item xs={12}><Alert severity="success">Nasabah: <b>{nasabah.nama_lengkap}</b> | Gadai ke-{totalGadai + 1}</Alert></Grid>
            
            <Grid item xs={6}>
              <TextField fullWidth type="date" label="Tgl Gadai" value={detail.tanggal_gadai} InputLabelProps={{shrink:true}} onChange={e => setDetail({...detail, tanggal_gadai: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <Paper variant="outlined" sx={{ p: 1, bgcolor: '#f5f5f5', textAlign: 'center' }}>
                <Typography variant="caption" display="block">Jatuh Tempo (Otomatis 15 Hari)</Typography>
                <Typography variant="body1" fontWeight="bold" color="primary">{previewJatuhTempo}</Typography>
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
            
            <Grid item xs={4}><TextField fullWidth label="Karat" value={barang.karat} onChange={e => setBarang({...barang, karat: e.target.value})} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Berat (gr)" type="number" value={barang.berat} onChange={e => setBarang({...barang, berat: e.target.value})} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Potongan Batu" value={barang.potongan_batu} onChange={e => setBarang({...barang, potongan_batu: e.target.value})} /></Grid>

            <Grid item xs={6}><TextField fullWidth label="Taksiran (Rp)" type="number" value={detail.taksiran} onChange={e => setDetail({...detail, taksiran: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Pinjaman (Rp)" type="number" value={detail.uang_pinjaman} onChange={e => setDetail({...detail, uang_pinjaman: e.target.value})} /></Grid>

            <Grid item xs={12} mt={2}>
              <Typography variant="subtitle2" gutterBottom>Upload SOP Foto</Typography>
              <Grid container spacing={1}>
                {DOKUMEN_SOP_EMAS.map(d => (
                  <Grid item xs={6} sm={3} key={d}>
                    <Button variant={barang.dokumen_pendukung[d] ? "contained" : "outlined"} component="label" fullWidth size="small">
                      {d.replace('_', ' ')} {barang.dokumen_pendukung[d] ? '✅' : '⬆️'}
                      <input type="file" hidden onChange={e => setBarang({...barang, dokumen_pendukung: {...barang.dokumen_pendukung, [d]: e.target.files[0]}})} />
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            <Grid item xs={12} mt={3}>
              <Button fullWidth variant="contained" size="large" onClick={() => setStep(2)}>Review Transaksi</Button>
            </Grid>
          </Grid>
        )}

        {step === 2 && (
          <Stack spacing={2}>
            <Alert severity="warning">Pastikan data taksiran dan berat sudah benar sebelum disimpan.</Alert>
            <Paper sx={{ p: 2 }}>
                <Typography>Taksiran: <b>Rp {Number(detail.taksiran).toLocaleString('id-ID')}</b></Typography>
                <Typography>Pinjaman: <b>Rp {Number(detail.uang_pinjaman).toLocaleString('id-ID')}</b></Typography>
            </Paper>
            <Button fullWidth variant="contained" color="success" onClick={handleSubmitFinal}>Simpan & Kirim Notif</Button>
            <Button fullWidth onClick={() => setStep(1)}>Ubah Data</Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default GadaiUlangEmasPage;