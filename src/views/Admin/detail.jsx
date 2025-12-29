// ===============================
// ADMIN DETAIL PAGE (FINAL SYNC)
// ===============================
import React, { useEffect, useState, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Card, CardHeader, CardContent, Typography, Box, CircularProgress,
    Grid, Paper, Stack, Button, Dialog, DialogContent, IconButton, Chip,
} from "@mui/material";
import { ArrowBack, Close } from "@mui/icons-material";
import axiosInstance from "api/axiosInstance";
import { AuthContext } from "AuthContex/AuthContext";

// ===================================
// HELPER FUNCTIONS
// ===================================
const getFullUrl = (path) => {
    if (!path || typeof path !== 'string') return null;
    if (path.startsWith("http")) return path;
    const base = (import.meta.env.VITE_API_BASE_URL || "").replace("/api", "");
    const cleanPath = path.startsWith("/") ? path.substring(1) : path;
    return cleanPath.startsWith("storage/") ? `${base}/${cleanPath}` : `${base}/storage/${cleanPath}`;
};

const getStatusColor = (s) => {
    if (!s) return "#9e9e9e";
    s = s.toLowerCase();
    if (s.includes("approved") || s === 'lunas' || s === 'terlelang') return "#4caf50";
    if (s.includes("rejected")) return "#f44336";
    if (s.includes("pending")) return "#ff9800";
    return "#9e9e9e";
};

const formatRp = (v) =>
    !v && v !== 0 ? "-" : new Intl.NumberFormat("id-ID", {
        style: "currency", currency: "IDR", minimumFractionDigits: 0
    }).format(v);

