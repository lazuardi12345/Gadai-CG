import React, { useState, useEffect, useCallback } from "react";
import {
  Card, CardHeader, CardContent, TextField, Button,
  Grid, Stack, CircularProgress, FormGroup, FormControlLabel,
  Checkbox, Box, Typography, FormControl, InputLabel, Select, MenuItem, Paper, Divider, Autocomplete
} from "@mui/material";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

const DOKUMEN_SOP_HP = {
  Android: ['body', 'imei', 'about', 'akun', 'admin', 'cam_depan', 'cam_belakang', 'rusak'],
  Samsung: ['body', 'imei', 'about', 'samsung_account', 'admin', 'cam_depan', 'cam_belakang', 'galaxy_store'],
  iPhone: ['body', 'imei', 'about', 'icloud', 'battery', 'utools', 'iunlocker', 'cek_pencurian']
};

const BANK_LIST = [
  'BCA', 'BRI', 'BNI', 'MANDIRI', 'BTN', 'SEABANK', 'BANK_JAGO', 'NEO_COMMERCE', 
  'ALOO_BANK', 'BLU', 'LINE_BANK', 'DIGIBANK', 'TMRW', 'BANK_RAYA', 'HIBANK',
  'CIMB_NIAGA', 'PERMATA', 'DANAMON', 'PANIN', 'OCBC_NISP', 'MAYBANK', 
  'COMMONWEALTH', 'DBS', 'UOB', 'HSBC', 'STANDARD_CHARTERED', 'ARTHA_GRAHA', 
  'MEGA', 'BUKOPIN', 'BTPN', 'SINARMAS', 'MESTIKA', 'BSI', 'MUAMALAT', 
  'BCA_SYARIAH', 'MEGA_SYARIAH', 'PANIN_SYARIAH', 'BUKOPIN_SYARIAH', 
  'BTPN_SYARIAH', 'VICTORIA_SYARIAH', 'BANK_DKI', 'BANK_JABAR', 'BANK_JATENG', 
  'BANK_JATIM', 'BANK_DIY', 'BANK_JAMBI', 'BANK_SUMUT', 'BANK_RIAU_KEPRI', 
  'BANK_SUMSEL_BABEL', 'BANK_LAMPUNG', 'BANK_KALBAR', 'BANK_KALSEL', 
  'BANK_KALTIMTARA', 'BANK_KALTENG', 'BANK_SULSELBAR', 'BANK_SULUTGO', 
  'BANK_NTB', 'BANK_NTT', 'BANK_BALI', 'BANK_PAPUA', 'BANK_BENGKULU', 'BANK_SULTRA', 'ALADIN_SYARIAH',
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

const GadaiHpWizardPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const baseUrl = getRoleBaseUrl();

  const [nasabah, setNasabah] = useState({ 
    nama_lengkap: "", 
    nik: "", 
    alamat: "", 
    no_hp: "", 
    bank: "BCA", 
    no_rek: "" 
  });
  const [fotoKtp, setFotoKtp] = useState(null);

  // REVISI: Jatuh tempo sekarang menyimpan angka durasi (default 15)
  const [detail, setDetail] = useState({
    tanggal_gadai: new Date().toISOString().split('T')[0],
    durasi: 15, 
    type_id: "",
  });

  const [barang, setBarang] = useState({
    nama_barang: "Android",
    merk_hp_id: "",
    type_hp_id: "",
    grade_hp_id: "",
    grade_type: "",
    kelengkapan: [],
    kerusakan: [],
    imei: "", 
    warna: "", 
    ram: "", 
    rom: "", 
    kunci_password: "",
    kunci_pin: "",
    kunci_pola: "",
    dokumen_pendukung: {}
  });

  const [merkHp, setMerkHp] = useState([]);
  const [typeHpByMerk, setTypeHpByMerk] = useState([]);
  const [masterHarga, setMasterHarga] = useState(null);
  const [kerusakanList, setKerusakanList] = useState([]);
  const [kelengkapanList, setKelengkapanList] = useState([]);

  // Fungsi pembantu untuk hitung tanggal jatuh tempo di UI
const getFormattedJatuhTempo = () => {
  if (!detail.tanggal_gadai) return ""; 
  const date = new Date(detail.tanggal_gadai);
  if (isNaN(date.getTime())) return ""; 
  const durasiHari = parseInt(detail.durasi) || 15;
  date.setDate(date.getDate() + durasiHari);

  // 4. Baru jalankan toISOString
  return date.toISOString().split('T')[0];
};

  const normalizeDataArray = (res) => {
    const dataObj = res.data?.data || res.data || res;
    if (dataObj && Array.isArray(dataObj.items)) return dataObj.items;
    if (Array.isArray(dataObj)) return dataObj;
    return [];
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [merkRes, kerusRes, kelengkRes, typeRes] = await Promise.all([
          axiosInstance.get(`${baseUrl}/merk-hp?per_page=100`),
          axiosInstance.get(`${baseUrl}/kerusakan?per_page=100`),
          axiosInstance.get(`${baseUrl}/kelengkapan?per_page=100`),
          axiosInstance.get(`${baseUrl}/type`) 
        ]);
        
        setMerkHp(normalizeDataArray(merkRes));
        setKerusakanList(normalizeDataArray(kerusRes));
        setKelengkapanList(normalizeDataArray(kelengkRes));

        const listTypes = normalizeDataArray(typeRes);
        const hpType = listTypes.find(t => 
          t.nama_type?.toLowerCase().includes("hp") || 
          t.nama_type?.toLowerCase().includes("handphone")
        );
        
        if (hpType) {
          setDetail(prev => ({ ...prev, type_id: hpType.id }));
        }
      } catch (err) {
        console.error("Error fetching master data:", err);
      } finally { 
        setLoading(false); 
      }
    };
    fetchAll();
  }, [baseUrl]);

  useEffect(() => {
    if (barang.merk_hp_id) {
      axiosInstance.get(`${baseUrl}/type-hp/by-merk/${barang.merk_hp_id}?per_page=1000`)
        .then(res => setTypeHpByMerk(normalizeDataArray(res)))
        .catch(err => console.error('Error fetching type HP:', err));
    }
  }, [barang.merk_hp_id, baseUrl]);

