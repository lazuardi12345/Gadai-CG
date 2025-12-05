import React, { useEffect, useState, useContext } from "react";
import {
  Box, Grid, Typography, Stack, Button, CircularProgress, Paper,
  Chip, Divider, Card, CardActionArea, CardMedia, IconButton, TextField, Dialog
} from "@mui/material";
import { ArrowBack, Close } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { AuthContext } from "AuthContex/AuthContext";

// SOP Dokumen Logam Mulia
const DOKUMEN_SOP_LOGAM = [
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

const EditGadaiLogamMuliaPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const role = (user?.role || "").toLowerCase();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allKelengkapan, setAllKelengkapan] = useState([]);
  const [form, setForm] = useState({
    nama_barang: "",
    kode_cap: "",
    karat: "",
    potongan_batu: "",
    berat: "",
    kelengkapan: [],
    dokumen_pendukung: {}
  });
  const [nasabah, setNasabah] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");

  // Fetch data awal
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const urlKelengkapan = role === "checker" ? "/checker/kelengkapan-emas" : "/kelengkapan-emas";
        const resKelengkapan = await axiosInstance.get(urlKelengkapan);
        const kelengkapanData = Array.isArray(resKelengkapan.data.data) ? resKelengkapan.data.data : [];
        setAllKelengkapan(kelengkapanData);

        const urlGadai = role === "checker"
          ? `/checker/gadai-logam-mulia/${id}`
          : `/gadai-logam-mulia/${id}`;
        const resGadai = await axiosInstance.get(urlGadai);
        const data = resGadai.data.data;

        setNasabah(data.detail_gadai?.nasabah || null);

        const dokumenPendukung = {};
        DOKUMEN_SOP_LOGAM.forEach(({ key }) => {
          const val = data.dokumen_pendukung?.[key];
          dokumenPendukung[key] = val ? { url: getFullUrl(val) } : null;
        });

        setForm({
          nama_barang: data.nama_barang || "",
          kode_cap: data.kode_cap || "",
          karat: data.karat || "",
          potongan_batu: data.potongan_batu || "",
          berat: data.berat || "",
          kelengkapan: Array.isArray(data.kelengkapan_list)
            ? data.kelengkapan_list.map(k => ({
              id: k.id,
              nama_kelengkapan: k.nama_kelengkapan
            }))
            : [],

          dokumen_pendukung: dokumenPendukung
        });

      } catch (err) {
        console.error(err);
        alert("Gagal mengambil data gadai logam mulia");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, role]);

  // Handle input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Checkbox kelengkapan
  const handleCheckboxChange = (item) => {
    setForm(prev => {
      const exists = prev.kelengkapan.find(k => k.id === item.id);
      if (exists) {
        return { ...prev, kelengkapan: prev.kelengkapan.filter(k => k.id !== item.id) };
      } else {
        return { ...prev, kelengkapan: [...prev.kelengkapan, { ...item, nominal_override: "" }] };
      }
    });
  };

  // Nominal override
  const handleNominalChange = (id, value) => {
    setForm(prev => ({
      ...prev,
      kelengkapan: prev.kelengkapan.map(k => k.id === id ? { ...k, nominal_override: value } : k)
    }));
  };

  // Dokumen
  const handleDokumenChange = (key, file) => {
    setForm(prev => ({
      ...prev,
      dokumen_pendukung: { ...prev.dokumen_pendukung, [key]: file ? { file, url: URL.createObjectURL(file) } : null }
    }));
  };

  // Submit
  const handleSubmit = async () => {
    const dataForm = new FormData();
    dataForm.append("_method", "PUT");
    ["nama_barang", "kode_cap", "karat", "potongan_batu", "berat"].forEach(key => dataForm.append(key, form[key]));
    form.kelengkapan.forEach((item, i) => {
      dataForm.append(`kelengkapan[${i}][id]`, item.id);
    });
    Object.entries(form.dokumen_pendukung).forEach(([k, val]) => {
      if (val?.file instanceof File) dataForm.append(`dokumen_pendukung[${k}]`, val.file);
    });

    try {
      setSaving(true);
      const urlSubmit = role === "checker"
        ? `/checker/gadai-logam-mulia/${id}`
        : `/gadai-logam-mulia/${id}`;
      const res = await axiosInstance.post(urlSubmit, dataForm, { headers: { "Content-Type": "multipart/form-data" } });
      if (res.data.success) {
        alert("Data berhasil diperbarui!");
        navigate("/gadai-logam-mulia");
      } else {
        alert(res.data.message || "Gagal memperbarui data.");
      }
    } catch (err) {
      console.error(err.response?.data || err);
      alert(err.response?.data?.message || "Terjadi kesalahan saat menyimpan data.");
    } finally { setSaving(false); }
  };

  if (loading) return <Stack alignItems="center" justifyContent="center" sx={{ height: "80vh" }}><CircularProgress /></Stack>;

  const dokumenKeys = Object.keys(form.dokumen_pendukung || {});

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 3, mb: 8, px: 2 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ position: "sticky", top: 16, zIndex: 20, borderRadius: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} variant="text">Kembali</Button>
            <Typography variant="h6" fontWeight={700}>Edit Gadai Logam Mulia</Typography>
          </Stack>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Left column */}
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
                    color={form.kelengkapan.some(f => f.id === k.id) ? "success" : "default"}
                    onClick={() => handleCheckboxChange(k)}
                    clickable
                  />
                ))}
              </Stack>

              {form.kelengkapan.map(k => (
                <TextField
                  key={k.id}
                  label={`Nominal ${k.nama_kelengkapan}`}
                  type="number"
                  value={k.nominal_override || ""}
                  onChange={(e) => handleNominalChange(k.id, e.target.value)}
                  fullWidth
                  sx={{ mt: 1 }}
                />
              ))}


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

        {/* Right column: dokumen */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>Dokumen & Foto</Typography>
            {dokumenKeys.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">Tidak ada dokumen tersedia sesuai SOP</Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {dokumenKeys.map(key => (
                  <Grid item xs={12} sm={6} key={key}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography fontWeight={700}>{DOKUMEN_SOP_LOGAM.find(d => d.key === key)?.label || key}</Typography>
                      <Grid container spacing={1}>
                        {form.dokumen_pendukung[key]?.url && (
                          <Grid item xs={6}>
                            <Card sx={{ borderRadius: 2, overflow: 'hidden', cursor: 'pointer' }}>
                              <CardActionArea onClick={() => setSelectedImage(form.dokumen_pendukung[key].url)}>
                                <CardMedia component="img" height="140" image={form.dokumen_pendukung[key].url} alt={key} />
                              </CardActionArea>
                            </Card>
                            <Button variant="outlined" color="error" size="small" fullWidth sx={{ mt: 1 }} onClick={() => handleDokumenChange(key, null)}>Hapus</Button>
                          </Grid>
                        )}
                        <Grid item xs={6}>
                          <Button variant="contained" component="label" fullWidth size="small" sx={{ mt: 1 }}>
                            Upload
                            <input type="file" hidden accept="image/*" onChange={e => handleDokumenChange(key, e.target.files[0])} />
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}

            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button variant="outlined" color="secondary" onClick={() => navigate("/gadai-logam-mulia")}>Batal</Button>
              <Button variant="contained" color="primary" onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan..." : "Update"}</Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog Preview */}
      <Dialog open={!!selectedImage} onClose={() => setSelectedImage("")} maxWidth="xl">
        <IconButton onClick={() => setSelectedImage("")} sx={{ position: 'absolute', top: 12, right: 12, zIndex: 30, bgcolor: 'rgba(255,255,255,0.9)' }}><Close /></IconButton>
        <Box component="img" src={selectedImage} alt="preview" sx={{ width: '100%', height: '80vh', objectFit: 'contain' }} />
      </Dialog>
    </Box>
  );
};

export default EditGadaiLogamMuliaPage;
