import React, { useState, useEffect, useMemo } from "react";
import {
  Card, CardHeader, CardContent, TextField, Button,
  Grid, Stack, CircularProgress, FormGroup, FormControlLabel,
  Checkbox, Box, Typography, FormControl, InputLabel, Select, MenuItem, Paper, Divider, Autocomplete, Alert
} from "@mui/material";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

const DOKUMEN_SOP_HP = {
  Android: ['body', 'imei', 'about', 'akun', 'admin', 'cam_depan', 'cam_belakang', 'rusak'],
  Samsung: ['body', 'imei', 'about', 'samsung_account', 'admin', 'cam_depan', 'cam_belakang', 'galaxy_store'],
  iPhone: ['body', 'imei', 'about', 'icloud', 'battery', '3utools', 'iunlocker', 'cek_pencurian']
};

const getRoleBaseUrl = () => {
  const user = JSON.parse(localStorage.getItem("auth_user"));
  const role = user?.role?.toLowerCase() || "";
  return (role === 'petugas' || role === 'checker') ? `/${role}` : '';
};

const GadaiUlangHpPage = () => {
  const navigate = useNavigate();
  const baseUrl = getRoleBaseUrl();

  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  
  const [nasabah, setNasabah] = useState(null);
  const [nikInput, setNikInput] = useState("");
  const [totalGadai, setTotalGadai] = useState(0);

  const [merkHp, setMerkHp] = useState([]);
  const [typeHpByMerk, setTypeHpByMerk] = useState([]);
  const [masterHarga, setMasterHarga] = useState(null); 
  const [kerusakanList, setKerusakanList] = useState([]);
  const [kelengkapanList, setKelengkapanList] = useState([]);
  const [allCategories, setAllCategories] = useState([]);

  const [detail, setDetail] = useState({
    tanggal_gadai: new Date().toISOString().split('T')[0], 
    jatuh_tempo: "",
    type_id: "", 
  });

  const [barang, setBarang] = useState({
    nama_barang: "Android", 
    merk_hp_id: "",
    type_hp_id: "", 
    grade_hp_id: "", 
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

        const typesData = normalizeData(t);
        setMerkHp(normalizeData(m));
        setKerusakanList(normalizeData(kr));
        setKelengkapanList(normalizeData(kl));
        setAllCategories(typesData);
        
        const hpType = typesData.find(x => 
          x.nama_type.toLowerCase().includes('hp') || 
          x.nama_type.toLowerCase().includes('handphone')
        );
        if (hpType) setDetail(prev => ({ ...prev, type_id: hpType.id }));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchMaster();
  }, [baseUrl]);

const handleCheckNasabah = async () => {
    if (!nikInput) return alert("Masukkan NIK");
    setLoading(true);
    try {
      const res = await axiosInstance.post(`${baseUrl}/gadai/ulang/check-nasabah`, { nik: nikInput });
      if (res.data.success) {
        setNasabah(res.data.data.nasabah);
        setTotalGadai(res.data.data.total_gadai); 
        setStep(1);
      }
    } catch (err) { alert(err.response?.data?.message || "NIK tidak ditemukan"); }
    finally { setLoading(false); }
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
          const g = res.data?.data?.grades?.[0] || res.data?.data?.grades || null;
          setMasterHarga(g);
          if (g) setBarang(p => ({ ...p, grade_hp_id: g.id }));
        });
    }
  }, [barang.type_hp_id, baseUrl]);