useEffect(() => {
  if (barang.type_hp_id) {
    axiosInstance.get(`${baseUrl}/harga-hp/type/${barang.type_hp_id}`)
      .then(res => {

        const paginatedData = res.data?.data?.data; 
        
        if (paginatedData && paginatedData.length > 0) {
          const firstItem = paginatedData[0];
          const gradeData = firstItem.grades?.[0] || null;
          
          setMasterHarga(gradeData);
          if (gradeData?.id) {
            setBarang(prev => ({ ...prev, grade_hp_id: gradeData.id }));
          }
        } else {
          setMasterHarga(null);
        }
      })
      .catch(err => {
        console.error("Gagal ambil harga:", err);
        setMasterHarga(null);
      });
  }
}, [barang.type_hp_id, baseUrl]);

  const handleNasabahChange = (e) => setNasabah(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleDetailChange = (e) => setDetail(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleBarangChange = (e) => setBarang(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const calculateTotalPersenKerusakan = () => {
    return kerusakanList
      .filter(k => barang.kerusakan.includes(k.id))
      .reduce((sum, item) => sum + parseFloat(item.persen || 0), 0);
  };

  const getPreviewValues = () => {
    if (!masterHarga || !barang.grade_type) {
      return { taksiran: 0, pinjaman: 0, basePinjaman: 0, baseTaksiran: 0, totalPersen: 0, nominalPotonganPinjaman: 0, nominalPotonganTaksiran: 0 };
    }
    const normalizedGrade = barang.grade_type.toLowerCase().replace(/-/g, '_');
    const colPinjaman = `grade_${normalizedGrade}`;
    const colTaksiran = `taksiran_${normalizedGrade}`;

    const basePinjaman = parseFloat(masterHarga[colPinjaman] || 0);
    const baseTaksiran = parseFloat(masterHarga[colTaksiran] || 0);
    const totalPersen = calculateTotalPersenKerusakan();
    
    const potPinjaman = (basePinjaman * totalPersen) / 100;
    const potTaksiran = (baseTaksiran * totalPersen) / 100;
    const rawPinjaman = basePinjaman - potPinjaman;
    const rawTaksiran = baseTaksiran - potTaksiran;

    return {
      basePinjaman, baseTaksiran,
      nominalPotonganPinjaman: potPinjaman,
      nominalPotonganTaksiran: potTaksiran,
      taksiran: Math.floor(rawTaksiran / 1000) * 1000,
      pinjaman: Math.floor(rawPinjaman / 1000) * 1000,
      totalPersen
    };
  };

  const preview = getPreviewValues();

  const handleSubmitFinal = async () => {
    if (!detail.type_id) {
      alert("❌ Error: Tipe Barang tidak ditemukan.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      
      Object.entries(nasabah).forEach(([k, v]) => formData.append(`nasabah[${k}]`, v));
      if (fotoKtp) formData.append("nasabah[foto_ktp]", fotoKtp);
      
      formData.append("detail[tanggal_gadai]", detail.tanggal_gadai);
      formData.append("detail[jatuh_tempo]", getFormattedJatuhTempo()); 
      formData.append("detail[type_id]", detail.type_id);
      Object.entries(barang).forEach(([k, v]) => {
        if (['dokumen_pendukung', 'kerusakan', 'kelengkapan'].includes(k)) return;
        formData.append(`barang[${k}]`, v);
      });

      barang.kerusakan.forEach((id, i) => formData.append(`barang[kerusakan][${i}]`, id));
      barang.kelengkapan.forEach((id, i) => formData.append(`barang[kelengkapan][${i}]`, id));

      Object.entries(barang.dokumen_pendukung).forEach(([k, f]) => {
        if (f) formData.append(`barang[dokumen_pendukung][${k}]`, f);
      });
      formData.append("barang[merk_name]", barang.nama_barang);

      const res = await axiosInstance.post(`${baseUrl}/gadai-wizard`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        alert("✅ Gadai HP Berhasil Disimpan!");
        navigate("/data-nasabah");
      }
    } catch (err) {
      alert(`❌ Error: ${err.response?.data?.message || "Terjadi Kesalahan Server"}`);
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <Card sx={{ p: 2, maxWidth: 900, mx: "auto", mt: 2 }}>
      <CardHeader title="Gadai HP" subheader={`Step ${step} dari 3`} />
      <CardContent>
        
        {step === 1 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Nama Lengkap *" name="nama_lengkap" value={nasabah.nama_lengkap} onChange={handleNasabahChange} required /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="NIK *" name="nik" value={nasabah.nik} onChange={handleNasabahChange} required /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Alamat" name="alamat" multiline rows={2} value={nasabah.alamat} onChange={handleNasabahChange} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="No HP" name="no_hp" value={nasabah.no_hp} onChange={handleNasabahChange} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="No Rekening" name="no_rek" value={nasabah.no_rek} onChange={handleNasabahChange} /></Grid>
            <Grid item xs={12} sm={4}>
              <TextField select fullWidth label="Bank" name="bank" value={nasabah.bank} onChange={handleNasabahChange}>
                {BANK_LIST.map((b) => (<MenuItem key={b} value={b}>{b.replace(/_/g, " ")}</MenuItem>))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Foto KTP Nasabah *</Typography>
              <input type="file" accept="image/*" onChange={e => setFotoKtp(e.target.files[0])} />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" fullWidth onClick={() => setStep(2)} disabled={!nasabah.nama_lengkap || !nasabah.nik}>Lanjut ke Data HP</Button>
            </Grid>
          </Grid>
        )}

        {step === 2 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth type="date" label="Tanggal Gadai" name="tanggal_gadai" 
                value={detail.tanggal_gadai} onChange={handleDetailChange} InputLabelProps={{ shrink: true }} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Durasi Pinjaman</InputLabel>
                <Select 
                  name="durasi" 
                  value={detail.durasi} 
                  onChange={handleDetailChange} 
                  label="Durasi Pinjaman"
                >
                  <MenuItem value={15}>15 Hari</MenuItem>
                  <MenuItem value={30}>30 Hari</MenuItem>
                </Select>
                {/* Tampilan bantuan tanggal jatuh tempo sesuai pilihan durasi */}
                <Typography variant="caption" sx={{ mt: 1, ml: 1, color: 'text.secondary' }}>
                  Estimasi Jatuh Tempo: <b>{getFormattedJatuhTempo()}</b>
                </Typography>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Jenis HP</InputLabel>
                <Select name="nama_barang" value={barang.nama_barang} onChange={handleBarangChange} label="Jenis HP">
                  {['Android', 'Samsung', 'iPhone'].map(v => (<MenuItem key={v} value={v}>{v}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Merk *</InputLabel>
                <Select name="merk_hp_id" value={barang.merk_hp_id} onChange={handleBarangChange} label="Merk" required>
                  <MenuItem value="">-- Pilih Merk --</MenuItem>
                  {merkHp.map(m => (<MenuItem key={m.id} value={m.id}>{m.nama_merk}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Autocomplete
                options={typeHpByMerk}
                getOptionLabel={(opt) => opt.nama_type || ""}
                value={typeHpByMerk.find(t => t.id === barang.type_hp_id) || null}
                onChange={(_, v) => setBarang(prev => ({ ...prev, type_hp_id: v?.id || "" }))}
                renderInput={(params) => <TextField {...params} label="Cari Type HP *" required />}
                disabled={!barang.merk_hp_id}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Pilih Grade Kondisi: *</Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {['a_dus', 'a_tanpa_dus', 'b_dus', 'b_tanpa_dus', 'c_dus', 'c_tanpa_dus'].map(g => (
                  <Button 
                    key={g} variant={barang.grade_type === g ? "contained" : "outlined"}
                    onClick={() => setBarang(prev => ({ ...prev, grade_type: g }))}
                    size="small" disabled={!barang.type_hp_id}
                  >
                    {g.replace(/_/g, ' ').toUpperCase()}
                  </Button>
                ))}
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, bgcolor: '#fff5f5' }}>
                <Typography variant="subtitle2" color="error">Potongan Kerusakan (%):</Typography>
                <FormGroup>
                  {kerusakanList.map(k => (
                    <FormControlLabel 
                      key={k.id}
                      control={<Checkbox size="small" checked={barang.kerusakan.includes(k.id)} onChange={() => {
                        const next = barang.kerusakan.includes(k.id) ? barang.kerusakan.filter(id => id !== k.id) : [...barang.kerusakan, k.id];
                        setBarang(prev => ({ ...prev, kerusakan: next }));
                      }} />}
                      label={`${k.nama_kerusakan} (${k.persen}%)`}
                    />
                  ))}
                </FormGroup>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="subtitle2">Kelengkapan:</Typography>
                <FormGroup>
                  {kelengkapanList.map(k => (
                    <FormControlLabel 
                      key={k.id}
                      control={<Checkbox size="small" checked={barang.kelengkapan.includes(k.id)} onChange={() => {
                        const next = barang.kelengkapan.includes(k.id) ? barang.kelengkapan.filter(id => id !== k.id) : [...barang.kelengkapan, k.id];
                        setBarang(prev => ({ ...prev, kelengkapan: next }));
                      }} />}
                      label={k.nama_kelengkapan}
                    />
                  ))}
                </FormGroup>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Detail HP (Opsional):</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}><TextField fullWidth size="small" label="IMEI" name="imei" value={barang.imei} onChange={handleBarangChange} /></Grid>
                <Grid item xs={6} sm={3}><TextField fullWidth size="small" label="Warna" name="warna" value={barang.warna} onChange={handleBarangChange} /></Grid>
                <Grid item xs={6} sm={3}><TextField fullWidth size="small" label="RAM" name="ram" value={barang.ram} onChange={handleBarangChange} /></Grid>
                <Grid item xs={6} sm={3}><TextField fullWidth size="small" label="ROM" name="rom" value={barang.rom} onChange={handleBarangChange} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Password HP" name="kunci_password" value={barang.kunci_password} onChange={handleBarangChange} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="PIN HP" name="kunci_pin" value={barang.kunci_pin} onChange={handleBarangChange} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Pola HP" name="kunci_pola" value={barang.kunci_pola} onChange={handleBarangChange} /></Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Upload SOP ({barang.nama_barang}):</Typography>
              <Grid container spacing={1}>
                {DOKUMEN_SOP_HP[barang.nama_barang]?.map(d => (
                  <Grid item xs={6} sm={3} key={d}>
                    <Box sx={{ p: 1, border: '1px dashed #ccc', borderRadius: 1 }}>
                      <Typography variant="caption" display="block" fontWeight="bold">{d.toUpperCase()}</Typography>
                      <input type="file" accept="image/*" style={{ fontSize: '9px' }} onChange={e => {
                        const file = e.target.files[0];
                        if (file) setBarang(prev => ({ ...prev, dokumen_pendukung: { ...prev.dokumen_pendukung, [d]: file } }));
                      }} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button variant="outlined" fullWidth onClick={() => setStep(1)}>Kembali</Button>
                <Button variant="contained" fullWidth onClick={() => setStep(3)} disabled={!barang.type_hp_id || !barang.grade_type}>Cek Harga</Button>
              </Stack>
            </Grid>
          </Grid>
        )}

        {step === 3 && (
          <Stack spacing={2}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" align="center" color="primary" fontWeight="bold">RINGKASAN GADAI</Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Tanggal Jatuh Tempo:</Typography>
                  <Typography fontWeight="bold">{getFormattedJatuhTempo()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Harga Dasar Pinjaman:</Typography>
                  <Typography>Rp {preview.basePinjaman.toLocaleString('id-ID')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="error">Potongan Kondisi ({preview.totalPersen}%):</Typography>
                  <Typography color="error">- Rp {preview.nominalPotonganPinjaman.toLocaleString('id-ID')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, bgcolor: '#e8f5e9' }}>
                  <Typography fontWeight="bold">Total Pinjaman Cair:</Typography>
                  <Typography fontWeight="bold" color="success.main">Rp {preview.pinjaman.toLocaleString('id-ID')}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Taksiran Nilai Barang:</Typography>
                  <Typography variant="body2">Rp {preview.taksiran.toLocaleString('id-ID')}</Typography>
                </Box>
              </Stack>
            </Paper>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" fullWidth onClick={() => setStep(2)}>Revisi</Button>
              <Button variant="contained" color="success" fullWidth onClick={handleSubmitFinal} disabled={loading}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "SIMPAN SEKARANG"}
              </Button>
            </Stack>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default GadaiHpWizardPage;