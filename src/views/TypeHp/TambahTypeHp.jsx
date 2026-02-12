import React, { useEffect, useState } from "react";
import {
    Card, CardHeader, CardContent, Divider, Button,
    TextField, Stack, CircularProgress, Typography, Grid, Paper, Box,
    useTheme, useMediaQuery, IconButton
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { CheckCircle as CheckCircleIcon, ArrowBackIos as BackIcon } from "@mui/icons-material";

const TambahTypeHp = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("auth_user"));
    const role = user?.role?.toLowerCase() || "";

    const getBaseApi = () => {
        if (role === "checker") return "/checker";
        if (role === "petugas") return "/petugas";
        return ""; 
    };

    const baseApi = getBaseApi();

    const [merkList, setMerkList] = useState([]);
    const [formData, setFormData] = useState({
        merk_hp_id: "",
        nama_type: "",
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchMerk = async () => {
            try {
                const res = await axiosInstance.get(`${baseApi}/merk-hp`);
                setMerkList(res.data.data || []);
            } catch (err) {
                alert("Gagal mengambil data merk.");
            } finally {
                setLoading(false);
            }
        };
        fetchMerk();
    }, [baseApi]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.merk_hp_id || !formData.nama_type) {
            alert("Harap pilih Merk dan isi Nama Type");
            return;
        }

        setSubmitting(true);
        try {
            const res = await axiosInstance.post(`${baseApi}/type-hp`, formData);
            if (res.data.success) {
                alert("Type HP berhasil ditambahkan");
                navigate("/type-hp");
            }
        } catch (err) {
            alert(err.response?.data?.message || "Gagal menyimpan data");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Stack alignItems="center" justifyContent="center" sx={{ height: "60vh" }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Memuat Data Merk...</Typography>
            </Stack>
        );
    }

    return (
        <Box sx={{ p: { xs: 1, md: 3 } }}>
            <Card sx={{ 
                maxWidth: 750, 
                margin: "0 auto", 
                borderRadius: { xs: 2, md: 3 }, 
                boxShadow: isMobile ? 1 : 6 
            }}>
                <CardHeader 
                    title={
                        <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="bold">
                            Tambah Type HP Baru
                        </Typography>
                    }
                    subheader={isMobile ? "Pilih merk & isi tipe" : "Pilih merk terlebih dahulu sebelum mengisi tipe"}
                    avatar={isMobile && (
                        <IconButton onClick={() => navigate("/type-hp")} size="small">
                            <BackIcon fontSize="small" />
                        </IconButton>
                    )}
                />
                <Divider />

                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Stack spacing={isMobile ? 3 : 4}>
                        <Box>
                            <Typography variant="caption" color="primary" fontWeight="bold" sx={{ mb: 1.5, display: 'block', letterSpacing: 1 }}>
                                STEP 1: PILIH MERK HP
                            </Typography>
                            <Grid container spacing={isMobile ? 1 : 2}>
                                {merkList.length > 0 ? (
                                    merkList.map((m) => (
                                        <Grid item xs={6} sm={4} key={m.id}>
                                            <Paper
                                                onClick={() => setFormData(prev => ({ ...prev, merk_hp_id: m.id }))}
                                                elevation={formData.merk_hp_id === m.id ? 3 : 0}
                                                sx={{
                                                    padding: isMobile ? 1.5 : 2.5,
                                                    textAlign: "center",
                                                    cursor: "pointer",
                                                    borderRadius: 2,
                                                    position: "relative",
                                                    border: "2px solid",
                                                    borderColor: formData.merk_hp_id === m.id ? "primary.main" : theme.palette.divider,
                                                    backgroundColor: formData.merk_hp_id === m.id ? "aliceblue" : "white",
                                                    transition: "all 0.2s ease",
                                                    "&:active": { transform: "scale(0.95)" }
                                                }}
                                            >
                                                {formData.merk_hp_id === m.id && (
                                                    <CheckCircleIcon 
                                                        color="primary" 
                                                        sx={{ position: "absolute", top: 4, right: 4, fontSize: 16 }} 
                                                    />
                                                )}
                                                <Typography 
                                                    variant={isMobile ? "body2" : "body1"} 
                                                    fontWeight={formData.merk_hp_id === m.id ? "bold" : "medium"}
                                                >
                                                    {m.nama_merk}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    ))
                                ) : (
                                    <Grid item xs={12}>
                                        <Typography color="error" variant="caption">Data merk tidak tersedia.</Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>

                        <Box>
                            <Typography variant="caption" color="primary" fontWeight="bold" sx={{ mb: 1.5, display: 'block', letterSpacing: 1 }}>
                                STEP 2: DETAIL TIPE
                            </Typography>
                            <TextField
                                label="Nama Type HP"
                                placeholder="Contoh: iPhone 15 Pro Max"
                                name="nama_type"
                                value={formData.nama_type}
                                onChange={(e) => setFormData(prev => ({ ...prev, nama_type: e.target.value }))}
                                fullWidth
                                variant="outlined"
                                autoComplete="off"
                                size={isMobile ? "small" : "medium"}
                            />
                        </Box>

                        <Stack direction={isMobile ? "column-reverse" : "row"} spacing={2} sx={{ pt: 2 }}>
                            <Button 
                                variant="outlined" 
                                fullWidth 
                                onClick={() => navigate("/type-hp")}
                                sx={{ borderRadius: 2, py: 1.2, textTransform: 'none' }}
                                color="inherit"
                            >
                                Batal
                            </Button>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleSubmit}
                                disabled={submitting || !formData.merk_hp_id || !formData.nama_type}
                                sx={{ borderRadius: 2, py: 1.2, fontWeight: "bold", textTransform: 'none' }}
                            >
                                {submitting ? <CircularProgress size={24} color="inherit" /> : "Simpan Unit"}
                            </Button>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
};

export default TambahTypeHp;