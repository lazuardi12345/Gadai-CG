import React, { useEffect, useState } from "react";
import {
    Card, CardHeader, CardContent, Divider, Button,
    TextField, Stack, CircularProgress, Typography,
    Grid, Paper
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axiosInstance from "api/axiosInstance";

const TambahGradeHp = () => {
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("auth_user"));
    const role = user?.role?.toLowerCase() || "";

    // =======================
    // API URL sesuai role
    // =======================
    const getApiUrl = () => {
        switch (role) {
            case "checker": return "/checker/grade-hp";
            case "petugas": return "/petugas/grade-hp";
            case "hm":
            default: return "/grade-hp";
        }
    };

    const getTypeUrl = (merkId) => {
        switch (role) {
            case "checker": return `/checker/type-hp/by-merk/${merkId}`;
            case "petugas": return `/petugas/type-hp/by-merk/${merkId}`;
            case "hm":
            default: return `/type-hp/by-merk/${merkId}`;
        }
    };

    const apiUrl = getApiUrl();

    const [merkList, setMerkList] = useState([]);
    const [typeList, setTypeList] = useState([]);
    const [selectedMerk, setSelectedMerk] = useState("");
    const [selectedType, setSelectedType] = useState("");
    const [formData, setFormData] = useState({
        type_hp_id: "",
        harga_grade_a: "",
        harga_grade_b: "",
        harga_grade_c: ""
    });

    const [loadingMerk, setLoadingMerk] = useState(true);
    const [loadingType, setLoadingType] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // =======================
    // FETCH MERK HP
    // =======================
    useEffect(() => {
        const fetchMerk = async () => {
            try {
                const res = await axiosInstance.get("/merk-hp");
                setMerkList(res.data.data || []);
            } catch {
                alert("Gagal mengambil data merk");
            } finally {
                setLoadingMerk(false);
            }
        };
        fetchMerk();
    }, []);

    // =======================
    // PILIH MERK DAN FETCH TYPE
    // =======================
    const handleSelectMerk = async (merkId) => {
        setSelectedMerk(merkId);
        setSelectedType("");
        setFormData(prev => ({ ...prev, type_hp_id: "" }));
        setLoadingType(true);

        try {
            const res = await axiosInstance.get(getTypeUrl(merkId));
            setTypeList(res.data.data || []);
        } catch {
            alert("Gagal mengambil data type HP");
        } finally {
            setLoadingType(false);
        }
    };

    const handleSelectType = (typeId) => {
        setSelectedType(typeId);
        setFormData(prev => ({ ...prev, type_hp_id: typeId }));
    };

    // =======================
    // SUBMIT GRADE
    // =======================
    const handleSubmit = async () => {
        if (!formData.type_hp_id) return alert("Pilih type HP dulu!");
        if (!formData.harga_grade_a || !formData.harga_grade_b || !formData.harga_grade_c) {
            return alert("Semua harga grade wajib diisi!");
        }

        setSubmitting(true);
        try {
            const res = await axiosInstance.post(apiUrl, formData);
            if (res.data.message) {
                alert("Grade HP berhasil ditambahkan!");
                navigate("/grade-hp");
            }
        } catch {
            alert("Gagal menyimpan grade");
        } finally {
            setSubmitting(false);
        }
    };

    // =======================
    // LOADING MERK
    // =======================
    if (loadingMerk) {
        return (
            <Stack alignItems="center" mt={5}>
                <CircularProgress />
            </Stack>
        );
    }

    // =======================
    // RENDER
    // =======================
    return (
        <Card sx={{ maxWidth: 700, margin: "20px auto", borderRadius: 3, boxShadow: 4 }}>
            <CardHeader title="Tambah Grade HP" />
            <Divider />
            <CardContent>
                <Stack spacing={3}>

                    {/* PILIH MERK */}
                    <Typography fontWeight="bold">Pilih Merk HP</Typography>
                    <Grid container spacing={2}>
                        {merkList.map((m) => (
                            <Grid item xs={6} sm={4} key={m.id}>
                                <Paper
                                    onClick={() => handleSelectMerk(m.id)}
                                    sx={{
                                        padding: 2,
                                        textAlign: "center",
                                        cursor: "pointer",
                                        borderRadius: 2,
                                        border: selectedMerk === m.id ? "2px solid #1976d2" : "1px solid #ccc",
                                        transition: "0.2s",
                                        "&:hover": { border: "2px solid #1976d2" }
                                    }}
                                >
                                    <Typography fontWeight="bold">{m.nama_merk}</Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>

                    {/* PILIH TYPE */}
                    {selectedMerk && (
                        <>
                            <Typography fontWeight="bold" mt={2}>Pilih Type HP</Typography>
                            {loadingType ? (
                                <CircularProgress size={25} />
                            ) : (
                                <Grid container spacing={2}>
                                    {typeList.map((t) => (
                                        <Grid item xs={6} sm={4} key={t.id}>
                                            <Paper
                                                onClick={() => handleSelectType(t.id)}
                                                sx={{
                                                    padding: 2,
                                                    textAlign: "center",
                                                    cursor: "pointer",
                                                    borderRadius: 2,
                                                    border: selectedType === t.id ? "2px solid #1976d2" : "1px solid #ccc",
                                                    transition: "0.2s",
                                                    "&:hover": { border: "2px solid #1976d2" }
                                                }}
                                            >
                                                <Typography fontWeight="bold">{t.nama_type}</Typography>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </>
                    )}

                    {/* FORM GRADE */}
                    {selectedType && (
                        <>
                            <Typography fontWeight="bold" mt={2}>Masukkan Harga Grade</Typography>
                            <TextField
                                label="Harga Grade A"
                                type="number"
                                value={formData.harga_grade_a}
                                onChange={(e) => setFormData(prev => ({ ...prev, harga_grade_a: e.target.value }))}
                                fullWidth
                            />
                            <TextField
                                label="Harga Grade B"
                                type="number"
                                value={formData.harga_grade_b}
                                onChange={(e) => setFormData(prev => ({ ...prev, harga_grade_b: e.target.value }))}
                                fullWidth
                            />
                            <TextField
                                label="Harga Grade C"
                                type="number"
                                value={formData.harga_grade_c}
                                onChange={(e) => setFormData(prev => ({ ...prev, harga_grade_c: e.target.value }))}
                                fullWidth
                            />

                            <Stack direction="row" spacing={2} mt={2}>
                                <Button variant="outlined" fullWidth onClick={() => navigate("/grade-hp")}>
                                    Batal
                                </Button>
                                <Button variant="contained" fullWidth onClick={handleSubmit} disabled={submitting}>
                                    {submitting ? <CircularProgress size={22} /> : "Simpan"}
                                </Button>
                            </Stack>
                        </>
                    )}

                </Stack>
            </CardContent>
        </Card>
    );
};

export default TambahGradeHp;
