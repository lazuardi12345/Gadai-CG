import React, { useEffect, useState, useContext } from "react";
import {
  Box, Grid, Typography, Stack, Button, CircularProgress, Paper, Chip,
  Divider, Dialog, DialogContent, IconButton, Card, CardActionArea, CardMedia, Badge, Tooltip
} from "@mui/material";
import { ArrowBack, Close, Image, Download } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { AuthContext } from "AuthContex/AuthContext";

// SOP Dokumen Logam Mulia
const DOKUMEN_SOP_LOGAM = [
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

const getFullUrl = (path) => {
  if (!path) return null;
  return path.startsWith("http") ? path : `${window.location.origin}/${path}`;
};

const DetailGadaiLogamMuliaPage = () => {
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
  setError(null);

  try {
    let url = `/gadai-logam-mulia/${id}`;
    if (userRole === 'checker') url = `/checker/gadai-logam-mulia/${id}`;
    if (userRole === 'petugas') url = `/petugas/gadai-logam-mulia/${id}`;

    const res = await axiosInstance.get(url);

    if (!res.data.success) {
      setError(res.data.message || "Gagal mengambil data detail");
      return;
    }

    const rawData = res.data.data;

    // Parsing dokumen pendukung sesuai SOP
    const dokumenPendukung = {};
    DOKUMEN_SOP_LOGAM.forEach((key) => {
      const val = rawData.dokumen_pendukung?.[key];
      dokumenPendukung[key] = val ? [getFullUrl(val)] : [];
    });

    setData({
      ...rawData,
      kelengkapan: rawData.kelengkapan_list || [],
      kerusakan: rawData.kerusakan_list || [],
      dokumen_pendukung: dokumenPendukung,
    });

  } catch (err) {
    setError(err.message || "Terjadi kesalahan server");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchDetail();
  }, [id, userRole]);

  if (loading)
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: "70vh" }}>
        <CircularProgress />
      </Stack>
    );

  if (error) return <Typography color="error" variant="h6" align="center" sx={{ mt: 2 }}>{error}</Typography>;
  if (!data) return <Typography align="center" sx={{ mt: 2 }}>Data tidak ditemukan.</Typography>;

  const d = data;
  const nasabah = d.detail_gadai?.nasabah;
  const dokumenKeys = Object.keys(d.dokumen_pendukung || {});

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 3, mb: 8, px: 2 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ position: "sticky", top: 16, zIndex: 20, borderRadius: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} variant="text" sx={{ textTransform: "none" }}>
              Kembali
            </Button>
            <Box>
              <Typography variant="h6" fontWeight={700}>Detail Gadai Logam Mulia</Typography>
              <Typography variant="body2" color="text.secondary">No Gadai: {d.detail_gadai?.no_gadai || '-'}</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Download semua dokumen (ZIP)">
              <Button variant="outlined" size="small" startIcon={<Download />}>Download</Button>
            </Tooltip>
            <Tooltip title="Preview gallery">
              <Button
                variant="contained"
                size="small"
                startIcon={<Image />}
                onClick={() => {
                  const first = dokumenKeys.reduce((acc, k) => acc || d.dokumen_pendukung[k]?.[0] || null, null);
                  if (first) setSelectedImage(first);
                }}
              >
                Preview
              </Button>
            </Tooltip>
          </Stack>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Left column */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2} alignItems="center">
              <Box textAlign="center">
                <Typography variant="h6" fontWeight={800}>{d.nama_barang || '-'}</Typography>
                <Typography variant="body2" color="text.secondary"> Kode/Cap {d.kode_cap || '-'}</Typography>
              </Box>

              <Divider sx={{ width: "100%" }} />

              <Stack spacing={1} sx={{ width: "100%" }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2" color="text.secondary">Karat</Typography>
                  <Typography variant="subtitle2" fontWeight={700}>{d.karat || '-'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2" color="text.secondary">Berat</Typography>
                  <Typography variant="subtitle2" fontWeight={700}>{d.berat ? `${d.berat} gram` : '-'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2" color="text.secondary">Potongan Batu</Typography>
                  <Typography variant="subtitle2" fontWeight={700}>{d.potongan_batu || '-'}</Typography>
                </Box>
              </Stack>

              <Divider sx={{ width: '100%' }} />

              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Kelengkapan</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {d.kelengkapan.length > 0 ? d.kelengkapan.map((k, i) => (
                    <Chip key={i} label={k.nama_kelengkapan} size="small" variant="outlined" color="success" />
                  )) : <Typography variant="body2" color="text.secondary">-</Typography>}
                </Stack>
              </Box>
            </Stack>
          </Paper>

          {/* Nasabah card */}
          <Paper elevation={1} sx={{ mt: 3, p: 2, borderRadius: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">Informasi Nasabah</Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="body1" fontWeight={700}>{nasabah?.nama_lengkap || '-'}</Typography>
              <Typography variant="body2" color="text.secondary">No Nasabah: {d.detail_gadai?.no_nasabah || '-'}</Typography>
              <Typography variant="body2" color="text.secondary">No Gadai: {d.detail_gadai?.no_gadai || '-'}</Typography>
              <Typography variant="body2" color="text.secondary">Tanggal: {d.detail_gadai?.tanggal_gadai || '-'}</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Right column: dokumen */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>Dokumen & Foto</Typography>
            {dokumenKeys.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Image sx={{ fontSize: 48, opacity: 0.4 }} />
                <Typography variant="body2" color="text.secondary">Tidak ada dokumen tersedia sesuai SOP</Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {dokumenKeys.map((key) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography fontWeight={700}>{LABEL_PENDUKUNG[key] || key}</Typography>
                        <Badge badgeContent={d.dokumen_pendukung[key]?.length || 0} color="primary" />
                      </Box>
                      <Grid container spacing={1}>
                        {(d.dokumen_pendukung[key] || []).map((url, idx) => (
                          <Grid item xs={6} key={idx}>
                            <Card sx={{ borderRadius: 2, overflow: 'hidden', cursor: 'pointer', boxShadow: 2 }}>
                              <CardActionArea onClick={() => setSelectedImage(url)}>
                                <CardMedia
                                  component="img"
                                  height="140"
                                  image={url}
                                  alt={`${key}-${idx}`}
                                  sx={{ objectFit: 'cover', transition: 'transform .25s', '&:hover': { transform: 'scale(1.03)' } }}
                                />
                              </CardActionArea>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog Preview */}
      <Dialog open={!!selectedImage} onClose={() => setSelectedImage("")} maxWidth="xl">
        <DialogContent sx={{ position: 'relative', p: 0, bgcolor: 'background.paper' }}>
          <IconButton onClick={() => setSelectedImage("")} sx={{ position: 'absolute', top: 12, right: 12, zIndex: 30, bgcolor: 'rgba(255,255,255,0.9)' }}>
            <Close />
          </IconButton>
          <Box component="img" src={selectedImage} alt="preview" sx={{ width: '100%', height: '80vh', objectFit: 'contain' }} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DetailGadaiLogamMuliaPage;
