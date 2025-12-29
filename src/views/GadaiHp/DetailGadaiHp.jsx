import React, { useEffect, useState, useContext } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Chip,
  Divider,
  Card,
  CardActionArea,
  CardMedia,
  Dialog,
  DialogContent,
  IconButton,
  Tooltip,
  Badge,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { ArrowBack, Close, Download, Image } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { AuthContext } from "AuthContex/AuthContext";

/* ================= SOP ================= */
const DOKUMEN_SOP_HP = {
  Android: ["body", "imei", "about", "akun", "admin", "cam_depan", "cam_belakang", "rusak"],
  Samsung: ["body", "imei", "about", "samsung_account", "admin", "cam_depan", "cam_belakang", "galaxy_store"],
  iPhone: ["body", "imei", "about", "icloud", "battery", "utools", "iunlocker", "cek_pencurian"],
};

/* ================= HELPERS ================= */
const getFullDokumenUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "");
  return path.startsWith("storage/")
    ? `${baseUrl}/${path}`
    : `${baseUrl}/storage/${path}`;
};

const formatRupiah = (v) =>
  v == null ? "-" : `Rp ${Number(v).toLocaleString("id-ID")}`;

/* ================= PAGE ================= */
const DetailGadaiHpPage = () => {
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
    try {
      setLoading(true);
      let url =
        userRole === "petugas"
          ? `/petugas/gadai-hp/${id}`
          : userRole === "checker"
          ? `/checker/gadai-hp/${id}`
          : `/gadai-hp/${id}`;

      const res = await axiosInstance.get(url);
      const raw = res.data.data;

      const sopKey =
        raw.nama_barang || raw.merk?.nama_merk || raw.type_hp?.nama_type;
      const sop = DOKUMEN_SOP_HP[sopKey] || [];

      const dokumen = {};
      Object.entries(raw.dokumen_pendukung || {}).forEach(([k, v]) => {
        if (!sop.includes(k)) return;
        dokumen[k] = Array.isArray(v)
          ? v.map(getFullDokumenUrl)
          : [getFullDokumenUrl(v)];
      });

      setData({
        ...raw,
        kerusakan: raw.kerusakan_list || [],
        kelengkapan: raw.kelengkapan_list || [],
        dokumen_pendukung: dokumen,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  /* ================= LOADING ================= */
  if (loading)
    return (
      <Stack height="70vh" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Stack>
    );

  if (error)
    return (
      <Typography align="center" color="error">
        Error: {error}
      </Typography>
    );

  const d = data;
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
              <Typography fontWeight={700}>Detail Gadai HP</Typography>
              <Typography variant="caption">
                No Gadai: {d.detail_gadai?.no_gadai || "-"}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" startIcon={<Download />}>
              Download
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<Image />}
              onClick={() =>
                setSelectedImage(
                  dokumenKeys
                    .flatMap((k) => d.dokumen_pendukung[k])
                    .filter(Boolean)[0]
                )
              }
            >
              Preview
            </Button>
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
                <Typography fontWeight={800}>{d.nama_barang}</Typography>
                <Typography variant="caption">
                  {d.merk?.nama_merk} • {d.type_hp?.nama_type}
                </Typography>
              </Box>

              <Divider />

              {[
                ["Grade", d.grade_type],
                ["Taksiran", formatRupiah(d.detail_gadai?.taksiran)],
                ["RAM / ROM", `${d.ram || "-"} / ${d.rom || "-"}`],
                ["Warna", d.warna],
              ].map(([l, v]) => (
                <Stack key={l} direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {l}
                  </Typography>
                  <Typography fontWeight={600}>{v || "-"}</Typography>
                </Stack>
              ))}

              <Divider />

              <Typography variant="subtitle2">Kelengkapan</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {d.kelengkapan.map((k, i) => (
                  <Chip key={i} label={k.nama_kelengkapan} size="small" />
                ))}
              </Stack>

              <Typography variant="subtitle2">Kerusakan</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {d.kerusakan.map((k, i) => (
                  <Chip key={i} label={k.nama_kerusakan} color="error" size="small" />
                ))}
              </Stack>
            </Stack>
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
                        {key.replace(/_/g, " ").toUpperCase()}
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
      <Dialog fullScreen={isMobile} open={!!selectedImage} onClose={() => setSelectedImage("")}>
        <DialogContent sx={{ p: 0, bgcolor: "black" }}>
          <IconButton
            onClick={() => setSelectedImage("")}
            sx={{ position: "absolute", top: 16, right: 16, color: "white" }}
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

export default DetailGadaiHpPage;
