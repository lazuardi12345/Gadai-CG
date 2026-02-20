import React, { useState, useEffect, useMemo } from "react";
import {
  Card, CardHeader, CardContent, TextField, Button,
  Grid, Stack, CircularProgress, FormControl, InputLabel, 
  Select, MenuItem, Paper, Divider, Autocomplete, Alert, Box, Typography,
  RadioGroup, FormControlLabel, Radio, FormLabel, Checkbox, FormGroup
} from "@mui/material";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

const DOKUMEN_SOP_HP = {
  Android: ['body', 'imei', 'about', 'akun', 'admin', 'cam_depan', 'cam_belakang', 'rusak'],
  Samsung: ['body', 'imei', 'about', 'samsung_account', 'admin', 'cam_depan', 'cam_belakang', 'galaxy_store'],
  iPhone: ['body', 'imei', 'about', 'icloud', 'battery', 'utools', 'iunlocker', 'cek_pencurian']
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
  const [gadaiBerjalan, setGadaiBerjalan] = useState(0);

  const [merkHp, setMerkHp] = useState([]);
  const [typeHpByMerk, setTypeHpByMerk] = useState([]);
  const [masterHarga, setMasterHarga] = useState(null); 
  const [kerusakanList, setKerusakanList] = useState([]);
  const [kelengkapanList, setKelengkapanList] = useState([]);

  const [detail, setDetail] = useState({
    tanggal_gadai: new Date().toISOString().split('T')[0], 
    type_id: "",
    tenor: 15 
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
    if (res.data?.data?.data && Array.isArray(res.data.data.data)) return res.data.data.data;
    const data = res.data?.data || res.data || res;
    return Array.isArray(data) ? data : (data.items || []);
  };

  const calculateJatuhTempo = useMemo(() => {
    if (!detail.tanggal_gadai || !detail.tenor) return null;
    const tglGadai = new Date(detail.tanggal_gadai);
    const jatuhTempo = new Date(tglGadai);
    jatuhTempo.setDate(jatuhTempo.getDate() + parseInt(detail.tenor));
    return jatuhTempo.toISOString().split('T')[0];
  }, [detail.tanggal_gadai, detail.tenor]);

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
        const hpType = typesData.find(x => x.nama_type?.toLowerCase().includes('hp') || x.nama_type?.toLowerCase().includes('handphone'));
        if (hpType) setDetail(prev => ({ ...prev, type_id: hpType.id }));
      } catch (e) { 
        setErrorMessage("Gagal memuat data master");
      } finally { setLoading(false); }
    };
    fetchMaster();
  }, [baseUrl]);

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
          const paginatedData = res.data?.data?.data || [];
          if (paginatedData.length > 0) {
            setMasterHarga(paginatedData[0].grades?.[0] || null);
          }
        });
    }
  }, [barang.type_hp_id, baseUrl]);

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

  // Fungsi Toggle untuk Checkbox Kerusakan & Kelengkapan
  const handleToggle = (id, field) => {
    const current = barang[field];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    setBarang({ ...barang, [field]: next });
  };

  const handleCheckNasabah = async () => {
    if (!nikInput) return alert("Masukkan NIK");
    setLoading(true);
    try {
      const res = await axiosInstance.post(`${baseUrl}/gadai/ulang/check-nasabah`, { nik: nikInput });
      if (res.data.success) {
        setNasabah(res.data.data.nasabah);
        setGadaiBerjalan(res.data.data.gadai_berjalan);
        setStep(1);
      }
    } catch (err) { 
      setErrorMessage(err.response?.data?.message || "NIK tidak ditemukan");
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("nasabah[id]", nasabah.id);
      fd.append("detail[tanggal_gadai]", detail.tanggal_gadai);
      fd.append("detail[type_id]", detail.type_id);
      fd.append("detail[tenor]", detail.tenor);
      fd.append("detail[jatuh_tempo]", calculateJatuhTempo);

      Object.entries(barang).forEach(([k, v]) => {
        if (['dokumen_pendukung', 'kerusakan', 'kelengkapan'].includes(k)) return;
        fd.append(`barang[${k}]`, v);
      });

      // Append Array Kerusakan & Kelengkapan
      barang.kerusakan.forEach((id, i) => fd.append(`barang[kerusakan][${i}]`, id));
      barang.kelengkapan.forEach((id, i) => fd.append(`barang[kelengkapan][${i}]`, id));

      Object.entries(barang.dokumen_pendukung).forEach(([k, f]) => {
        if (f) fd.append(`barang[dokumen_pendukung][${k}]`, f);
      });

      await axiosInstance.post(`${baseUrl}/gadai/ulang`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      alert("✅ Berhasil disimpan!");
      navigate("/data-nasabah");
    } catch (err) { 
      setErrorMessage(err.response?.data?.message || "Gagal simpan");
    } finally { setLoading(false); }
  };

  return (
    <Card sx={{ p: 2 }}>
      <CardHeader title="Gadai Ulang Handphone" subheader="Repeat Order System" />
      <CardContent>
        {errorMessage && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>{errorMessage}</Alert>}

        {step === 0 && (
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <TextField fullWidth label="NIK" value={nikInput} onChange={e => setNikInput(e.target.value)} sx={{ mb: 2 }} onKeyPress={(e) => e.key === 'Enter' && handleCheckNasabah()} />
            <Button variant="contained" fullWidth onClick={handleCheckNasabah} disabled={loading}>{loading ? <CircularProgress size={24}/> : "Lanjut"}</Button>
          </Paper>
        )}

        {step === 1 && (
          <Grid container spacing={2}>
            <Grid item xs={12}><Alert severity="info">Nasabah: <b>{nasabah?.nama_lengkap}</b> | Kuota: {gadaiBerjalan}/3</Alert></Grid>
            
            <Grid item xs={6}><TextField fullWidth type="date" label="Tgl Gadai" value={detail.tanggal_gadai} InputLabelProps={{shrink:true}} onChange={e => setDetail({...detail, tanggal_gadai: e.target.value})} /></Grid>
            <Grid item xs={6}>
               <FormControl component="fieldset">
                <FormLabel component="legend">Tenor</FormLabel>
                <RadioGroup row value={detail.tenor} onChange={e => setDetail({...detail, tenor: parseInt(e.target.value)})}>
                  <FormControlLabel value={15} control={<Radio />} label="15 Hari" />
                  <FormControlLabel value={30} control={<Radio />} label="30 Hari" />
                </RadioGroup>
              </FormControl>
            </Grid>

            <Grid item xs={12}><Divider>Spesifikasi HP</Divider></Grid>
            <Grid item xs={4}>
              <FormControl fullWidth><InputLabel>Merk</InputLabel><Select value={barang.merk_hp_id} label="Merk" onChange={e => setBarang({...barang, merk_hp_id: e.target.value})}>
                {merkHp.map(m => <MenuItem key={m.id} value={m.id}>{m.nama_merk}</MenuItem>)}
              </Select></FormControl>
            </Grid>
            <Grid item xs={8}><Autocomplete options={typeHpByMerk} getOptionLabel={(o) => o.nama_type || ""} onChange={(_, v) => setBarang({...barang, type_hp_id: v?.id || ""})} renderInput={(p) => <TextField {...p} label="Tipe HP" />} /></Grid>

            <Grid item xs={4}><TextField fullWidth label="IMEI" value={barang.imei} onChange={e => setBarang({...barang, imei: e.target.value})} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Warna" value={barang.warna} onChange={e => setBarang({...barang, warna: e.target.value})} /></Grid>
            <Grid item xs={2}><TextField fullWidth label="RAM" value={barang.ram} onChange={e => setBarang({...barang, ram: e.target.value})} /></Grid>
            <Grid item xs={2}><TextField fullWidth label="ROM" value={barang.rom} onChange={e => setBarang({...barang, rom: e.target.value})} /></Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2">Grade Kondisi</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {['a_dus', 'a_tanpa_dus', 'b_dus', 'b_tanpa_dus', 'c_dus', 'c_tanpa_dus'].map(g => (
                  <Button key={g} variant={barang.grade_type === g ? "contained" : "outlined"} size="small" onClick={() => setBarang({...barang, grade_type: g})}>{g.replace(/_/g, ' ').toUpperCase()}</Button>
                ))}
              </Stack>
            </Grid>

            {/* --- KELENGKAPAN --- */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="primary">Kelengkapan</Typography>
              <FormGroup row>
                {kelengkapanList.map(k => (
                  <FormControlLabel key={k.id} control={<Checkbox size="small" checked={barang.kelengkapan.includes(k.id)} onChange={() => handleToggle(k.id, 'kelengkapan')} />} label={k.nama_kelengkapan} />
                ))}
              </FormGroup>
            </Grid>

            {/* --- KERUSAKAN --- */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="error">Kerusakan (Potongan %)</Typography>
              <FormGroup row>
                {kerusakanList.map(k => (
                  <FormControlLabel key={k.id} control={<Checkbox size="small" checked={barang.kerusakan.includes(k.id)} onChange={() => handleToggle(k.id, 'kerusakan')} />} label={`${k.nama_kerusakan} (${k.persen}%)`} />
                ))}
              </FormGroup>
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
            <Paper sx={{ p: 3, bgcolor: '#f5f5f5', textAlign: 'center' }}>
              <Typography variant="h5" color="primary">Rp {calculation.pinjaman.toLocaleString('id-ID')}</Typography>
              <Typography variant="caption" display="block">Taksiran: Rp {calculation.taksiran.toLocaleString('id-ID')}</Typography>
              {calculation.pengurang > 0 && <Typography variant="caption" color="error">Potongan Kerusakan: {calculation.pengurang}%</Typography>}
            </Paper>
            <Button fullWidth variant="contained" color="success" onClick={handleSubmit} disabled={loading}>Simpan Transaksi</Button>
            <Button fullWidth onClick={() => setStep(1)}>Kembali</Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default GadaiUlangHpPage;