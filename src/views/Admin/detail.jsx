// ===============================
// ADMIN DETAIL PAGE (CLEAN UI VERSION)
// ===============================
import React, { useEffect, useState, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Card,
    CardHeader,
    CardContent,
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
    Chip,
    Table,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
} from "@mui/material";
import { ArrowBack, Close } from "@mui/icons-material";
import axiosInstance from "api/axiosInstance";
import { AuthContext } from "AuthContex/AuthContext";

// ===================================
// HELPER FUNCTIONS
// ===================================

const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const base = (import.meta.env.VITE_API_BASE_URL || "").replace("/api", "");
    return path.startsWith("storage/") ? `${base}/${path}` : `${base}/storage/${path}`;
};

const getStatusColor = (s) => {
    if (!s) return "#9e9e9e";
    s = s.toLowerCase();
    if (s.includes("approved")) return "#4caf50";
    if (s.includes("rejected")) return "#f44336";
    if (s.includes("pending")) return "#ff9800";
    return "#9e9e9e";
};

const formatRp = (v) =>
    !v && v !== 0
        ? "-"
        : new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }).format(v);

// ===================================
// REUSABLE COMPONENTS
// ===================================

/**
 * Komponen untuk menampilkan satu baris detail.
 */
const DetailItem = ({ label, value, xs = 12, sm = 6 }) => (
    <Grid item xs={xs} sm={sm}>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="body1" fontWeight={500}>{value || "-"}</Typography>
    </Grid>
);

/**
 * Komponen untuk preview gambar/dokumen.
 */
const ImagePreview = ({ selectedImage, setSelectedImage }) => (
    <Dialog open={!!selectedImage} onClose={() => setSelectedImage("")} maxWidth="lg" fullWidth>
        <DialogContent sx={{ p: 0, position: "relative", bgcolor: "#000" }}>
            <IconButton
                onClick={() => setSelectedImage("")}
                sx={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    bgcolor: "rgba(255,255,255,0.9)",
                    zIndex: 10,
                    "&:hover": { bgcolor: "white" }
                }}
            >
                <Close />
            </IconButton>
            <img
                src={selectedImage}
                style={{
                    width: "100%",
                    maxHeight: "90vh",
                    objectFit: "contain"
                }}
                alt="Dokumen"
            />
        </DialogContent>
    </Dialog>
);

// ===================================
// MAIN COMPONENT
// ===================================

