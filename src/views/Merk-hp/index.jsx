import React, { useEffect, useState, useCallback } from "react";
import {
    Card, CardHeader, CardContent, Divider, Table, TableContainer,
    TableHead, TableBody, TableRow, TableCell, TablePagination,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    Button, CircularProgress, Stack, Grid, Typography, TextField,
    Paper, InputAdornment
} from "@mui/material";

import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    Search as SearchIcon, Clear as ClearIcon
} from "@mui/icons-material";

import axiosInstance from "api/axiosInstance";

const MerkHpGadaiPage = () => {

    const user = JSON.parse(localStorage.getItem("auth_user"));
    const role = user?.role?.toLowerCase() || "";

    const getApiUrl = (role) => {
        switch (role) {
            case "checker": return "/checker/merk-hp";
            case "petugas": return "/petugas/merk-hp";
            case "hm":
            default: return "/merk-hp";
        }
    };

    const apiUrl = getApiUrl(role);

    const [merkData, setMerkData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [openModal, setOpenModal] = useState(false);
    const [formData, setFormData] = useState({ nama_merk: "" });
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Search
    const [search, setSearch] = useState("");

    // Fetch Data Merk
    const fetchData = useCallback(async () => {
        setTableLoading(true);
        try {
            const res = await axiosInstance.get(apiUrl);
            const list = res.data.data || [];
            setMerkData(list);
            setFilteredData(list);
        } catch {
            alert("Gagal mengambil data merk");
        } finally {
            setTableLoading(false);
            setLoading(false);
        }
    }, [apiUrl]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Search filter
    useEffect(() => {
        const keyword = search.toLowerCase();
        const filter = merkData.filter((item) =>
            item.nama_merk.toLowerCase().includes(keyword)
        );
        setFilteredData(filter);
        setPage(0);
    }, [search, merkData]);

    // Modal Handler
    const handleOpenModal = (merk = null) => {
        if (merk) {
            setFormData({ nama_merk: merk.nama_merk });
            setEditingId(merk.id);
        } else {
            setFormData({ nama_merk: "" });
            setEditingId(null);
        }
        setOpenModal(true);
    };

    const handleSubmit = async () => {
        if (!formData.nama_merk.trim()) return alert("Nama merk wajib diisi");

        try {
            setSubmitting(true);

            if (editingId) {
                await axiosInstance.put(`${apiUrl}/${editingId}`, { nama_merk: formData.nama_merk });
            } else {
                await axiosInstance.post(apiUrl, { nama_merk: formData.nama_merk });
            }

            setOpenModal(false);
            fetchData();
        } catch {
            alert("Gagal menyimpan data");
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
            alert("Gagal menghapus");
        }
    };

    // Pagination
    const handleChangePage = (_, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (e) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

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
                title={<Typography variant="h6" fontWeight="bold">Master Merk HP</Typography>}
                action={
                    role !== "petugas" && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
                            Tambah Merk
                        </Button>
                    )
                }
            />
            <Divider />

            <CardContent>

                {/* Search */}
                <TextField
                    fullWidth
                    placeholder="Cari Merk HP..."
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ mb: 2 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                        endAdornment: search && (
                            <InputAdornment position="end">
                                <IconButton onClick={() => setSearch("")}>
                                    <ClearIcon />
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />

                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                    <Table>
                        <TableHead sx={{ background: "#fafafa" }}>
                            <TableRow>
                                <TableCell align="center"><b>No</b></TableCell>
                                <TableCell><b>Nama Merk</b></TableCell>
                                {role !== "petugas" && (
                                    <TableCell align="center"><b>Aksi</b></TableCell>
                                )}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {tableLoading ? (
                                <TableRow><TableCell colSpan={3} align="center"><CircularProgress size={25} /></TableCell></TableRow>
                            ) : filteredData.length === 0 ? (
                                <TableRow><TableCell colSpan={3} align="center">Tidak ada data</TableCell></TableRow>
                            ) : (
                                filteredData
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((item, index) => (
                                        <TableRow hover key={item.id}>
                                            <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                                            <TableCell>{item.nama_merk}</TableCell>

                                            {role !== "petugas" && (
                                                <TableCell align="center">
                                                    <IconButton color="primary" onClick={() => handleOpenModal(item)}>
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
                        rowsPerPageOptions={[5, 10, 25]}
                        count={filteredData.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        component="div"
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </TableContainer>
            </CardContent>

            {/* MODAL */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
                <DialogTitle>{editingId ? "Edit Merk" : "Tambah Merk"}</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Nama Merk"
                        margin="normal"
                        value={formData.nama_merk}
                        onChange={(e) => setFormData({ nama_merk: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModal(false)}>Batal</Button>
                    <Button variant="contained" disabled={submitting} onClick={handleSubmit}>
                        {submitting ? <CircularProgress size={20} /> : "Simpan"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default MerkHpGadaiPage;
