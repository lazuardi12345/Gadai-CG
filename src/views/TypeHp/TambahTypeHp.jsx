import React, { useEffect, useState } from "react";
import {
    Card, CardHeader, CardContent, Divider, Button,
    TextField, Stack, CircularProgress, Typography, Grid, Paper
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axiosInstance from "api/axiosInstance";

const TambahTypeHp = () => {
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("auth_user"));
    const role = user?.role?.toLowerCase() || "";

    const getApiUrl = () => {
        switch (role) {
            case "checker": return "/checker/type-hp";
            case "petugas": return "/petugas/type-hp";
            case "hm":
            default: return "/type-hp";
        }
    };

    const apiUrl = getApiUrl();

    const [merkList, setMerkList] = useState([]);
    const [formData, setFormData] = useState({
        merk_hp_id: "",
        nama_type: "",
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Ambil list Merek HP
    useEffect(() => {
        const fetchMerk = async () => {
            try {
                const res = await axiosInstance.get("/merk-hp");
                setMerkList(res.data.data || []);
            } catch (err) {
                alert("Gagal mengambil data merk");
            } finally {
                setLoading(false);
            }
        };

        fetchMerk();
    }, []);

    const handleSubmit = async () => {
        if (!formData.merk_hp_id || !formData.nama_type) {
            alert("Semua field wajib diisi");
            return;
        }

        setSubmitting(true);
        try {
            const res = await axiosInstance.post(apiUrl, formData);
            if (res.data.message) {
                alert("Type HP berhasil ditambahkan");
                navigate("/type-hp");
            }
        } catch (err) {
            alert("Gagal menyimpan");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Stack alignItems="center" mt={5}>
                <CircularProgress />
            </Stack>
        );
    }

    return (
        <Card sx={{ maxWidth: 700, margin: "20px auto", borderRadius: 3, boxShadow: 4 }}>
            <CardHeader title="Tambah Type HP" />
            <Divider />

            <CardContent>
                <Stack spacing={3}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        Pilih Merk HP
                    </Typography>

                    {/* LIST MERK — BUKAN DROPDOWN */}
                    <Grid container spacing={2}>
                        {merkList.map((m) => (
                            <Grid item xs={6} sm={4} key={m.id}>
                                <Paper
                                    onClick={() =>
                                        setFormData(prev => ({ ...prev, merk_hp_id: m.id }))
                                    }
                                    sx={{
                                        padding: 2,
                                        textAlign: "center",
                                        cursor: "pointer",
                                        borderRadius: 2,
                                        border:
                                            formData.merk_hp_id === m.id
                                                ? "2px solid #1976d2"
                                                : "1px solid #ccc",
                                        transition: "0.2s",
                                        "&:hover": { border: "2px solid #1976d2" }
                                    }}
                                >
                                    <Typography fontWeight="bold">{m.nama_merk}</Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>

                    {/* INPUT NAMA TYPE */}
                    <TextField
                        label="Nama Type HP"
                        name="nama_type"
                        value={formData.nama_type}
                        onChange={(e) =>
                            setFormData(prev => ({ ...prev, nama_type: e.target.value }))
                        }
                        fullWidth
                    />

                    <Stack direction="row" spacing={2}>
                        <Button variant="outlined" fullWidth onClick={() => navigate("/type-hp")}>
                            Batal
                        </Button>

                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? <CircularProgress size={22} /> : "Simpan"}
                        </Button>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default TambahTypeHp;
