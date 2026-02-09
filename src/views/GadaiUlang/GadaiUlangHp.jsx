import React, { useState, useEffect, useMemo } from "react";
import {
  Card, CardHeader, CardContent, TextField, Button,
  Grid, Stack, CircularProgress, FormControl, InputLabel, 
  Select, MenuItem, Paper, Divider, Autocomplete, Alert, Box, Typography,
  RadioGroup, FormControlLabel, Radio, FormLabel
} from "@mui/material";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

const DOKUMEN_SOP_HP = {
  Android: ['body', 'imei', 'about', 'akun', 'admin', 'cam_depan', 'cam_belakang', 'rusak'],
  Samsung: ['body', 'imei', 'about', 'samsung_account', 'admin', 'cam_depan', 'cam_belakang', 'galaxy_store'],
  iPhone: ['body', 'imei', 'about', 'icloud', 'battery', '3utools', 'iunlocker', 'cek_pencurian']
};

const getRoleBaseUrl = () => {
  const user = JSON.parse(localStorage.getItem("auth_user") || "{}");
  const role = user?.role?.toLowerCase() || "";
  return (role === 'petugas' || role === 'checker') ? `/${role}` : '';
};

const GadaiUlangHpPage = () => {
  const navigate = useNavigate();
  const baseUrl = getRoleBaseUrl();

  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  const [nasabah, setNasabah] = useState(null);
  const [nikInput, setNikInput] = useState("");
  const [totalGadai, setTotalGadai] = useState(0);
  const [gadaiBerjalan, setGadaiBerjalan] = useState(0);

  const [merkHp, setMerkHp] = useState([]);
  const [typeHpByMerk, setTypeHpByMerk] = useState([]);
  const [masterHarga, setMasterHarga] = useState(null); 
  const [kerusakanList, setKerusakanList] = useState([]);
  const [kelengkapanList, setKelengkapanList] = useState([]);
  const [allCategories, setAllCategories] = useState([]);

  const [detail, setDetail] = useState({
    tanggal_gadai: new Date().toISOString().split('T')[0], 
    type_id: "",
    tenor: 15 // DEFAULT 15 hari
  });

  const [barang, setBarang] = useState({
    nama_barang: "Android",
    merk_hp_id: "",
    type_hp_id: "", 
    grade_type: "",
    imei: "", 
    warna: "", 
    ram: "", 
    rom: "",
    kunci_password: "", 
    kunci_pin: "",      
    kunci_pola: "",     
    kerusakan: [], 
    kelengkapan: [], 
    dokumen_pendukung: {}
  });

  const normalizeData = (res) => {
    const data = res.data?.data || res.data || res;
    return Array.isArray(data) ? data : (data.items || []);
  };

  // Calculate Jatuh Tempo berdasarkan Tenor
  const calculateJatuhTempo = useMemo(() => {
    if (!detail.tanggal_gadai || !detail.tenor) return null;
    
    const tglGadai = new Date(detail.tanggal_gadai);
    const jatuhTempo = new Date(tglGadai);
    jatuhTempo.setDate(jatuhTempo.getDate() + parseInt(detail.tenor));
    
    return jatuhTempo.toISOString().split('T')[0];
  }, [detail.tanggal_gadai, detail.tenor]);

  // Fetch Master Data
  useEffect(() => {
    const fetchMaster = async () => {
      try {
        setLoading(true);
        const [m, kr, kl, t] = await Promise.all([
          axiosInstance.get(`${baseUrl}/merk-hp?per_page=100`),
          axiosInstance.get(`${baseUrl}/kerusakan?per_page=100`),
          axiosInstance.get(`${baseUrl}/kelengkapan?per_page=100`),
          axiosInstance.get(`${baseUrl}/type`)
        ]);

        const merkData = normalizeData(m);
        const kerusakanData = normalizeData(kr);
        const kelengkapanData = normalizeData(kl);
        const typesData = normalizeData(t);

        setMerkHp(merkData);
        setKerusakanList(kerusakanData);
        setKelengkapanList(kelengkapanData);
        setAllCategories(typesData);
        
        console.log("🔍 ALL TYPES DATA:", typesData);
        
        // FIX: Cari "Handphone" (sesuai database kamu)
        const hpType = typesData.find(x => {
          const nama = (x.nama_type || '').toLowerCase();
          return nama.includes('handphone') || 
                 nama.includes('hp') || 
                 nama.includes('smartphone');
        });
        
        console.log("🔍 HP Type Found:", hpType);
        
        if (hpType) {
          setDetail(prev => ({ 
            ...prev,
            type_id: hpType.id 
          }));
          console.log("✅ Type ID LANGSUNG di-set ke:", hpType.id);
        } else {
          console.warn("⚠️ Tidak ditemukan Type HP! Semua types:", typesData);
          setErrorMessage("Master Type HP belum tersedia. Hubungi admin.");
        }
      } catch (e) { 
        console.error("❌ Fetch Master Error:", e);
        setErrorMessage("Gagal memuat data master");
      } finally { 
        setLoading(false); 
      }
    };
    fetchMaster();
  }, [baseUrl]);

  // Check Nasabah
  const handleCheckNasabah = async () => {
    if (!nikInput) return alert("Masukkan NIK");
    
    // VALIDASI: Pastikan Type ID sudah ada sebelum lanjut
    if (!detail.type_id) {
      alert("❌ System Error: Type ID belum ter-load. Refresh halaman atau hubungi admin.");
      return;
    }
    
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await axiosInstance.post(`${baseUrl}/gadai/ulang/check-nasabah`, { nik: nikInput });
      if (res.data.success) {
        const { nasabah, total_gadai, gadai_berjalan } = res.data.data;
        setNasabah(nasabah);
        setTotalGadai(total_gadai);
        setGadaiBerjalan(gadai_berjalan);
        setStep(1);
      }
    } catch (err) { 
      setErrorMessage(err.response?.data?.message || "NIK tidak ditemukan");
    } finally { 
      setLoading(false); 
    }
  };

  // Fetch Type HP by Merk
  useEffect(() => {
    if (barang.merk_hp_id) {
      axiosInstance.get(`${baseUrl}/type-hp/by-merk/${barang.merk_hp_id}?per_page=1000`)
        .then(res => setTypeHpByMerk(normalizeData(res)))
        .catch(err => console.error("Fetch Type HP Error:", err));
    }
  }, [barang.merk_hp_id, baseUrl]);

  // Fetch Harga by Type HP
  useEffect(() => {
    if (barang.type_hp_id) {
      axiosInstance.get(`${baseUrl}/harga-hp/type/${barang.type_hp_id}`)
        .then(res => {
          const g = res.data?.data?.grades?.[0] || null;
          setMasterHarga(g);
          console.log("💰 Master Harga Loaded:", g);
        })
        .catch(err => console.error("Fetch Harga Error:", err));
    }
  }, [barang.type_hp_id, baseUrl]);

  // Calculate Taksiran & Pinjaman
  const calculation = useMemo(() => {
    if (!masterHarga || !barang.grade_type) return { taksiran: 0, pinjaman: 0, pengurang: 0 };
    
    const key = barang.grade_type.toLowerCase();
    const baseP = parseFloat(masterHarga[`grade_${key}`] || 0);
    const baseT = parseFloat(masterHarga[`taksiran_${key}`] || 0);
    
    const totalPersen = kerusakanList
      .filter(k => barang.kerusakan.includes(k.id))
      .reduce((acc, curr) => acc + parseFloat(curr.persen || 0), 0);
    
    const multiplier = Math.max(0, (100 - totalPersen) / 100);
    
    return {
      taksiran: Math.floor((baseT * multiplier) / 1000) * 1000,
      pinjaman: Math.floor((baseP * multiplier) / 1000) * 1000,
      pengurang: totalPersen
    };
  }, [masterHarga, barang.grade_type, barang.kerusakan, kerusakanList]);

  // Submit Handler
  const handleSubmit = async () => {
    // VALIDASI FRONTEND
    if (!detail.type_id) {
      alert("❌ Type ID belum dipilih! Hubungi admin.");
      return;
    }
    
    if (!barang.type_hp_id) {
      alert("❌ Tipe HP belum dipilih!");
      setStep(1);
      return;
    }

    if (!barang.grade_type) {
      alert("❌ Grade kondisi belum dipilih!");
      setStep(1);
      return;
    }

    if (!barang.merk_hp_id) {
      alert("❌ Merk HP belum dipilih!");
      setStep(1);
      return;
    }

    console.log("📤 Data yang akan dikirim:");
    console.log("- Nasabah ID:", nasabah.id);
    console.log("- Type ID (kategori):", detail.type_id);
    console.log("- Type HP ID (barang):", barang.type_hp_id);
    console.log("- Grade:", barang.grade_type);
    console.log("- Tenor:", detail.tenor, "hari");
    console.log("- Jatuh Tempo:", calculateJatuhTempo);

    setLoading(true);
    try {
      const fd = new FormData();
      
      // 1. Nasabah (FLAT)
      fd.append("nasabah[id]", nasabah.id);
      
      // 2. Detail (FLAT)
      fd.append("detail[tanggal_gadai]", detail.tanggal_gadai);
      fd.append("detail[type_id]", detail.type_id);
      fd.append("detail[tenor]", detail.tenor); // KIRIM TENOR

      // 3. Barang (FLAT)
      fd.append("barang[nama_barang]", barang.nama_barang);
      fd.append("barang[merk_hp_id]", barang.merk_hp_id);
      fd.append("barang[type_hp_id]", barang.type_hp_id);
      fd.append("barang[grade_type]", barang.grade_type);
      fd.append("barang[imei]", barang.imei || "");
      fd.append("barang[warna]", barang.warna || "");
      fd.append("barang[ram]", barang.ram || "");
      fd.append("barang[rom]", barang.rom || "");
      fd.append("barang[kunci_password]", barang.kunci_password || "");
      fd.append("barang[kunci_pin]", barang.kunci_pin || "");
      fd.append("barang[kunci_pola]", barang.kunci_pola || "");
      fd.append("barang[merk_name]", barang.nama_barang);

      // 4. Array Sync
      barang.kerusakan.forEach(id => fd.append("barang[kerusakan][]", id));
      barang.kelengkapan.forEach(id => fd.append("barang[kelengkapan][]", id));

      // 5. Dokumen SOP
      Object.entries(barang.dokumen_pendukung).forEach(([k, f]) => {
        if (f) fd.append(`barang[dokumen_pendukung][${k}]`, f);
      });

      // DEBUG - Log FormData
      console.log("=== 📋 FormData Content ===");
      for (let pair of fd.entries()) {
        console.log(pair[0], ':', pair[1]);
      }

      const response = await axiosInstance.post(`${baseUrl}/gadai/ulang`, fd, { 
        headers: { "Content-Type": "multipart/form-data" } 
      });

      console.log("✅ Response:", response.data);
      alert("✅ Berhasil disimpan dengan status PROSES!");
      navigate("/data-nasabah");

    } catch (err) { 
      console.error("❌ Submit Error:", err.response?.data);
      const errMsg = err.response?.data?.message || err.response?.data?.errors || "Gagal simpan";
      
      if (typeof errMsg === 'object') {
        const errStr = Object.entries(errMsg).map(([k, v]) => `${k}: ${v}`).join('\n');
        setErrorMessage(errStr);
      } else {
        setErrorMessage(errMsg);
      }
      
      setStep(1);
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <Card sx={{ p: 2 }}>
      <CardHeader 
        title="Gadai Ulang Handphone" 
        subheader="Repeat Order System" 
      />
      <CardContent>
        {loading && (
          <Box textAlign="center" py={2}>
            <CircularProgress />
          </Box>
        )}
        
        {errorMessage && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }} 
            onClose={() => setErrorMessage(null)}
          >
            {errorMessage}
          </Alert>
        )}

        {/* STEP 0: Check Nasabah */}
        {step === 0 && (
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">Cek NIK Nasabah</Typography>
            
            {/* Show Type ID status */}
            <Alert severity={detail.type_id ? "success" : "warning"} sx={{ my: 2 }}>
              <Typography variant="caption">
                System Status: Type ID = {detail.type_id || "⏳ Loading..."}
                {detail.type_id && " ✅ Ready"}
              </Typography>
            </Alert>
            
            <TextField 
              fullWidth 
              label="NIK" 
              value={nikInput} 
              onChange={e => setNikInput(e.target.value)} 
              sx={{ my: 2 }} 
              onKeyPress={(e) => e.key === 'Enter' && handleCheckNasabah()}
            />
            <Button 
              variant="contained" 
              fullWidth 
              onClick={handleCheckNasabah}
              disabled={loading || !detail.type_id}
            >
              {detail.type_id ? "Lanjut" : "⏳ Memuat System..."}
            </Button>
          </Paper>
        )}

        {/* STEP 1: Form Input */}
        {step === 1 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Alert severity="info">
                Nasabah: <b>{nasabah?.nama_lengkap}</b> | Kuota: {gadaiBerjalan}/3
              </Alert>
            </Grid>


            <Grid item xs={12}>
              <Divider>Detail Transaksi</Divider>
            </Grid>

            <Grid item xs={6}>
              <TextField 
                fullWidth 
                type="date" 
                label="Tgl Gadai" 
                value={detail.tanggal_gadai} 
                InputLabelProps={{shrink:true}} 
                onChange={e => setDetail({...detail, tanggal_gadai: e.target.value})} 
              />
            </Grid>

            {/* PILIHAN TENOR */}
            <Grid item xs={6}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Pilih Tenor</FormLabel>
                <RadioGroup
                  row
                  value={detail.tenor}
                  onChange={e => setDetail({...detail, tenor: parseInt(e.target.value)})}
                >
                  <FormControlLabel 
                    value={15} 
                    control={<Radio />} 
                    label="15 Hari" 
                  />
                  <FormControlLabel 
                    value={30} 
                    control={<Radio />} 
                    label="30 Hari" 
                  />
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* DISPLAY JATUH TEMPO */}
            <Grid item xs={12}>
              <Alert severity="info" icon={false}>
                <Typography variant="body2">
                  <b>Jatuh Tempo:</b> {calculateJatuhTempo ? 
                    new Date(calculateJatuhTempo).toLocaleDateString('id-ID', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) 
                    : '-'
                  } ({detail.tenor} hari dari tanggal gadai)
                </Typography>
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Divider>Spesifikasi HP</Divider>
            </Grid>

            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Merk</InputLabel>
                <Select 
                  value={barang.merk_hp_id} 
                  label="Merk" 
                  onChange={e => setBarang({...barang, merk_hp_id: e.target.value})}
                >
                  {merkHp.map(m => (
                    <MenuItem key={m.id} value={m.id}>{m.nama_merk}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={8}>
              <Autocomplete 
                options={typeHpByMerk} 
                getOptionLabel={(o) => o.nama_type || ""} 
                onChange={(_, v) => setBarang({...barang, type_hp_id: v?.id || ""})} 
                renderInput={(p) => <TextField {...p} label="Tipe HP" />} 
              />
            </Grid>

            <Grid item xs={4}>
              <TextField 
                fullWidth 
                label="IMEI" 
                value={barang.imei} 
                onChange={e => setBarang({...barang, imei: e.target.value})} 
              />
            </Grid>
            <Grid item xs={4}>
              <TextField 
                fullWidth 
                label="Warna" 
                value={barang.warna} 
                onChange={e => setBarang({...barang, warna: e.target.value})} 
              />
            </Grid>
            <Grid item xs={2}>
              <TextField 
                fullWidth 
                label="RAM" 
                value={barang.ram} 
                onChange={e => setBarang({...barang, ram: e.target.value})} 
              />
            </Grid>
            <Grid item xs={2}>
              <TextField 
                fullWidth 
                label="ROM" 
                value={barang.rom} 
                onChange={e => setBarang({...barang, rom: e.target.value})} 
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2">Grade Kondisi</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {['a_dus', 'a_tanpa_dus', 'b_dus', 'b_tanpa_dus', 'c_dus', 'c_tanpa_dus'].map(g => (
                  <Button 
                    key={g} 
                    variant={barang.grade_type === g ? "contained" : "outlined"} 
                    size="small" 
                    onClick={() => setBarang({...barang, grade_type: g})}
                  >
                    {g.replace(/_/g, ' ').toUpperCase()}
                  </Button>
                ))}
              </Stack>
            </Grid>

            <Grid item xs={4}>
              <TextField 
                fullWidth 
                label="Password" 
                value={barang.kunci_password} 
                onChange={e => setBarang({...barang, kunci_password: e.target.value})} 
              />
            </Grid>
            <Grid item xs={4}>
              <TextField 
                fullWidth 
                label="PIN" 
                value={barang.kunci_pin} 
                onChange={e => setBarang({...barang, kunci_pin: e.target.value})} 
              />
            </Grid>
            <Grid item xs={4}>
              <TextField 
                fullWidth 
                label="Pola" 
                value={barang.kunci_pola} 
                onChange={e => setBarang({...barang, kunci_pola: e.target.value})} 
              />
            </Grid>

            <Grid item xs={12}>
              <Divider>SOP Foto HP</Divider>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Select 
                fullWidth 
                size="small" 
                value={barang.nama_barang} 
                onChange={e => setBarang({...barang, nama_barang: e.target.value})}
              >
                {Object.keys(DOKUMEN_SOP_HP).map(k => (
                  <MenuItem key={k} value={k}>{k}</MenuItem>
                ))}
              </Select>
            </Grid>

            <Grid container item spacing={1}>
              {DOKUMEN_SOP_HP[barang.nama_barang]?.map(d => (
                <Grid item xs={6} sm={3} key={d}>
                  <Button 
                    variant={barang.dokumen_pendukung[d] ? "contained" : "outlined"} 
                    component="label" 
                    fullWidth 
                    size="small"
                  >
                    {d} {barang.dokumen_pendukung[d] ? '✅' : '⬆️'}
                    <input 
                      type="file" 
                      hidden 
                      onChange={e => setBarang({
                        ...barang, 
                        dokumen_pendukung: {
                          ...barang.dokumen_pendukung, 
                          [d]: e.target.files[0]
                        }
                      })} 
                    />
                  </Button>
                </Grid>
              ))}
            </Grid>

            <Grid item xs={12} mt={2}>
              <Button 
                fullWidth 
                variant="contained" 
                color="secondary" 
                onClick={() => setStep(2)} 
                disabled={!barang.grade_type || !barang.type_hp_id || !barang.merk_hp_id}
              >
                Kalkulasi & Review
              </Button>
            </Grid>
          </Grid>
        )}

        {/* STEP 2: Review & Submit */}
        {step === 2 && (
          <Stack spacing={2}>
            <Paper sx={{ p: 3, bgcolor: '#f5f5f5' }}>
              <Typography variant="h5" align="center" color="primary">
                Rp {calculation.pinjaman.toLocaleString('id-ID')}
              </Typography>
              <Typography align="center" variant="caption" display="block">
                Taksiran: Rp {calculation.taksiran.toLocaleString('id-ID')}
              </Typography>
              {calculation.pengurang > 0 && (
                <Typography align="center" variant="caption" color="error">
                  Pengurang Kerusakan: {calculation.pengurang}%
                </Typography>
              )}
            </Paper>

            <Alert severity="info">
              <Typography variant="body2">
                <b>Data yang akan disimpan:</b><br/>
                Nasabah: {nasabah?.nama_lengkap}<br/>
                Tanggal Gadai: {detail.tanggal_gadai}<br/>
                Tenor: {detail.tenor} Hari<br/>
                Jatuh Tempo: {calculateJatuhTempo}<br/>
                HP: {typeHpByMerk.find(t => t.id === barang.type_hp_id)?.nama_type}<br/>
                Grade: {barang.grade_type?.toUpperCase()}<br/>
                Pinjaman: Rp {calculation.pinjaman.toLocaleString('id-ID')}
              </Typography>
            </Alert>

            <Button 
              fullWidth 
              variant="contained" 
              color="success" 
              size="large" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Menyimpan..." : "Simpan Transaksi"}
            </Button>
            <Button 
              fullWidth 
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Kembali
            </Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default GadaiUlangHpPage;