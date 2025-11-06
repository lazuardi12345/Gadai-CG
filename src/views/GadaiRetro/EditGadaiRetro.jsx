import React, { useEffect, useState, useContext } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Grid,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Autocomplete,
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { AuthContext } from "AuthContex/AuthContext";

// List kelengkapan
const KELENGKAPAN_LIST = ["Sertifikat", "Nota", "Box", "Lainnya"];

// Dokumen pendukung SOP
const DOKUMEN_PENDUKUNG_SOP = [
  { key: "emas_timbangan", label: "Emas + Timbangan" },
  { key: "gosokan_timer", label: "Gosokan + Timer 1 Menit" },
  { key: "gosokan_ktp", label: "Gosokan + KTP" },
  { key: "batu", label: "Batu (jika ada)" },
  { key: "cap_merek", label: "Cap / Merek (jika ada)" },
  { key: "karatase", label: "Karatase (jika ada)" },
  { key: "ukuran_batu", label: "Ukuran Batu (Metmess)" },
];

const EditGadaiRetroPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nasabahs, setNasabahs] = useState([]);
  const [selectedNasabah, setSelectedNasabah] = useState(null);

  const [form, setForm] = useState({
    nama_barang: "",
    type_retro: "",
    kelengkapan: [],
    kode_cap: "",
    karat: "",
    potongan_batu: "",
    berat: "",
    detail_gadai_id: "",
    dokumen_pendukung: {},
  });

  // Ambil data awal
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // endpoint gadai retro sesuai role
        const urlGet = userRole === "checker"
          ? `/checker/gadai-retro/${id}`
          : `/gadai-retro/${id}`;

        // endpoint nasabah sesuai role
        const urlNasabah = userRole === "checker"
          ? `/checker/data-nasabah`
          : `/data-nasabah`;

        const [resRetro, resNasabah] = await Promise.all([
          axiosInstance.get(urlGet),
          axiosInstance.get(urlNasabah),
        ]);

        const data = resRetro.data.data;

        const kelengkapan = Array.isArray(data.kelengkapan)
          ? data.kelengkapan
          : data.kelengkapan
          ? [data.kelengkapan]
          : [];

        const dokumenPendukung = {};
        if (data.dokumen_pendukung) {
          Object.entries(data.dokumen_pendukung).forEach(([key, val]) => {
            dokumenPendukung[key] = val
              ? { url: val.startsWith("http") ? val : `${window.location.origin}/storage/${val}` }
              : null;
          });
        }

        setForm({
          nama_barang: data.nama_barang || "",
          type_retro: data.type_retro || "",
          kelengkapan,
          kode_cap: data.kode_cap || "",
          karat: data.karat || "",
          potongan_batu: data.potongan_batu || "",
          berat: data.berat || "",
          detail_gadai_id: data.detail_gadai_id || "",
          dokumen_pendukung: dokumenPendukung,
        });

        setNasabahs(resNasabah.data.data || []);
        const nasabahFound = resNasabah.data.data.find(
          (n) => n.id === data.detail_gadai?.nasabah?.id
        );
        setSelectedNasabah(nasabahFound || null);

      } catch (err) {
        console.error(err);
        alert("Gagal mengambil data gadai retro");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, userRole]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (value) => {
    setForm(prev => {
      const exists = prev.kelengkapan.includes(value);
      return {
        ...prev,
        kelengkapan: exists
          ? prev.kelengkapan.filter(v => v !== value)
          : [...prev.kelengkapan, value],
      };
    });
  };

  const handleDokumenChange = (key, file) => {
    setForm(prev => ({
      ...prev,
      dokumen_pendukung: {
        ...prev.dokumen_pendukung,
        [key]: file ? { file, url: URL.createObjectURL(file) } : null,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!form.detail_gadai_id) {
      alert("Silakan pilih Nasabah terlebih dahulu.");
      return;
    }

    try {
      setSaving(true);
      const data = new FormData();
      data.append("_method", "PUT");

      ["nama_barang", "type_retro", "kode_cap", "karat", "potongan_batu", "berat", "detail_gadai_id"]
        .forEach(key => data.append(key, form[key]));

      form.kelengkapan.forEach((item, i) => data.append(`kelengkapan[${i}]`, item));

      Object.entries(form.dokumen_pendukung).forEach(([k, val]) => {
        if (val?.file instanceof File) data.append(`dokumen_pendukung[${k}]`, val.file);
      });

      const urlSubmit = userRole === "checker"
        ? `/checker/gadai-retro/${id}`
        : `/gadai-retro/${id}`;

      const res = await axiosInstance.post(urlSubmit, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        alert("✅ Data berhasil diperbarui!");
        navigate("/gadai-retro");
      } else {
        alert(res.data.message || "Gagal memperbarui data.");
      }
    } catch (err) {
      console.error(err.response?.data || err);
      alert(err.response?.data?.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <Stack alignItems="center" justifyContent="center" sx={{ height: "80vh" }}>
      <CircularProgress />
    </Stack>
  );

  return (
    <Card sx={{ p: 2 }}>
      <CardHeader title="Edit Gadai Retro" />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <TextField
                label="Nama Barang"
                name="nama_barang"
                value={form.nama_barang}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                label="Type Retro"
                name="type_retro"
                value={form.type_retro}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                label="Kode Cap"
                name="kode_cap"
                value={form.kode_cap}
                onChange={handleInputChange}
                fullWidth
              />
              <Typography variant="subtitle1">Kelengkapan:</Typography>
              <FormGroup row>
                {KELENGKAPAN_LIST.map(item => (
                  <FormControlLabel
                    key={item}
                    control={<Checkbox checked={form.kelengkapan.includes(item)} onChange={() => handleCheckboxChange(item)} />}
                    label={item}
                  />
                ))}
              </FormGroup>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <TextField
                label="Karat"
                name="karat"
                value={form.karat}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                label="Potongan Batu"
                name="potongan_batu"
                value={form.potongan_batu}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                label="Berat"
                name="berat"
                value={form.berat}
                onChange={handleInputChange}
                fullWidth
              />
              <Autocomplete
                options={nasabahs}
                getOptionLabel={o => o.nama_lengkap || ""}
                value={selectedNasabah}
                onChange={(e, val) => {
                  setSelectedNasabah(val);
                  setForm(prev => ({ ...prev, detail_gadai_id: val ? val.id : "" }));
                }}
                renderInput={(params) => <TextField {...params} label="Cari Nasabah" placeholder="Ketik nama nasabah..." fullWidth />}
              />
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Upload file dokumen pendukung pemeriksaan retro.
            </Alert>
          </Grid>
          {DOKUMEN_PENDUKUNG_SOP.map(item => (
            <Grid item xs={12} sm={6} key={item.key}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>{item.label}</Typography>
              <Box sx={{ p: 2, border: "1px dashed #ccc", borderRadius: 2, bgcolor: "#fafafa", display: "flex", flexDirection: "column", alignItems: "center" }}>
                {form.dokumen_pendukung[item.key]?.url ? (
                  <Box component="img" src={form.dokumen_pendukung[item.key].url} alt={item.label} sx={{ maxWidth: "150px", maxHeight: "150px", mb: 1, borderRadius: 1, objectFit: "contain" }} />
                ) : (
                  <Typography variant="body2" sx={{ mb: 1, color: "#888" }}>Belum ada file</Typography>
                )}
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" component="label" size="small">
                    Upload
                    <input type="file" hidden accept="image/*" onChange={e => handleDokumenChange(item.key, e.target.files[0])} />
                  </Button>
                  {form.dokumen_pendukung[item.key]?.url && (
                    <Button variant="outlined" color="error" size="small" onClick={() => handleDokumenChange(item.key, null)}>Hapus</Button>
                  )}
                </Stack>
              </Box>
            </Grid>
          ))}

        </Grid>

        <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 4 }}>
          <Button variant="outlined" color="secondary" onClick={() => navigate("/gadai-retro")}>Batal</Button>
          <Button variant="contained" color="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Menyimpan..." : "Update"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default EditGadaiRetroPage;
