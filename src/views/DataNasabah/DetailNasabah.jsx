import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Grid,
  Typography,
  Divider,
  CircularProgress,
  Button,
  Stack,
  Box,
  Avatar,
  Paper,
  Dialog,
  DialogContent,
  IconButton,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import axiosInstance from "api/axiosInstance";

const DetailNasabahPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nasabah, setNasabah] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State untuk popup foto
  const [openPhoto, setOpenPhoto] = useState(false);

  // Ambil role user dari localStorage
  const user = JSON.parse(localStorage.getItem("auth_user"));
  const role = user?.role?.toLowerCase() || "";

  // Sesuaikan API URL berdasarkan role
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

// Contoh penggunaan
const apiUrl = getApiUrlById("data-nasabah", role, id);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await axiosInstance.get(apiUrl);
        if (res.data.success) {
          setNasabah(res.data.data);
        } else {
          setError(res.data.message || "Gagal memuat data nasabah.");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Terjadi kesalahan server.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [apiUrl]);

  if (loading) {
    return (
      <Grid container justifyContent="center" alignItems="center" sx={{ height: "100vh" }}>
        <CircularProgress />
      </Grid>
    );
  }

  if (error) {
    return (
      <Typography align="center" color="error" sx={{ mt: 4 }}>
        {error}
      </Typography>
    );
  }

  if (!nasabah) {
    return (
      <Typography align="center" sx={{ mt: 4 }}>
        Data nasabah tidak ditemukan.
      </Typography>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ boxShadow: 3, borderRadius: 3, maxWidth: 900, mx: "auto", backgroundColor: "#ffffff" }}>
        <CardHeader
          title={<Typography variant="h6" sx={{ fontWeight: "bold" }}>👤 Detail Nasabah</Typography>}
          action={
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(-1)}
              >
                Kembali
              </Button>
            </Stack>
          }
        />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            {/* FOTO NASABAH */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={2}
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  p: 2,
                  textAlign: "center",
                  backgroundColor: "#fafafa",
                  cursor: nasabah.foto_ktp ? "pointer" : "default",
                }}
                onClick={() => nasabah.foto_ktp && setOpenPhoto(true)}
              >
                {nasabah.foto_ktp ? (
                  <img
                    src={nasabah.foto_ktp}
                    alt="Foto KTP"
                    style={{ width: "100%", height: 250, objectFit: "cover", borderRadius: 8 }}
                  />
                ) : (
                  <Avatar
                    sx={{ width: 120, height: 120, mx: "auto", bgcolor: "primary.main", fontSize: 40 }}
                  >
                    {nasabah.nama_lengkap?.charAt(0).toUpperCase()}
                  </Avatar>
                )}
                <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: "bold" }}>
                  {nasabah.nama_lengkap}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  NIK: {nasabah.nik}
                </Typography>
              </Paper>
            </Grid>

            {/* INFORMASI NASABAH */}
            <Grid item xs={12} md={8}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                  Informasi Pribadi
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Nama Lengkap</Typography>
                    <Typography variant="body1">{nasabah.nama_lengkap}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">NIK</Typography>
                    <Typography variant="body1">{nasabah.nik}</Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Alamat</Typography>
                    <Typography variant="body1">{nasabah.alamat}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Nomor HP</Typography>
                    <Typography variant="body1">{nasabah.no_hp}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Tanggal Terdaftar</Typography>
                    <Typography variant="body1">
                      {new Date(nasabah.created_at).toLocaleDateString("id-ID")}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Petugas yang menambahkan</Typography>
                    <Typography variant="body1">{nasabah.user?.name || "Tidak diketahui"}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* DIALOG FOTO */}
      <Dialog open={openPhoto} onClose={() => setOpenPhoto(false)} maxWidth="sm" fullWidth>
        <DialogContent sx={{ position: "relative", p: 0 }}>
          <IconButton
            onClick={() => setOpenPhoto(false)}
            sx={{ position: "absolute", top: 8, right: 8, zIndex: 10 }}
          >
            <CloseIcon />
          </IconButton>
          <img
            src={nasabah.foto_ktp}
            alt="Foto KTP"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DetailNasabahPage;
