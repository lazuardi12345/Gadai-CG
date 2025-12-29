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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    CircularProgress,
    Stack,
    Grid,
    Typography,
    TextField,
    Paper,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import axiosInstance from "api/axiosInstance";

const KelengkapanPage = () => {
    // Ambil role user
    const user = JSON.parse(localStorage.getItem("auth_user"));
    const role = user?.role?.toLowerCase() || "";

    const getApiUrl = (role) => {
        switch (role) {
            case "checker": return "/checker/kelengkapan";
            case "hm":
            default: return "/kelengkapan";
        }
    };

    const apiUrl = getApiUrl(role);

    // States
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    const [error, setError] = useState(null);

    // Server-side Pagination States
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);

    const [openModal, setOpenModal] = useState(false);
    const [formData, setFormData] = useState({ nama_kelengkapan: "" });
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Fetch Data sesuai Pagination Backend
    const fetchData = useCallback(async () => {
        setTableLoading(true);
        try {
            // BE menggunakan page 1-based, MUI 0-based. Tambahkan per_page.
            const res = await axiosInstance.get(`${apiUrl}?page=${page + 1}&per_page=${rowsPerPage}`);
            if (res.data.success) {
                // Sesuai struktur BE: res.data.data.items
                setData(res.data.data.items || []);
                setTotalRows(res.data.data.total || 0);
            } else {
                setError("Gagal mengambil data");
            }
        } catch (err) {
            setError("Terjadi kesalahan koneksi");
            console.error(err);
        } finally {
            setTableLoading(false);
            setLoading(false);
        }
    }, [apiUrl, page, rowsPerPage]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        const { nama_kelengkapan } = formData;
        if (!nama_kelengkapan) {
            alert("Nama kelengkapan wajib diisi");
            return;
        }

        try {
            setSubmitting(true);
            let res;
            if (editingId) {
                res = await axiosInstance.put(`${apiUrl}/${editingId}`, { nama_kelengkapan });
            } else {
                res = await axiosInstance.post(apiUrl, { nama_kelengkapan });
            }

            if (res.data.success) {
                setOpenModal(false);
                fetchData();
            } else {
                alert(res.data.message);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Terjadi kesalahan server");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus data kelengkapan ini?")) return;
        try {
            const res = await axiosInstance.delete(`${apiUrl}/${id}`);
            if (res.data.success) fetchData();
        } catch (err) {
            alert("Gagal menghapus");
        }
    };

    const handleChangePage = (_, newPage) => setPage(newPage);
    
    const handleChangeRowsPerPage = (e) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

    if (loading)
        return (
            <Grid container justifyContent="center" alignItems="center" sx={{ height: "80vh" }}>
                <CircularProgress />
            </Grid>
        );

    if (error) return <Typography color="error" align="center" sx={{ mt: 5 }}>{error}</Typography>;

    return (
        <Card sx={{ boxShadow: 4, borderRadius: 3 }}>
            <CardHeader
                title={<Typography variant="h6" sx={{ fontWeight: "bold" }}>Master Kelengkapan</Typography>}
                action={
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenModal()}
                        sx={{ textTransform: "none", borderRadius: 2 }}
                    >
                        Tambah Kelengkapan
                    </Button>
                }
            />
            <Divider />

            <CardContent>
                <TableContainer component={Paper} sx={{ borderRadius: 2, position: 'relative' }}>
                    {tableLoading && (
                        <Stack alignItems="center" justifyContent="center" sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.7)', zIndex: 1 }}>
                            <CircularProgress size={30} />
                        </Stack>
                    )}
                    <Table>
                        <TableHead sx={{ background: "#fafafa" }}>
                            <TableRow>
                                <TableCell align="center" width="70"><b>No</b></TableCell>
                                <TableCell><b>Nama Kelengkapan</b></TableCell>
                                <TableCell align="center" width="150"><b>Aksi</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.length > 0 ? (
                                data.map((item, index) => (
                                    <TableRow hover key={item.id}>
                                        <TableCell align="center">
                                            {page * rowsPerPage + index + 1}
                                        </TableCell>
                                        <TableCell>{item.nama_kelengkapan}</TableCell>
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
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell align="center" colSpan={3}>Tidak ada data kelengkapan</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50]}
                        component="div"
                        count={totalRows}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </TableContainer>
            </CardContent>

            {/* MODAL FORM */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: "bold" }}>
                    {editingId ? "Edit Kelengkapan" : "Tambah Kelengkapan"}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Nama Kelengkapan"
                            name="nama_kelengkapan"
                            value={formData.nama_kelengkapan}
                            onChange={handleFormChange}
                            fullWidth
                            autoFocus
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenModal(false)}>Batal</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? <CircularProgress size={22} /> : "Simpan Data"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default KelengkapanPage;