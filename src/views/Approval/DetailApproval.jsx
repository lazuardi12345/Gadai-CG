import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Card,
    CardHeader,
    CardContent,
    Divider,
    Typography,
    Box,
    CircularProgress,
    Grid,
    Paper,
    Stack,
    Button,
    Dialog,
    DialogContent,
    IconButton,
    Chip
} from "@mui/material";
import { ArrowBack, Close } from "@mui/icons-material";
import axiosInstance from "api/axiosInstance";

// Helper: full URL dokumen
const getFullDokumenUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "");
    return path.startsWith("storage/") ? `${baseUrl}/${path}` : `${baseUrl}/storage/${path}`;
};

// Helper: warna status
const getStatusColor = (status) => {
    if (!status) return "#ccc"; // default abu-abu
    const s = status.toLowerCase();
    if (s.includes("approved")) return "#4caf50"; // hijau
    if (s.includes("rejected")) return "#f44336"; // merah
    if (s.includes("pending")) return "#ff9800";  // kuning
    return "#ccc"; // default abu-abu
};

const DetailApprovalPage = () => {
    const { detailGadaiId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState("");

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            try {
                const res = await axiosInstance.get(`checker/approvals/${detailGadaiId}/full-detail`);
                if (res.data.success) {
                    setData(res.data.data);
                } else {
                    setError(res.data.message || "Gagal mengambil data detail");
                }
            } catch (err) {
                setError(err.message || "Terjadi kesalahan server");
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [detailGadaiId]);

    if (loading) return (
        <Stack alignItems="center" justifyContent="center" sx={{ height: "80vh" }}>
            <CircularProgress />
        </Stack>
    );

    if (error) return (
        <Typography color="error" variant="h6" align="center" sx={{ mt: 2 }}>
            Error: {error}
        </Typography>
    );

    if (!data) return (
        <Typography align="center" sx={{ mt: 2 }}>
            Data tidak ditemukan.
        </Typography>
    );

    const detail_gadai = data.detail_gadai;
    const nasabah = detail_gadai.nasabah;

    const getBarang = () => {
        switch (detail_gadai.type?.nama_type) {
            case "Handphone": return data.hp?.data || [];
            case "Perhiasan": return data.perhiasan?.data || [];
            case "Logam Mulia": return data.logam_mulia?.data || [];
            case "Retro": return data.retro?.data || [];
            default: return [];
        }
    };

    const barangList = getBarang();

    const dokumenList = [];
    barangList.forEach(item => {
        if (item.dokumen_pendukung) {
            Object.entries(item.dokumen_pendukung).forEach(([key, val]) => {
                if (val) {
                    let url = null;
                    if (typeof val === "string") url = getFullDokumenUrl(val);
                    else if (Array.isArray(val) && val.length > 0) url = getFullDokumenUrl(val[0]);
                    if (url) dokumenList.push({ key, url });
                }
            });
        }
    });

    const sectionPaper = { p: 2, borderRadius: 2, mb: 2, bgcolor: "#f9f9f9" };

    return (
        <Box sx={{ maxWidth: 1000, mx: "auto", mt: 3, mb: 6 }}>
            <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
                <CardHeader
                    title={<Typography variant="h5" fontWeight={600}>Detail Approval</Typography>}
                    action={
                        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
                            Kembali
                        </Button>
                    }
                    sx={{ bgcolor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}
                />
                <CardContent sx={{ p: 3 }}>
                    {/* NASABAH */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>Informasi Nasabah</Typography>
                        <Paper sx={sectionPaper} variant="outlined">
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}><Typography><strong>Nama:</strong> {nasabah?.nama_lengkap || "-"}</Typography></Grid>
                                <Grid item xs={12} sm={6}><Typography><strong>NIK:</strong> {nasabah?.nik || "-"}</Typography></Grid>
                                <Grid item xs={12} sm={6}><Typography><strong>Alamat:</strong> {nasabah?.alamat || "-"}</Typography></Grid>
                                <Grid item xs={12} sm={6}><Typography><strong>No HP:</strong> {nasabah?.no_hp || "-"}</Typography></Grid>
                                {nasabah?.foto_ktp && (
                                    <Grid item xs={12}>
                                        <Box
                                            component="img"
                                            src={getFullDokumenUrl(nasabah.foto_ktp)}
                                            alt="KTP"
                                            sx={{
                                                maxWidth: 200,
                                                borderRadius: 1,
                                                border: "1px solid #ccc",
                                                cursor: "pointer",
                                                "&:hover": { transform: "scale(1.05)" },
                                                transition: "transform 0.3s"
                                            }}
                                            onClick={() => setSelectedImage(getFullDokumenUrl(nasabah.foto_ktp))}
                                        />
                                    </Grid>
                                )}
                            </Grid>
                        </Paper>
                    </Box>

                    {/* DETAIL GADAI */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>Detail Gadai</Typography>
                        <Paper sx={sectionPaper} variant="outlined">
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}><Typography><strong>Type:</strong> {detail_gadai.type?.nama_type || "-"}</Typography></Grid>
                                <Grid item xs={12} sm={6}><Typography><strong>No Gadai:</strong> {detail_gadai.no_gadai || "-"}</Typography></Grid>
                                <Grid item xs={12} sm={6}><Typography><strong>Tanggal Gadai:</strong> {detail_gadai.tanggal_gadai || "-"}</Typography></Grid>
                                <Grid item xs={12} sm={6}><Typography><strong>Jatuh Tempo:</strong> {detail_gadai.jatuh_tempo || "-"}</Typography></Grid>
                                <Grid item xs={12} sm={6}><Typography><strong>Uang Pinjaman:</strong> {detail_gadai.uang_pinjaman || "-"}</Typography></Grid>
                                <Grid item xs={12} sm={6}><Typography><strong>Taksiran:</strong> {detail_gadai.taksiran || "-"}</Typography></Grid>
                            </Grid>
                        </Paper>
                    </Box>

                    {/* BARANG */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>Detail Barang</Typography>
                        <Grid container spacing={2}>
                            {barangList.length > 0 ? barangList.map((item, idx) => (
                                <Grid item xs={12} sm={6} key={idx}>
                                    <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2, height: "100%" }}>
                                        {Object.entries(item).map(([key, val]) => {
                                            const skipFields = ["id", "dokumen_pendukung", "created_at", "updated_at", "deleted_at", "detail_gadai_id"];
                                            if (!skipFields.includes(key)) {
                                                const displayValue = Array.isArray(val) ? val.join(", ") : val || "-";
                                                return (
                                                    <Typography key={key} sx={{ mb: 0.5, fontSize: 14 }}>
                                                        <strong>{key.replace(/_/g, " ")}:</strong> {displayValue}
                                                    </Typography>
                                                );
                                            }
                                            return null;
                                        })}
                                    </Paper>
                                </Grid>
                            )) : <Typography color="text.secondary" sx={{ ml: 2 }}>Tidak ada barang</Typography>}
                        </Grid>
                    </Box>

                    {/* PERPANJANGAN */}
                    {detail_gadai.perpanjangan_tempos?.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>Perpanjangan Tempo</Typography>
                            <Grid container spacing={2}>
                                {detail_gadai.perpanjangan_tempos.map((p, idx) => (
                                    <Grid item xs={12} sm={6} key={idx}>
                                        <Paper sx={{ p: 2, borderRadius: 2, bgcolor: "#e8f0fe" }}>
                                            <Typography><strong>Tanggal Perpanjangan:</strong> {p.tanggal_perpanjangan}</Typography>
                                            <Typography><strong>Jatuh Tempo Baru:</strong> {p.jatuh_tempo_baru}</Typography>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}

                    {/* APPROVAL HISTORY */}
                    {detail_gadai.approvals?.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>Approval History</Typography>
                            <Grid container spacing={2}>
                                {detail_gadai.approvals.map((a, idx) => (
                                    <Grid item xs={12} sm={6} key={idx}>
                                        <Paper sx={{ p: 2, borderRadius: 2, bgcolor: "#f9f9f9" }}>
                                            <Typography><strong>Role:</strong> {a.role}</Typography>
                                            <Typography>
                                                <strong>Status:</strong>{" "}
                                                <Chip
                                                    label={a.status}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 500,
                                                        color: "#fff",
                                                        backgroundColor: getStatusColor(a.status)
                                                    }}
                                                />

                                            </Typography>
                                            <Typography><strong>Catatan:</strong> {a.catatan || "-"}</Typography>
                                            <Typography><strong>User:</strong> {a.user?.name || "-"}</Typography>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}

                    {/* DOKUMEN PENDUKUNG */}
                    {dokumenList.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>Dokumen Pendukung</Typography>
                            <Grid container spacing={2}>
                                {dokumenList.map((d, idx) => (
                                    <Grid item xs={12} sm={4} key={idx}>
                                        <Typography sx={{ mb: 1, fontSize: 14, fontWeight: 500 }}>
                                            {d.key.replace(/_/g, " ").toUpperCase()}
                                        </Typography>
                                        <Box
                                            component="img"
                                            src={d.url}
                                            alt={d.key}
                                            sx={{
                                                width: "100%",
                                                maxHeight: 150,
                                                objectFit: "contain",
                                                borderRadius: 1,
                                                border: "1px solid #ccc",
                                                cursor: "pointer",
                                                "&:hover": { transform: "scale(1.05)" },
                                                transition: "transform 0.3s"
                                            }}
                                            onClick={() => setSelectedImage(d.url)}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}

                </CardContent>
            </Paper>

            {/* PREVIEW IMAGE */}
           {/* PREVIEW IMAGE */}
<Dialog
  open={!!selectedImage}
  onClose={() => setSelectedImage("")}
  maxWidth="lg"
  fullWidth
>
  <DialogContent
    sx={{
      position: "relative",
      p: 0,
      textAlign: "center",
      bgcolor: "#000",
    }}
  >
    <IconButton
      onClick={() => setSelectedImage("")}
      sx={{
        position: "absolute",
        top: 8,
        right: 8,
        zIndex: 10,
        bgcolor: "rgba(255,255,255,0.7)",
      }}
    >
      <Close />
    </IconButton>
    <Box
      component="img"
      src={selectedImage}
      alt="Preview"
      sx={{
        width: "100%",
        height: "auto",
        maxHeight: "90vh",
        objectFit: "contain",
      }}
    />
  </DialogContent>

  {/* Tombol Aksi */}
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      gap: 2,
      p: 2,
      bgcolor: "#f9f9f9",
      borderTop: "1px solid #ddd",
    }}
  >
    <Button
      variant="outlined"
      color="primary"
      onClick={() => window.open(selectedImage, "_blank")}
    >
      Perbesar
    </Button>
    <Button
      variant="contained"
      color="inherit"
      onClick={() => setSelectedImage("")}
    >
      Tutup
    </Button>
  </Box>
</Dialog>

        </Box>
    );
};

export default DetailApprovalPage;
