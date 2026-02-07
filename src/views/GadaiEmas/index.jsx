import React, { useState, useEffect } from "react";
import {
  Card, CardHeader, CardContent, TextField, Button,
  Grid, Stack, CircularProgress, Typography, FormControl,
  InputLabel, Select, MenuItem, Divider, InputAdornment,
  Checkbox, FormControlLabel
} from "@mui/material";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

const getRoleBaseUrl = () => {
  const user = JSON.parse(localStorage.getItem("auth_user") || "{}");
  const role = user?.role?.toLowerCase() || "";
  switch (role) {
    case "petugas": return "/petugas";
    case "checker": return "/checker";
    case "hm": return "";
    default: return "";
  }
};

const DOKUMEN_FIELDS = [
  "emas_timbangan",
  "gosokan_timer",
  "gosokan_ktp",
  "batu",
  "cap_merek",
  "karatase",
  "ukuran_batu",
];

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
  'BANK_NTB', 'BANK_NTT', 'BANK_BALI', 'BANK_PAPUA', 'BANK_BENGKULU', 'BANK_SULTRA'
];

const formatRupiah = (value) => {
  if (!value) return "";
  const number = value.toString().replace(/\D/g, "");
  return new Intl.NumberFormat("id-ID").format(number);
};

const GadaiEmasFormPage = () => {
  const navigate = useNavigate();
  const baseUrl = getRoleBaseUrl();
  const [loading, setLoading] = useState(false);

  const [nasabah, setNasabah] = useState({
    nama_lengkap: "", 
    nik: "", 
    alamat: "", 
    no_hp: "", 
    bank: "BCA", 
    no_rek: ""
  });
  const [fotoKtp, setFotoKtp] = useState(null);

  const [detail, setDetail] = useState({
    tanggal_gadai: new Date().toISOString().split("T")[0],
    // BE secara default pakai 15 hari, kita set default di FE juga agar sinkron
    jatuh_tempo: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split("T")[0],
    durasi_hari: "15", 
    taksiran: "",
    uang_pinjaman: "",
    type_id: "",
  });

  const [barang, setBarang] = useState({
    nama_barang: "", karat: "", berat: "", kode_cap: "", potongan_batu: ""
  });

  const [kelengkapanList, setKelengkapanList] = useState([]);
  const [selectedKelengkapan, setSelectedKelengkapan] = useState([]);
  const [dokumenFiles, setDokumenFiles] = useState({});

  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const resKel = await axiosInstance.get(`${baseUrl}/kelengkapan-emas`);
        setKelengkapanList(resKel?.data?.data ?? resKel?.data ?? []);
      } catch (e) {
        console.error("Error fetching kelengkapan", e);
      }
    };
    fetchMaster();
  }, [baseUrl]);

  const setNasabahField = (e) => setNasabah(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const setDetailField = (e) => {
    const { name, value } = e.target;

    if (name === "taksiran" || name === "uang_pinjaman") {
      setDetail(prev => ({ ...prev, [name]: formatRupiah(value) }));
      return;
    }

    if (name === "durasi_hari") {
      const days = parseInt(value);
      const baseDate = new Date(detail.tanggal_gadai);
      baseDate.setDate(baseDate.getDate() + days);
      setDetail(prev => ({ 
        ...prev, 
        durasi_hari: value,
        jatuh_tempo: baseDate.toISOString().split("T")[0] 
      }));
      return;
    }

    setDetail(prev => ({ ...prev, [name]: value }));
  };

  const setBarangField = (e) => setBarang(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const toggleKelengkapan = (id) => {
    setSelectedKelengkapan(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (!nasabah.nama_lengkap || !nasabah.nik || !detail.type_id || !barang.nama_barang) {
      alert("Mohon lengkapi data wajib (Nama, NIK, Jenis Gadai, Nama Barang)");
      return;
    }

    try {
      setLoading(true);
      const fd = new FormData();

      // Nasabah
      Object.entries(nasabah).forEach(([k, v]) => fd.append(`nasabah[${k}]`, v));
      if (fotoKtp) fd.append("nasabah[foto_ktp]", fotoKtp);

      // Detail - Pastikan nominal bersih dari titik agar BE (int) tidak salah baca
      fd.append("detail[tanggal_gadai]", detail.tanggal_gadai);
      fd.append("detail[jatuh_tempo]", detail.jatuh_tempo);
      fd.append("detail[type_id]", detail.type_id);
      fd.append("detail[taksiran]", detail.taksiran.replace(/\D/g, "") || "0");
      fd.append("detail[uang_pinjaman]", detail.uang_pinjaman.replace(/\D/g, "") || "0");

      // Barang
      Object.entries(barang).forEach(([k, v]) => fd.append(`barang[${k}]`, v));

      // Kelengkapan sesuai ekspektasi BE: barang[kelengkapan][]
      selectedKelengkapan.forEach(id => fd.append("barang[kelengkapan][]", id));

      // Dokumen sesuai ekspektasi BE: barang[dokumen_pendukung][field]
      DOKUMEN_FIELDS.forEach(field => {
        if (dokumenFiles[field]) fd.append(`barang[dokumen_pendukung][${field}]`, dokumenFiles[field]);
      });

      const res = await axiosInstance.post(`${baseUrl}/gadai-emas`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res?.data?.success) {
        alert("✅ Data gadai emas berhasil disimpan!");
        navigate("/data-nasabah");
      }
    } catch (err) {
      alert("❌ Gagal menyimpan: " + (err.response?.data?.message || "Server Error"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <Stack alignItems="center" justifyContent="center" sx={{ height: "70vh" }}>
      <CircularProgress />
      <Typography sx={{ mt: 2 }}>Sedang memproses data...</Typography>
    </Stack>
  );

  return (
    <Card sx={{ p: 2, borderRadius: 2 }}>
      <CardHeader title="Form Gadai Emas" subheader="Pastikan status awal adalah PROSES" />
      <CardContent>
        <Grid container spacing={3}>
          {/* NASABAH */}
          <Grid item xs={12}><Typography variant="h6">Data Nasabah</Typography><Divider /></Grid>
          <Grid item xs={6}><TextField fullWidth size="small" label="Nama Lengkap" name="nama_lengkap" value={nasabah.nama_lengkap} onChange={setNasabahField} /></Grid>
          <Grid item xs={6}><TextField fullWidth size="small" label="NIK" name="nik" value={nasabah.nik} onChange={setNasabahField} /></Grid>
          <Grid item xs={12}><TextField fullWidth size="small" label="Alamat" name="alamat" value={nasabah.alamat} onChange={setNasabahField} /></Grid>
          <Grid item xs={4}><TextField fullWidth size="small" label="No HP" name="no_hp" value={nasabah.no_hp} onChange={setNasabahField} /></Grid>
          <Grid item xs={4}><TextField fullWidth size="small" label="No Rekening" name="no_rek" value={nasabah.no_rek} onChange={setNasabahField} /></Grid>
          <Grid item xs={4}>
            <TextField select fullWidth size="small" label="Bank" name="bank" value={nasabah.bank} onChange={setNasabahField}>
              {BANK_LIST.map((b) => (<MenuItem key={b} value={b}>{b.replace(/_/g, " ")}</MenuItem>))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" component="label" size="small">Upload KTP
              <input type="file" accept="image/*" hidden onChange={(e) => setFotoKtp(e.target.files?.[0] ?? null)} />
            </Button>
            {fotoKtp && <Typography variant="caption" sx={{ ml: 1 }}>{fotoKtp.name}</Typography>}
          </Grid>

          {/* DETAIL */}
          <Grid item xs={12}><Typography variant="h6">Detail Gadai</Typography><Divider /></Grid>
          <Grid item xs={4}>
            <TextField fullWidth type="date" size="small" label="Tanggal Gadai" name="tanggal_gadai" value={detail.tanggal_gadai} onChange={setDetailField} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Durasi (Jatuh Tempo)</InputLabel>
              <Select name="durasi_hari" value={detail.durasi_hari} label="Durasi (Jatuh Tempo)" onChange={setDetailField}>
                <MenuItem value="15">15 Hari</MenuItem>
                <MenuItem value="30">30 Hari</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4}>
            <TextField fullWidth size="small" label="Tanggal Jatuh Tempo" value={detail.jatuh_tempo} disabled helperText="Terhitung otomatis dari durasi" />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Jenis Gadai</InputLabel>
              <Select name="type_id" value={detail.type_id} onChange={setDetailField} label="Jenis Gadai">
                <MenuItem value={2}>Logam Mulia</MenuItem>
                <MenuItem value={3}>Retro</MenuItem>
                <MenuItem value={4}>Perhiasan</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* BARANG */}
          <Grid item xs={12}><Typography variant="h6">Detail Barang</Typography><Divider /></Grid>
          <Grid item xs={4}><TextField fullWidth size="small" label="Nama Barang" name="nama_barang" value={barang.nama_barang} onChange={setBarangField} /></Grid>
          <Grid item xs={4}><TextField fullWidth size="small" label="Karat" name="karat" value={barang.karat} onChange={setBarangField} /></Grid>
          <Grid item xs={4}><TextField fullWidth size="small" label="Berat (Gram)" name="berat" value={barang.berat} onChange={setBarangField} /></Grid>
          <Grid item xs={6}><TextField fullWidth size="small" label="Kode Cap" name="kode_cap" value={barang.kode_cap} onChange={setBarangField} /></Grid>
          <Grid item xs={6}><TextField fullWidth size="small" label="Potongan Batu" name="potongan_batu" value={barang.potongan_batu} onChange={setBarangField} /></Grid>

          {/* KELENGKAPAN */}
          <Grid item xs={12}><Typography variant="h6">Kelengkapan</Typography><Divider /></Grid>
          <Grid container item spacing={1}>
            {kelengkapanList.map(item => (
              <Grid item xs={4} key={item.id}>
                <FormControlLabel control={<Checkbox size="small" checked={selectedKelengkapan.includes(item.id)} onChange={() => toggleKelengkapan(item.id)} />} label={item.nama_kelengkapan} />
              </Grid>
            ))}
          </Grid>

          {/* DOKUMEN PENDUKUNG */}
          <Grid item xs={12}><Typography variant="h6">Dokumen Pendukung (SOP)</Typography><Divider /></Grid>
          {DOKUMEN_FIELDS.map(field => (
            <Grid item xs={4} key={field}>
              <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>{field.replace(/_/g, " ").toUpperCase()}</Typography>
              <input type="file" style={{ fontSize: '11px' }} onChange={(e) => setDokumenFiles(prev => ({ ...prev, [field]: e.target.files[0] }))} />
            </Grid>
          ))}

          {/* NOMINAL */}
          <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
          <Grid item xs={6}>
            <TextField fullWidth size="small" label="Taksiran" name="taksiran" value={detail.taksiran} onChange={setDetailField} InputProps={{ startAdornment: (<InputAdornment position='start'>Rp</InputAdornment>) }} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth size="small" label="Uang Pinjaman" name="uang_pinjaman" value={detail.uang_pinjaman} onChange={setDetailField} InputProps={{ startAdornment: (<InputAdornment position='start'>Rp</InputAdornment>) }} />
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" justifyContent="flex-end">
              <Button variant="contained" color="primary" onClick={handleSubmit} size="large">Simpan Gadai Emas</Button>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default GadaiEmasFormPage;