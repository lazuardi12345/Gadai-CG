import React, { useState, useEffect, useCallback } from "react";
import {
  Card, CardHeader, CardContent, TextField, Button,
  Grid, Stack, CircularProgress, FormGroup, FormControlLabel,
  Checkbox, Box, Typography, FormControl, InputLabel, Select, MenuItem, Paper, Divider, Autocomplete, Alert
} from "@mui/material";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

// Standard Operating Procedure (SOP) Dokumen untuk HP berdasarkan jenisnya
const DOKUMEN_SOP_HP = {
  Android: ['body', 'imei', 'about', 'akun', 'admin', 'cam_depan', 'cam_belakang', 'rusak'],
  Samsung: ['body', 'imei', 'about', 'samsung_account', 'admin', 'cam_depan', 'cam_belakang', 'galaxy_store'],
  iPhone: ['body', 'imei', 'about', 'icloud', 'battery', 'utools', 'iunlocker', 'cek_pencurian']
};

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

const GadaiUlangHpPage = () => {
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
    taksiran: 0, 
    uang_pinjaman: 0,
    type_id: 1, // Handphone
    type_name: "Handphone",
    id: null
  });

  // Barang HP
  const [barang, setBarang] = useState({
    nama_barang: "", 
    kelengkapan: [], 
    kerusakan: [], 
    grade_hp_id: 0, 
    grade_type: "",
    imei: "", 
    warna: "", 
    kunci_password: "", 
    kunci_pin: "", 
    kunci_pola: "",
    ram: "", 
    rom: "", 
    type_hp_id: "", 
    merk_hp_id: "",
    dokumen_pendukung: {}
  });

  // Master Data
  const [merkHp, setMerkHp] = useState([]);
  const [typeHpByMerk, setTypeHpByMerk] = useState([]);
  const [gradeHp, setGradeHp] = useState(null);
  const [kerusakanList, setKerusakanList] = useState([]);
  const [kelengkapanList, setKelengkapanList] = useState([]);
  const [kerusakanNominal, setKerusakanNominal] = useState(0);
  const [kelengkapanNominal, setKelengkapanNominal] = useState(0);

  const baseUrl = getRoleBaseUrl();

  const normalizeDataArray = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res.data && Array.isArray(res.data)) return res.data;
    if (res.items && Array.isArray(res.items)) return res.items;
    return [];
  };

  // ===== Fetch Initial Data =====
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [merkRes, kerusRes, kelengkRes] = await Promise.all([
          axiosInstance.get(`${baseUrl}/merk-hp`).catch(e => e),
          axiosInstance.get(`${baseUrl}/kerusakan`).catch(e => e),
          axiosInstance.get(`${baseUrl}/kelengkapan`).catch(e => e)
        ]);

        setMerkHp(normalizeDataArray(merkRes?.data?.data ?? merkRes));
        setKerusakanList(normalizeDataArray(kerusRes?.data?.data ?? kerusRes));
        setKelengkapanList(normalizeDataArray(kelengkRes?.data?.data ?? kelengkRes));
      } catch (err) {
        console.error(err);
        alert("Gagal mengambil data awal.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [baseUrl]);

  // ===== CEK NASABAH BY NIK =====
  const handleCheckNasabah = async () => {
    if (!nikInput.trim()) {
      alert("NIK wajib diisi!");
      return;
    }

    try {
      setLoading(true);
      const res = await axiosInstance.post(`${baseUrl}/gadai/ulang/check-nasabah`, { nik: nikInput });

      if (res?.data?.success) {
        setNasabah(res.data.data.nasabah);
        setTotalGadai(res.data.data.total_gadai);
        setStep(1); // Lanjut ke step detail & barang
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

  const fetchTypeHpByMerk = useCallback(async (merkId) => {
    if (!merkId) return setTypeHpByMerk([]);
    try {
      setLoading(true);
      const res = await axiosInstance.get(`${baseUrl}/type-hp/by-merk/${merkId}?per_page=1000`);
      setTypeHpByMerk(normalizeDataArray(res?.data?.data ?? res));
    } catch (err) {
      console.error(err);
      setTypeHpByMerk([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    if (barang.merk_hp_id) {
      fetchTypeHpByMerk(barang.merk_hp_id);
    }
  }, [barang.merk_hp_id, fetchTypeHpByMerk]);

  useEffect(() => {
    if (!barang.type_hp_id) return setGradeHp(null);
    const fetchGradesByType = async () => {
      try {
        const res = await axiosInstance.get(`${baseUrl}/grade-hp/by-type/${barang.type_hp_id}`);
        const grade = Array.isArray(res.data.data) ? res.data.data[0] : null;
        setGradeHp(grade);
        if (grade) setBarang(prev => ({ ...prev, grade_hp_id: grade.id }));
      } catch (err) {
        console.error(err);
        setGradeHp(null);
      }
    };
    fetchGradesByType();
  }, [barang.type_hp_id, baseUrl]);

  // ===== Handlers =====
  const handleDetailChange = (e) => setDetail(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleBarangChange = (e) => setBarang(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleKerusakanToggle = (item) => {
    setBarang(prev => {
      const exists = prev.kerusakan.includes(item.id);
      const newKerusakan = exists ? prev.kerusakan.filter(id => id !== item.id) : [...prev.kerusakan, item.id];
      setKerusakanNominal(prevNom => exists ? prevNom - (item.nominal || 0) : prevNom + (item.nominal || 0));
      return { ...prev, kerusakan: newKerusakan };
    });
  };

  const handleKelengkapanChange = (id, nominal) => {
    setBarang(prev => {
      const exists = prev.kelengkapan.includes(id);
      const newKelengkapan = exists ? prev.kelengkapan.filter(v => v !== id) : [...prev.kelengkapan, id];
      setKelengkapanNominal(prevNom => exists ? prevNom - nominal : prevNom + nominal);
      return { ...prev, kelengkapan: newKelengkapan };
    });
  };

  const handleDokumenChange = (key, file) => {
    setBarang(prev => ({ ...prev, dokumen_pendukung: { ...prev.dokumen_pendukung, [key]: file } }));
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 2));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 0));

  const handleSubmitFinal = async () => {
    // Validasi
    if (!detail.tanggal_gadai || !detail.jatuh_tempo || !barang.nama_barang) {
      setStep(1);
      alert("Lengkapi tanggal gadai, jatuh tempo, dan nama/tipe barang.");
      return;
    }
    if (barang.nama_barang && !barang.merk_hp_id) {
      setStep(1);
      alert("Merk HP wajib diisi.");
      return;
    }
    if (barang.merk_hp_id && !barang.type_hp_id) {
      setStep(1);
      alert("Tipe HP wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();

      // NIK nasabah untuk identifikasi
      formData.append("nasabah[nik]", nasabah.nik);

      Object.entries(detail).forEach(([k, v]) => {
        if (v !== null && !['taksiran', 'uang_pinjaman', 'type_name'].includes(k)) {
          formData.append(`detail[${k}]`, v);
        }
      });

      Object.entries(barang).forEach(([k, v]) => {
        if (['dokumen_pendukung', 'kerusakan', 'kelengkapan'].includes(k)) return;
        if (Array.isArray(v)) {
          v.forEach(i => i && formData.append(`barang[${k}][]`, i));
        } else if (v !== null) {
          formData.append(`barang[${k}]`, v);
        }
      });

      Object.entries(barang.dokumen_pendukung || {}).forEach(([k, f]) => {
        if (f) formData.append(`barang[dokumen_pendukung][${k}]`, f);
      });

      barang.kerusakan?.forEach((id, i) => formData.append(`barang[kerusakan][${i}]`, id));
      barang.kelengkapan?.forEach((id, i) => formData.append(`barang[kelengkapan][${i}]`, id));
      
      if (barang.grade_hp_id) formData.append("barang[grade_hp_id]", barang.grade_hp_id);
      if (barang.grade_type) formData.append("barang[grade_type]", barang.grade_type);
      
      // Tambahkan merk_hp untuk dokumen
      if (barang.nama_barang) formData.append("barang[merk_hp]", barang.nama_barang);

      // Endpoint gadai ulang
      const res = await axiosInstance.post(`${baseUrl}/gadai/ulang`, formData, { 
        headers: { "Content-Type": "multipart/form-data" } 
      });

      if (!res?.data?.success) {
        alert(res?.data?.message || "Gagal menyimpan data.");
        return;
      }

      alert("Data gadai ulang berhasil disimpan dan taksiran dihitung otomatis.");
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
      <CardHeader title="Gadai Ulang Handphone" />
      <CardContent>
        {/* ================= STEP 0: CEK NIK NASABAH ================= */}
        {step === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Alert severity="info">
                Masukkan NIK nasabah yang sudah pernah terdaftar untuk melakukan gadai ulang.
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

        {/* ================= STEP 1: Detail Gadai & Barang HP ================= */}
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

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Detail Handphone</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            {/* Nama Barang (Jenis HP) */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Nama Barang (Jenis HP)</InputLabel>
                <Select 
                  name="nama_barang" 
                  value={barang.nama_barang} 
                  onChange={handleBarangChange} 
                  label="Nama Barang (Jenis HP)"
                >
                  {['Android', 'Samsung', 'iPhone'].map(n => (
                    <MenuItem key={n} value={n}>{n}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Merk HP */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Merk HP</InputLabel>
                <Select 
                  name="merk_hp_id" 
                  value={barang.merk_hp_id || ""} 
                  onChange={(e) => {
                    handleBarangChange(e);
                    setBarang(prev => ({ ...prev, type_hp_id: "", grade_hp_id: 0, grade_type: "" }));
                  }}
                  label="Merk HP"
                >
                  {merkHp.map(m => (
                    <MenuItem key={m.id} value={m.id}>{m.nama_merk}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Type HP dengan Search */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                fullWidth
                size="small"
                options={typeHpByMerk}
                getOptionLabel={(option) => option.nama_type || ""}
                value={typeHpByMerk.find(t => t.id === barang.type_hp_id) || null}
                onChange={(event, newValue) => {
                  setBarang(prev => ({ 
                    ...prev, 
                    type_hp_id: newValue?.id || "", 
                    grade_hp_id: 0, 
                    grade_type: "" 
                  }));
                }}
                disabled={typeHpByMerk.length === 0}
                renderInput={(params) => (
                  <TextField {...params} label="Type HP" placeholder="Cari type HP..." />
                )}
                noOptionsText="Tidak ada data type HP"
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </Grid>

            {/* Grade HP */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2">Grade HP</Typography>
                <FormGroup row>
                  {gradeHp && ['A', 'B', 'C'].map(g => {
                    const nominal = gradeHp[`harga_grade_${g.toLowerCase()}`] || 0;
                    const checked = barang.grade_type === g;
                    return (
                      <FormControlLabel 
                        key={g}
                        control={
                          <Checkbox 
                            checked={checked} 
                            onChange={() => setBarang(prev => ({ ...prev, grade_type: g }))} 
                          />
                        }
                        label={`${g} (${nominal.toLocaleString('id-ID')})`} 
                      />
                    );
                  })}
                </FormGroup>
              </Paper>
            </Grid>

            {/* Info HP */}
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="RAM" name="ram" value={barang.ram || ""} onChange={handleBarangChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="ROM" name="rom" value={barang.rom || ""} onChange={handleBarangChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="IMEI" name="imei" value={barang.imei || ""} onChange={handleBarangChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="WARNA" name="warna" value={barang.warna || ""} onChange={handleBarangChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="PASSWORD" name="kunci_password" value={barang.kunci_password || ""} onChange={handleBarangChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="PIN" name="kunci_pin" value={barang.kunci_pin || ""} onChange={handleBarangChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="POLA" name="kunci_pola" value={barang.kunci_pola || ""} onChange={handleBarangChange} />
            </Grid>

            {/* Kerusakan */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2">Kerusakan</Typography>
                <FormGroup row>
                  {kerusakanList.map(k => (
                    <FormControlLabel 
                      key={k.id}
                      control={
                        <Checkbox 
                          checked={barang.kerusakan.includes(k.id)} 
                          onChange={() => handleKerusakanToggle(k)} 
                        />
                      }
                      label={`${k.nama_kerusakan} (${(k.nominal || 0).toLocaleString('id-ID')})`} 
                    />
                  ))}
                </FormGroup>
              </Paper>
            </Grid>

            {/* Kelengkapan */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2">Kelengkapan</Typography>
                <FormGroup row>
                  {kelengkapanList.map(k => {
                    const nominal = k.nominal || 0;
                    const checked = barang.kelengkapan.includes(k.id);
                    return (
                      <FormControlLabel 
                        key={k.id}
                        control={
                          <Checkbox 
                            checked={checked} 
                            onChange={() => handleKelengkapanChange(k.id, nominal)} 
                          />
                        }
                        label={`${k.nama_kelengkapan} (${nominal.toLocaleString('id-ID')})`} 
                      />
                    );
                  })}
                </FormGroup>
              </Paper>
            </Grid>

            {/* Dokumen Pendukung */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2">
                  Dokumen Pendukung HP **{barang.nama_barang || '(Pilih Jenis HP)'}**
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {DOKUMEN_SOP_HP[barang.nama_barang]?.map(d => (
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
                Finalisasi Gadai Ulang Handphone & Preview Taksiran
              </Typography>
            </Grid>

            {/* Preview Taksiran */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Taksiran (Grade HP)"
                value={
                  gradeHp && barang.grade_type
                    ? (gradeHp[`harga_grade_${barang.grade_type.toLowerCase()}`] || 0)
                      .toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })
                    : (0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })
                }
                InputProps={{ readOnly: true }}
              />
            </Grid>

            {/* Preview Uang Pinjaman */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Uang Pinjaman (Taksiran - Kerusakan + Kelengkapan)"
                value={
                  gradeHp && barang.grade_type
                    ? ((gradeHp[`harga_grade_${barang.grade_type.toLowerCase()}`] || 0) + kelengkapanNominal - kerusakanNominal)
                      .toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })
                    : (0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })
                }
                InputProps={{ readOnly: true }}
              />
            </Grid>

            {/* Ringkasan Kerusakan & Kelengkapan */}
            <Grid item xs={12} sm={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2">Ringkasan Kerusakan (Pengurang)</Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {kerusakanList.filter(k => barang.kerusakan.includes(k.id)).map(k => (
                    <li key={k.id}>
                      {k.nama_kerusakan} — **{(k.nominal || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}**
                    </li>
                  ))}
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2">Ringkasan Kelengkapan (Penambah)</Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {kelengkapanList.filter(k => barang.kelengkapan.includes(k.id)).map(k => (
                    <li key={k.id}>
                      {k.nama_kelengkapan} — **{(k.nominal || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}**
                    </li>
                  ))}
                </Box>
              </Paper>
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
                  Simpan & Hitung Taksiran
                </Button>
              </Stack>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default GadaiUlangHpPage;