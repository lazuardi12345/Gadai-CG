import React, { useEffect, useState, useRef, useCallback } from "react";
import {
    Card, CardHeader, CardContent, Divider, Table, TableContainer,
    TableHead, TableBody, TableRow, TableCell, TablePagination,
    IconButton, Button, CircularProgress, Stack, Grid, Typography, Paper,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from "@mui/material";

import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    ArrowBackIosNew, ArrowForwardIos, Search as SearchIcon
} from "@mui/icons-material";

import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

const TypeHpPage = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("auth_user"));
    const role = (user?.role || "").toLowerCase();

    const getBaseApi = () => {
        if (role === "checker") return "/checker";
        if (role === "petugas") return "/petugas";
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

    // Modal Edit
    const [openEdit, setOpenEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ nama_type: "" });

    const handleOpenEdit = (item) => {
        setEditId(item.id);
        setForm({
            nama_type: item.nama_type,
            merk_hp_id: selectedMerk,
        });
        setOpenEdit(true);
    };

    const handleUpdate = async () => {
        try {
            await axiosInstance.put(`${baseApi}/type-hp/${editId}`, form);
            setOpenEdit(false);
            fetchTypes();
        } catch (error) {
            alert("Gagal update Type HP");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus?")) return;
        try {
            await axiosInstance.delete(`${baseApi}/type-hp/${id}`);
            fetchTypes();
        } catch {
            alert("Gagal menghapus Type HP");
        }
    };

    // Load Merk
    useEffect(() => {
        const loadMerk = async () => {
            try {
                const res = await axiosInstance.get(`${baseApi}/merk-hp`);
                const list = res.data.data || [];
                setMerkList(list);
                if (list.length > 0) setSelectedMerk(list[0].id);
            } catch {
                alert("Gagal mengambil data merk");
            } finally {
                setLoading(false);
            }
        };
        loadMerk();
    }, []);

    // Fetch Type by Merk (SERVER SIDE PAGINATION)
    const fetchTypes = useCallback(async () => {
        if (!selectedMerk) return;

        setTableLoading(true);
        try {
            const res = await axiosInstance.get(`${baseApi}/type-hp/by-merk/${selectedMerk}`, {
                params: {
                    page: page + 1,
                    limit: rowsPerPage,
                    search: searchType
                }
            });

            setTypeList(res.data.data || []);
            setTotalRows(res.data.total || 0);
        } catch {
            alert("Gagal mengambil data tipe HP");
        } finally {
            setTableLoading(false);
        }
    }, [selectedMerk, page, rowsPerPage, searchType]);

    useEffect(() => {
        fetchTypes();
    }, [fetchTypes]);

    if (loading) {
        return (
            <Grid container justifyContent="center" sx={{ height: "100vh" }}>
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
                    role !== "petugas" && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/type-hp/tambah")}>
                            Tambah Type
                        </Button>
                    )
                }
            />
            <Divider />

            <CardContent>
                <Stack direction="row" spacing={2} mb={2}>
                    <TextField
                        label="Cari Merk..."
                        size="small"
                        value={searchMerk}
                        onChange={(e) => setSearchMerk(e.target.value)}
                        sx={{ width: 250 }}
                        InputProps={{
                            startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />
                        }}
                    />

                    <TextField
                        label="Cari Type..."
                        size="small"
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                        sx={{ width: 250 }}
                        InputProps={{
                            startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />
                        }}
                    />
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <IconButton onClick={scrollLeft}><ArrowBackIosNew fontSize="small" /></IconButton>
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
                                sx={{ flexShrink: 0 }}
                            >
                                {m.nama_merk}
                            </Button>
                        ))}
                    </Stack>
                    <IconButton onClick={scrollRight}><ArrowForwardIos fontSize="small" /></IconButton>
                </Stack>

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
                                <TableRow><TableCell colSpan={3} align="center"><CircularProgress size={25} /></TableCell></TableRow>
                            ) : typeList.length === 0 ? (
                                <TableRow><TableCell colSpan={3} align="center">Tidak ada data</TableCell></TableRow>
                            ) : (
                                typeList.map((item, index) => (
                                    <TableRow key={item.id} hover>
                                        <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                                        <TableCell>{item.nama_type}</TableCell>

                                        {role !== "petugas" && (
                                            <TableCell align="center">
                                                <IconButton color="primary" onClick={() => handleOpenEdit(item)}>
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton color="error" onClick={() => handleDelete(item.id)}>
                                                    <DeleteIcon />
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

            <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
                <DialogTitle>Edit Type HP</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth label="Nama Type" margin="normal"
                        value={form.nama_type}
                        onChange={(e) => setForm({ ...form, nama_type: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEdit(false)}>Batal</Button>
                    <Button variant="contained" onClick={handleUpdate}>Simpan</Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default TypeHpPage;
