import React, { useEffect, useState, useCallback } from "react";
import {
    Card, CardHeader, CardContent, Divider,
    Table, TableContainer, TableHead, TableBody,
    TableRow, TableCell, TablePagination,
    IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, Button, CircularProgress,
    Stack, Grid, Typography, TextField, Paper
} from "@mui/material";

import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from "@mui/icons-material";

import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

const GradeHpPage = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("auth_user"));
    const role = user?.role?.toLowerCase() || "";

    const getApiUrl = () => {
        switch (role) {
            case "checker": return "/checker/grade-hp";
            case "petugas": return "/petugas/grade-hp";
            default: return "/grade-hp";
        }
    };
    const apiUrl = getApiUrl();

    const [merkList, setMerkList] = useState([]);
    const [selectedMerk, setSelectedMerk] = useState("");

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [openModal, setOpenModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        type_hp_id: "",
        harga_grade_a: "",
        harga_grade_b: "",
        harga_grade_c: ""
    });

    // =============================
    //  FETCH MERK HP
    // =============================
    useEffect(() => {
        const fetchMerk = async () => {
            try {
                const res = await axiosInstance.get("/merk-hp");
                const list = res.data.data || [];
                setMerkList(list);

                if (list.length > 0) {
                    setSelectedMerk(list[0].id);
                }
            } catch (err) {
                console.error(err);
                alert("Gagal mengambil data merk");
            }
        };

        fetchMerk();
    }, []);

    // =============================
    //  FETCH GRADE HP
    // =============================
    const fetchData = useCallback(async () => {
        if (!selectedMerk) return;

        setTableLoading(true);
        try {
            const res = await axiosInstance.get(`${apiUrl}/by-merk/${selectedMerk}`);
            const rows = Array.isArray(res.data.data) ? res.data.data : [];
            setData(rows);
        } catch (err) {
            console.error(err);
            alert("Gagal mengambil data grade");
        } finally {
            setTableLoading(false);
            setLoading(false);
        }
    }, [apiUrl, selectedMerk]);

    useEffect(() => {
        fetchData();
    }, [selectedMerk, fetchData]);

    // =============================
    //  FORMAT RUPIAH
    // =============================
    const formatRupiah = (value) => {
        if (!value) return "-";
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR"
        }).format(value);
    };

    // =============================
    //  OPEN MODAL ADD/EDIT
    // =============================
    const handleOpenModal = (item = null) => {
        if (item) {
            setFormData({
                type_hp_id: item.type_hp_id,
                harga_grade_a: item.harga_grade_a,
                harga_grade_b: item.harga_grade_b,
                harga_grade_c: item.harga_grade_c
            });
            setEditingId(item.id);
        } else {
            setFormData({
                type_hp_id: "",
                harga_grade_a: "",
                harga_grade_b: "",
                harga_grade_c: ""
            });
            setEditingId(null);
        }

        setOpenModal(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // =============================
    //  SUBMIT ADD / EDIT DATA
    // =============================
    const handleSubmit = async () => {
        if (!formData.type_hp_id ||
            !formData.harga_grade_a ||
            !formData.harga_grade_b ||
            !formData.harga_grade_c
        ) {
            return alert("Semua field wajib diisi!");
        }

        try {
            let res;

            if (editingId) {
                res = await axiosInstance.put(`${apiUrl}/${editingId}`, formData);
            } else {
                res = await axiosInstance.post(apiUrl, formData);
            }

            if (res.data.message) {
                setOpenModal(false);
                fetchData();
            }
        } catch (err) {
            console.error(err);
            alert("Gagal menyimpan data");
        }
    };

    // =============================
    //  DELETE DATA
    // =============================
    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus data ini?")) return;

        try {
            const res = await axiosInstance.delete(`${apiUrl}/${id}`);
            if (res.data.message) fetchData();
        } catch (err) {
            console.error(err);
            alert("Gagal menghapus data");
        }
    };

    // =============================
    //  LOADING VIEW
    // =============================
    if (loading) {
        return (
            <Grid container justifyContent="center" alignItems="center" sx={{ height: "100vh" }}>
                <CircularProgress />
            </Grid>
        );
    }

    return (
        <Card sx={{ boxShadow: 4, borderRadius: 3 }}>
            <CardHeader
                title={<Typography variant="h6" sx={{ fontWeight: "bold" }}>Master Grade HP</Typography>}
                action={
                    role !== "petugas" && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate("/grade-hp/tambah")}
                        >
                            Tambah Grade
                        </Button>
                    )
                }
            />

            <Divider />

            <CardContent>
                {/* ======================= MERK FILTER ======================= */}
                <Stack direction="row" spacing={1} mb={2}>
                    {merkList.map((m) => (
                        <Button
                            key={m.id}
                            variant={selectedMerk === m.id ? "contained" : "outlined"}
                            onClick={() => setSelectedMerk(m.id)}
                        >
                            {m.nama_merk}
                        </Button>
                    ))}
                </Stack>

                {/* ======================= TABLE ======================= */}
                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                    <Table>
                        <TableHead sx={{ background: "#f5f5f5" }}>
                            <TableRow>
                                <TableCell align="center"><b>No</b></TableCell>
                                <TableCell><b>Type</b></TableCell>
                                <TableCell><b>Grade A</b></TableCell>
                                <TableCell><b>Grade B</b></TableCell>
                                <TableCell><b>Grade C</b></TableCell>
                                {role !== "petugas" && (
                                    <TableCell align="center"><b>Aksi</b></TableCell>
                                )}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {tableLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <CircularProgress size={25} />
                                    </TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">Tidak ada data</TableCell>
                                </TableRow>
                            ) : (
                                data
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((item, index) => (
                                        <TableRow hover key={item.id}>
                                            <TableCell align="center">
                                                {page * rowsPerPage + index + 1}
                                            </TableCell>

                                            <TableCell>{item.type?.nama_type || "-"}</TableCell>
                                            <TableCell>{formatRupiah(item.harga_grade_a)}</TableCell>
                                            <TableCell>{formatRupiah(item.harga_grade_b)}</TableCell>
                                            <TableCell>{formatRupiah(item.harga_grade_c)}</TableCell>

                                            {role !== "petugas" && (
                                                <TableCell align="center">
                                                    <Stack direction="row" spacing={1} justifyContent="center">
                                                        <IconButton
                                                            color="primary"
                                                            onClick={() => handleOpenModal(item)}
                                                        >
                                                            <EditIcon />
                                                        </IconButton>

                                                        <IconButton
                                                            color="error"
                                                            onClick={() => handleDelete(item.id)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Stack>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                            )}
                        </TableBody>
                    </Table>

                    <TablePagination
                        component="div"
                        count={data.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                    />
                </TableContainer>
            </CardContent>

            {/* ======================= MODAL ADD / EDIT ======================= */}
            {role !== "petugas" && (
                <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: "bold" }}>
                        {editingId ? "Edit Grade HP" : "Tambah Grade HP"}
                    </DialogTitle>

                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField
                                label="Type HP ID"
                                name="type_hp_id"
                                value={formData.type_hp_id}
                                onChange={handleChange}
                                fullWidth
                            />

                            <TextField
                                label="Harga Grade A"
                                name="harga_grade_a"
                                type="number"
                                value={formData.harga_grade_a}
                                onChange={handleChange}
                                fullWidth
                            />

                            <TextField
                                label="Harga Grade B"
                                name="harga_grade_b"
                                type="number"
                                value={formData.harga_grade_b}
                                onChange={handleChange}
                                fullWidth
                            />

                            <TextField
                                label="Harga Grade C"
                                name="harga_grade_c"
                                type="number"
                                value={formData.harga_grade_c}
                                onChange={handleChange}
                                fullWidth
                            />
                        </Stack>
                    </DialogContent>

                    <DialogActions>
                        <Button onClick={() => setOpenModal(false)}>Batal</Button>
                        <Button variant="contained" onClick={handleSubmit}>Simpan</Button>
                    </DialogActions>
                </Dialog>
            )}
        </Card>
    );
};

export default GradeHpPage;
