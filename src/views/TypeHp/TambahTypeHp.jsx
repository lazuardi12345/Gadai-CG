import React, { useEffect, useState } from "react";
import {
    Card, CardHeader, CardContent, Divider, Button,
    TextField, Stack, CircularProgress, Typography, Grid, Paper, Box
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { CheckCircle as CheckCircleIcon } from "@mui/icons-material";

const TambahTypeHp = () => {
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("auth_user"));
    const role = user?.role?.toLowerCase() || "";

    // ================= BASE API SESUAI ROLE =================
    const getBaseApi = () => {
        if (role === "checker") return "/checker";
        if (role === "petugas") return "/petugas";
        // HM atau Admin biasanya menggunakan route tanpa prefix di file route Anda
        return ""; 
    };

    const baseApi = getBaseApi();

    // ================= STATE =================
    const [merkList, setMerkList] = useState([]);
    const [formData, setFormData] = useState({
        merk_hp_id: "",
        nama_type: "",
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // ========== FETCH MERK SESUAI ROLE ==============
    useEffect(() => {
        const fetchMerk = async () => {
            try {
                // Sesuai Route::apiResource('merk-hp', ...)
                const res = await axiosInstance.get(`${baseApi}/merk-hp`);
                setMerkList(res.data.data || []);
            } catch (err) {
                console.error(err);
                alert("Gagal mengambil data merk. Silakan coba lagi.");
            } finally {
                setLoading(false);
            }
        };

        fetchMerk();
    }, [baseApi]);

    // ============= SUBMIT =============
    const handleSubmit = async (e) => {
        e.preventDefault(); // Mencegah reload halaman

        if (!formData.merk_hp_id || !formData.nama_type) {
            alert("Harap pilih Merk dan isi Nama Type");
            return;
        }

        setSubmitting(true);
        try {
            // POST ke endpoint: /type-hp atau /checker/type-hp
            const res = await axiosInstance.post(`${baseApi}/type-hp`, formData);

            if (res.data.success) {
                alert(res.data.message || "Type HP berhasil ditambahkan");
                navigate("/type-hp");
            }
        } catch (err) {
            // Menangkap pesan error dari validasi Laravel (request->validate)
            const errorMsg = err.response?.data?.message || "Gagal menyimpan data";
            alert(errorMsg);
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
        <Card sx={{ maxWidth: 750, margin: "20px auto", borderRadius: 3, boxShadow: 6 }}>
            <CardHeader 
                title={<Typography variant="h6" fontWeight="bold">Tambah Type HP Baru</Typography>}
                subheader="Pilih merk terlebih dahulu sebelum mengisi tipe"
            />
            <Divider />

            <CardContent>
                <Stack spacing={4}>
                    <Box>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            STEP 1: PILIH MERK HP
                        </Typography>
                        <Grid container spacing={2}>
                            {merkList.length > 0 ? (
                                merkList.map((m) => (
                                    <Grid item xs={6} sm={4} key={m.id}>
                                        <Paper
                                            onClick={() => setFormData(prev => ({ ...prev, merk_hp_id: m.id }))}
                                            elevation={formData.merk_hp_id === m.id ? 4 : 1}
                                            sx={{
                                                padding: 2.5,
                                                textAlign: "center",
                                                cursor: "pointer",
                                                borderRadius: 3,
                                                position: "relative",
                                                border: "2px solid",
                                                borderColor: formData.merk_hp_id === m.id ? "primary.main" : "transparent",
                                                backgroundColor: formData.merk_hp_id === m.id ? "aliceblue" : "white",
                                                transition: "all 0.3s ease",
                                                "&:hover": { borderColor: "primary.light", transform: "translateY(-2px)" }
                                            }}
                                        >
                                            {formData.merk_hp_id === m.id && (
                                                <CheckCircleIcon 
                                                    color="primary" 
                                                    sx={{ position: "absolute", top: 5, right: 5, fontSize: 20 }} 
                                                />
                                            )}
                                            <Typography fontWeight={formData.merk_hp_id === m.id ? "bold" : "medium"}>
                                                {m.nama_merk}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                ))
                            ) : (
                                <Grid item xs={12}>
                                    <Typography color="error">Data merk tidak tersedia.</Typography>
                                </Grid>
                            )}
                        </Grid>
                    </Box>

                    <Box>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            STEP 2: DETAIL TIPE
                        </Typography>
                        <TextField
                            label="Nama Type HP"
                            placeholder="Contoh: iPhone 15 Pro Max atau Galaxy S24 Ultra"
                            name="nama_type"
                            value={formData.nama_type}
                            onChange={(e) => setFormData(prev => ({ ...prev, nama_type: e.target.value }))}
                            fullWidth
                            variant="outlined"
                            autoComplete="off"
                        />
                    </Box>

                    <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
                        <Button 
                            variant="outlined" 
                            fullWidth 
                            onClick={() => navigate("/type-hp")}
                            sx={{ borderRadius: 2, py: 1.2 }}
                            color="inherit"
                        >
                            Batal
                        </Button>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleSubmit}
                            disabled={submitting || !formData.merk_hp_id || !formData.nama_type}
                            sx={{ borderRadius: 2, py: 1.2, fontWeight: "bold" }}
                        >
                            {submitting ? <CircularProgress size={24} color="inherit" /> : "Simpan Data"}
                        </Button>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default TambahTypeHp;