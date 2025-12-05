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
    Collapse,
    Tooltip,
} from "@mui/material";
import { ArrowBack, Close, ExpandMore, ExpandLess } from "@mui/icons-material";
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
const DetailItem = ({ label, value, xs = 12, sm = 6 }) => (
    <Grid item xs={xs} sm={sm}>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="body1" fontWeight={500}>{value || "-"}</Typography>
    </Grid>
);

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
                style={{ width: "100%", maxHeight: "90vh", objectFit: "contain" }}
                alt="Dokumen"
            />
        </DialogContent>
    </Dialog>
);

// ===================================
// DOKUMEN SOP HP
// ===================================
const DOKUMEN_SOP_HP = {
    Android: ['body', 'imei', 'about', 'akun', 'admin', 'cam_depan', 'cam_belakang', 'rusak'],
    Samsung: ['body', 'imei', 'about', 'samsung_account', 'admin', 'cam_depan', 'cam_belakang', 'galaxy_store'],
    iPhone: ['body', 'imei', 'about', 'icloud', 'battery', 'utools', 'iunlocker', 'cek_pencurian']
};

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
    const [expandedBarang, setExpandedBarang] = useState({}); // collapse state per item

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
        ...(data.hp ? [data.hp] : []).map(item => ({ category: "Handphone", ...item })),
        ...(data.perhiasan ? [data.perhiasan] : []).map(item => ({ category: "Perhiasan", ...item })),
        ...(data.logam_mulia ? [data.logam_mulia] : []).map(item => ({ category: "Logam Mulia", ...item })),
        ...(data.retro ? [data.retro] : []).map(item => ({ category: "Retro", ...item })),
    ];

    // ===================================
    // DOKUMEN PENDUKUNG SESUAI SOP
    // ===================================
    const dokumenPendukung = [];
    barangList.forEach((item) => {
        if (!item.dokumen_pendukung) return;

        // ambil SOP sesuai merk
        const merk = item.merk?.nama_merk || "Android";
        const sopList = DOKUMEN_SOP_HP[merk] || [];

        sopList.forEach((key) => {
            const val = item.dokumen_pendukung[key];
            if (!val) return;
            let url = null;
            if (typeof val === "string") url = getFullUrl(val);
            else if (Array.isArray(val) && val.length > 0) url = getFullUrl(val[0]);
            if (url) dokumenPendukung.push({ key: item.category + " - " + key, url });
        });
    });

    const sectionPaperStyle = { p: 3, borderRadius: 2, mb: 4, boxShadow: 2 };

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
                        {/* INFORMASI NASABAH */}
                        <Paper sx={sectionPaperStyle}>
                            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: '#1976d2' }}>
                                Informasi Nasabah
                            </Typography>
                            <Grid container spacing={3}>
                                <DetailItem label="Nama Lengkap" value={nasabah.nama_lengkap} />
                                <DetailItem label="NIK" value={nasabah.nik} />
                                <DetailItem label="Alamat" value={nasabah.alamat} xs={12} sm={12} />
                                <DetailItem label="No HP" value={nasabah.no_hp} />
                                <DetailItem label="No Rekening" value={nasabah.no_rek} />
                                {nasabah.foto_ktp && (
                                    <Grid item xs={12}>
                                        <Typography variant="body2" color="text.secondary">Foto KTP</Typography>
                                        <Box
                                            component="img"
                                            src={getFullUrl(nasabah.foto_ktp)}
                                            sx={{ width: 150, height: 100, objectFit: "cover", borderRadius: 1, border: "2px solid #ccc", cursor: "pointer", mt: 1 }}
                                            onClick={() => setSelectedImage(getFullUrl(nasabah.foto_ktp))}
                                            alt="Foto KTP Nasabah"
                                        />
                                    </Grid>
                                )}
                            </Grid>
                        </Paper>

                        {/* DETAIL GADAI & PERHITUNGAN */}
                        <Paper sx={sectionPaperStyle}>
                            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: '#d32f2f' }}>
                                Detail Transaksi & Biaya
                            </Typography>
                            <Grid container spacing={3}>
                                <DetailItem label="No Gadai" value={detail.no_gadai} />
                                <DetailItem label="Jenis Gadai" value={detail.type?.nama_type} />
                                <DetailItem label="Tanggal Gadai" value={detail.tanggal_gadai} />
                                <DetailItem label="Jatuh Tempo Awal" value={detail.jatuh_tempo} />
                                <Grid item xs={12}><Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, borderBottom: '1px solid #eee' }}>Perhitungan Biaya</Typography></Grid>
                                <DetailItem label="Pinjaman Pokok" value={formatRp(perhitungan.pinjaman_pokok)} />
                                <DetailItem label="Total Diterima" value={formatRp(perhitungan.total_diterima)} />
                                <DetailItem label="Tenor Hari" value={perhitungan.tenor_hari} />
                                <DetailItem label="Jasa" value={formatRp(perhitungan.jasa)} />
                                <DetailItem label="Admin Fee" value={formatRp(perhitungan.admin_fee)} />
                                <DetailItem label="Asuransi" value={formatRp(perhitungan.asuransi)} />
                            </Grid>
                        </Paper>

                        {/* BARANG DIGADAI */}
                        {barangList.length > 0 && (
                            <Paper sx={sectionPaperStyle}>
                                <Typography
                                    variant="h5"
                                    fontWeight={700}
                                    gutterBottom
                                    sx={{
                                        color: '#004d40',
                                        mb: 2,
                                        letterSpacing: 0.5,
                                        borderBottom: '3px solid #26a69a',
                                        display: 'inline-block',
                                        pb: 0.5
                                    }}
                                >
                                     Barang Digadai
                                </Typography>

                                <Grid container spacing={2}>
                                    {barangList.map((item, idx) => (
                                        <Grid item xs={12} key={idx}>
                                            <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 1 }}>
                                                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                                    {item.category}
                                                </Typography>

                                                {/* Info Utama */}
                                                <Grid container spacing={1} sx={{ mb: 1 }}>
                                                    {item.category.toLowerCase() === "handphone" && (
                                                        <>
                                                            <Grid item xs={12} sm={6} md={4}>
                                                                <Typography variant="caption" color="text.secondary">Merk</Typography>
                                                                <Typography variant="body2">{item.merk?.nama_merk}</Typography>
                                                            </Grid>
                                                            <Grid item xs={12} sm={6} md={4}>
                                                                <Typography variant="caption" color="text.secondary">Type</Typography>
                                                                <Typography variant="body2">{item.type_hp?.nama_type}</Typography>
                                                            </Grid>
                                                            <Grid item xs={12} sm={6} md={4}>
                                                                <Typography variant="caption" color="text.secondary">Warna</Typography>
                                                                <Typography variant="body2">{item.warna}</Typography>
                                                            </Grid>
                                                            <Grid item xs={12} sm={6} md={4}>
                                                                <Typography variant="caption" color="text.secondary">RAM / ROM</Typography>
                                                                <Typography variant="body2">{item.ram} / {item.rom}</Typography>
                                                            </Grid>
                                                            <Grid item xs={12} sm={6} md={4}>
                                                                <Typography variant="caption" color="text.secondary">IMEI</Typography>
                                                                <Typography variant="body2">{item.imei}</Typography>
                                                            </Grid>
                                                            <Grid item xs={12} sm={6} md={4}>
                                                                <Typography variant="caption" color="text.secondary">Grade</Typography>
                                                                <Typography variant="body2">{item.grade_type}</Typography>
                                                            </Grid>
                                                        </>
                                                    )}
                                                </Grid>

                                                {/* Kerusakan */}
                                                {item.kerusakan_list?.length > 0 && (
                                                    <Box sx={{ mt: 2 }}>
                                                        <Typography variant="subtitle2" fontWeight={600}>Kerusakan</Typography>
                                                        <Grid container spacing={1}>
                                                            {item.kerusakan_list.map((kerusakan, kidx) => (
                                                                <Grid item xs={12} sm={6} md={4} key={kidx}>
                                                                    <Typography variant="body2">- {kerusakan.nama_kerusakan}</Typography>
                                                                </Grid>
                                                            ))}
                                                        </Grid>
                                                    </Box>
                                                )}

                                                {/* Kelengkapan */}
                                                {item.kelengkapan_list?.length > 0 && (
                                                    <Box sx={{ mt: 2 }}>
                                                        <Typography variant="subtitle2" fontWeight={600}>Kelengkapan</Typography>
                                                        <Grid container spacing={1}>
                                                            {item.kelengkapan_list.map((kelengkapan, kidx) => (
                                                                <Grid item xs={12} sm={6} md={4} key={kidx}>
                                                                    <Typography variant="body2">- {kelengkapan.nama_kelengkapan}</Typography>
                                                                </Grid>
                                                            ))}
                                                        </Grid>
                                                    </Box>
                                                )}
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Paper>
                        )}


                        {/* PERPANJANGAN TEMPO */}
                        {perpanjanganTempo.length > 0 && (
                            <Paper sx={sectionPaperStyle}>
                                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: '#ff9800' }}>
                                    Riwayat Perpanjangan Tempo
                                </Typography>
                                <TableContainer>
                                    <Table size="small">
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

                        {/* APPROVAL HISTORY */}
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
                                                        sx={{ color: "#fff", backgroundColor: getStatusColor(a.status), fontWeight: 500 }}
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

                        {/* DOKUMEN PENDUKUNG */}
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
                                                    objectFit: "cover",
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
