import React, { useState, useEffect, useMemo } from "react";
import {
  Card, CardHeader, CardContent, TextField, Button,
  Grid, Stack, CircularProgress, FormGroup, FormControlLabel,
  Checkbox, Box, Typography, FormControl, InputLabel, Select, MenuItem, Paper, Divider, Autocomplete, Alert, InputAdornment
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
  });

  const [barang, setBarang] = useState({
    nama_barang: "Android", // Default SOP
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

        setMerkHp(normalizeData(m));
        setKerusakanList(normalizeData(kr));
        setKelengkapanList(normalizeData(kl));
        const typesData = normalizeData(t);
        setAllCategories(typesData);
        
        const hpType = typesData.find(x => x.nama_type.toLowerCase().includes('hp'));
        if (hpType) setDetail(prev => ({ ...prev, type_id: hpType.id }));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchMaster();
  }, [baseUrl]);

  const handleCheckNasabah = async () => {
    if (!nikInput) return alert("Masukkan NIK");
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
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (barang.merk_hp_id) {
      axiosInstance.get(`${baseUrl}/type-hp/by-merk/${barang.merk_hp_id}?per_page=1000`)
        .then(res => setTypeHpByMerk(normalizeData(res)));
    }
  }, [barang.merk_hp_id, baseUrl]);

  useEffect(() => {
    if (barang.type_hp_id) {
      axiosInstance.get(`${baseUrl}/harga-hp/type/${barang.type_hp_id}`)
        .then(res => {
          const g = res.data?.data?.grades?.[0] || null;
          setMasterHarga(g);
        });
    }
  }, [barang.type_hp_id, baseUrl]);

  const calculation = useMemo(() => {
    if (!masterHarga || !barang.grade_type) return { taksiran: 0, pinjaman: 0, pengurang: 0 };
    const key = barang.grade_type.toLowerCase();
    const baseP = parseFloat(masterHarga[`grade_${key}`] || 0);
    const baseT = parseFloat(masterHarga[`taksiran_${key}`] || 0);
    const totalPersen = kerusakanList.filter(k => barang.kerusakan.includes(k.id)).reduce((acc, curr) => acc + parseFloat(curr.persen || 0), 0);
    const multiplier = Math.max(0, (100 - totalPersen) / 100);
    return {
      taksiran: Math.floor((baseT * multiplier) / 1000) * 1000,
      pinjaman: Math.floor((baseP * multiplier) / 1000) * 1000,
      pengurang: totalPersen
    };
  }, [masterHarga, barang.grade_type, barang.kerusakan, kerusakanList]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      // 1. Nasabah
      fd.append("nasabah[id]", nasabah.id);
      
      // 2. Detail
      fd.append("detail[tanggal_gadai]", detail.tanggal_gadai);
      fd.append("detail[type_id]", detail.type_id);

      // 3. Barang
      fd.append("barang[nama_barang]", barang.nama_barang); // Digunakan untuk SOP
      fd.append("barang[merk_hp_id]", barang.merk_hp_id);
      fd.append("barang[type_hp_id]", barang.type_hp_id);
      fd.append("barang[grade_type]", barang.grade_type);
      fd.append("barang[imei]", barang.imei);
      fd.append("barang[warna]", barang.warna);
      fd.append("barang[ram]", barang.ram);
      fd.append("barang[rom]", barang.rom);
      fd.append("barang[kunci_password]", barang.kunci_password);
      fd.append("barang[kunci_pin]", barang.kunci_pin);
      fd.append("barang[kunci_pola]", barang.kunci_pola);
      fd.append("barang[merk_name]", barang.nama_barang); // Helper SOP di BE

      // 4. Array Sync
      barang.kerusakan.forEach(id => fd.append("barang[kerusakan][]", id));
      barang.kelengkapan.forEach(id => fd.append("barang[kelengkapan][]", id));

      // 5. Dokumen SOP
      Object.entries(barang.dokumen_pendukung).forEach(([k, f]) => {
        if (f) fd.append(`barang[dokumen_pendukung][${k}]`, f);
      });

      await axiosInstance.post(`${baseUrl}/gadai/ulang`, fd, { 
        headers: { "Content-Type": "multipart/form-data" } 
      });

      alert("Berhasil disimpan dengan status PROSES!");
      navigate("/data-nasabah");
    } catch (err) { 
      setErrorMessage(err.response?.data?.message || "Gagal simpan");
      setStep(1);
    } finally { setLoading(false); }
  };

  return (
    <Card sx={{ p: 2 }}>
      <CardHeader title="Gadai Ulang Handphone" subheader="Repeat Order System" />
      <CardContent>
        {loading && <Box textAlign="center" py={2}><CircularProgress /></Box>}
        {errorMessage && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage(null)}>{errorMessage}</Alert>}

        {step === 0 && (
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">Cek NIK Nasabah</Typography>
            <TextField fullWidth label="NIK" value={nikInput} onChange={e => setNikInput(e.target.value)} sx={{ my: 2 }} />
            <Button variant="contained" fullWidth onClick={handleCheckNasabah}>Lanjut</Button>
          </Paper>
        )}

        {step === 1 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
                <Alert severity="info">Nasabah: <b>{nasabah?.nama_lengkap}</b> | Kuota: {gadaiBerjalan}/3</Alert>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="date" label="Tgl Gadai" value={detail.tanggal_gadai} InputLabelProps={{shrink:true}} onChange={e => setDetail({...detail, tanggal_gadai: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
               <Typography variant="caption" color="textSecondary">Jatuh Tempo Otomatis: 15 Hari</Typography>
            </Grid>

            <Grid item xs={12}><Divider>Spesifikasi HP</Divider></Grid>
            <Grid item xs={4}>
                <FormControl fullWidth><InputLabel>Merk</InputLabel>
                    <Select value={barang.merk_hp_id} label="Merk" onChange={e => setBarang({...barang, merk_hp_id: e.target.value})}>
                        {merkHp.map(m => <MenuItem key={m.id} value={m.id}>{m.nama_merk}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={8}>
                <Autocomplete options={typeHpByMerk} getOptionLabel={(o) => o.nama_type || ""} onChange={(_, v) => setBarang({...barang, type_hp_id: v?.id || ""})} renderInput={(p) => <TextField {...p} label="Tipe HP" />} />
            </Grid>

            <Grid item xs={12}>
                <Typography variant="subtitle2">Grade Kondisi</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                    {['a_dus', 'a_tanpa_dus', 'b_dus', 'b_tanpa_dus', 'c_dus', 'c_tanpa_dus'].map(g => (
                        <Button key={g} variant={barang.grade_type === g ? "contained" : "outlined"} size="small" onClick={() => setBarang({...barang, grade_type: g})}>
                            {g.replace(/_/g, ' ').toUpperCase()}
                        </Button>
                    ))}
                </Stack>
            </Grid>

            <Grid item xs={12}><Divider>SOP Foto HP</Divider></Grid>
            <Grid item xs={12} sm={4}>
                <Select fullWidth size="small" value={barang.nama_barang} onChange={e => setBarang({...barang, nama_barang: e.target.value})}>
                    {Object.keys(DOKUMEN_SOP_HP).map(k => <MenuItem key={k} value={k}>{k}</MenuItem>)}
                </Select>
            </Grid>
            <Grid container item spacing={1}>
                {DOKUMEN_SOP_HP[barang.nama_barang]?.map(d => (
                    <Grid item xs={6} sm={3} key={d}>
                        <Button variant={barang.dokumen_pendukung[d] ? "contained" : "outlined"} component="label" fullWidth size="small">
                            {d} {barang.dokumen_pendukung[d] ? '✅' : '⬆️'}
                            <input type="file" hidden onChange={e => setBarang({...barang, dokumen_pendukung: {...barang.dokumen_pendukung, [d]: e.target.files[0]}})} />
                        </Button>
                    </Grid>
                ))}
            </Grid>

            <Grid item xs={12} mt={2}>
              <Button fullWidth variant="contained" color="secondary" onClick={() => setStep(2)} disabled={!barang.grade_type || !barang.type_hp_id}>Kalkulasi & Review</Button>
            </Grid>
          </Grid>
        )}

        {step === 2 && (
          <Stack spacing={2}>
            <Paper sx={{ p: 3, bgcolor: '#f5f5f5' }}>
              <Typography variant="h5" align="center" color="primary">Rp {calculation.pinjaman.toLocaleString('id-ID')}</Typography>
              <Typography align="center" variant="caption" display="block">Taksiran: Rp {calculation.taksiran.toLocaleString('id-ID')}</Typography>
            </Paper>
            <Button fullWidth variant="contained" color="success" size="large" onClick={handleSubmit}>Simpan Transaksi</Button>
            <Button fullWidth onClick={() => setStep(1)}>Kembali</Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default GadaiUlangHpPage;