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

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [openModal, setOpenModal] = useState(false);
    const [formData, setFormData] = useState({ nama_kelengkapan: "", nominal: "" });
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const formatRupiah = (number) => {
        if (!number || isNaN(number)) return "Rp 0";
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(number);
    };

    const fetchData = useCallback(async () => {
        setTableLoading(true);
        try {
            const res = await axiosInstance.get(apiUrl);
            if (res.data.success) {
                setData(res.data.data.items || res.data.data || []);
            } else {
                setError("Gagal mengambil data");
            }
        } catch (err) {
            setError("Terjadi kesalahan");
        } finally {
            setTableLoading(false);
            setLoading(false);
        }
    }, [apiUrl]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpenModal = (item = null) => {
        if (item) {
            setFormData({ nama_kelengkapan: item.nama_kelengkapan, nominal: item.nominal });
            setEditingId(item.id);
        } else {
            setFormData({ nama_kelengkapan: "", nominal: "" });
            setEditingId(null);
        }
        setOpenModal(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (name === "nominal") {
            const onlyNumbers = value.replace(/\D/g, "");
            setFormData(prev => ({ ...prev, nominal: onlyNumbers }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async () => {
        const { nama_kelengkapan, nominal } = formData;
        if (!nama_kelengkapan || nominal === "") {
            alert("Semua field wajib diisi");
            return;
        }

        try {
            setSubmitting(true);
            let res;
            if (editingId) {
                res = await axiosInstance.put(`${apiUrl}/${editingId}`, {
                    nama_kelengkapan,
                    nominal: Number(nominal),
                });
            } else {
                res = await axiosInstance.post(apiUrl, {
                    nama_kelengkapan,
                    nominal: Number(nominal),
                });
            }

            if (res.data.success) {
                setOpenModal(false);
                fetchData();
            } else {
                alert(res.data.message);
            }
        } catch (err) {
            alert("Terjadi kesalahan server");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus?")) return;
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
            <Grid container justifyContent="center" alignItems="center" sx={{ height: "100vh" }}>
                <CircularProgress />
            </Grid>
        );

    if (error) return <Typography color="error" align="center">{error}</Typography>;

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
                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                    <Table>
                        <TableHead sx={{ background: "#fafafa" }}>
                            <TableRow>
                                <TableCell align="center"><b>No</b></TableCell>
                                <TableCell><b>Nama Kelengkapan</b></TableCell>
                                <TableCell><b>Nominal</b></TableCell>
                                <TableCell align="center"><b>Aksi</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.length > 0 ? (
                                data
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((item, index) => (
                                        <TableRow hover key={item.id}>
                                            <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                                            <TableCell>{item.nama_kelengkapan}</TableCell>
                                            <TableCell>{formatRupiah(item.nominal)}</TableCell>
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
                                    <TableCell align="center" colSpan={4}>Tidak ada data</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={data.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </TableContainer>
            </CardContent>

            {/* MODAL */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
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
                        />
                        <TextField
                            label="Nominal (Rupiah)"
                            name="nominal"
                            value={formData.nominal}
                            onChange={handleFormChange}
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModal(false)}>Batal</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? <CircularProgress size={22} /> : "Simpan"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default KelengkapanPage;
