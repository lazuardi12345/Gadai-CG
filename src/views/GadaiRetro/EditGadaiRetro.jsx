import React, { useEffect, useState, useContext } from "react";
import {
  Box, Grid, Typography, Stack, Button, CircularProgress, Paper,
  Chip, Divider, Card, CardActionArea, CardMedia, IconButton, Dialog,
  TextField
} from "@mui/material";
import { ArrowBack, Close, PhotoCamera, Folder } from "@mui/icons-material"; // Tambah icon
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { AuthContext } from "AuthContex/AuthContext";
import imageCompression from "browser-image-compression"; // Import library kompresi

const DOKUMEN_SOP_RETRO = [
  { key: "emas_timbangan", label: "Emas + Timbangan" },
  { key: "gosokan_timer", label: "Gosokan + Timer 1 Menit" },
  { key: "gosokan_ktp", label: "Gosokan + KTP" },
  { key: "batu", label: "Batu (jika ada)" },
  { key: "cap_merek", label: "Cap / Merek (jika ada)" },
  { key: "karatase", label: "Karatase (jika ada)" },
  { key: "ukuran_batu", label: "Ukuran Batu (Metmess)" },
];

const getFullUrl = (path) =>
  path ? (path.startsWith("http") ? path : `${window.location.origin}/storage/${path}`) : null;

const EditGadaiRetroPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const role = (user?.role || "").toLowerCase();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false); // State loading kompresi
  const [allKelengkapan, setAllKelengkapan] = useState([]);
  const [nasabah, setNasabah] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");

  const [form, setForm] = useState({
    nama_barang: "",
    kelengkapan: [],
    kode_cap: "",
    karat: "",
    potongan_batu: "",
    berat: "",
    detail_gadai_id: "",
    dokumen_pendukung: {},
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const urlKelengkapan = role === "checker" ? "/checker/kelengkapan-emas" : "/kelengkapan-emas";
        const urlGadai = role === "checker" ? `/checker/gadai-retro/${id}` : `/gadai-retro/${id}`;
        const [resKelengkapan, resGadai] = await Promise.all([
          axiosInstance.get(urlKelengkapan),
          axiosInstance.get(urlGadai),
        ]);

        const kelengkapanData = Array.isArray(resKelengkapan.data.data) ? resKelengkapan.data.data : [];
        setAllKelengkapan(kelengkapanData);

        const data = resGadai.data.data;
        setNasabah(data.detail_gadai?.nasabah || null);

        const kelengkapanList = Array.isArray(data.kelengkapan_list)
          ? data.kelengkapan_list.map(k => k.nama_kelengkapan)
          : [];

        const dokumenObj = data.dokumen_pendukung || {};
        const dokumenPendukung = {};

        DOKUMEN_SOP_RETRO.forEach(({ key }) => {
          dokumenPendukung[key] = dokumenObj[key]
            ? { url: getFullUrl(dokumenObj[key]) }
            : null;
        });

        setForm({
          nama_barang: data.nama_barang || "",
          kelengkapan: kelengkapanList,
          kode_cap: data.kode_cap || "",
          karat: data.karat || "",
          potongan_batu: data.potongan_batu || "",
          berat: data.berat || "",
          detail_gadai_id: data.detail_gadai?.id || data.detail_gadai_id || "",
          dokumen_pendukung: dokumenPendukung,
        });

      } catch (err) {
        console.error(err);
        alert("Gagal mengambil data gadai retro");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, role]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (value) => {
    setForm(prev => ({
      ...prev,
      kelengkapan: prev.kelengkapan.includes(value)
        ? prev.kelengkapan.filter(v => v !== value)
        : [...prev.kelengkapan, value]
    }));
  };

  // Fungsi Kompresi & Handle Kamera/Galeri
  const handleDokumenChange = async (key, file) => {
    if (!file) {
      setForm(prev => ({
        ...prev,
        dokumen_pendukung: { ...prev.dokumen_pendukung, [key]: null }
      }));
      return;
    }

    const options = {
      maxSizeMB: 0.9,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.8
    };

    try {
      setCompressing(true);
      const compressedFile = await imageCompression(file, options);
      const uniqueFile = new File([compressedFile], `${key}_${Date.now()}.jpg`, { type: "image/jpeg" });
      
      setForm(prev => ({
        ...prev,
        dokumen_pendukung: {
          ...prev.dokumen_pendukung,
          [key]: { file: uniqueFile, url: URL.createObjectURL(uniqueFile) },
        },
      }));
    } catch (error) {
      console.error("Gagal memproses gambar:", error);
      alert("Terjadi kesalahan saat memproses gambar.");
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const dataForm = new FormData();
      dataForm.append("_method", "PUT");

      ["nama_barang", "kode_cap", "karat", "potongan_batu", "berat"]
        .forEach(key => dataForm.append(key, form[key] ?? ""));

      form.kelengkapan.forEach((nama, i) => {
        const item = allKelengkapan.find(k => k.nama_kelengkapan === nama);
        if (item) dataForm.append(`kelengkapan[${i}]`, item.id);
      });

      Object.entries(form.dokumen_pendukung).forEach(([key, val]) => {
        if (val?.file instanceof File) {
          dataForm.append(`dokumen_pendukung[${key}]`, val.file);
        }
      });

      const urlSubmit = role === "checker" ? `/checker/gadai-retro/${id}` : `/gadai-retro/${id}`;

      const res = await axiosInstance.post(urlSubmit, dataForm, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        alert("Data berhasil diperbarui!");
        navigate("/gadai-retro");
      } else {
        alert(res.data.message || "Gagal memperbarui data.");
      }
    } catch (err) {
      console.error(err.response?.data || err);
      alert(err.response?.data?.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Stack alignItems="center" justifyContent="center" sx={{ height: "80vh" }}><CircularProgress /></Stack>;

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 3, mb: 8, px: 2 }}>
      <Paper elevation={2} sx={{ position: "sticky", top: 16, zIndex: 20, borderRadius: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} variant="text">Kembali</Button>
            <Typography variant="h6" fontWeight={700}>Edit Gadai Retro</Typography>
          </Stack>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2}>
              <TextField label="Nama Barang" name="nama_barang" value={form.nama_barang} onChange={handleInputChange} fullWidth />
              <TextField label="Kode Cap" name="kode_cap" value={form.kode_cap} onChange={handleInputChange} fullWidth />
              <TextField label="Karat" name="karat" value={form.karat} onChange={handleInputChange} fullWidth />
              <TextField label="Potongan Batu" name="potongan_batu" value={form.potongan_batu} onChange={handleInputChange} fullWidth />
              <TextField label="Berat" name="berat" value={form.berat} onChange={handleInputChange} fullWidth />

              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2">Kelengkapan</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {allKelengkapan.map(k => (
                  <Chip
                    key={k.id}
                    label={k.nama_kelengkapan}
                    color={form.kelengkapan.includes(k.nama_kelengkapan) ? "success" : "default"}
                    onClick={() => handleCheckboxChange(k.nama_kelengkapan)}
                    clickable
                  />
                ))}
              </Stack>

              {nasabah && (
                <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                  <Typography variant="subtitle2">Informasi Nasabah</Typography>
                  <Typography fontWeight={700}>{nasabah.nama_lengkap}</Typography>
                  <Typography variant="body2">NIK: {nasabah.nik}</Typography>
                  <Typography variant="body2">No HP: {nasabah.no_hp}</Typography>
                  <Typography variant="body2">No Rek: {nasabah.no_rek}</Typography>
                </Paper>
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={800}>Dokumen & Foto</Typography>
              {compressing && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={14} />
                  <Typography variant="caption">Memproses Foto...</Typography>
                </Stack>
              )}
            </Stack>

            <Grid container spacing={2}>
              {DOKUMEN_SOP_RETRO.map(({ key, label }) => (
                <Grid item xs={12} sm={6} key={key}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" fontWeight={800} display="block" sx={{ mb: 1, textTransform: 'uppercase' }}>
                      {label}
                    </Typography>
                    <Grid container spacing={1}>
                      {form.dokumen_pendukung[key]?.url && (
                        <Grid item xs={12}>
                          <Card sx={{ borderRadius: 2, overflow: 'hidden', cursor: 'pointer', mb: 1 }}>
                            <CardActionArea onClick={() => setSelectedImage(form.dokumen_pendukung[key].url)}>
                              <CardMedia component="img" height="140" image={form.dokumen_pendukung[key].url} alt={key} />
                            </CardActionArea>
                          </Card>
                          <Button variant="outlined" color="error" size="small" fullWidth onClick={() => handleDokumenChange(key, null)}>Hapus</Button>
                        </Grid>
                      )}
                      
                      {/* Tombol Kamera */}
                      <Grid item xs={6}>
                        <Button variant="contained" component="label" fullWidth size="small" startIcon={<PhotoCamera />} disabled={compressing}>
                          Kamera
                          <input type="file" hidden accept="image/*" capture="environment" onChange={e => handleDokumenChange(key, e.target.files[0])} />
                        </Button>
                      </Grid>

                      {/* Tombol Galeri */}
                      <Grid item xs={6}>
                        <Button variant="outlined" component="label" fullWidth size="small" startIcon={<Folder />} disabled={compressing}>
                          Galeri
                          <input type="file" hidden accept="image/*" onChange={e => handleDokumenChange(key, e.target.files[0])} />
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button variant="outlined" color="secondary" onClick={() => navigate("/gadai-retro")}>Batal</Button>
              <Button variant="contained" color="primary" onClick={handleSubmit} disabled={saving || compressing}>
                {saving ? "Menyimpan..." : "Update"}
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={!!selectedImage} onClose={() => setSelectedImage("")} maxWidth="xl">
        <IconButton onClick={() => setSelectedImage("")} sx={{ position: 'absolute', top: 12, right: 12, zIndex: 30, bgcolor: 'rgba(255,255,255,0.9)' }}><Close /></IconButton>
        <Box component="img" src={selectedImage} alt="preview" sx={{ width: '100%', height: '80vh', objectFit: 'contain' }} />
      </Dialog>
    </Box>
  );
};

export default EditGadaiRetroPage;