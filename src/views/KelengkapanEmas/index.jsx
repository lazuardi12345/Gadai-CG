import React, { useEffect, useState, useCallback } from "react";
import {
    Card, CardHeader, CardContent, Divider, Table, TableContainer,
    TableHead, TableBody, TableRow, TableCell, TablePagination,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    Button, CircularProgress, Stack, Grid, Typography, TextField, Paper,
    Box, useTheme, useMediaQuery, Avatar // <-- Import Box, useTheme, useMediaQuery, & Avatar
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import axiosInstance from "api/axiosInstance";

const KelengkapanEmasPage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Deteksi Layar HP

    const user = JSON.parse(localStorage.getItem("auth_user"));
    const role = user?.role?.toLowerCase() || "";

    const getApiUrl = (role) => {
        switch (role) {
            case "checker": return "/checker/kelengkapan-emas";
            default: return "/kelengkapan-emas";
        }
    };

    const apiUrl = getApiUrl(role);

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [openModal, setOpenModal] = useState(false);
    const [formData, setFormData] = useState({ nama_kelengkapan: "" });
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        setTableLoading(true);
        try {
            const res = await axiosInstance.get(apiUrl);
            if (res.data.success) {
                setData(res.data.data || []);
            } else {
                setError("Gagal mengambil data");
            }
        } catch (err) {
            setError("Terjadi kesalahan server");
        } finally {
            setTableLoading(false);
            setLoading(false);
        }
    }, [apiUrl]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpenModal = (item = null) => {
        if (item) {
            setFormData({ nama_kelengkapan: item.nama_kelengkapan });
            setEditingId(item.id);
        } else {
            setFormData({ nama_kelengkapan: "" });
            setEditingId(null);
        }
        setOpenModal(true);
    };

    const handleSubmit = async () => {
        if (!formData.nama_kelengkapan.trim()) {
            alert("Nama kelengkapan wajib diisi");
            return;
        }

        try {
            setSubmitting(true);
            let res = editingId 
                ? await axiosInstance.put(`${apiUrl}/${editingId}`, formData)
                : await axiosInstance.post(apiUrl, formData);

            if (res.data.success) {
                setOpenModal(false);
                fetchData();
            }
        } catch (err) {
            alert("Terjadi kesalahan server");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus kelengkapan ini?")) return;
        try {
            const res = await axiosInstance.delete(`${apiUrl}/${id}`);
            if (res.data.success) fetchData();
        } catch (err) {
            alert("Gagal menghapus data");
        }
    };

    if (loading) return (
        <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
            <CircularProgress />
        </Box>
    );

    return (
        <Box sx={{ p: { xs: 1, md: 3 } }}>
            <Card sx={{ boxShadow: 3, borderRadius: { xs: 2, md: 3 } }}>
                <CardHeader
                    title={<Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="bold">Master Kelengkapan Emas</Typography>}
                    action={
                        <Button
                            variant="contained"
                            size={isMobile ? "small" : "medium"}
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenModal()}
                            sx={{ borderRadius: 2 }}
                        >
                            {isMobile ? "Tambah" : "Tambah Baru"}
                        </Button>
                    }
                />
                <Divider />
                <CardContent sx={{ p: { xs: 1, md: 2 } }}>
                    
                    {isMobile ? (
                        /* Tampilan MOBILE: Card Style */
                        <Stack spacing={1.5}>
                            {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, index) => (
                                <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: 12 }}>
                                                {page * rowsPerPage + index + 1}
                                            </Avatar>
                                            <Typography variant="body2" fontWeight="500">
                                                {item.nama_kelengkapan}
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={0.5}>
                                            <IconButton size="small" color="primary" onClick={() => handleOpenModal(item)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    ) : (
                        /* Tampilan DESKTOP: Tabel Style */
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead sx={{ background: "#f8fafc" }}>
                                    <TableRow>
                                        <TableCell align="center" width="70"><b>No</b></TableCell>
                                        <TableCell><b>Nama Kelengkapan</b></TableCell>
                                        <TableCell align="center" width="120"><b>Aksi</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, index) => (
                                        <TableRow hover key={item.id}>
                                            <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                                            <TableCell>{item.nama_kelengkapan}</TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={1} justifyContent="center">
                                                    <IconButton size="small" color="primary" onClick={() => handleOpenModal(item)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {data.length === 0 && (
                        <Typography variant="body2" align="center" sx={{ py: 3, color: 'text.secondary' }}>
                            Tidak ada data.
                        </Typography>
                    )}

                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={data.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_, p) => setPage(p)}
                        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        labelRowsPerPage={isMobile ? "Baris:" : "Baris per halaman:"}
                    />
                </CardContent>
            </Card>

            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: "bold" }}>
                    {editingId ? "Edit Kelengkapan" : "Tambah Kelengkapan"}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nama Kelengkapan"
                        fullWidth
                        variant="outlined"
                        value={formData.nama_kelengkapan}
                        onChange={(e) => setFormData({ ...formData, nama_kelengkapan: e.target.value })}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 0 }}>
                    <Button onClick={() => setOpenModal(false)} color="inherit">Batal</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? <CircularProgress size={22} /> : "Simpan"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default KelengkapanEmasPage;