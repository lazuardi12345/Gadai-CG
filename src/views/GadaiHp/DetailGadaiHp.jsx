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
  Dialog,
  DialogContent,
  IconButton,
} from "@mui/material";
import { ArrowBack, Close } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { AuthContext } from "AuthContex/AuthContext"; 

const DetailGadaiHpPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); 
  const userRole = (user?.role || '').toLowerCase(); 

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedImage, setSelectedImage] = useState("");

  const fetchDetail = async () => {
    setLoading(true);
    try {

      let url = '';
      if (userRole === 'petugas') url = `/petugas/gadai-hp/${id}`;
      else if (userRole === 'checker') url = `/checker/gadai-hp/${id}`;
      else if (userRole === 'hm') url = `/gadai-hp/${id}`;
      else {
        setError('Role tidak diizinkan mengakses data');
        setLoading(false);
        return;
      }

      const res = await axiosInstance.get(url);
      if (res.data.success) {
        const rawData = res.data.data;


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
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h5" fontWeight={600}>
                Detail Gadai HP
              </Typography>
            </Stack>
          }
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
          {/* === NASABAH SECTION === */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Informasi Nasabah
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
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
          </Box>

          {/* === BARANG GADAI SECTION === */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Informasi Barang Gadai
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Grid container spacing={2}>
                {[['Nama Barang', d.nama_barang],
                  ['IMEI', d.imei],
                  ['Merk', d.merk],
                  ['Tipe HP', d.type_hp],
                  ['Grade', d.grade],
                  ['Warna', d.warna],
                  ['RAM', d.ram],
                  ['ROM', d.rom],
                  ['Kunci Password', d.kunci_password],
                  ['Kunci PIN', d.kunci_pin],
                  ['Kunci Pola', d.kunci_pola],
                ].map(([label, value], i) => (
                  <Grid item xs={12} sm={6} key={i}>
                    <Typography><strong>{label}:</strong> {value || "-"}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Box>

          {/* === KONDISI BARANG === */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Kondisi Barang
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ mb: 1 }}><strong>Kelengkapan:</strong></Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {(Array.isArray(d.kelengkapan) ? d.kelengkapan : [d.kelengkapan])
                      .filter(Boolean)
                      .map((k, i) => (
                        <Chip key={i} label={k} color="success" variant="outlined" size="small" />
                      ))}
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ mb: 1 }}><strong>Kerusakan:</strong></Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {(Array.isArray(d.kerusakan) ? d.kerusakan : [d.kerusakan])
                      .filter(Boolean)
                      .map((r, i) => (
                        <Chip key={i} label={r} color="error" variant="outlined" size="small" />
                      ))}
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          </Box>

          {/* === DOKUMEN PENDUKUNG === */}
          {dokumenKeys.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Dokumen Pendukung
              </Typography>
              <Grid container spacing={2}>
                {dokumenKeys.map((key) => (
                  <Grid item xs={12} sm={4} key={key}>
                    <Typography sx={{ mb: 1, fontSize: 14, fontWeight: 500 }}>
                      {key.replace(/_/g, ' ').toUpperCase()}
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
                        onClick={() => setSelectedImage(d.dokumen_pendukung[key].url)}
                      />
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

      {/* === Dialog Preview Gambar === */}
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
