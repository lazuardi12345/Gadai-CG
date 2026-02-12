import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CardHeader, CardContent, Typography, Box, CircularProgress,
  Grid, Paper, Stack, Button, Dialog, DialogContent, IconButton,
  Chip, Divider, useTheme, useMediaQuery
} from "@mui/material";
import { ArrowBack, Close, ZoomIn, AccountCircle, Assignment, History, PhotoLibrary } from "@mui/icons-material";
import axiosInstance from "api/axiosInstance";

const getFullDokumenUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "");
  return path.startsWith("storage/") ? `${baseUrl}/${path}` : `${baseUrl}/storage/${path}`;
};

const getStatusColor = (status) => {
  if (!status) return "default";
  const s = status.toLowerCase();
  if (s.includes("approved")) return "success";
  if (s.includes("rejected")) return "error";
  if (s.includes("pending")) return "warning";
  return "default";
};

const DetailApprovalHMPage = () => {
  const { detailGadaiId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/approvals/${detailGadaiId}/full-detail`);
      if (res.data.success) setData(res.data.data);
      else setError(res.data.message || "Gagal mengambil data detail");
    } catch (err) {
      setError(err.message || "Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  }, [detailGadaiId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) return <Stack alignItems="center" justifyContent="center" sx={{ height: "80vh" }}><CircularProgress /></Stack>;
  if (error) return <Typography color="error" align="center" sx={{ mt: 2 }}>Error: {error}</Typography>;
  if (!data) return <Typography align="center" sx={{ mt: 2 }}>Data tidak ditemukan.</Typography>;

  const { detail_gadai } = data;
  const { nasabah } = detail_gadai;

  const getBarang = () => {
    const type = detail_gadai.type?.nama_type;
    if (type === "Handphone") return data.hp?.data || [];
    if (type === "Perhiasan") return data.perhiasan?.data || [];
    if (type === "Logam Mulia") return data.logam_mulia?.data || [];
    if (type === "Retro") return data.retro?.data || [];
    return [];
  };

  const dokumenList = [];
  getBarang().forEach((item) => {
    if (item.dokumen_pendukung) {
      let doc = item.dokumen_pendukung;
      if (typeof doc === "string") { try { doc = JSON.parse(doc); } catch { doc = {}; } }
      Object.entries(doc).forEach(([key, val]) => {
        if (typeof val === "string" && val) dokumenList.push({ key, url: getFullDokumenUrl(val) });
      });
    }
  });

  const hmApprovals = detail_gadai.approvals?.filter((a) => a.role?.toLowerCase() === "hm") || [];
  const checkerApprovals = detail_gadai.approvals?.filter((a) => a.role?.toLowerCase() === "checker") || [];

  const InfoRow = ({ label, value }) => (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="body2" fontWeight={600}>{value || "-"}</Typography>
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1000, mx: "auto" }}>
      {/* Header Statis */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <IconButton onClick={() => navigate(-1)} color="primary"><ArrowBack /></IconButton>
        <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">Detail Approval</Typography>
      </Stack>

      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e0e0e0", overflow: "hidden" }}>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          
          {/* NASABAH SECTION */}
          <Stack direction="row" spacing={1} alignItems="center" mb={2}>
            <AccountCircle color="primary" />
            <Typography variant="subtitle1" fontWeight="bold">Informasi Nasabah</Typography>
          </Stack>
          <Grid container spacing={isMobile ? 0 : 2}>
            <Grid item xs={6} md={3}><InfoRow label="Nama" value={nasabah?.nama_lengkap} /></Grid>
            <Grid item xs={6} md={3}><InfoRow label="NIK" value={nasabah?.nik} /></Grid>
            <Grid item xs={6} md={3}><InfoRow label="No HP" value={nasabah?.no_hp} /></Grid>
            <Grid item xs={6} md={3}><InfoRow label="Alamat" value={nasabah?.alamat} /></Grid>
          </Grid>
          {nasabah?.foto_ktp && (
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<PhotoLibrary />}
              onClick={() => setSelectedImage(getFullDokumenUrl(nasabah.foto_ktp))}
              sx={{ mt: 1, mb: 3 }}
            >
              Lihat Foto KTP
            </Button>
          )}

          <Divider sx={{ my: 2 }} />

          {/* GADAI SECTION */}
          <Stack direction="row" spacing={1} alignItems="center" mb={2}>
            <Assignment color="primary" />
            <Typography variant="subtitle1" fontWeight="bold">Detail Gadai & Pinjaman</Typography>
          </Stack>
          <Grid container spacing={isMobile ? 0 : 2}>
            <Grid item xs={6} md={4}><InfoRow label="Tipe Barang" value={detail_gadai.type?.nama_type} /></Grid>
            <Grid item xs={6} md={4}><InfoRow label="No Gadai" value={detail_gadai.no_gadai} /></Grid>
            <Grid item xs={6} md={4}><InfoRow label="Tanggal Gadai" value={detail_gadai.tanggal_gadai} /></Grid>
            <Grid item xs={12} md={4}>
               <Paper sx={{ p: 1.5, bgcolor: '#f1f5f9', borderRadius: 2 }}>
                 <Typography variant="caption" color="primary" fontWeight="bold">Uang Pinjaman</Typography>
                 <Typography variant="h6" color="primary" fontWeight="bold">
                   Rp {Number(detail_gadai.uang_pinjaman || 0).toLocaleString("id-ID")}
                 </Typography>
               </Paper>
            </Grid>
            <Grid item xs={12} md={4} sx={{ mt: isMobile ? 1 : 0 }}>
               <Paper sx={{ p: 1.5, bgcolor: '#fff7ed', borderRadius: 2 }}>
                 <Typography variant="caption" color="warning.dark" fontWeight="bold">Taksiran</Typography>
                 <Typography variant="h6" color="warning.dark" fontWeight="bold">
                   Rp {Number(detail_gadai.taksiran || 0).toLocaleString("id-ID")}
                 </Typography>
               </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* APPROVAL HISTORY */}
          <Stack direction="row" spacing={1} alignItems="center" mb={2}>
            <History color="primary" />
            <Typography variant="subtitle1" fontWeight="bold">Sejarah Approval</Typography>
          </Stack>
          
          <Grid container spacing={2}>
            {/* Checker Column */}
            <Grid item xs={12} md={6}>
              <Typography variant="caption" fontWeight="bold" color="text.secondary">CHECKER</Typography>
              {checkerApprovals.length > 0 ? checkerApprovals.map((a, i) => (
                <Paper key={i} sx={{ p: 1.5, mt: 1, border: '1px solid #eee', bgcolor: '#fafafa' }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" fontWeight="bold">{a.user?.name}</Typography>
                    <Chip label={a.status} size="small" color={getStatusColor(a.status)} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">{a.catatan || "Tanpa catatan"}</Typography>
                </Paper>
              )) : <Typography variant="caption" display="block">Belum ada data</Typography>}
            </Grid>
            
            {/* HM Column */}
            <Grid item xs={12} md={6}>
              <Typography variant="caption" fontWeight="bold" color="text.secondary">HEAD MANAGER (HM)</Typography>
              {hmApprovals.length > 0 ? hmApprovals.map((a, i) => (
                <Paper key={i} sx={{ p: 1.5, mt: 1, border: '1px solid #eee', bgcolor: '#f0fdf4' }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" fontWeight="bold">{a.user?.name}</Typography>
                    <Chip label={a.status} size="small" color={getStatusColor(a.status)} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">{a.catatan || "Tanpa catatan"}</Typography>
                </Paper>
              )) : <Typography variant="caption" display="block">Belum ada data</Typography>}
            </Grid>
          </Grid>

          {/* DOKUMEN SECTION */}
          {dokumenList.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" fontWeight="bold" mb={2}>Dokumen Pendukung</Typography>
              <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
                {dokumenList.map((d, idx) => (
                  <Box key={idx} sx={{ minWidth: 120, textAlign: 'center' }}>
                    <Paper 
                      sx={{ position: 'relative', cursor: 'pointer', overflow: 'hidden', height: 100, borderRadius: 2 }}
                      onClick={() => setSelectedImage(d.url)}
                    >
                      <Box component="img" src={d.url} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <Box sx={{ position: 'absolute', top: 0, right: 0, p: 0.5, bgcolor: 'rgba(0,0,0,0.5)', borderBottomLeftRadius: 8 }}>
                        <ZoomIn sx={{ color: '#fff', fontSize: 16 }} />
                      </Box>
                    </Paper>
                    <Typography variant="caption" noWrap sx={{ display: 'block', mt: 0.5 }}>
                      {d.key.replace(/_/g, " ")}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>
      </Paper>

      {/* LIGHTBOX / IMAGE PREVIEW */}
      <Dialog open={!!selectedImage} onClose={() => setSelectedImage("")} fullScreen={isMobile} maxWidth="lg">
        <Box sx={{ bgcolor: '#000', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" justifyContent="flex-end" p={1}>
            <IconButton onClick={() => setSelectedImage("")} sx={{ color: '#fff' }}><Close /></IconButton>
          </Stack>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
            <Box component="img" src={selectedImage} sx={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
          </Box>
          <Stack direction="row" spacing={2} p={3} justifyContent="center" bgcolor="rgba(255,255,255,0.1)">
            <Button variant="contained" onClick={() => window.open(selectedImage, "_blank")}>Buka di Tab Baru</Button>
            <Button variant="outlined" sx={{ color: '#fff', borderColor: '#fff' }} onClick={() => setSelectedImage("")}>Tutup</Button>
          </Stack>
        </Box>
      </Dialog>
    </Box>
  );
};

export default DetailApprovalHMPage;