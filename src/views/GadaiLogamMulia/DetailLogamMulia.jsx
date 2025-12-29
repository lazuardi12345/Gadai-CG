import React, { useEffect, useState, useContext } from "react";
import {
  Box,
  Grid,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Paper,
  Chip,
  Divider,
  Dialog,
  DialogContent,
  IconButton,
  Card,
  CardActionArea,
  CardMedia,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { ArrowBack, Close, Image, Download } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { AuthContext } from "AuthContex/AuthContext";

/* ================= SOP ================= */
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
  cap_merek: "Cap / Merek",
  karatase: "Karatase",
  ukuran_batu: "Ukuran Batu (Metmess)",
};

/* ================= URL HELPER ================= */
const getFullUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;

  const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "");
  return path.startsWith("storage/")
    ? `${baseUrl}/${path}`
    : `${baseUrl}/storage/${path}`;
};

/* ================= PAGE ================= */
const DetailGadaiLogamMuliaPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `/gadai-logam-mulia/${id}`;
      if (userRole === "checker") url = `/checker/gadai-logam-mulia/${id}`;
      if (userRole === "petugas") url = `/petugas/gadai-logam-mulia/${id}`;

      const res = await axiosInstance.get(url);
      const raw = res.data.data;

      const dokumenPendukung = {};
      DOKUMEN_SOP_LOGAM.forEach((key) => {
        const val = raw.dokumen_pendukung?.[key];
        dokumenPendukung[key] = val ? [getFullUrl(val)] : [];
      });

      setData({
        ...raw,
        kelengkapan: raw.kelengkapan_list || [],
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

  /* ================= STATE ================= */
  if (loading)
    return (
      <Stack height="70vh" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Stack>
    );

  if (error)
    return (
      <Typography color="error" align="center" sx={{ mt: 3 }}>
        {error}
      </Typography>
    );

  if (!data)
    return (
      <Typography align="center" sx={{ mt: 3 }}>
        Data tidak ditemukan
      </Typography>
    );

  const d = data;
  const nasabah = d.detail_gadai?.nasabah;
  const dokumenKeys = Object.keys(d.dokumen_pendukung || {});

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: 2, pb: 6 }}>
      {/* ================= HEADER ================= */}
      <Paper
        sx={{
          position: "sticky",
          top: 8,
          zIndex: 20,
          p: 2,
          mb: 3,
          borderRadius: 3,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
              Kembali
            </Button>
            <Box>
              <Typography fontWeight={800}>
                Detail Gadai Logam Mulia
              </Typography>
              <Typography variant="caption">
                No Gadai: {d.detail_gadai?.no_gadai || "-"}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Tooltip title="Download dokumen">
              <Button variant="outlined" size="small" startIcon={<Download />}>
                Download
              </Button>
            </Tooltip>
            <Tooltip title="Preview">
              <Button
                variant="contained"
                size="small"
                startIcon={<Image />}
                onClick={() => {
                  const first = dokumenKeys
                    .map((k) => d.dokumen_pendukung[k]?.[0])
                    .find(Boolean);
                  if (first) setSelectedImage(first);
                }}
              >
                Preview
              </Button>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {/* ================= CONTENT ================= */}
      <Grid container spacing={3}>
        {/* ===== LEFT ===== */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2}>
              <Box textAlign="center">
                <Typography fontWeight={800}>
                  {d.nama_barang || "-"}
                </Typography>
                <Typography variant="caption">
                  Kode / Cap: {d.kode_cap || "-"}
                </Typography>
              </Box>

              <Divider />

              {[
                ["Karat", d.karat],
                ["Berat", d.berat ? `${d.berat} gram` : "-"],
                ["Potongan Batu", d.potongan_batu || "-"],
              ].map(([l, v]) => (
                <Stack key={l} direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">{l}</Typography>
                  <Typography fontWeight={700}>{v}</Typography>
                </Stack>
              ))}

              <Divider />

              <Typography variant="subtitle2">Kelengkapan</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {d.kelengkapan.length ? (
                  d.kelengkapan.map((k, i) => (
                    <Chip
                      key={i}
                      label={k.nama_kelengkapan}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    -
                  </Typography>
                )}
              </Stack>
            </Stack>
          </Paper>

          {/* ===== NASABAH ===== */}
          <Paper sx={{ mt: 3, p: 2, borderRadius: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Informasi Nasabah
            </Typography>
            <Typography fontWeight={700}>
              {nasabah?.nama_lengkap || "-"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No Nasabah: {d.detail_gadai?.no_nasabah || "-"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tanggal: {d.detail_gadai?.tanggal_gadai || "-"}
            </Typography>
          </Paper>
        </Grid>

        {/* ===== RIGHT ===== */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography fontWeight={800} mb={2}>
              Dokumen & Foto
            </Typography>

            <Grid container spacing={2}>
              {dokumenKeys.map((key) => (
                <Grid item xs={12} sm={6} key={key}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography fontWeight={700}>
                        {LABEL_PENDUKUNG[key]}
                      </Typography>
                      <Badge
                        badgeContent={d.dokumen_pendukung[key].length}
                        color="primary"
                      />
                    </Stack>

                    <Grid container spacing={1} mt={1}>
                      {d.dokumen_pendukung[key].map((url, i) => (
                        <Grid item xs={6} key={i}>
                          <Card>
                            <CardActionArea
                              onClick={() => setSelectedImage(url)}
                            >
                              <CardMedia
                                component="img"
                                height="120"
                                image={url}
                                sx={{ objectFit: "cover" }}
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
          </Paper>
        </Grid>
      </Grid>

      {/* ================= PREVIEW ================= */}
      <Dialog
        fullScreen={isMobile}
        open={!!selectedImage}
        onClose={() => setSelectedImage("")}
      >
        <DialogContent sx={{ p: 0, bgcolor: "black" }}>
          <IconButton
            onClick={() => setSelectedImage("")}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "white",
              zIndex: 20,
            }}
          >
            <Close />
          </IconButton>
          <Box
            component="img"
            src={selectedImage}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DetailGadaiLogamMuliaPage;
