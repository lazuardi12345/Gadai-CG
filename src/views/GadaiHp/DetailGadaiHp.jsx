import React, { useEffect, useState, useContext } from "react";
import {
  CardHeader,
  CardContent,
  Grid,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Box,
  Paper,
  Dialog,
  DialogContent,
  IconButton,
  Chip,
  Card,
  CardActionArea,
  CardMedia,
  Tooltip,
  Divider,
  Avatar,
  Badge,
} from "@mui/material";
import { ArrowBack, Close, Download, Image } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { AuthContext } from "AuthContex/AuthContext";

// SOP Foto Dokumen
const DOKUMEN_SOP_HP = {
  Android: ['body', 'imei', 'about', 'akun', 'admin', 'cam_depan', 'cam_belakang', 'rusak'],
  Samsung: ['body', 'imei', 'about', 'samsung_account', 'admin', 'cam_depan', 'cam_belakang', 'galaxy_store'],
  iPhone: ['body', 'imei', 'about', 'icloud', 'battery', 'utools', 'iunlocker', 'cek_pencurian']
};

// Helper: Buat URL dokumen
const getFullDokumenUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "");
  return path.startsWith("storage/") ? `${baseUrl}/${path}` : `${baseUrl}/storage/${path}`;
};

// Small util: format currency
const formatRupiah = (value) => {
  if (value == null || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return `Rp ${num.toLocaleString("id-ID")}`;
};

const DetailGadaiHpPage = () => {
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
      let url = "";
      if (userRole === "petugas") url = `/petugas/gadai-hp/${id}`;
      else if (userRole === "checker") url = `/checker/gadai-hp/${id}`;
      else if (userRole === "hm") url = `/gadai-hp/${id}`;
      else {
        setError("Role tidak diizinkan mengakses data");
        setLoading(false);
        return;
      }

      const res = await axiosInstance.get(url);
      if (!res.data.success) {
        setError(res.data.message || "Gagal mengambil data detail");
        setLoading(false);
        return;
      }

      const rawData = res.data.data;

      // Tentukan SOP berdasarkan barang / merk / type
      const sopKey = rawData.nama_barang || rawData.merk?.nama_merk || rawData.type_hp?.nama_type;
      const sopDokumen = DOKUMEN_SOP_HP[sopKey] || [];

      // Filter dokumen pendukung dan konversi ke url
      const rawDokumen = rawData.dokumen_pendukung || {};
      const dokumenPendukung = {};

      Object.entries(rawDokumen).forEach(([key, val]) => {
        if (!sopDokumen.includes(key)) return; // hanya SOP

        let urls = [];
        if (typeof val === "string") urls.push(getFullDokumenUrl(val));
        else if (Array.isArray(val)) urls = val.map(getFullDokumenUrl);

        dokumenPendukung[key] = urls.length > 0 ? urls : null;
      });

      setData({
        ...rawData,
        kerusakan: rawData.kerusakan_list || [],
        kelengkapan: rawData.kelengkapan_list || [],
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, userRole]);

  if (loading)
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: "70vh" }}>
        <CircularProgress />
      </Stack>
    );

  if (error)
    return <Typography color="error" variant="h6" align="center" sx={{ mt: 2 }}>{`Error: ${error}`}</Typography>;

  if (!data)
    return <Typography align="center" sx={{ mt: 2 }}>Data tidak ditemukan.</Typography>;

  const d = data;
  const nasabah = d.detail_gadai?.nasabah;
  const dokumenKeys = Object.keys(d.dokumen_pendukung || {});

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 3, mb: 8, px: 2 }}>

      {/* Sticky Header */}
      <Paper elevation={2} sx={{ position: "sticky", top: 16, zIndex: 20, borderRadius: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              variant="text"
              sx={{ textTransform: "none" }}
            >
              Kembali
            </Button>

            <Box>
              <Typography variant="h6" fontWeight={700}>Detail Gadai HP</Typography>
              <Typography variant="body2" color="text.secondary">No Gadai: {d.detail_gadai?.no_gadai || '-'}</Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Download semua dokumen (ZIP)">
              <Button variant="outlined" size="small" startIcon={<Download />}>Download</Button>
            </Tooltip>
            <Tooltip title="Lihat preview gallery">
              <Button variant="contained" size="small" startIcon={<Image />} onClick={() => {
                // open first available image
                const first = dokumenKeys.reduce((acc, k) => {
                  if (acc) return acc;
                  const v = d.dokumen_pendukung[k];
                  return v && v.length ? v[0] : null;
                }, null);
                if (first) setSelectedImage(first);
              }}>Preview</Button>
            </Tooltip>
          </Stack>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Left column: summary */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2} alignItems="center">


              <Box textAlign="center">
                <Typography variant="h6" fontWeight={800}>{d.nama_barang || '-'}</Typography>
                <Typography variant="body2" color="text.secondary">{d.merk?.nama_merk || '-'} • {d.type_hp?.nama_type || '-'}</Typography>
              </Box>

              <Divider sx={{ width: "100%" }} />

              <Stack spacing={1} sx={{ width: "100%" }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2" color="text.secondary">Grade</Typography>
                  <Typography variant="subtitle2" fontWeight={700}>{d.grade_type || '-'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2" color="text.secondary">Taksiran</Typography>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {formatRupiah(d?.detail_gadai?.taksiran)}
                  </Typography>
                </Box>


                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2" color="text.secondary">RAM / ROM</Typography>
                  <Typography variant="subtitle2" fontWeight={700}>{d.ram || '-'} / {d.rom || '-'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2" color="text.secondary">Warna</Typography>
                  <Typography variant="subtitle2">{d.warna || '-'}</Typography>
                </Box>

              </Stack>

              <Divider sx={{ width: '100%' }} />

              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Kelengkapan</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {d.kelengkapan.length > 0 ? d.kelengkapan.map((k, i) => (
                    <Chip key={i} label={k.nama_kelengkapan} size="small" variant="outlined" color="success" sx={{ borderColor: 'success.main', color: 'success.main' }} />
                  )) : <Typography variant="body2" color="text.secondary">-</Typography>}
                </Stack>
              </Box>

              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Kerusakan</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {d.kerusakan.length > 0 ? d.kerusakan.map((k, i) => (
                    <Chip key={i} label={k.nama_kerusakan} size="small" color="error" variant="outlined" />
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

        {/* Right column: gallery & documents */}
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
                {dokumenKeys.sort((a, b) => (DOKUMEN_SOP_HP[d.nama_barang] || []).indexOf(a) - (DOKUMEN_SOP_HP[d.nama_barang] || []).indexOf(b)).map((key) => (
                  <Grid item xs={12} sm={6} md={6} key={key}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography fontWeight={700}>{key.replace(/_/g, ' ').toUpperCase()}</Typography>
                        <Badge badgeContent={(d.dokumen_pendukung[key] || []).length} color="primary" />
                      </Box>

                      <Grid container spacing={1}>
                        {(d.dokumen_pendukung[key] || []).map((url, idx) => (
                          <Grid item xs={6} key={idx}>
                            <Card sx={{ borderRadius: 2, overflow: 'hidden', cursor: 'pointer', boxShadow: 2 }}>
                              <CardActionArea onClick={() => setSelectedImage(url)}>
                                <CardMedia component="img" height="140" image={url} alt={`${key}-${idx}`} sx={{ objectFit: 'cover', transition: 'transform .25s', '&:hover': { transform: 'scale(1.03)' } }} />
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

          {/* Timeline / notes area (optional) */}
          <Paper elevation={0} sx={{ mt: 3, p: 2 }}>
            <Typography variant="caption" color="text.secondary">Catatan: Sistem hanya menampilkan dokumen sesuai SOP.</Typography>
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

export default DetailGadaiHpPage;