const DetailItem = ({ label, value, xs = 12, sm = 6 }) => (
    <Grid item xs={xs} sm={sm}>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="body1" fontWeight={500}>{value || "-"}</Typography>
    </Grid>
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
            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (e) {
            console.error("Fetch error:", e);
        } finally {
            setLoading(false);
        }
    }, [detailGadaiId, user?.role]);

    useEffect(() => { loadDetail(); }, [loadDetail]);

    if (loading) return (
        <Stack alignItems="center" justifyContent="center" sx={{ height: "70vh" }}>
            <CircularProgress />
        </Stack>
    );

    if (!data) return <Typography align="center" sx={{ mt: 4 }}>Data tidak ditemukan.</Typography>;

    // ===================================
    // EXTRACTION DATA
    // ===================================
    const detail = data.detail_gadai || {};
    const nasabah = detail.nasabah || {};
    const perhitunganAwal = data.perhitungan_awal || {};
    const perhitunganKeterlambatan = data.perhitungan_keterlambatan || {};
    const approvals = detail.approvals || [];
    
    // Data Barang HP
    const hp = detail.hp || null;
    const dokumenSop = hp?.dokumen_pendukung_hp || {};

    const sectionPaperStyle = { p: 3, borderRadius: 2, mb: 4, boxShadow: 2 };

    return (
        <Box sx={{ maxWidth: 1000, mx: "auto", mt: 3, mb: 6, px: 2 }}>
            <Card sx={{ borderRadius: 3, boxShadow: 6 }}>
                <CardHeader
                    title={<Typography variant="h5" fontWeight={700}>Detail Gadai #{detail.no_gadai}</Typography>}
                    action={<Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>Kembali</Button>}
                    sx={{ bgcolor: "#e3f2fd", py: 2 }}
                />
                <CardContent sx={{ p: 4 }}>
                    <Stack spacing={3}>
                        
                        {/* 1. INFO NASABAH */}
                        <Paper sx={sectionPaperStyle}>
                            <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 700 }}>Informasi Nasabah</Typography>
                            <Grid container spacing={2}>
                                <DetailItem label="Nama Lengkap" value={nasabah.nama_lengkap} />
                                <DetailItem label="NIK" value={nasabah.nik} />
                                <DetailItem label="No HP" value={nasabah.no_hp} />
                                <DetailItem label="No Rekening" value={nasabah.no_rek} />
                                <DetailItem label="Alamat" value={nasabah.alamat} xs={12} />
                                {nasabah.foto_ktp && (
                                    <Grid item xs={12}>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Foto KTP:</Typography>
                                        <Box component="img" src={getFullUrl(nasabah.foto_ktp)} 
                                            sx={{ width: 220, borderRadius: 2, cursor: 'pointer', border: '2px solid #eee', "&:hover": { borderColor: '#1976d2' } }}
                                            onClick={() => setSelectedImage(getFullUrl(nasabah.foto_ktp))}
                                        />
                                    </Grid>
                                )}
                            </Grid>
                        </Paper>

                        {/* 2. DETAIL TRANSAKSI & KALKULASI */}
                        <Paper sx={sectionPaperStyle}>
                            <Typography variant="h6" color="error" gutterBottom sx={{ fontWeight: 700 }}>Detail Transaksi & Biaya</Typography>
                            <Grid container spacing={2}>
                                <DetailItem label="Status Gadai" value={<Chip label={detail.status?.toUpperCase()} size="small" color="success" />} />
                                <DetailItem label="Tanggal Gadai" value={detail.tanggal_gadai} />
                                <DetailItem label="Jatuh Tempo" value={perhitunganKeterlambatan.jatuh_tempo} />
                                <DetailItem label="Pinjaman Pokok" value={formatRp(perhitunganAwal.pinjaman)} />
                                <DetailItem label="Tenor Paket" value={perhitunganAwal.tenor_hari} />
                                <DetailItem label="Hari Terlambat" value={`${perhitunganKeterlambatan.hari_terlambat} Hari`} />
                                <DetailItem label="Bunga" value={formatRp(perhitunganKeterlambatan.bunga)} />
                                <DetailItem label="Penalty" value={formatRp(perhitunganKeterlambatan.penalty)} />
                                <DetailItem label="Denda Keterlambatan" value={formatRp(perhitunganKeterlambatan.denda)} />
                                <Grid item xs={12}>
                                    <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 2, border: '2px solid #ff9800', textAlign: 'center' }}>
                                        <Typography variant="subtitle1" color="#e65100" fontWeight={400}>Total Hutang Pelunasan:</Typography>
                                        <Typography variant="h4" color="#e65100" fontWeight={800}>
                                            {formatRp(perhitunganKeterlambatan.total_hutang)}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontStyle: 'italic' }}>Per tanggal hitung: {perhitunganKeterlambatan.tanggal_yang_dipakai}</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* 3. DETAIL BARANG (HP) */}
                        {hp && (
                            <Paper sx={sectionPaperStyle}>
                                <Typography variant="h6" color="secondary" gutterBottom sx={{ fontWeight: 700 }}>📱 Spesifikasi Barang</Typography>
                                <Grid container spacing={2}>
                                    <DetailItem label="Merk" value={hp.merk?.nama_merk} />
                                    <DetailItem label="Type HP" value={hp.type_hp?.nama_type} />
                                    <DetailItem label="Warna" value={hp.warna} />
                                    <DetailItem label="RAM / ROM" value={`${hp.ram}GB / ${hp.rom}GB`} />
                                    <DetailItem label="IMEI" value={hp.imei} />
                                    {/* PERBAIKAN GRADE DI SINI */}
                                    <DetailItem label="Grade Pilihan" value={hp.grade_type?.replace(/_/g, " ").toUpperCase()} />
                                    <DetailItem label="Password / PIN" value={hp.kunci_password || hp.kunci_pin || "-"} />
                                </Grid>

                                {/* List Kerusakan */}
                                {hp.kerusakan_list?.length > 0 && (
                                    <Box sx={{ mt: 2, p: 2, bgcolor: '#fafafa', borderRadius: 1 }}>
                                        <Typography variant="subtitle2" fontWeight={700}>Kondisi Kerusakan:</Typography>
                                        {hp.kerusakan_list.map((k, i) => (
                                            <Typography key={i} variant="body2" color="error">• {k.nama_kerusakan} ({k.persen}%)</Typography>
                                        ))}
                                    </Box>
                                )}
                            </Paper>
                        )}

                        {/* 4. DOKUMEN PENDUKUNG (Filtered) */}
                        {Object.keys(dokumenSop).length > 0 && (
                            <Paper sx={sectionPaperStyle}>
                                <Typography variant="h6" color="info.main" gutterBottom sx={{ fontWeight: 700 }}> Dokumen SOP Barang</Typography>
                                <Grid container spacing={2}>
                                    {Object.entries(dokumenSop).map(([key, path]) => {
                                        // FILTER: Jangan tampilkan field non-gambar
                                        const ignoreFields = ['id', 'created_at', 'updated_at', 'gadai_hp_id'];
                                        if (ignoreFields.includes(key) || !path) return null;

                                        const url = getFullUrl(path);
                                        return (
                                            <Grid item xs={6} sm={4} md={3} key={key}>
                                                <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mb: 0.5 }}>
                                                    {key.toUpperCase()}
                                                </Typography>
                                                <Box component="img" src={url}
                                                    sx={{ 
                                                        width: '100%', height: 120, objectFit: 'cover', 
                                                        borderRadius: 2, cursor: 'pointer', border: '1px solid #ddd',
                                                        "&:hover": { boxShadow: 3, transform: 'scale(1.02)' },
                                                        transition: '0.2s'
                                                    }}
                                                    onClick={() => setSelectedImage(url)}
                                                />
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </Paper>
                        )}

                        {/* 5. APPROVAL HISTORY */}
                        {approvals.length > 0 && (
                            <Paper sx={sectionPaperStyle}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>Riwayat Approval</Typography>
                                <Stack spacing={2}>
                                    {approvals.map((a, i) => (
                                        <Box key={i} sx={{ p: 2, borderLeft: `5px solid ${getStatusColor(a.status)}`, bgcolor: '#fcfcfc', borderRadius: '0 8px 8px 0', boxShadow: 1 }}>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="subtitle1" fontWeight={700}>{a.role.toUpperCase()}</Typography>
                                                <Typography variant="caption" color="text.secondary">{new Date(a.created_at).toLocaleString('id-ID')}</Typography>
                                            </Stack>
                                            <Typography variant="body2" sx={{ my: 0.5 }}>Oleh: <b>{a.user?.name}</b></Typography>
                                            <Chip label={a.status} size="small" sx={{ bgcolor: getStatusColor(a.status), color: '#fff', mb: 1 }} />
                                            <Typography variant="body2" sx={{ p: 1, bgcolor: '#fff', borderRadius: 1, border: '1px dashed #ccc' }}>
                                                Catatan: {a.catatan || "Tidak ada catatan"}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Paper>
                        )}

                    </Stack>
                </CardContent>
            </Card>

            <Dialog open={!!selectedImage} onClose={() => setSelectedImage("")} maxWidth="md" fullWidth>
                <DialogContent sx={{ p: 0, bgcolor: '#000', textAlign: 'center', position: 'relative' }}>
                    <IconButton 
                        onClick={() => setSelectedImage("")} 
                        sx={{ position: 'absolute', right: 10, top: 10, bgcolor: 'rgba(255,255,255,0.3)', '&:hover': { bgcolor: 'rgba(255,255,255,0.5)' } }}
                    >
                        <Close />
                    </IconButton>
                    <img src={selectedImage} style={{ maxWidth: '100%', maxHeight: '90vh', display: 'block', margin: 'auto' }} alt="Preview" />
                </DialogContent>
            </Dialog>
        </Box>  
    );
};

export default AdminDetailPage;