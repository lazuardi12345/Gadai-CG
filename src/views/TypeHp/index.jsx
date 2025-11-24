import React, { useEffect, useState, useCallback } from "react";
import {
    Card,
    CardHeader,
    CardContent,
    Divider,
    Table,
    TableContainer,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TablePagination,
    IconButton,
    Button,
    CircularProgress,
    Stack,
    Grid,
    Typography,
    Paper,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";

import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

const TypeHpPage = () => {
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
    const [selectedMerk, setSelectedMerk] = useState("");
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [openModal, setOpenModal] = useState(false);
    const [formData, setFormData] = useState({ merk_hp_id: "", nama_type: "" });
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // ========================
    // FETCH LIST MERK
    // ========================
    useEffect(() => {
        const fetchMerk = async () => {
            try {
                const res = await axiosInstance.get("/merk-hp");
                const list = res.data.data || [];
                setMerkList(list);
                if (list.length > 0) setSelectedMerk(list[0].id);
            } catch {
                alert("Gagal mengambil data merk");
            }
        };
        fetchMerk();
    }, []);

    // ========================
    // FETCH TYPE PER MERK
    // ========================
    const fetchData = useCallback(async () => {
        if (!selectedMerk) return;
        setTableLoading(true);
        try {
            const res = await axiosInstance.get(`${apiUrl}/by-merk/${selectedMerk}`);
            setData(res.data.data || []);
        } catch {
            alert("Gagal mengambil data Type HP");
        } finally {
            setLoading(false);
            setTableLoading(false);
        }
    }, [apiUrl, selectedMerk]);

    useEffect(() => { fetchData(); }, [selectedMerk, fetchData]);

    // ========================
    // MODAL & FORM
    // ========================
    const handleOpenModal = (item = null) => {
        if (item) {
            setFormData({ merk_hp_id: item.merk_hp_id, nama_type: item.nama_type });
            setEditingId(item.id);
        } else {
            setFormData({ merk_hp_id: "", nama_type: "" });
            setEditingId(null);
        }
        setOpenModal(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        const { merk_hp_id, nama_type } = formData;
        if (!merk_hp_id || !nama_type) return alert("Semua field wajib diisi");

        try {
            setSubmitting(true);
            if (editingId) {
                await axiosInstance.put(`${apiUrl}/${editingId}`, formData);
            } else {
                await axiosInstance.post(apiUrl, formData);
            }
            setOpenModal(false);
            fetchData();
        } catch {
            alert("Gagal menyimpan Type HP");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus?")) return;
        try {
            await axiosInstance.delete(`${apiUrl}/${id}`);
            fetchData();
        } catch {
            alert("Gagal menghapus Type HP");
        }
    };

    if (loading)
        return (
            <Grid container justifyContent="center" alignItems="center" sx={{ height: "100vh" }}>
                <CircularProgress />
            </Grid>
        );

    return (
        <Card sx={{ boxShadow: 4, borderRadius: 3 }}>
            <CardHeader
                title={<Typography variant="h6" sx={{ fontWeight: "bold" }}>Master Type HP</Typography>}
                action={
                    role !== "petugas" && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate("/type-hp/tambah")} // ← arahkan ke halaman tambah
                        >
                            Tambah Type
                        </Button>
                    )
                }
            />

            <Divider />

            <CardContent>
                {/* ======================== */}
                {/* TAB MERK */}
                {/* ======================== */}
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

                {/* ======================== */}
                {/* TABLE */}
                {/* ======================== */}
                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                    <Table>
                        <TableHead sx={{ background: "#fafafa" }}>
                            <TableRow>
                                <TableCell align="center"><b>No</b></TableCell>
                                <TableCell><b>Type HP</b></TableCell>
                                {role !== "petugas" && <TableCell align="center"><b>Aksi</b></TableCell>}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {tableLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        <CircularProgress size={25} />
                                    </TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">Tidak ada data</TableCell>
                                </TableRow>
                            ) : (
                                data
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((item, index) => (
                                        <TableRow hover key={item.id}>
                                            <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                                            <TableCell>{item.nama_type}</TableCell>
                                            {role !== "petugas" && (
                                                <TableCell align="center">
                                                    <Stack direction="row" spacing={1} justifyContent="center">
                                                        <IconButton color="primary" onClick={() => handleOpenModal(item)}>
                                                            <EditIcon />
                                                        </IconButton>
                                                        <IconButton color="error" onClick={() => handleDelete(item.id)}>
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
        </Card>
    );
};

export default TypeHpPage;