const AdminDetailPage = () => {
    const { detailGadaiId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState("");

    const loadDetail = useCallback(async () => {
        try {
            const endpoint = user?.role === "hm"
                ? `/laporan/detail/${detailGadaiId}`
                : `/admin/laporan/detail/${detailGadaiId}`;

            const res = await axiosInstance.get(endpoint);

            if (res.data.success) setData(res.data.data);
            else console.error("Gagal mengambil data detail:", res.data.message);
        } catch (e) {
            console.error("Kesalahan server saat fetch detail:", e);
        } finally {
            setLoading(false);
        }
    }, [detailGadaiId, user?.role]);

    useEffect(() => { loadDetail(); }, [loadDetail]);

    if (loading)
        return (
            <Stack alignItems="center" justifyContent="center" sx={{ height: "70vh" }}>
                <CircularProgress />
            </Stack>
        );

    if (!data)
        return (
            <Typography align="center" variant="h6" color="text.secondary" sx={{ mt: 4 }}>
                Data Gadai tidak ditemukan.
            </Typography>
        );

    // ===================================
    // DATA EXTRACTION & PROCESSING
    // ===================================
    const detail = data.detail_gadai ?? {};
    const perhitungan = data.perhitungan ?? {};
    const approvals = data.approvals || [];
    const perpanjanganTempo = data.perpanjangan_tempo || [];
    const nasabah = detail.nasabah || {};

    const barangList = [
        ...(data.hp?.data || []).map(item => ({ category: "Handphone", ...item })),
        ...(data.perhiasan?.data || []).map(item => ({ category: "Perhiasan", ...item })),
        ...(data.logam_mulia?.data || []).map(item => ({ category: "Logam Mulia", ...item })),
        ...(data.retro?.data || []).map(item => ({ category: "Retro", ...item })),
    ];

    const dokumenPendukung = [];
    barangList.forEach((item) => {
        if (!item.dokumen_pendukung) return;
        Object.entries(item.dokumen_pendukung).forEach(([key, val]) => {
            let url = null;
            if (typeof val === "string") url = getFullUrl(val);
            else if (Array.isArray(val) && val.length > 0) url = getFullUrl(val[0]);
            if (url) dokumenPendukung.push({ key: item.category + " - " + key, url });
        });
    });

    // Styling
    const sectionPaperStyle = {
        p: 3,
        borderRadius: 2,
        mb: 4,
        boxShadow: 2,
    };

    return (
        <Box sx={{ maxWidth: 1000, mx: "auto", mt: 3, mb: 6 }}>
            <Card sx={{ borderRadius: 3, boxShadow: 6 }}>
                <CardHeader
                    title={<Typography variant="h5" fontWeight={700}>Detail Gadai #{detail.no_gadai || detailGadaiId}</Typography>}
                    action={
                        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
                            Kembali
                        </Button>
                    }
                    sx={{ bgcolor: "#e3f2fd", borderBottom: "1px solid #bbdefb", py: 2 }}
                />
                <CardContent sx={{ p: 4 }}>
                    <Stack spacing={4}>
                        
                        {/* =================================== */}
                        {/* 1. INFORMASI NASABAH */}
                        {/* =================================== */}
                        <Paper sx={sectionPaperStyle}>
                            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: '#1976d2' }}>
                                👤 Informasi Nasabah
                            </Typography>
                            <Grid container spacing={3}>
                                <DetailItem label="Nama Lengkap" value={nasabah.nama_lengkap} />
                                <DetailItem label="NIK" value={nasabah.nik} />
                                <DetailItem label="Alamat" value={nasabah.alamat} xs={12} sm={12} />
                                <DetailItem label="No HP" value={nasabah.no_hp} />
                                <DetailItem label="No Rekening" value={nasabah.no_rek} /> {/* Tampilkan No Rek */}
                                {nasabah.foto_ktp && (
                                    <Grid item xs={12}>
                                        <Typography variant="body2" color="text.secondary">Foto KTP</Typography>
                                        <Box
                                            component="img"
                                            src={getFullUrl(nasabah.foto_ktp)}
                                            sx={{
                                                width: 150,
                                                height: 100,
                                                objectFit: "cover",
                                                borderRadius: 1,
                                                border: "2px solid #ccc",
                                                cursor: "pointer",
                                                mt: 1
                                            }}
                                            onClick={() => setSelectedImage(getFullUrl(nasabah.foto_ktp))}
                                            alt="Foto KTP Nasabah"
                                        />
                                    </Grid>
                                )}
                            </Grid>
                        </Paper>

                        {/* =================================== */}
                        {/* 2. DETAIL GADAI & PERHITUNGAN */}
                        {/* =================================== */}
                        <Paper sx={sectionPaperStyle}>
                            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: '#d32f2f' }}>
                            Detail Transaksi & Biaya
                            </Typography>
                            <Grid container spacing={3}>
                                <DetailItem label="No Gadai" value={detail.no_gadai} />
                                <DetailItem label="Jenis Gadai" value={detail.type?.nama_type} />
                                <DetailItem label="Tanggal Gadai" value={detail.tanggal_gadai} />
                                <DetailItem label="Jatuh Tempo Awal" value={detail.jatuh_tempo} />
                                
                                {/* Pemisahan Perhitungan */}
                                <Grid item xs={12}><Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, borderBottom: '1px solid #eee' }}>Perhitungan Biaya</Typography></Grid>
                                
                                <DetailItem label="Pinjaman Pokok" value={formatRp(perhitungan.pinjaman_pokok)} />
                                <DetailItem label="Total Diterima" value={formatRp(perhitungan.total_diterima)} />
                                <DetailItem label="Tenor Hari" value={perhitungan.tenor_hari} />
                                <DetailItem label="Jasa" value={formatRp(perhitungan.jasa)} />
                                <DetailItem label="Admin Fee" value={formatRp(perhitungan.admin_fee)} />
                                <DetailItem label="Asuransi" value={formatRp(perhitungan.asuransi)} />
                            </Grid>
                        </Paper>

                        {/* =================================== */}
                        {/* 3. BARANG DIGADAI */}
                        {/* =================================== */}
                        {barangList.length > 0 && (
                            <Paper sx={sectionPaperStyle}>
                                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: '#004d40' }}>
                                Barang Digadai ({barangList.length} Item)
                                </Typography>
                                {barangList.map((item, idx) => (
                                    <Box key={idx} sx={{ mt: idx > 0 ? 3 : 0, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: '#004d40' }}>
                                            {idx + 1}. {item.category}
                                        </Typography>
                                        <Grid container spacing={1}>
                                            {Object.entries(item).map(([k, v]) => {
                                                if (
                                                    ["id", "category", "dokumen_pendukung", "created_at", "updated_at", "deleted_at", "detail_gadai_id"].includes(k)
                                                ) return null;

                                                const label = k.replace(/_/g, " ").toUpperCase();
                                                const valueDisplay = Array.isArray(v) ? v.join(", ") : v || "-";
                                                
                                                return (
                                                    <Grid item xs={12} sm={6} md={4} key={k}>
                                                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                                                        <Typography variant="body2">{valueDisplay}</Typography>
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    </Box>
                                ))}
                            </Paper>
                        )}


                        {/* =================================== */}
                        {/* 4. PERPANJANGAN TEMPO */}
                        {/* =================================== */}
                        {perpanjanganTempo.length > 0 && (
                            <Paper sx={sectionPaperStyle}>
                                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: '#ff9800' }}>
                                Riwayat Perpanjangan Tempo
                                </Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#fff3e0' }}>
                                                <TableCell sx={{ fontWeight: 700 }}>No</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Tanggal Perpanjangan</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Jatuh Tempo Baru</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {perpanjanganTempo.map((p, idx) => (
                                                <TableRow key={idx} hover>
                                                    <TableCell>{idx + 1}</TableCell>
                                                    <TableCell>{p.tanggal_perpanjangan}</TableCell>
                                                    <TableCell>{p.jatuh_tempo_baru}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        )}

                        {/* =================================== */}
                        {/* 5. APPROVAL HISTORY */}
                        {/* =================================== */}
                        {approvals.length > 0 && (
                            <Paper sx={sectionPaperStyle}>
                                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: '#7b1fa2' }}>
                                    Riwayat Persetujuan
                                </Typography>
                                <Grid container spacing={3}>
                                    {approvals.map((a, idx) => (
                                        <Grid item xs={12} sm={6} key={idx}>
                                            <Paper elevation={1} sx={{ p: 2, borderRadius: 1, borderLeft: `5px solid ${getStatusColor(a.status)}` }}>
                                                <Typography variant="body2" color="text.secondary">Role: <strong>{a.role}</strong></Typography>
                                                <Stack direction="row" alignItems="center" spacing={1} sx={{ my: 0.5 }}>
                                                    <Typography variant="body2" color="text.secondary">Status:</Typography>
                                                    <Chip
                                                        size="small"
                                                        label={a.status}
                                                        sx={{
                                                            color: "#fff",
                                                            backgroundColor: getStatusColor(a.status),
                                                            fontWeight: 500
                                                        }}
                                                    />
                                                </Stack>
                                                <Typography variant="body2">Catatan: {a.catatan || "-"}</Typography>
                                                <Typography variant="caption" color="text.secondary">User: {a.user?.name || "-"}</Typography>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Paper>
                        )}
                        
                        {/* =================================== */}
                        {/* 6. DOKUMEN PENDUKUNG */}
                        {/* =================================== */}
                        {dokumenPendukung.length > 0 && (
                            <Paper sx={sectionPaperStyle}>
                                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: '#039be5' }}>
                                    Dokumen Pendukung Barang
                                </Typography>
                                <Grid container spacing={3}>
                                    {dokumenPendukung.map((d, idx) => (
                                        <Grid item xs={6} sm={4} md={3} key={idx}>
                                            <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
                                                {d.key.replace(/_/g, " ").toUpperCase()}
                                            </Typography>
                                            <Box
                                                component="img"
                                                src={d.url}
                                                sx={{
                                                    width: "100%",
                                                    height: 120,
                                                    objectFit: "cover", // Use cover for better layout
                                                    borderRadius: 1,
                                                    border: "1px solid #ccc",
                                                    cursor: "pointer",
                                                    "&:hover": { opacity: 0.8 },
                                                    transition: "0.3s"
                                                }}
                                                onClick={() => setSelectedImage(d.url)}
                                                alt={d.key}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Paper>
                        )}

                    </Stack>
                </CardContent>
            </Card>

            {/* IMAGE PREVIEW MODAL */}
            <ImagePreview selectedImage={selectedImage} setSelectedImage={setSelectedImage} />
        </Box>
    );
};

export default AdminDetailPage;