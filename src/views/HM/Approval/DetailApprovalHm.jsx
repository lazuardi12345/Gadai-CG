import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Typography, Box, CircularProgress, Grid, Stack, Button,
  Dialog, IconButton, Divider, useTheme, useMediaQuery, Avatar,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Card
} from "@mui/material";
import {
  ArrowBack, Close, AccountCircle, History,
  PhotoLibrary, CalendarMonth, Payments, LocationOn,
  CreditCard, Smartphone, Diamond, VerifiedUser, Info
} from "@mui/icons-material";
import axiosInstance from "api/axiosInstance";

/* ─── Helpers ─────────────────────────────────────────────────── */
const formatRp = (v) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(v || 0);

/* ─── Palette — sama persis dengan ApprovalHMPage ────────────── */
const C = {
  bg:          "#F4F7F7",
  surface:     "#ffffff",
  surfaceAlt:  "#F8FAF8",
  border:      "#E0EED2",
  primary:     "#004D40",
  primaryLight:"#E8F5E9",
  text:        "#000000",
  textMuted:   "rgba(0,0,0,0.45)",
  red:         "#dc2626",
  redLight:    "#fef2f2",
};

/* ─── StatusBadge ────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const s = status?.toLowerCase() || "";
  const isRejected = s.includes("rejected");
  return (
    <Box sx={{
      display: "inline-flex", alignItems: "center", gap: 0.7,
      px: 1.5, py: 0.4, borderRadius: "100px",
      bgcolor: isRejected ? C.redLight : C.primaryLight,
      border: `1px solid ${isRejected ? "#fca5a5" : "#a7d7c5"}`,
    }}>
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: isRejected ? C.red : C.primary }} />
      <Typography sx={{ color: isRejected ? C.red : C.primary, fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.06em" }}>
        {status?.toUpperCase()}
      </Typography>
    </Box>
  );
};

/* ─── InfoRow ────────────────────────────────────────────────── */
const InfoRow = ({ label, value, icon: Icon }) => (
  <Box sx={{ mb: 2 }}>
    <Stack direction="row" spacing={0.8} alignItems="center" mb={0.3}>
      {Icon && <Icon sx={{ fontSize: 13, color: C.textMuted }} />}
      <Typography variant="caption" sx={{ color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.63rem" }}>
        {label}
      </Typography>
    </Stack>
    <Typography variant="body2" fontWeight={700} sx={{ color: C.text, pl: Icon ? 2.6 : 0 }}>
      {value || "—"}
    </Typography>
  </Box>
);

/* ─── SectionTitle ───────────────────────────────────────────── */
const SectionTitle = ({ icon: Icon, label }) => (
  <Stack direction="row" spacing={1.5} alignItems="center" mb={2.5}>
    <Avatar sx={{ width: 32, height: 32, bgcolor: C.primaryLight, color: C.primary }}>
      <Icon sx={{ fontSize: 16 }} />
    </Avatar>
    <Typography variant="subtitle2" fontWeight={800} sx={{ color: C.primary }}>
      {label}
    </Typography>
  </Stack>
);

/* ─── Main Page ──────────────────────────────────────────────── */
const DetailApprovalHMPage = () => {
  const { detailGadaiId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/approvals/${detailGadaiId}/full-detail`);
      if (res.data.payload && !res.data.payload.error) {
        setData(res.data.payload.data);
      } else {
        setError(res.data.payload?.message || "Gagal mengambil data detail");
      }
    } catch {
      setError("Terjadi kesalahan koneksi ke server");
    } finally {
      setLoading(false);
    }
  }, [detailGadaiId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  if (loading)
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: "100vh", bgcolor: C.bg }}>
        <CircularProgress color="success" />
        <Typography variant="caption" sx={{ color: C.textMuted, mt: 2 }}>Memuat data...</Typography>
      </Stack>
    );

  if (error)
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: "100vh", bgcolor: C.bg }}>
        <Typography color="error">{error}</Typography>
      </Stack>
    );

  if (!data) return null;

  const { detail_gadai } = data;
  const { nasabah, approvals } = detail_gadai;

  const getActiveBarang = () => {
  if (data.hp?.total > 0) return { label: "Handphone", icon: Smartphone, items: data.hp.data, type: "hp", isEmas: false };
  if (data.perhiasan?.total > 0) return { label: "Perhiasan", icon: Diamond, items: data.perhiasan.data, type: "perhiasan", isEmas: true };
  if (data.logam_mulia?.total > 0) return { label: "Logam Mulia", icon: Diamond, items: data.logam_mulia.data, type: "lm", isEmas: true };
  if (data.retro?.total > 0) return { label: "Retro", icon: Diamond, items: data.retro.data, type: "retro", isEmas: true };
  return null;
};
  const activeBarang = getActiveBarang();

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: C.bg, minHeight: "100vh" }}>

      {/* ── Header ── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2} mb={4}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton
            onClick={() => navigate(-1)}
            sx={{ bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px",
              "&:hover": { bgcolor: C.primaryLight } }}
          >
            <ArrowBack fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight={900} color={C.primary}>
              Detail Gadai
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {detail_gadai.no_gadai}
            </Typography>
          </Box>
        </Stack>
        <StatusBadge status={detail_gadai.status} />
      </Stack>

      <Grid container spacing={3}>

        {/* ── LEFT COLUMN ── */}
        <Grid item xs={12} md={8}>

          {/* Nasabah Card */}
          <Card sx={{ borderRadius: "20px", boxShadow: "0 8px 32px rgba(0,0,0,0.05)", border: `1px solid ${C.border}`, mb: 3 }}>
            <Box sx={{ p: 3 }}>
              <SectionTitle icon={AccountCircle} label="Identitas Nasabah" />
              <Grid container>
                <Grid item xs={12} sm={6}><InfoRow label="Nama Lengkap" value={nasabah?.nama_lengkap} icon={AccountCircle} /></Grid>
                <Grid item xs={12} sm={6}><InfoRow label="Nomor WhatsApp" value={nasabah?.no_hp} icon={Info} /></Grid>
                <Grid item xs={12} sm={6}><InfoRow label="NIK" value={nasabah?.nik} icon={CreditCard} /></Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow
                    label="Rekening"
                    value={nasabah?.bank && nasabah?.no_rek ? `${nasabah.bank} — ${nasabah.no_rek}` : null}
                    icon={Payments}
                  />
                </Grid>
                <Grid item xs={12}><InfoRow label="Alamat Sesuai KTP" value={nasabah?.alamat} icon={LocationOn} /></Grid>
              </Grid>

              {nasabah?.foto_ktp && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PhotoLibrary sx={{ fontSize: 14 }} />}
                  onClick={() => setSelectedImage(nasabah.foto_ktp)}
                  sx={{ mt: 1, borderColor: C.primary, color: C.primary, borderRadius: "8px",
                    textTransform: "none", "&:hover": { bgcolor: C.primaryLight, borderColor: C.primary } }}
                >
                  Lihat Foto KTP
                </Button>
              )}
            </Box>
          </Card>

          {/* Barang Table */}
          {activeBarang && (
            <Card sx={{ borderRadius: "20px", boxShadow: "0 8px 32px rgba(0,0,0,0.05)", border: `1px solid ${C.border}` }}>
              <Box sx={{ p: 3, pb: 0 }}>
                <SectionTitle icon={activeBarang.icon} label={`Informasi Barang — ${activeBarang.label}`} />
              </Box>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: C.surfaceAlt }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: C.primary, fontSize: "0.72rem" }}>ITEM / MERK</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: C.primary, fontSize: "0.72rem" }}>SPESIFIKASI</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: C.primary, fontSize: "0.72rem" }}>UANG PINJAMAN</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
  {activeBarang.items.map((item, idx) => (
    <TableRow key={idx} hover sx={{ "&:last-child td": { border: 0 } }}>

      <TableCell sx={{ py: 2 }}>
        <Typography variant="body2" fontWeight={800} color={C.text}>
          {item.nama_barang || item.jenis_perhiasan || activeBarang.label}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {activeBarang.isEmas 
            ? `Kode Cap: ${item.kode_cap || "—"}` 
            : (item.imei || item.brand || "No SN / IMEI")}
        </Typography>
      </TableCell>

      <TableCell>
        <Box sx={{ display: "inline-block", px: 1, py: 0.3, borderRadius: "6px", bgcolor: C.primaryLight, mb: 0.5 }}>
          <Typography variant="caption" sx={{ color: C.primary, fontWeight: 700, fontSize: "0.65rem" }}>
            {activeBarang.isEmas 
              ? `Karat: ${item.karat || item.kadar || "—"}K` 
              : `Warna: ${item.warna || "—"}`}
          </Typography>
        </Box>
        <Typography variant="caption" display="block" color="textSecondary">
          {activeBarang.isEmas 
            ? `Berat: ${item.berat} gr` 
            : `RAM ${item.ram}GB · ROM ${item.rom}GB`}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontWeight={900} color={C.text}>
          {item.grade_nominal 
            ? formatRp(item.grade_nominal) 
            : formatRp(detail_gadai.uang_pinjaman)}
        </Typography>
        {item.grade_type && (
          <Box sx={{ display: "inline-block", px: 1, py: 0.2, borderRadius: "4px", bgcolor: C.primaryLight, mt: 0.5 }}>
            <Typography sx={{ color: C.primary, fontSize: "0.6rem", fontWeight: 700 }}>
              {item.grade_type.replace("_", " ").toUpperCase()}
            </Typography>
          </Box>
        )}
      </TableCell>
    </TableRow>
  ))}
</TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
        </Grid>

        {/* ── RIGHT COLUMN ── */}
        <Grid item xs={12} md={4}>

          {/* Finance Summary Card */}
          <Card sx={{ borderRadius: "20px", mb: 3, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,77,64,0.12)" }}>
            <Box sx={{ bgcolor: C.primary, p: 3 }}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.65rem" }}>
                Total Pinjaman
              </Typography>
              <Typography variant="h4" fontWeight={900} sx={{ color: "#fff", mt: 0.5, lineHeight: 1.1 }}>
                {formatRp(detail_gadai.uang_pinjaman)}
              </Typography>
            </Box>
            <Box sx={{ p: 3, bgcolor: C.surface }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="textSecondary">Taksiran Total</Typography>
                  <Typography variant="body2" fontWeight={900} color={C.text}>
                    {formatRp(detail_gadai.taksiran)}
                  </Typography>
                </Stack>
                <Divider sx={{ borderColor: C.border }} />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="textSecondary">Jatuh Tempo</Typography>
                  <Stack direction="row" spacing={0.8} alignItems="center">
                    <CalendarMonth sx={{ fontSize: 15, color: C.primary }} />
                    <Typography variant="body2" fontWeight={900} color={C.text}>
                      {detail_gadai.jatuh_tempo}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Box>
          </Card>

          {/* Log Verifikasi */}
          <Card sx={{ borderRadius: "20px", boxShadow: "0 8px 32px rgba(0,0,0,0.05)", border: `1px solid ${C.border}`, p: 3 }}>
            <SectionTitle icon={History} label="Log Verifikasi" />

            <Stack spacing={2}>
              {approvals && approvals.length > 0 ? approvals.map((app, i) => (
                <Box key={i} sx={{
                  p: 2, borderRadius: "12px",
                  bgcolor: C.surfaceAlt,
                  border: `1px solid ${C.border}`,
                  borderLeft: `3px solid ${C.primary}`,
                }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box sx={{ px: 1.2, py: 0.3, borderRadius: "6px", bgcolor: C.primaryLight }}>
                      <Typography sx={{ color: C.primary, fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.08em" }}>
                        {app.role?.toUpperCase()}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.65rem" }}>
                      {new Date(app.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    </Typography>
                  </Stack>

                  <Typography variant="body2" fontWeight={800} sx={{ color: C.text, mb: 1 }}>
                    {app.user?.name}
                  </Typography>

                  <Box sx={{ p: 1.2, borderRadius: "8px", bgcolor: C.surface, border: `1px dashed ${C.border}`, mb: 1.2 }}>
                    <Typography variant="caption" sx={{ fontStyle: "italic", lineHeight: 1.5, display: "block" }} color="textSecondary">
                      "{app.catatan || "Tidak ada catatan"}"
                    </Typography>
                  </Box>

                  <StatusBadge status={app.status?.split("_")[0]} />
                </Box>
              )) : (
                <Box sx={{ textAlign: "center", py: 5, border: `2px dashed ${C.border}`, borderRadius: "12px" }}>
                  <VerifiedUser sx={{ fontSize: 28, color: C.border, mb: 1 }} />
                  <Typography variant="caption" color="textSecondary" display="block">
                    Menunggu verifikasi checker...
                  </Typography>
                </Box>
              )}
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* ── KTP Lightbox ── */}
      <Dialog
        open={!!selectedImage}
        onClose={() => setSelectedImage("")}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden" } }}
      >
        <Box sx={{ position: "relative", bgcolor: "#000", p: 1 }}>
          <IconButton
            onClick={() => setSelectedImage("")}
            sx={{ position: "absolute", right: 10, top: 10, zIndex: 10,
              bgcolor: "rgba(0,0,0,0.6)", color: "#fff",
              "&:hover": { bgcolor: "rgba(220,38,38,0.7)" } }}
          >
            <Close fontSize="small" />
          </IconButton>
          <Box component="img" src={selectedImage}
            sx={{ width: "100%", maxHeight: "85vh", objectFit: "contain", borderRadius: "10px", display: "block" }} />
        </Box>
      </Dialog>
    </Box>
  );
};

export default DetailApprovalHMPage;