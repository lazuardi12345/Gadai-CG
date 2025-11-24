import React, { useEffect, useState, useContext } from "react";
import {
    Card, CardHeader, CardContent, Grid, Typography, Stack,
    Button, CircularProgress, Box, TextField, FormGroup, FormControlLabel, Checkbox
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { AuthContext } from "AuthContex/AuthContext";

// Helper: full URL dokumen
const getFullDokumenUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "");
    return path.startsWith("storage/") ? `${baseUrl}/${path}` : `${baseUrl}/storage/${path}`;
};

const KELENGKAPAN_LIST = ["Box", "Charger", "Kabel Data", "Kartu Garansi", "Tusuk SIM"];

const EditGadaiHpPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const userRole = (user?.role || "").toLowerCase();
    const canEdit = ["hm", "checker"].includes(userRole);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        nama_barang: "",
        kelengkapan: [],
        kerusakan: [],
        grade_type: "",
        grade_nominal: "",
        imei: "",
        warna: "",
        kunci_password: "",
        kunci_pin: "",
        kunci_pola: "",
        ram: "",
        rom: "",
        type_hp: "",
        merk: "",
        detail_gadai_id: "",
        dokumen_pendukung: {},
    });

    // Ambil data awal
    const fetchData = async () => {
        setLoading(true);
        try {
            const url = userRole === "checker" ? `/checker/gadai-hp/${id}` : `/gadai-hp/${id}`;
            const res = await axiosInstance.get(url);
            if (!res.data.success) throw new Error(res.data.message || "Gagal ambil data");
            const d = res.data.data;

            // Ambil daftar kerusakan default
            const kerRes = await axiosInstance.get("/kerusakan");
            const defaultKerusakanList = kerRes.data?.data?.items || kerRes.data?.data || [];


            const kerusakanMap = {};
            if (Array.isArray(d.kerusakan)) {
                d.kerusakan.forEach(k => {
                    kerusakanMap[k.id] = k.pivot?.nominal_override ?? k.nominal ?? 0;
                });
            }

            const kerusakanArray = defaultKerusakanList.map(k => {
                const overrideNominal = kerusakanMap[k.id];

                return {
                    id: k.id,
                    nama_kerusakan: k.nama_kerusakan || k.nama,
                    nominal_default: k.nominal ?? 0,
                    nominal: overrideNominal ?? k.nominal ?? 0,
                    checked: overrideNominal !== undefined,
                };
            });



            let kelengkapanArray = [];
            try { kelengkapanArray = d.kelengkapan ? JSON.parse(d.kelengkapan) : []; } catch { kelengkapanArray = []; }

            const dokumenPendukung = {};
            if (d.dokumen_pendukung) {
                const dok = typeof d.dokumen_pendukung === "string" ? JSON.parse(d.dokumen_pendukung) : d.dokumen_pendukung;
                Object.entries(dok).forEach(([k, val]) => {
                    dokumenPendukung[k] = val
                        ? { file: null, url: getFullDokumenUrl(val), remove: false }
                        : { file: null, url: null, remove: false };
                });
            }

            setForm(prev => ({
                ...prev,
                ...d,
                kelengkapan: kelengkapanArray,
                kerusakan: kerusakanArray,
                dokumen_pendukung: dokumenPendukung,
            }));
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [id, userRole]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (field, value) => {
        setForm(prev => {
            const newArray = prev[field].includes(value)
                ? prev[field].filter(i => i !== value)
                : [...prev[field], value];
            return { ...prev, [field]: newArray };
        });
    };

    const handleDokumenChange = (key, file) => {
        setForm(prev => ({
            ...prev,
            dokumen_pendukung: {
                ...prev.dokumen_pendukung,
                [key]: file
                    ? { file, url: URL.createObjectURL(file), remove: false }
                    : { ...prev.dokumen_pendukung[key], file: null, url: null, remove: true },
            },
        }));
    };

    const toggleKerusakan = (idx) => {
        setForm(prev => {
            const ker = [...prev.kerusakan];
            ker[idx].checked = !ker[idx].checked;
            if (!ker[idx].checked) ker[idx].nominal = ker[idx].nominal_default;
            return { ...prev, kerusakan: ker };
        });
    };

    const handleNominalChange = (idx, value) => {
        setForm(prev => {
            const ker = [...prev.kerusakan];
            ker[idx].nominal = Number(value);
            return { ...prev, kerusakan: ker };
        });
    };

    const handleSubmit = async () => {
        try {
            setSaving(true);
            const data = new FormData();
            data.append("_method", "PUT");

            // Fields
            ["nama_barang", "grade_type", "grade_nominal", "imei", "warna", "kunci_password", "kunci_pin", "kunci_pola", "ram", "rom", "type_hp", "merk", "detail_gadai_id"]
                .forEach(key => { if (form[key] && form[key] !== "null") data.append(key, form[key]); });

            // Kelengkapan
            form.kelengkapan.forEach((item, i) => data.append(`kelengkapan[${i}]`, item));


            let index = 0;
            form.kerusakan.forEach(k => {
                if (k.checked && k.id) {
                    data.append(`kerusakan[${index}][id]`, k.id);
                    data.append(`kerusakan[${index}][nominal_override]`, Number(k.nominal) || 0);
                    index++;
                }
            });



            // Dokumen
            Object.entries(form.dokumen_pendukung).forEach(([key, val]) => {
                if (val?.file instanceof File) data.append(`dokumen_pendukung[${key}]`, val.file);
                if (val?.remove) data.append(`dokumen_pendukung_remove[${key}]`, '1');
            });

            const url = userRole === "checker" ? `/checker/gadai-hp/${id}` : `/gadai-hp/${id}`;
            const res = await axiosInstance.post(url, data, { headers: { "Content-Type": "multipart/form-data" } });

            if (res.data.success) {
                alert("Data berhasil diperbarui!");
                navigate(-1);
            } else {
                alert(res.data.message || "Gagal menyimpan");
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan saat menyimpan data");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <Stack alignItems="center" justifyContent="center" sx={{ height: "80vh" }}>
            <CircularProgress />
        </Stack>
    );

    return (
        <Card sx={{ maxWidth: 1000, mx: "auto", mt: 2, p: 2 }}>
            <CardHeader title="Edit Gadai HP" />
            <CardContent>

                {/* Informasi HP */}
                <Typography variant="h6" fontWeight={600} gutterBottom>Informasi HP</Typography>
                <Grid container spacing={2}>
                    {["nama_barang", "grade_type", "grade_nominal", "imei", "warna", "ram", "rom", "kunci_pin"].map(key => (
                        <Grid item xs={12} sm={6} key={key}>
                            <TextField
                                label={key.replace(/_/g, ' ').toUpperCase()}
                                name={key}
                                value={form[key]}
                                onChange={handleInputChange}
                                fullWidth
                            />
                        </Grid>
                    ))}
                </Grid>

                {/* Kelengkapan */}
                <Box sx={{ mt: 2 }}>
                    <Typography>Kelengkapan:</Typography>
                    <FormGroup row>
                        {KELENGKAPAN_LIST.map(item => (
                            <FormControlLabel
                                key={item}
                                control={<Checkbox checked={form.kelengkapan.includes(item)} onChange={() => handleCheckboxChange("kelengkapan", item)} />}
                                label={item}
                            />
                        ))}
                    </FormGroup>
                </Box>

                {/* Kerusakan */}
                <Box sx={{ mt: 2 }}>
                    <Typography>Kerusakan:</Typography>
                    {form.kerusakan.map((k, idx) => (
                        <Stack key={idx} direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                            <Checkbox checked={k.checked} onChange={() => toggleKerusakan(idx)} disabled={!canEdit} />
                            <Typography sx={{ minWidth: 200 }}>{k.nama_kerusakan}</Typography>
                            <TextField
                                type="number"
                                size="small"
                                value={k.nominal}
                                disabled={!k.checked || !canEdit}
                                onChange={e => handleNominalChange(idx, e.target.value)}
                            />
                        </Stack>
                    ))}
                </Box>

                {/* Dokumen Pendukung */}
                {Object.keys(form.dokumen_pendukung || {}).length > 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="h6">Dokumen Pendukung</Typography>
                        <Grid container spacing={2}>
                            {Object.entries(form.dokumen_pendukung).map(([key, val]) => (
                                <Grid item xs={12} sm={4} key={key}>
                                    <Typography sx={{ mb: 1 }}>{key.replace(/_/g, " ").toUpperCase()}</Typography>
                                    {val?.url ? (
                                        <Box component="img" src={val.url} alt={key} sx={{ width: "100%", maxHeight: 150, objectFit: "contain", mb: 1 }} />
                                    ) : <Typography variant="body2" color="text.secondary">Belum ada dokumen</Typography>}
                                    <Stack direction="row" spacing={1}>
                                        <Button variant="contained" component="label" size="small" disabled={!canEdit}>
                                            Upload
                                            <input type="file" hidden onChange={e => handleDokumenChange(key, e.target.files[0])} />
                                        </Button>
                                        {val?.url && canEdit && (
                                            <Button variant="outlined" color="error" size="small" onClick={() => handleDokumenChange(key, null)}>Hapus</Button>
                                        )}
                                    </Stack>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}

                {/* Actions */}
                <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 4 }}>
                    <Button variant="outlined" onClick={() => navigate(-1)}>Batal</Button>
                    {canEdit && <Button variant="contained" color="primary" disabled={saving} onClick={handleSubmit}>{saving ? "Menyimpan..." : "Update"}</Button>}
                </Stack>

            </CardContent>
        </Card>
    );
};

export default EditGadaiHpPage;
