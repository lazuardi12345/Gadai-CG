import React, { useEffect, useState, useRef, useCallback } from "react";
import {
    Card, CardHeader, CardContent, Divider, Table, TableContainer,
    TableHead, TableBody, TableRow, TableCell, TablePagination,
    IconButton, Button, CircularProgress, Stack, Grid, Typography, Paper,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip
} from "@mui/material";

import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    ArrowBackIosNew, ArrowForwardIos, Search as SearchIcon,
    CheckCircle as CheckCircleIcon, Cancel as CancelIcon
} from "@mui/icons-material";

import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

const TypeHpPage = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("auth_user"));
    const role = (user?.role || "").toLowerCase();
    
    // HM dan Checker boleh Edit/Hapus, Petugas hanya View
    const canManage = role === "hm" || role === "checker";

    const getBaseApi = () => {
        if (role === "checker") return "/checker";
        if (role === "petugas") return "/petugas";
        // Default untuk HM atau Admin jika tidak pakai prefix khusus di route-nya
        return ""; 
    };
    const baseApi = getBaseApi();

    const [merkList, setMerkList] = useState([]);
    const [selectedMerk, setSelectedMerk] = useState("");
    const [typeList, setTypeList] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchMerk, setSearchMerk] = useState("");
    const [searchType, setSearchType] = useState("");

    const scrollRef = useRef(null);
    const scrollLeft = () => scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
    const scrollRight = () => scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });

    const [openEdit, setOpenEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ nama_type: "", merk_hp_id: "" });

    // Load Merk HP
    useEffect(() => {
        const loadMerk = async () => {
            try {
                // Sesuai Route::apiResource('merk-hp', ...)
                const res = await axiosInstance.get(`${baseApi}/merk-hp`);
                const list = res.data.data || [];
                setMerkList(list);
                if (list.length > 0) setSelectedMerk(list[0].id);
            } catch {
                console.error("Gagal mengambil data merk");
            } finally {
                setLoading(false);
            }
        };
        loadMerk();
    }, [baseApi]);

    // Fetch Type by Merk (Laravel Pagination)
    const fetchTypes = useCallback(async () => {
        if (!selectedMerk) return;

        setTableLoading(true);
        try {
            // Sesuai route: GET /type-hp/by-merk/{merkId}
            const res = await axiosInstance.get(`${baseApi}/type-hp/by-merk/${selectedMerk}`, {
                params: {
                    page: page + 1, // Laravel mulai dari page 1
                    per_page: rowsPerPage, // Sesuai $request->get('per_page') di BE
                    search: searchType
                }
            });

            // Laravel Paginate Response: res.data.data
            setTypeList(res.data.data || []);
            setTotalRows(res.data.total || 0);
        } catch (error) {
            console.error("Gagal mengambil data tipe HP");
        } finally {
            setTableLoading(false);
        }
    }, [selectedMerk, page, rowsPerPage, searchType, baseApi]);

    useEffect(() => {
        fetchTypes();
    }, [fetchTypes]);

    const handleOpenEdit = (item) => {
        setEditId(item.id);
        setForm({
            nama_type: item.nama_type,
            merk_hp_id: item.merk_hp_id,
        });
        setOpenEdit(true);
    };

    const handleUpdate = async () => {
        try {
            await axiosInstance.put(`${baseApi}/type-hp/${editId}`, form);
            setOpenEdit(false);
            fetchTypes();
        } catch (error) {
            alert("Gagal update Type HP. Pastikan data valid.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus? Data harga terkait mungkin akan hilang.")) return;
        try {
            await axiosInstance.delete(`${baseApi}/type-hp/${id}`);
            fetchTypes();
        } catch {
            alert("Gagal menghapus Type HP");
        }
    };

    if (loading) {
        return (
            <Grid container justifyContent="center" alignItems="center" sx={{ height: "80vh" }}>
                <CircularProgress />
            </Grid>
        );
    }

    const filteredMerk = merkList.filter(m =>
        m.nama_merk.toLowerCase().includes(searchMerk.toLowerCase())
    );

    return (
        <Card sx={{ boxShadow: 4, borderRadius: 3 }}>
            <CardHeader
                title={<Typography variant="h6" fontWeight="bold">Master Type HP</Typography>}
                action={
                    canManage && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/type-hp/tambah")}>
                            Tambah Type
                        </Button>
                    )
                }
            />
            <Divider />

            <CardContent>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
                    <TextField
                        label="Cari Merk..."
                        size="small"
                        value={searchMerk}
                        onChange={(e) => setSearchMerk(e.target.value)}
                        sx={{ width: { xs: "100%", sm: 250 } }}
                        InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} /> }}
                    />

                    <TextField
                        label="Cari Type..."
                        size="small"
                        value={searchType}
                        onChange={(e) => {
                            setSearchType(e.target.value);
                            setPage(0); // Reset ke page 1 saat cari
                        }}
                        sx={{ width: { xs: "100%", sm: 250 } }}
                        InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} /> }}
                    />
                </Stack>

                {/* Merk Slider */}
                <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                    <IconButton onClick={scrollLeft} sx={{ bgcolor: "#eee" }}><ArrowBackIosNew fontSize="small" /></IconButton>
                    <Stack
                        ref={scrollRef}
                        direction="row"
                        spacing={1}
                        sx={{ overflowX: "auto", whiteSpace: "nowrap", flex: 1, py: 1, "&::-webkit-scrollbar": { display: "none" } }}
                    >
                        {filteredMerk.map((m) => (
                            <Button
                                key={m.id}
                                variant={selectedMerk === m.id ? "contained" : "outlined"}
                                onClick={() => {
                                    setSelectedMerk(m.id);
                                    setPage(0);
                                }}
                                sx={{ flexShrink: 0, borderRadius: 5 }}
                            >
                                {m.nama_merk}
                            </Button>
                        ))}
                    </Stack>
                    <IconButton onClick={scrollRight} sx={{ bgcolor: "#eee" }}><ArrowForwardIos fontSize="small" /></IconButton>
                </Stack>

                <TableContainer component={Paper} sx={{ borderRadius: 2, border: "1px solid #e0e0e0" }}>
                    <Table>
                        <TableHead sx={{ background: "#f5f5f5" }}>
                            <TableRow>
                                <TableCell align="center" width={70}><b>No</b></TableCell>
                                <TableCell><b>Type HP</b></TableCell>
                                <TableCell align="center"><b>Status Grade</b></TableCell>
                                {canManage && <TableCell align="center"><b>Aksi</b></TableCell>}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {tableLoading ? (
                                <TableRow><TableCell colSpan={4} align="center"><CircularProgress size={25} sx={{ my: 2 }} /></TableCell></TableRow>
                            ) : typeList.length === 0 ? (
                                <TableRow><TableCell colSpan={4} align="center">Tidak ada data tipe untuk merk ini</TableCell></TableRow>
                            ) : (
                                typeList.map((item, index) => (
                                    <TableRow key={item.id} hover>
                                        <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>{item.nama_type}</TableCell>
                                        <TableCell align="center">
                                            {/* Menggunakan logic has_grade dari transform BE */}
                                            {item.has_grade ? (
                                                <Chip icon={<CheckCircleIcon />} label="Grade Ready" color="success" size="small" variant="outlined" />
                                            ) : (
                                                <Chip icon={<CancelIcon />} label="No Grade" color="warning" size="small" variant="outlined" />
                                            )}
                                        </TableCell>

                                        {canManage && (
                                            <TableCell align="center">
                                                <IconButton color="primary" size="small" onClick={() => handleOpenEdit(item)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton color="error" size="small" onClick={() => handleDelete(item.id)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    <TablePagination
                        component="div"
                        count={totalRows}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_, p) => setPage(p)}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                    />
                </TableContainer>
            </CardContent>

            {/* Dialog Edit */}
            <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="xs">
                <DialogTitle>Edit Nama Type</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth 
                        label="Nama Type HP" 
                        margin="normal"
                        variant="outlined"
                        value={form.nama_type}
                        onChange={(e) => setForm({ ...form, nama_type: e.target.value })}
                        autoFocus
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenEdit(false)} color="inherit">Batal</Button>
                    <Button variant="contained" onClick={handleUpdate} disabled={!form.nama_type}>
                        Simpan Perubahan
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default TypeHpPage;