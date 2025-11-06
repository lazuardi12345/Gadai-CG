import React, { useEffect, useState, useContext } from "react";
import {
  CardHeader,
  CardContent,
  Grid,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Chip,
  Box,
  Paper,
  Divider,
  Dialog,
  DialogContent,
  IconButton,
} from "@mui/material";
import { ArrowBack, Close } from "@mui/icons-material";
import axiosInstance from "api/axiosInstance";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "AuthContex/AuthContext"; // Ambil role user

const DOKUMEN_PENDUKUNG_KEYS = [
  "emas_timbangan",
  "gosokan_timer",
  "gosokan_ktp",
  "batu",
  "cap_merek",
  "karatase",
  "ukuran_batu",
];

const LABEL_PENDUKUNG = {
  emas_timbangan: "Emas + Timbangan",
  gosokan_timer: "Gosokan + Timer 1 Menit",
  gosokan_ktp: "Gosokan + KTP",
  batu: "Batu (jika ada)",
  cap_merek: "Cap / Merek (jika ada)",
  karatase: "Karatase (jika ada)",
  ukuran_batu: "Ukuran Batu (Metmess)",
};

// Helper untuk menentukan endpoint sesuai role
const getApiUrlById = (resource, role, id) => {
  switch (role) {
    case "petugas":
      return `/petugas/${resource}/${id}`;
    case "checker":
      return `/checker/${resource}/${id}`;
    case "hm":
    default:
      return `/${resource}/${id}`;
  }
};

const DetailGadaiPerhiasanPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const url = getApiUrlById("gadai-perhiasan", userRole, id);
      const res = await axiosInstance.get(url);

      if (res.data.success) {
        const rawData = res.data.data;

        // Transform dokumen pendukung jadi URL lengkap
        const dokumenPendukung = {};
        if (rawData.dokumen_pendukung) {
          Object.entries(rawData.dokumen_pendukung).forEach(([key, val]) => {
            if (typeof val === "string" && val) {
              dokumenPendukung[key] = { url: val.startsWith("http") ? val : `${window.location.origin}/${val}` };
            } else if (Array.isArray(val) && val.length > 0) {
              dokumenPendukung[key] = { url: val[0].startsWith("http") ? val[0] : `${window.location.origin}/${val[0]}` };
            } else {
              dokumenPendukung[key] = null;
            }
          });
        }

        setData({ ...rawData, dokumen_pendukung: dokumenPendukung });
      } else {
        setError(res.data.message || "Gagal mengambil data detail");
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id, userRole]);

  const handleOpenImage = (url) => setSelectedImage(url);
  const handleCloseImage = () => setSelectedImage("");

  if (loading)
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: "80vh" }}>
        <CircularProgress />
      </Stack>
    );

  if (error)
    return (
      <Typography color="error" variant="h6" align="center" sx={{ mt: 2 }}>
        Error: {error}
      </Typography>
    );

  if (!data)
    return (
      <Typography align="center" sx={{ mt: 2 }}>
        Data tidak ditemukan.
      </Typography>
    );

  const d = data;
  const nasabah = d.detail_gadai?.nasabah;
  const sectionStyle = { mb: 3, p: 3, borderRadius: 2, bgcolor: "#f9f9f9" };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 2, mb: 6 }}>
      <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
        <CardHeader
          title={<Typography variant="h5" fontWeight={600}>Detail Gadai Perhiasan</Typography>}
          action={
            <Button
              variant="outlined"
              color="primary"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
            >
              Kembali
            </Button>
          }
          sx={{ bgcolor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}
        />
        <CardContent sx={{ p: 3 }}>
          {/* Informasi Nasabah */}
          <Paper sx={sectionStyle} elevation={0}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Informasi Nasabah</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography><strong>Nama:</strong> {nasabah?.nama_lengkap || "-"}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography><strong>No Nasabah:</strong> {d.detail_gadai?.no_nasabah || "-"}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography><strong>No Gadai:</strong> {d.detail_gadai?.no_gadai || "-"}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography><strong>Tanggal Gadai:</strong> {d.detail_gadai?.tanggal_gadai || "-"}</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Informasi Barang */}
          <Paper sx={sectionStyle} elevation={0}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Informasi Barang</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {[
                ['Nama Barang', d.nama_barang],
                ['Tipe Perhiasan', d.type_perhiasan],
                ['Kode Cap', d.kode_cap],
                ['Karat', d.karat],
                ['Berat', d.berat ? `${d.berat} gram` : "-"],
                ['Potongan Batu', d.potongan_batu],
              ].map(([label, value], i) => (
                <Grid item xs={12} sm={6} key={i}>
                  <Typography><strong>{label}:</strong> {value || "-"}</Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Kelengkapan & Kerusakan */}
          <Paper sx={sectionStyle} elevation={0}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Kelengkapan & Kerusakan</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ mb: 1 }}><strong>Kelengkapan:</strong></Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {(Array.isArray(d.kelengkapan) ? d.kelengkapan : [d.kelengkapan])
                    .filter(Boolean)
                    .map((k, i) => <Chip key={i} label={k} color="success" variant="outlined" size="small" />)}
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ mb: 1 }}><strong>Kerusakan:</strong></Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {(Array.isArray(d.kerusakan) ? d.kerusakan : [d.kerusakan])
                    .filter(Boolean)
                    .map((r, i) => <Chip key={i} label={r} color="error" variant="outlined" size="small" />)}
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* Status Gadai */}
          <Paper sx={sectionStyle} elevation={0}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Status Gadai</Typography>
            <Divider sx={{ mb: 2 }} />
            <Chip
              label={d.detail_gadai?.status?.toUpperCase() || "-"}
              color={
                d.detail_gadai?.status === "proses" ? "warning" :
                d.detail_gadai?.status === "selesai" ? "info" :
                d.detail_gadai?.status === "lunas" ? "success" : "default"
              }
              size="small"
            />
          </Paper>

          {/* Dokumen Pendukung */}
          <Paper sx={sectionStyle} elevation={0}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Dokumen Pendukung</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {DOKUMEN_PENDUKUNG_KEYS.map((key) => (
                <Grid item xs={12} sm={4} key={key}>
                  <Typography sx={{ mb: 1, fontSize: 14, fontWeight: 500 }}>
                    {LABEL_PENDUKUNG[key]}
                  </Typography>
                  {d.dokumen_pendukung[key]?.url ? (
                    <Box
                      component="img"
                      src={d.dokumen_pendukung[key].url}
                      alt={key}
                      sx={{
                        width: '100%',
                        maxHeight: 150,
                        objectFit: 'contain',
                        borderRadius: 1,
                        border: '1px solid #ccc',
                        cursor: 'pointer',
                        transition: 'transform 0.3s',
                        '&:hover': { transform: 'scale(1.05)' }
                      }}
                      onClick={() => handleOpenImage(d.dokumen_pendukung[key].url)}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">Belum ada dokumen</Typography>
                  )}
                </Grid>
              ))}
            </Grid>
          </Paper>
        </CardContent>
      </Paper>

      {/* Dialog Preview Gambar */}
      <Dialog open={!!selectedImage} onClose={handleCloseImage} maxWidth="lg">
        <DialogContent sx={{ position: "relative", p: 0 }}>
          <IconButton
            onClick={handleCloseImage}
            sx={{ position: "absolute", top: 8, right: 8, zIndex: 10, bgcolor: "rgba(255,255,255,0.7)" }}
          >
            <Close />
          </IconButton>
          <Box
            component="img"
            src={selectedImage}
            alt="Preview"
            sx={{ width: "100%", height: "auto", maxHeight: "90vh", objectFit: "contain" }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DetailGadaiPerhiasanPage;