const calculation = useMemo(() => {
    if (!masterHarga || !barang.grade_type) return { taksiran: 0, pinjaman: 0, pengurang: 0 };
    
    const key = barang.grade_type.toLowerCase().replace(/-/g, '_');
    const baseP = parseFloat(masterHarga[`grade_${key}`] || 0);
    const baseT = parseFloat(masterHarga[`taksiran_${key}`] || 0);
    
    const totalPersen = kerusakanList
      .filter(k => barang.kerusakan.includes(k.id))
      .reduce((acc, curr) => acc + parseFloat(curr.persen || 0), 0);
    
    const multiplier = Math.max(0, (100 - totalPersen) / 100);
    const rawPinjaman = baseP * multiplier;
    const rawTaksiran = baseT * multiplier;

    return {
      taksiran: Math.floor(rawTaksiran / 1000) * 1000,
      pinjaman: Math.floor(rawPinjaman / 1000) * 1000,
      pengurang: totalPersen
    };
  }, [masterHarga, barang.grade_type, barang.kerusakan, kerusakanList]);

  const handleSubmit = async () => {
    if (!detail.type_id) return alert("Pilih Kategori Gadai!");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("nasabah[id]", nasabah.id);
      fd.append("detail[tanggal_gadai]", detail.tanggal_gadai);
      fd.append("detail[jatuh_tempo]", detail.jatuh_tempo);
      fd.append("detail[type_id]", detail.type_id);

      Object.keys(barang).forEach(key => {
        if (!['kerusakan', 'kelengkapan', 'dokumen_pendukung'].includes(key)) {
          fd.append(`barang[${key}]`, barang[key] || "");
        }
      });

      barang.kerusakan.forEach((id, i) => fd.append(`barang[kerusakan][${i}]`, id));
      barang.kelengkapan.forEach((id, i) => fd.append(`barang[kelengkapan][${i}]`, id));
      
      Object.entries(barang.dokumen_pendukung).forEach(([k, f]) => {
        if (f) fd.append(`barang[dokumen_pendukung][${k}]`, f);
      });
      fd.append("barang[merk_name]", barang.nama_barang);

      await axiosInstance.post(`${baseUrl}/gadai/ulang`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      alert("Gadai Ulang Berhasil!");
      navigate("/data-nasabah");
    } catch (err) { alert(err.response?.data?.message || "Gagal simpan"); }
    finally { setLoading(false); }
  };

  return (
    <Card sx={{ p: 2 }}>
      <CardHeader title="Gadai Ulang Handphone (Repeat Customer)" />
      <CardContent>
        {loading && <Box textAlign="center" py={2}><CircularProgress /></Box>}

        {step === 0 && (
          <Stack spacing={2}>
            <TextField fullWidth label="NIK Nasabah" value={nikInput} onChange={e => setNikInput(e.target.value)} />
            <Button variant="contained" onClick={handleCheckNasabah}>Cek Nasabah</Button>
          </Stack>
        )}

        {step === 1 && (
  <Grid container spacing={2}>
    <Grid item xs={12}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          bgcolor: '#f1f8e9', 
          border: '1px solid #c5e1a5', 
          borderRadius: 2,
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ textTransform: 'uppercase', color: '#558b2f', fontWeight: 'bold' }}>
            Data Nasabah (Repeat Order)
          </Typography>
          <Typography variant="h5" fontWeight="900" sx={{ color: '#33691e' }}>
            {nasabah?.nama_lengkap}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            NIK: {nasabah?.nik} | Alamat: {nasabah?.alamat || '-'}
          </Typography>
        </Box>

        <Box 
          sx={{ 
            textAlign: { xs: 'left', sm: 'right' },
            p: 1.5, 
            bgcolor: '#ffffff', 
            borderRadius: 2, 
            border: '2px dashed #8bc34a',
            minWidth: '150px'
          }}
        >
          <Typography variant="caption" fontWeight="bold" color="textSecondary">
            TOTAL GADAI SEBELUMNYA
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, gap: 1 }}>
            <Typography variant="h4" fontWeight="900" color="primary">
              {totalGadai}
            </Typography>
            <Typography variant="subtitle1" fontWeight="bold">KALI</Typography>
          </Box>
          {totalGadai >= 5 && (
            <Typography 
              variant="caption" 
              sx={{ 
                bgcolor: '#ffd600', 
                color: '#000', 
                px: 1, 
                py: 0.5, 
                borderRadius: 1, 
                fontWeight: '900',
                display: 'inline-block',
                mt: 0.5
              }}
            >
              ⭐ NASABAH LOYAL
            </Typography>
          )}
        </Box>
      </Paper>
    </Grid>

    {/* FORM TRANSAKSI */}
    <Grid item xs={12} sm={4}>
      <FormControl fullWidth required>
        <InputLabel>Kategori Gadai</InputLabel>
        <Select 
          value={detail.type_id} 
          label="Kategori Gadai" 
          onChange={e => setDetail({...detail, type_id: e.target.value})}
        >
          {allCategories.map(cat => (
            <MenuItem key={cat.id} value={cat.id}>{cat.nama_type}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>
    <Grid item xs={12} sm={4}>
      <TextField 
        fullWidth 
        type="date" 
        label="Tgl Gadai" 
        value={detail.tanggal_gadai} 
        InputLabelProps={{shrink:true}} 
        onChange={e => setDetail({...detail, tanggal_gadai: e.target.value})} 
      />
    </Grid>
    <Grid item xs={12} sm={4}>
      <FormControl fullWidth>
        <InputLabel>Tenor</InputLabel>
        <Select 
          value={detail.jatuh_tempo} 
          label="Tenor" 
          onChange={e => setDetail({...detail, jatuh_tempo: e.target.value})}
        >
          {[15, 30].map(d => {
            const dt = new Date(detail.tanggal_gadai); 
            dt.setDate(dt.getDate() + d);
            return (
              <MenuItem key={d} value={dt.toISOString().split('T')[0]}>
                {d} Hari (Jatuh Tempo: {dt.toLocaleDateString('id-ID')})
              </MenuItem>
            )
          })}
        </Select>
      </FormControl>
    </Grid>

    <Grid item xs={12}><Divider sx={{ fontWeight: 'bold' }}>SPESIFIKASI & KEAMANAN</Divider></Grid>

    <Grid item xs={12} sm={4}>
      <FormControl fullWidth>
        <InputLabel>Merk</InputLabel>
        <Select 
          value={barang.merk_hp_id} 
          label="Merk" 
          onChange={e => setBarang({...barang, merk_hp_id: e.target.value, type_hp_id: ""})}
        >
          {merkHp.map(m => <MenuItem key={m.id} value={m.id}>{m.nama_merk}</MenuItem>)}
        </Select>
      </FormControl>
    </Grid>
    <Grid item xs={12} sm={8}>
      <Autocomplete 
        options={typeHpByMerk} 
        getOptionLabel={(o) => o.nama_type || ""} 
        onChange={(_, v) => setBarang({...barang, type_hp_id: v?.id || ""})} 
        renderInput={(p) => <TextField {...p} label="Tipe HP" placeholder="Ketik tipe HP..." />} 
      />
    </Grid>

    {/* Spek Fisik */}
    <Grid item xs={6} sm={3}><TextField fullWidth label="IMEI" size="small" value={barang.imei} onChange={e => setBarang({...barang, imei: e.target.value})} /></Grid>
    <Grid item xs={6} sm={3}><TextField fullWidth label="Warna" size="small" value={barang.warna} onChange={e => setBarang({...barang, warna: e.target.value})} /></Grid>
    <Grid item xs={6} sm={3}><TextField fullWidth label="RAM" size="small" value={barang.ram} onChange={e => setBarang({...barang, ram: e.target.value})} /></Grid>
    <Grid item xs={6} sm={3}><TextField fullWidth label="ROM" size="small" value={barang.rom} onChange={e => setBarang({...barang, rom: e.target.value})} /></Grid>
    
    {/* INPUT KEAMANAN BARU */}
    <Grid item xs={12} sm={4}>
      <TextField 
        fullWidth 
        label="Password Layar" 
        placeholder="Contoh: admin123" 
        size="small" 
        sx={{ bgcolor: '#fffde7' }} 
        value={barang.kunci_password} 
        onChange={e => setBarang({...barang, kunci_password: e.target.value})} 
      />
    </Grid>
    <Grid item xs={12} sm={4}>
      <TextField 
        fullWidth 
        label="PIN (Angka)" 
        placeholder="Contoh: 1234" 
        size="small" 
        sx={{ bgcolor: '#fffde7' }} 
        value={barang.kunci_pin} 
        onChange={e => setBarang({...barang, kunci_pin: e.target.value})} 
      />
    </Grid>
    <Grid item xs={12} sm={4}>
      <TextField 
        fullWidth 
        label="Pola (Pattern)" 
        placeholder="Contoh: L terbalik" 
        size="small" 
        sx={{ bgcolor: '#fffde7' }} 
        value={barang.kunci_pola} 
        onChange={e => setBarang({...barang, kunci_pola: e.target.value})} 
      />
    </Grid>

    <Grid item xs={12}><Divider sx={{ fontWeight: 'bold' }}>KONDISI & GRADE</Divider></Grid>
    <Grid item xs={12}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {['a_dus', 'a_tanpa_dus', 'b_dus', 'b_tanpa_dus', 'c_dus', 'c_tanpa_dus'].map(g => (
          <Button 
            key={g} 
            variant={barang.grade_type === g ? "contained" : "outlined"} 
            size="small" 
            sx={{ mb: 1 }}
            onClick={() => setBarang({...barang, grade_type: g})}
          >
            {g.replace(/_/g, ' ').toUpperCase()}
          </Button>
        ))}
      </Stack>
    </Grid>

    <Grid item xs={12} sm={6}>
      <Paper sx={{ p: 1.5, bgcolor: '#f8f9fa', height: '100%' }}>
        <Typography variant="subtitle2" fontWeight="bold">Kelengkapan :</Typography>
        <FormGroup row>
          {kelengkapanList.map(k => (
            <FormControlLabel 
              key={k.id} 
              control={<Checkbox size="small" checked={barang.kelengkapan.includes(k.id)} onChange={e => {
                const ids = e.target.checked ? [...barang.kelengkapan, k.id] : barang.kelengkapan.filter(x => x !== k.id);
                setBarang({...barang, kelengkapan: ids});
              }} />} 
              label={<Typography variant="caption">{k.nama_kelengkapan}</Typography>} 
            />
          ))}
        </FormGroup>
      </Paper>
    </Grid>
    <Grid item xs={12} sm={6}>
      <Paper sx={{ p: 1.5, bgcolor: '#fff5f5', height: '100%', border: '1px solid #ffcdd2' }}>
        <Typography variant="subtitle2" color="error" fontWeight="bold">Kerusakan (Potongan %) :</Typography>
        <FormGroup row>
          {kerusakanList.map(k => (
            <FormControlLabel 
              key={k.id} 
              control={<Checkbox size="small" color="error" checked={barang.kerusakan.includes(k.id)} onChange={e => {
                const ids = e.target.checked ? [...barang.kerusakan, k.id] : barang.kerusakan.filter(x => x !== k.id);
                setBarang({...barang, kerusakan: ids});
              }} />} 
              label={<Typography variant="caption">{k.nama_kerusakan} ({k.persen}%)</Typography>} 
            />
          ))}
        </FormGroup>
      </Paper>
    </Grid>

    <Grid item xs={12}><Divider sx={{ fontWeight: 'bold' }}>UPLOAD FOTO SOP</Divider></Grid>
    <Grid item xs={12} sm={4} sx={{ mb: 2 }}>
        <FormControl fullWidth size="small">
            <InputLabel>Jenis HP (SOP Foto)</InputLabel>
            <Select 
              value={barang.nama_barang} 
              label="Jenis HP (SOP Foto)" 
              onChange={e => setBarang({...barang, nama_barang: e.target.value})}
            >
                {Object.keys(DOKUMEN_SOP_HP).map(k => <MenuItem key={k} value={k}>{k}</MenuItem>)}
            </Select>
        </FormControl>
    </Grid>
    <Grid container item spacing={1}>
        {DOKUMEN_SOP_HP[barang.nama_barang]?.map(d => (
        <Grid item xs={6} sm={3} key={d}>
            <Button 
              variant={barang.dokumen_pendukung[d] ? "contained" : "outlined"} 
              color={barang.dokumen_pendukung[d] ? "success" : "primary"}
              component="label" 
              fullWidth 
              size="small" 
              sx={{fontSize: '10px', py: 1}}
            >
              {barang.dokumen_pendukung[d] ? "✅ " + d.toUpperCase() : "UPLOAD " + d.toUpperCase()}
              <input type="file" hidden onChange={e => setBarang({...barang, dokumen_pendukung: {...barang.dokumen_pendukung, [d]: e.target.files[0]}})} />
            </Button>
        </Grid>
        ))}
    </Grid>

    <Grid item xs={12} mt={3}>
      <Button 
        fullWidth 
        variant="contained" 
        size="large" 
        sx={{ py: 1.5, fontWeight: 'bold' }}
        onClick={() => setStep(2)} 
        disabled={!barang.type_hp_id || !barang.grade_type}
      >
        Lanjut ke Review Kalkulasi
      </Button>
    </Grid>
  </Grid>
)}

        {step === 2 && (
          <Stack spacing={3}>
            <Paper sx={{ p: 4, bgcolor: '#fcfcfc' }}>
              <Typography variant="h6" align="center">Review Pinjaman</Typography>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between" mb={1}><Typography>Grade Dasar:</Typography><Typography fontWeight="bold">Rp {(masterHarga?.[`grade_${barang.grade_type}`] || 0).toLocaleString('id-ID')}</Typography></Box>
              <Box display="flex" justifyContent="space-between" mb={1}><Typography color="error">Potongan Kondisi:</Typography><Typography color="error">-{calculation.pengurang}%</Typography></Box>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between"><Typography variant="h5">Total Cair:</Typography><Typography variant="h5" color="primary" fontWeight="bold">Rp {calculation.pinjaman.toLocaleString('id-ID')}</Typography></Box>
            </Paper>
            <Stack direction="row" spacing={2}>
              <Button fullWidth variant="outlined" size="large" onClick={() => setStep(1)}>Kembali</Button>
              <Button fullWidth variant="contained" color="success" size="large" onClick={handleSubmit}>Simpan Gadai Ulang</Button>
            </Stack>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default GadaiUlangHpPage;