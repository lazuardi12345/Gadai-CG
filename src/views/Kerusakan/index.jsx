import React, { useEffect, useState, useCallback } from "react";
import {
    Card, CardHeader, CardContent, Divider, Table, TableContainer,
    TableHead, TableBody, TableRow, TableCell, TablePagination,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    Button, CircularProgress, Stack, Grid, Typography, TextField,
    Paper, InputAdornment, Box, useTheme, useMediaQuery, Avatar
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import axiosInstance from "api/axiosInstance";

const KerusakanPage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const user = JSON.parse(localStorage.getItem("auth_user"));
    const role = user?.role?.toLowerCase() || "";

    const getApiUrl = (role) => {
        switch (role) {
            case "checker": return "/checker/kerusakan";
            default: return "/kerusakan";
        }
    };

    const apiUrl = getApiUrl(role);

    const [kerusakanData, setKerusakanData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);

    const [openTambahModal, setOpenTambahModal] = useState(false);
    const [formData, setFormData] = useState({ nama_kerusakan: "", persen: "" });
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        setTableLoading(true);
        try {
            const res = await axiosInstance.get(`${apiUrl}?page=${page + 1}&per_page=${rowsPerPage}`);
            if (res.data.success) {
                setKerusakanData(res.data.data.items || []);
                setTotalRows(res.data.data.total || 0);
            } else {
                setError("Gagal mengambil data");
            }
        } catch (err) {
            setError("Terjadi kesalahan koneksi");
        } finally {
            setTableLoading(false);
            setLoading(false);
        }
    }, [apiUrl, page, rowsPerPage]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpenTambahModal = (kerusakan = null) => {
        if (kerusakan) {
            setFormData({ nama_kerusakan: kerusakan.nama_kerusakan, persen: kerusakan.persen });
            setEditingId(kerusakan.id);
        } else {
            setFormData({ nama_kerusakan: "", persen: "" });
            setEditingId(null);
        }
        setOpenTambahModal(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (name === "persen") {
            const val = value.replace(/[^0-9.]/g, "");
            if (val <= 100) setFormData(prev => ({ ...prev, persen: val }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async () => {
        const { nama_kerusakan, persen } = formData;
        if (!nama_kerusakan || persen === "") {
            alert("Semua field wajib diisi");
            return;
        }
        try {
            setSubmitting(true);
            const payload = { nama_kerusakan, persen: parseFloat(persen) };
            let res = editingId 
                ? await axiosInstance.put(`${apiUrl}/${editingId}`, payload)
                : await axiosInstance.post(apiUrl, payload);

            if (res.data.success) {
                setOpenTambahModal(false);
                fetchData();
            }
        } catch (err) {
            alert(err.response?.data?.message || "Kesalahan server");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus?")) return;
        try {
            await axiosInstance.delete(`${apiUrl}/${id}`);
            fetchData();
        } catch (err) {
            alert("Gagal menghapus");
        }
    };

    if (loading) return (
        <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
            <CircularProgress />
        </Box>
    );

    return (
        <Box sx={{ p: { xs: 1, md: 3 } }}>
            <Card sx={{ boxShadow: 4, borderRadius: 3 }}>
                <CardHeader
                    title={
                        <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontWeight: "bold" }}>
                            Master Kerusakan
                        </Typography>
                    }
                    action={
                        <Button
                            variant="contained"
                            size={isMobile ? "small" : "medium"}
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenTambahModal()}
                            sx={{ borderRadius: 2 }}
                        >
                            {isMobile ? "Tambah" : "Tambah Kerusakan"}
                        </Button>
                    }
                />
                <Divider />

                <CardContent sx={{ p: { xs: 1, md: 2 } }}>
                    {isMobile ? (
                        /* MOBILE VIEW: List Card */
                        <Stack spacing={2}>
                            {kerusakanData.map((item, index) => (
                                <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'error.light', fontSize: 14 }}>
                                                {page * rowsPerPage + index + 1}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {item.nama_kerusakan}
                                                </Typography>
                                                <Typography variant="caption" color="error.main" fontWeight="bold">
                                                    Potongan: {item.persen}%
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <Stack direction="row">
                                            <IconButton size="small" color="primary" onClick={() => handleOpenTambahModal(item)}>
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
                        /* DESKTOP VIEW: Table */
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, position: 'relative' }}>
                            {tableLoading && (
                                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.7)', zIndex: 1 }}>
                                    <CircularProgress size={30} />
                                </Box>
                            )}
                            <Table size="small">
                                <TableHead sx={{ background: "#f8fafc" }}>
                                    <TableRow>
                                        <TableCell align="center" width="70"><b>No</b></TableCell>
                                        <TableCell><b>Nama Kerusakan</b></TableCell>
                                        <TableCell align="center"><b>Potongan Harga (%)</b></TableCell>
                                        <TableCell align="center" width="120"><b>Aksi</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {kerusakanData.map((item, index) => (
                                        <TableRow hover key={item.id}>
                                            <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                                            <TableCell>{item.nama_kerusakan}</TableCell>
                                            <TableCell align="center">
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                                    {item.persen}%
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={1} justifyContent="center">
                                                    <IconButton size="small" color="primary" onClick={() => handleOpenTambahModal(item)}>
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

                    {kerusakanData.length === 0 && !tableLoading && (
                        <Typography variant="body2" align="center" sx={{ py: 3, color: 'text.secondary' }}>
                            Tidak ada data kerusakan.
                        </Typography>
                    )}

                    <TablePagination
                        component="div"
                        count={totalRows}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_, p) => setPage(p)}
                        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        labelRowsPerPage={isMobile ? "Baris:" : "Baris per halaman:"}
                    />
                </CardContent>
            </Card>

            {/* MODAL FORM */}
            <Dialog open={openTambahModal} onClose={() => setOpenTambahModal(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: "bold" }}>
                    {editingId ? "Edit Data Kerusakan" : "Tambah Data Kerusakan"}
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Nama Kerusakan"
                            name="nama_kerusakan"
                            value={formData.nama_kerusakan}
                            onChange={handleFormChange}
                            fullWidth
                            placeholder="Contoh: Layar Pecah"
                        />
                        <TextField
                            label="Besar Potongan"
                            name="persen"
                            value={formData.persen}
                            onChange={handleFormChange}
                            fullWidth
                            InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                            }}
                            helperText="Masukkan angka 0 - 100"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenTambahModal(false)} color="inherit">Batal</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? <CircularProgress size={22} /> : "Simpan Data"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default KerusakanPage;