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

const formatRupiah = (value) => {
  const number = value.replace(/\D/g, "");
  return new Intl.NumberFormat("id-ID").format(number);
};

const GadaiEmasFormPage = () => {
  const navigate = useNavigate();
  const baseUrl = getRoleBaseUrl();
  const [loading, setLoading] = useState(false);

  // Nasabah
  const [nasabah, setNasabah] = useState({
    nama_lengkap: "", nik: "", alamat: "", no_hp: "", no_rek: ""
  });
  const [fotoKtp, setFotoKtp] = useState(null);

  // Detail Gadai
  const [detail, setDetail] = useState({
    tanggal_gadai: new Date().toISOString().split("T")[0],
    jatuh_tempo: "",
    taksiran: "",
    uang_pinjaman: "",
    type_id: "",
  });

  // Barang
  const [barang, setBarang] = useState({
    nama_barang: "", karat: "", berat: "", kode_cap: "", potongan_batu: ""
  });

  // Kelengkapan
  const [kelengkapanList, setKelengkapanList] = useState([]);
  const [selectedKelengkapan, setSelectedKelengkapan] = useState([]);

  // Dokumen pendukung
  const [dokumenFiles, setDokumenFiles] = useState({});

  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const resKel = await axiosInstance.get(`${baseUrl}/kelengkapan-emas`);
        const kel = resKel?.data?.data ?? resKel?.data ?? [];
        setKelengkapanList(kel);
      } catch (e) {
        console.error("Error fetching kelengkapan", e);
      }
    };
    fetchMaster();
  }, [baseUrl]);

  const setNasabahField = (e) =>
    setNasabah(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const setDetailField = (e) => {
    const { name, value } = e.target;

    // Rupiah
    if (name === "taksiran" || name === "uang_pinjaman") {
      setDetail(prev => ({ ...prev, [name]: formatRupiah(value) }));
      return;
    }

    // Jatuh tempo 15/30 hari
    if (name === "jatuh_tempo") {
      const days = parseInt(value);
      const baseDate = new Date(detail.tanggal_gadai);
      baseDate.setDate(baseDate.getDate() + days);
      const jatuhTempo = baseDate.toISOString().split("T")[0];
      setDetail(prev => ({ ...prev, jatuh_tempo: jatuhTempo }));
      return;
    }

    setDetail(prev => ({ ...prev, [name]: value }));
  };

  const setBarangField = (e) =>
    setBarang(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const toggleKelengkapan = (id) => {
    setSelectedKelengkapan(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleDokumenChange = (field, file) =>
    setDokumenFiles(prev => ({ ...prev, [field]: file }));

  const validateBeforeSubmit = () => {
    if (!nasabah.nama_lengkap || !nasabah.nik) { alert("Lengkapi data nasabah."); return false; }
    if (!fotoKtp) { alert("Upload Foto KTP nasabah."); return false; }
    if (!detail.type_id) { alert("Pilih jenis gadai."); return false; }
    if (!barang.nama_barang || !barang.karat || !barang.berat) { alert("Lengkapi data barang."); return false; }
    return true;
  };

// ...import dan hooks tetap sama

const handleSubmit = async () => {
  if (!validateBeforeSubmit()) return;

  try {
    setLoading(true);
    const fd = new FormData();

    // Nasabah
    Object.entries(nasabah).forEach(([k, v]) => fd.append(`nasabah[${k}]`, v));
    if (fotoKtp) fd.append("nasabah[foto_ktp]", fotoKtp);

    // Detail
    fd.append("detail[tanggal_gadai]", detail.tanggal_gadai);
    fd.append("detail[jatuh_tempo]", detail.jatuh_tempo);
    fd.append("detail[type_id]", detail.type_id);
    fd.append("detail[taksiran]", detail.taksiran.replace(/\D/g, "") || "0");
    fd.append("detail[uang_pinjaman]", detail.uang_pinjaman.replace(/\D/g, "") || "0");

    // Barang
    Object.entries(barang).forEach(([k, v]) => fd.append(`barang[${k}]`, v));

    // Kelengkapan
    selectedKelengkapan.forEach(id => fd.append("barang[kelengkapan][]", id));

    // Dokumen pendukung sebagai object agar Laravel bisa baca
    DOKUMEN_FIELDS.forEach(field => {
      const file = dokumenFiles[field];
      if (file) fd.append(`barang[dokumen_pendukung][${field}]`, file);
    });

    const res = await axiosInstance.post(`${baseUrl}/gadai-emas`, fd, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    if (res?.data?.success) {
      alert("Data gadai emas berhasil disimpan!");
      navigate("/data-nasabah"); // redirect
    } else {
      alert("Gagal menyimpan data.");
    }
  } catch (err) {
    console.error("Submit error", err);
    alert("Error menyimpan data.");
  } finally {
    setLoading(false);
  }
};

  if (loading) return (
    <Stack alignItems="center" justifyContent="center" sx={{ height: "70vh" }}>
      <CircularProgress />
    </Stack>
  );

  return (
    <Card sx={{ p: 2, borderRadius: 2 }}>
      <CardHeader title="Form Gadai Emas" />
      <CardContent>
        <Grid container spacing={3}>

          {/* NASABAH */}
          <Grid item xs={12}><Typography variant="h6">Data Nasabah</Typography><Divider /></Grid>
          <Grid item xs={6}><TextField fullWidth size="small" label="Nama Lengkap" name="nama_lengkap" value={nasabah.nama_lengkap} onChange={setNasabahField} /></Grid>
          <Grid item xs={6}><TextField fullWidth size="small" label="NIK" name="nik" value={nasabah.nik} onChange={setNasabahField} /></Grid>
          <Grid item xs={12}><TextField fullWidth size="small" label="Alamat" name="alamat" value={nasabah.alamat} onChange={setNasabahField} /></Grid>
          <Grid item xs={6}><TextField fullWidth size="small" label="No HP" name="no_hp" value={nasabah.no_hp} onChange={setNasabahField} /></Grid>
          <Grid item xs={6}><TextField fullWidth size="small" label="No Rekening" name="no_rek" value={nasabah.no_rek} onChange={setNasabahField} /></Grid>

          <Grid item xs={12}>
            <Button variant="contained" component="label">Upload KTP
              <input type="file" accept="image/*" hidden onChange={(e) => setFotoKtp(e.target.files?.[0] ?? null)} />
            </Button>
            {fotoKtp && <Typography variant="caption" sx={{ ml: 1 }}>{fotoKtp.name}</Typography>}
          </Grid>

          {/* DETAIL */}
          <Grid item xs={12}><Typography variant="h6">Detail Gadai</Typography><Divider /></Grid>
          <Grid item xs={6}>
            <TextField fullWidth type="date" size="small" label="Tanggal Gadai"
              name="tanggal_gadai" value={detail.tanggal_gadai} onChange={setDetailField}
              InputLabelProps={{ shrink: true }} />
          </Grid>

          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Jatuh Tempo</InputLabel>
              <Select name="jatuh_tempo" label="Jatuh Tempo" onChange={setDetailField}>
                <MenuItem value="15">15 Hari</MenuItem>
                <MenuItem value="30">30 Hari</MenuItem>
              </Select>
            </FormControl>
            {detail.jatuh_tempo && <Typography variant="caption">Tanggal: {detail.jatuh_tempo}</Typography>}
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
          <Grid item xs={4}><TextField fullWidth size="small" label="Kode Cap" name="kode_cap" value={barang.kode_cap} onChange={setBarangField} /></Grid>
          <Grid item xs={4}><TextField fullWidth size="small" label="Potongan Batu" name="potongan_batu" value={barang.potongan_batu} onChange={setBarangField} /></Grid>

          {/* KELENGKAPAN */}
          <Grid item xs={12}><Typography variant="h6">Kelengkapan</Typography><Divider /></Grid>
          <Grid container item spacing={1}>
            {kelengkapanList.map(item => (
              <Grid item xs={4} key={item.id}>
                <FormControlLabel
                  control={<Checkbox checked={selectedKelengkapan.includes(item.id)} onChange={() => toggleKelengkapan(item.id)} />}
                  label={item.nama_kelengkapan}
                />
              </Grid>
            ))}
          </Grid>

          {/* DOKUMEN PENDUKUNG */}
          <Grid item xs={12}><Typography variant="h6">Dokumen Pendukung</Typography><Divider /></Grid>
          {DOKUMEN_FIELDS.map(field => (
            <Grid item xs={6} key={field}>
              <Typography variant="caption" display="block" sx={{ mb: .5 }}>
                {field.replace(/_/g, " ")}
              </Typography>
              <Button variant="outlined" component="label" size="small">Upload
                <input type="file" hidden onChange={(e) => handleDokumenChange(field, e.target.files?.[0] ?? null)} />
              </Button>
              {dokumenFiles[field] && <Typography variant="caption" sx={{ ml: 1 }}>
                {dokumenFiles[field].name}
              </Typography>}
            </Grid>
          ))}

          {/* NOMINAL */}
          <Grid item xs={6}>
            <TextField fullWidth size="small" label="Taksiran" name="taksiran"
              value={detail.taksiran} onChange={setDetailField}
              InputProps={{ startAdornment: (<InputAdornment position='start'>Rp</InputAdornment>) }} />
          </Grid>

          <Grid item xs={6}>
            <TextField fullWidth size="small" label="Uang Pinjaman" name="uang_pinjaman"
              value={detail.uang_pinjaman} onChange={setDetailField}
              InputProps={{ startAdornment: (<InputAdornment position='start'>Rp</InputAdornment>) }} />
          </Grid>

          {/* SUBMIT */}
          <Grid item xs={12}>
            <Stack direction="row" justifyContent="flex-end">
              <Button variant="contained" onClick={handleSubmit}>Simpan</Button>
            </Stack>
          </Grid>

        </Grid>
      </CardContent>
    </Card>
  );
};

export default GadaiEmasFormPage;
