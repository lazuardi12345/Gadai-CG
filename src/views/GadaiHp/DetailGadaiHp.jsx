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
} from "@mui/material";
import { ArrowBack, Close } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { AuthContext } from "AuthContex/AuthContext";

// Helper: Buat URL dokumen berdasarkan base API
const getFullDokumenUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "");
  return path.startsWith("storage/") ? `${baseUrl}/${path}` : `${baseUrl}/storage/${path}`;
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

      // Parse kelengkapan
      let kelengkapanArray = [];
      try {
        if (rawData.kelengkapan) kelengkapanArray = JSON.parse(rawData.kelengkapan);
      } catch {
        kelengkapanArray = [];
      }

      // Parse dokumen pendukung
      let dokumenObj = {};
      if (rawData.dokumen_pendukung) {
        if (typeof rawData.dokumen_pendukung === "string") {
          try {
            dokumenObj = JSON.parse(rawData.dokumen_pendukung);
          } catch {
            dokumenObj = {};
          }
        } else {
          dokumenObj = rawData.dokumen_pendukung;
        }
      }

      // Ubah ke array URL per key dengan base URL backend
      const dokumenPendukung = {};
      Object.entries(dokumenObj).forEach(([key, val]) => {
        let urls = [];
        if (!val) urls = [];
        else if (typeof val === "string") urls.push(getFullDokumenUrl(val));
        else if (Array.isArray(val)) urls = val.map(getFullDokumenUrl);
        dokumenPendukung[key] = urls.length > 0 ? urls : null;
      });

      setData({
        ...rawData,
        kelengkapan: kelengkapanArray,
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
  const dokumenKeys = d.dokumen_pendukung ? Object.keys(d.dokumen_pendukung) : [];

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 2, mb: 6 }}>
      <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
        <CardHeader
          title={<Typography variant="h5" fontWeight={600}>Detail Gadai HP</Typography>}
          action={
            <Button variant="outlined" color="primary" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
              Kembali
            </Button>
          }
          sx={{ bgcolor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}
        />
        <CardContent sx={{ p: 3 }}>
          {/* Informasi Nasabah */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Informasi Nasabah</Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><Typography><strong>Nama:</strong> {nasabah?.nama_lengkap || "-"}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography><strong>No Nasabah:</strong> {d.detail_gadai?.no_nasabah || "-"}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography><strong>No Gadai:</strong> {d.detail_gadai?.no_gadai || "-"}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography><strong>Tanggal Gadai:</strong> {d.detail_gadai?.tanggal_gadai || "-"}</Typography></Grid>
              </Grid>
            </Paper>
          </Box>

          {/* Informasi HP */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Informasi HP</Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><Typography><strong>Nama Barang:</strong> {d.nama_barang || "-"}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography><strong>Merk:</strong> {d.merk?.nama_merk || "-"}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography><strong>Type:</strong> {d.type_hp?.nama_type || "-"}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography><strong>Grade:</strong> {d.grade_type || "-"}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography><strong>Grade Nominal:</strong> {d.grade_nominal ? `Rp ${Number(d.grade_nominal).toLocaleString("id-ID")}` : "-"}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography><strong>RAM:</strong> {d.ram || "-"}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography><strong>ROM:</strong> {d.rom || "-"}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography><strong>Warna:</strong> {d.warna || "-"}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography><strong>Kunci PIN:</strong> {d.kunci_pin || "-"}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography><strong>Kunci Password:</strong> {d.kunci_password || "-"}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography><strong>Kunci Pola:</strong> {d.kunci_pola || "-"}</Typography></Grid>

                <Grid item xs={12}>
                  <Grid container spacing={2}>
                    {/* Kelengkapan */}
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ mb: 1 }}><strong>Kelengkapan:</strong></Typography>
                      {d.kelengkapan && d.kelengkapan.length > 0 ? (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {d.kelengkapan.map((k, idx) => (
                            <Chip key={idx} label={k} size="small" color="primary" variant="outlined" />
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </Grid>

                    {/* Kerusakan */}
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ mb: 1 }}><strong>Kerusakan:</strong></Typography>
                      {d.kerusakan && d.kerusakan.length > 0 ? (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {d.kerusakan.map((k, idx) => (
                            <Chip
                              key={idx}
                              label={k.nama_kerusakan}
                              size="small"
                              color="error"
                              variant="outlined"
                            />

                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </Grid>
                  </Grid>
                </Grid>


              </Grid>
            </Paper>
          </Box>

          {/* Dokumen Pendukung */}
          {dokumenKeys.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Dokumen Pendukung</Typography>
              <Grid container spacing={2}>
                {dokumenKeys.map((key) => (
                  <Grid item xs={12} sm={4} key={key}>
                    <Typography sx={{ mb: 1, fontSize: 14, fontWeight: 500 }}>
                      {key.replace(/_/g, " ").toUpperCase()}
                    </Typography>
                    {d.dokumen_pendukung[key] ? (
                      d.dokumen_pendukung[key].map((url, idx) => (
                        <Box
                          key={idx}
                          component="img"
                          src={url}
                          alt={`${key}-${idx}`}
                          sx={{
                            width: "100%",
                            maxHeight: 150,
                            objectFit: "contain",
                            borderRadius: 1,
                            border: "1px solid #ccc",
                            cursor: "pointer",
                            mb: 1,
                            "&:hover": { transform: "scale(1.05)" },
                            transition: "transform 0.3s",
                          }}
                          onClick={() => setSelectedImage(url)}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">Belum ada dokumen</Typography>
                    )}
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </CardContent>
      </Paper>

      {/* Dialog Preview */}
      <Dialog open={!!selectedImage} onClose={() => setSelectedImage("")} maxWidth="lg">
        <DialogContent sx={{ position: "relative", p: 0 }}>
          <IconButton
            onClick={() => setSelectedImage("")}
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

export default DetailGadaiHpPage;
