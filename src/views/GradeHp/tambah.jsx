import React, { useEffect, useState, useRef, useCallback } from "react";
import {
    Card, CardHeader, CardContent, Divider, Button,
    TextField, Stack, CircularProgress, Typography,
    Grid, Paper
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axiosInstance from "api/axiosInstance";

const getApiUrl = (resource, type = "", id = "") => {
    const user = JSON.parse(localStorage.getItem("auth_user"));
    const role = (user?.role || "").toLowerCase();

    let base = "";
    switch (role) {
        case "checker": base = `/checker/${resource}`; break;
        case "petugas": base = `/petugas/${resource}`; break;
        case "hm":
        default: base = `/${resource}`;
    }

    if (type && id) return `${base}/${type}/${id}`;
    if (type) return `${base}/${type}`;
    return base;
};

const TambahGradeHp = () => {
    const navigate = useNavigate();
    const typeSectionRef = useRef(null);
    const searchTimeout = useRef(null);

    const [merkList, setMerkList] = useState([]);
    const [typeList, setTypeList] = useState([]);

    const [selectedMerk, setSelectedMerk] = useState("");
    const [selectedType, setSelectedType] = useState("");

    const [searchType, setSearchType] = useState("");

    const [formData, setFormData] = useState({
        type_hp_id: "",
        harga_grade_a: "",
        harga_grade_b: "",
        harga_grade_c: ""
    });

    const [loadingMerk, setLoadingMerk] = useState(true);
    const [loadingType, setLoadingType] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // GET MERK
    useEffect(() => {
        const fetchMerk = async () => {
            try {
                const res = await axiosInstance.get(getApiUrl("merk-hp"));
                setMerkList(res.data.data || []);
            } catch {
                alert("Gagal mengambil data merk");
            } finally {
                setLoadingMerk(false);
            }
        };
        fetchMerk();
    }, []);

    // FETCH TYPE (Debounce search)
    const fetchTypeByMerk = useCallback(async (merkId, searchText = "") => {
        if (!merkId) return;
        setLoadingType(true);

        try {
            const res = await axiosInstance.get(getApiUrl("type-hp", "by-merk", merkId), {
                params: { search: searchText, limit: 9999 }
            });

            const filtered = (res?.data?.data || []).filter(item => !item.has_grade);
            setTypeList(filtered);
        } catch {
            alert("Gagal mengambil data type HP");
        } finally {
            setLoadingType(false);
        }
    }, []);

    const handleSearchType = (value) => {
        setSearchType(value);
        clearTimeout(searchTimeout.current);

        searchTimeout.current = setTimeout(() => {
            fetchTypeByMerk(selectedMerk, value);
        }, 400); // Delay search
    };

    const handleSelectMerk = (merkId) => {
        setSelectedMerk(merkId);
        setSelectedType("");
        setFormData(prev => ({ ...prev, type_hp_id: "" }));
        setSearchType("");

        fetchTypeByMerk(merkId);

        setTimeout(() => {
            typeSectionRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 300);
    };

    const handleSelectType = (typeId) => {
        setSelectedType(typeId);
        setFormData(prev => ({ ...prev, type_hp_id: typeId }));
    };

    const handleSubmit = async () => {
        if (!formData.type_hp_id) return alert("Pilih type HP dulu!");
        if (!formData.harga_grade_a || !formData.harga_grade_b || !formData.harga_grade_c) {
            return alert("Semua harga grade wajib diisi!");
        }

        setSubmitting(true);
        try {
            await axiosInstance.post(getApiUrl("grade-hp"), formData);
            alert("Grade HP berhasil ditambahkan!");
            navigate("/grade-hp");
        } catch {
            alert("Gagal menyimpan grade");
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingMerk) {
        return (
            <Stack alignItems="center" mt={5}>
                <CircularProgress />
            </Stack>
        );
    }

    return (
        <Card sx={{ maxWidth: 700, margin: "20px auto", borderRadius: 3, boxShadow: 4 }}>
            <CardHeader title="Tambah Grade HP" />
            <Divider />
            <CardContent>
                <Stack spacing={3}>

                    {/* MERK */}
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
                                        border: selectedMerk === m.id ? "2px solid #1976d2" : "1px solid #ccc"
                                    }}
                                >
                                    <Typography fontWeight="bold">{m.nama_merk}</Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>

                    {/* TYPE */}
                    {selectedMerk && (
                        <div ref={typeSectionRef}>
                            <Typography fontWeight="bold" mt={2}>Pilih Type HP</Typography>

                            <TextField
                                placeholder="Cari type HP..."
                                size="small"
                                fullWidth
                                value={searchType}
                                onChange={(e) => handleSearchType(e.target.value)}
                                sx={{ mt: 1 }}
                            />

                            {loadingType ? (
                                <CircularProgress size={25} />
                            ) : typeList.length === 0 ? (
                                <Typography color="error" mt={1}>Tidak ada type tersedia</Typography>
                            ) : (
                                <Stack direction="row" spacing={2} sx={{ overflowX: "auto", py: 2 }}>
                                    {typeList.map((t) => (
                                        <Paper
                                            key={t.id}
                                            onClick={() => handleSelectType(t.id)}
                                            sx={{
                                                minWidth: 160,
                                                padding: 2,
                                                textAlign: "center",
                                                cursor: "pointer",
                                                borderRadius: 3,
                                                border: selectedType === t.id ? "2px solid #1976d2" : "1px solid #ccc",
                                                backgroundColor: selectedType === t.id ? "#E3F2FD" : "#fff"
                                            }}
                                        >
                                            <Typography fontWeight="bold">{t.nama_type}</Typography>
                                        </Paper>
                                    ))}
                                </Stack>
                            )}
                        </div>
                    )}

                    {/* FORM HARGA */}
                    {selectedType && (
                        <>
                            <Typography fontWeight="bold">Harga Grade</Typography>

                            <TextField label="Harga Grade A" type="number" fullWidth
                                value={formData.harga_grade_a}
                                onChange={(e) => setFormData(prev => ({ ...prev, harga_grade_a: e.target.value }))} />

                            <TextField label="Harga Grade B" type="number" fullWidth
                                value={formData.harga_grade_b}
                                onChange={(e) => setFormData(prev => ({ ...prev, harga_grade_b: e.target.value }))} />

                            <TextField label="Harga Grade C" type="number" fullWidth
                                value={formData.harga_grade_c}
                                onChange={(e) => setFormData(prev => ({ ...prev, harga_grade_c: e.target.value }))} />

                            <Stack direction="row" spacing={2} mt={2}>
                                <Button variant="outlined" fullWidth onClick={() => navigate("/grade-hp")}>Batal</Button>
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
