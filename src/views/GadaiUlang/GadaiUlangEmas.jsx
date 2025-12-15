import React, { useState, useEffect } from "react";
import {
  Card, CardHeader, CardContent, TextField, Button,
  Grid, Stack, CircularProgress, Box, Typography, 
  FormControl, InputLabel, Select, MenuItem, Paper, Divider, Alert
} from "@mui/material";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

// Dokumen SOP untuk Emas
const DOKUMEN_SOP_EMAS = [
  'emas_timbangan',
  'gosokan_timer',
  'gosokan_ktp',
  'batu',
  'cap_merek',
  'karatase',
  'ukuran_batu'
];

// Type Emas
const TYPE_EMAS = [
  { id: 2, name: 'Logam Mulia' },
  { id: 3, name: 'Retro' },
  { id: 4, name: 'Perhiasan' }
];

const getRoleBaseUrl = () => {
  const user = JSON.parse(localStorage.getItem("auth_user"));
  const role = user?.role?.toLowerCase() || "";

  switch (role) {
    case 'petugas': return '/petugas';
    case 'checker': return '/checker';
    case 'hm': return '';
    default: return '';
  }
};

const GadaiUlangEmasPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0: Cek NIK, 1: Detail & Barang, 2: Finalisasi
  const [loading, setLoading] = useState(false);

  // Data Nasabah (dari database)
  const [nasabah, setNasabah] = useState(null);
  const [nikInput, setNikInput] = useState("");
  const [totalGadai, setTotalGadai] = useState(0);

  // Detail Gadai
  const [detail, setDetail] = useState({
    tanggal_gadai: "",
    jatuh_tempo: "",
    type_id: 2, // Default: Logam Mulia
    taksiran: 0,
    uang_pinjaman: 0
  });

  // Barang Emas
  const [barang, setBarang] = useState({
    nama_barang: "",
    kode_cap: "",
    karat: "",
    potongan_batu: "",
    berat: "",
    dokumen_pendukung: {}
  });

  const baseUrl = getRoleBaseUrl();

  // ===== CEK NASABAH BY NIK =====
  const handleCheckNasabah = async () => {
    if (!nikInput.trim()) {
      alert("NIK wajib diisi!");
      return;
    }

    try {
      setLoading(true);
      const res = await axiosInstance.post(`${baseUrl}/gadai/ulang-emas/check-nasabah`, { nik: nikInput });

      if (res?.data?.success) {
        setNasabah(res.data.data.nasabah);
        setTotalGadai(res.data.data.total_gadai);
        setStep(1);
      } else {
        alert(res?.data?.message || "Nasabah tidak ditemukan.");
      }
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Nasabah dengan NIK tersebut tidak ditemukan.");
    } finally {
      setLoading(false);
    }
  };

  // ===== Handlers =====
  const handleDetailChange = (e) => setDetail(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleBarangChange = (e) => setBarang(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleDokumenChange = (key, file) => {
    setBarang(prev => ({ ...prev, dokumen_pendukung: { ...prev.dokumen_pendukung, [key]: file } }));
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 2));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 0));

  const handleSubmitFinal = async () => {
    // Validasi
    if (!detail.tanggal_gadai || !detail.jatuh_tempo) {
      setStep(1);
      alert("Lengkapi tanggal gadai dan jatuh tempo.");
      return;
    }
    if (!barang.nama_barang || !barang.karat || !barang.berat) {
      setStep(1);
      alert("Nama barang, karat, dan berat wajib diisi.");
      return;
    }
    if (!detail.taksiran || detail.taksiran <= 0) {
      setStep(1);
      alert("Taksiran harus diisi dan lebih dari 0.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();

      // NIK nasabah untuk identifikasi
      formData.append("nasabah[nik]", nasabah.nik);

      // Detail gadai
      Object.entries(detail).forEach(([k, v]) => {
        if (v !== null) {
          formData.append(`detail[${k}]`, v);
        }
      });

      // Barang emas
      Object.entries(barang).forEach(([k, v]) => {
        if (k === 'dokumen_pendukung') return;
        if (v !== null && v !== '') {
          formData.append(`barang[${k}]`, v);
        }
      });

      // Dokumen pendukung
      Object.entries(barang.dokumen_pendukung || {}).forEach(([k, f]) => {
        if (f) formData.append(`barang[dokumen_pendukung][${k}]`, f);
      });

      // Endpoint gadai ulang emas
      const res = await axiosInstance.post(`${baseUrl}/gadai/ulang-emas`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (!res?.data?.success) {
        alert(res?.data?.message || "Gagal menyimpan data.");
        return;
      }

      alert("Data gadai ulang emas berhasil disimpan!");
      navigate("/data-nasabah");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: '80vh' }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Card sx={{ p: 2 }}>
      <CardHeader title="Gadai Ulang Emas " />
      <CardContent>
        {/* ================= STEP 0: CEK NIK NASABAH ================= */}
        {step === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Alert severity="info">
                Masukkan NIK nasabah yang sudah pernah terdaftar untuk melakukan gadai ulang emas.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Masukkan NIK Nasabah"
                value={nikInput}
                onChange={(e) => setNikInput(e.target.value)}
                placeholder="Contoh: 3201234567890123"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleCheckNasabah();
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" justifyContent="flex-end">
                <Button
                  variant="contained"
                  onClick={handleCheckNasabah}
                  disabled={!nikInput.trim()}
                >
                  Cek Data Nasabah
                </Button>
              </Stack>
            </Grid>
          </Grid>
        )}

        {/* ================= STEP 1: Detail Gadai & Barang Emas ================= */}
        {step === 1 && nasabah && (
          <Grid container spacing={2}>
            {/* Info Nasabah */}
            <Grid item xs={12}>
              <Alert severity="success">
                <Typography variant="subtitle2">Data Nasabah Ditemukan:</Typography>
                <Typography variant="body2">
                  <strong>Nama:</strong> {nasabah.nama_lengkap} | <strong>NIK:</strong> {nasabah.nik} |
                  <strong> Total Gadai Sebelumnya:</strong> {totalGadai} kali
                  {totalGadai > 0 && (
                    <span> (Gadai selanjutnya adalah yang ke-{totalGadai + 1})</span>
                  )}
                </Typography>
              </Alert>
            </Grid>

            {/* Detail Gadai */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Detail Gadai</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Tanggal Gadai"
                name="tanggal_gadai"
                type="date"
                value={detail.tanggal_gadai}
                onChange={handleDetailChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" disabled={!detail.tanggal_gadai}>
                <InputLabel>Jatuh Tempo</InputLabel>
                <Select
                  name="jatuh_tempo"
                  value={detail.jatuh_tempo || ""}
                  onChange={handleDetailChange}
                  label="Jatuh Tempo"
                >
                  {[15, 30].map(d => {
                    const dt = new Date(detail.tanggal_gadai);
                    dt.setDate(dt.getDate() + d);
                    const value = isNaN(dt.getTime()) ? "" : dt.toISOString().split('T')[0];
                    return (
                      <MenuItem key={d} value={value}>
                        {d} Hari — {isNaN(dt.getTime()) ? '-' : dt.toLocaleDateString('id-ID')}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            {/* Type Emas */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipe Emas</InputLabel>
                <Select
                  name="type_id"
                  value={detail.type_id}
                  onChange={handleDetailChange}
                  label="Tipe Emas"
                >
                  {TYPE_EMAS.map(t => (
                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Detail Barang Emas</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            {/* Info Emas */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Nama Barang"
                name="nama_barang"
                value={barang.nama_barang}
                onChange={handleBarangChange}
                placeholder="Contoh: Cincin Emas"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Kode Cap"
                name="kode_cap"
                value={barang.kode_cap}
                onChange={handleBarangChange}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Karat"
                name="karat"
                value={barang.karat}
                onChange={handleBarangChange}
                placeholder="Contoh: 24K"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Berat (gram)"
                name="berat"
                type="number"
                value={barang.berat}
                onChange={handleBarangChange}
                placeholder="Contoh: 5.5"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Potongan Batu (gram)"
                name="potongan_batu"
                type="number"
                value={barang.potongan_batu}
                onChange={handleBarangChange}
                placeholder="Contoh: 0.5"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Taksiran & Pinjaman</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Taksiran (Rp)"
                name="taksiran"
                type="number"
                value={detail.taksiran}
                onChange={handleDetailChange}
                placeholder="Contoh: 5000000"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Uang Pinjaman (Rp)"
                name="uang_pinjaman"
                type="number"
                value={detail.uang_pinjaman}
                onChange={handleDetailChange}
                placeholder="Contoh: 4500000"
              />
            </Grid>

            {/* Dokumen Pendukung */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Dokumen Pendukung Emas
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {DOKUMEN_SOP_EMAS.map(d => (
                    <Grid item xs={12} sm={4} key={d}>
                      <Button variant="contained" component="label" fullWidth>
                        Upload {d.toUpperCase().replace(/_/g, ' ')}
                        <input
                          type="file"
                          hidden
                          onChange={e => handleDokumenChange(d, e.target.files?.[0])}
                        />
                      </Button>
                      {barang.dokumen_pendukung[d] && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                          {barang.dokumen_pendukung[d].name}
                        </Typography>
                      )}
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>

            {/* Navigation */}
            <Grid item xs={12}>
              <Stack direction="row" justifyContent="space-between">
                <Button variant="outlined" onClick={prevStep}>Kembali ke Cek NIK</Button>
                <Button variant="contained" onClick={nextStep}>Finalisasi</Button>
              </Stack>
            </Grid>
          </Grid>
        )}

        {/* ================= STEP 2: Finalisasi ================= */}
        {step === 2 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" align="center" sx={{ mb: 3 }}>
                Finalisasi Gadai Ulang Emas & Review Data
              </Typography>
            </Grid>

            {/* Preview Data */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Ringkasan Data Gadai</Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Tipe Emas:</strong> {TYPE_EMAS.find(t => t.id === detail.type_id)?.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Nama Barang:</strong> {barang.nama_barang}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Karat:</strong> {barang.karat} | <strong>Berat:</strong> {barang.berat} gram
                  </Typography>
                  {barang.potongan_batu && (
                    <Typography variant="body2">
                      <strong>Potongan Batu:</strong> {barang.potongan_batu} gram
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Preview Taksiran */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Taksiran"
                value={parseInt(detail.taksiran || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            {/* Preview Uang Pinjaman */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Uang Pinjaman"
                value={parseInt(detail.uang_pinjaman || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            {/* Info Total Gadai */}
            <Grid item xs={12}>
              <Alert severity="info">
                Setelah disimpan, ini akan menjadi gadai ke-<strong>{totalGadai + 1}</strong> untuk nasabah <strong>{nasabah?.nama_lengkap}</strong>
              </Alert>
            </Grid>

            {/* Navigation */}
            <Grid item xs={12}>
              <Stack direction="row" justifyContent="space-between">
                <Button variant="outlined" onClick={prevStep}>Kembali</Button>
                <Button variant="contained" onClick={handleSubmitFinal}>
                  Simpan Data Gadai Emas
                </Button>
              </Stack>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default GadaiUlangEmasPage;