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

const MerkHpGadaiPage = () => {

    // Ambil role user
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
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    const [error, setError] = useState(null);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [openModal, setOpenModal] = useState(false);
    const [formData, setFormData] = useState({ nama_merk: "" });
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Fetch data
    const fetchData = useCallback(async () => {
        setTableLoading(true);
        try {
            const res = await axiosInstance.get(apiUrl);

            if (res.data.success !== false) {
                setMerkData(res.data.data || []);
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

    // Open modal add / edit
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

    const handleFormChange = (e) => {
        setFormData({ nama_merk: e.target.value });
    };

    // Submit data
    const handleSubmit = async () => {
        const { nama_merk } = formData;

        if (!nama_merk.trim()) {
            alert("Nama merk wajib diisi");
            return;
        }

        try {
            setSubmitting(true);
            let res;

            if (editingId) {
                res = await axiosInstance.put(`${apiUrl}/${editingId}`, {
                    nama_merk,
                });
            } else {
                res = await axiosInstance.post(apiUrl, {
                    nama_merk,
                });
            }

            if (res.data.success !== false) {
                setOpenModal(false);
                fetchData();
            } else {
                alert(res.data.message || "Gagal menyimpan");
            }
        } catch (err) {
            alert("Terjadi kesalahan server");
        } finally {
            setSubmitting(false);
        }
    };

    // Delete
    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus?")) return;

        try {
            const res = await axiosInstance.delete(`${apiUrl}/${id}`);

            if (res.data.success !== false) {
                fetchData();
            } else {
                alert("Gagal menghapus");
            }
        } catch (err) {
            alert("Terjadi kesalahan server");
        }
    };

    // Pagination handler
    const handleChangePage = (_, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (e) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

    // Loading UI
    if (loading)
        return (
            <Grid container justifyContent="center" alignItems="center" sx={{ height: "100vh" }}>
                <CircularProgress />
            </Grid>
        );

    // Error
    if (error) return <Typography color="error" align="center">{error}</Typography>;

    return (
        <Card sx={{ boxShadow: 4, borderRadius: 3 }}>
            <CardHeader
                title={<Typography variant="h6" sx={{ fontWeight: "bold" }}>Master Merk HP</Typography>}
                action={
                    role !== "petugas" && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            sx={{ textTransform: "none", borderRadius: 2 }}
                            onClick={() => handleOpenModal()}
                        >
                            Tambah Merk
                        </Button>
                    )
                }
            />

            <Divider />

            <CardContent>
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
                            {merkData.length > 0 ? (
                                merkData
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((item, index) => (
                                        <TableRow hover key={item.id}>
                                            <TableCell align="center">
                                                {page * rowsPerPage + index + 1}
                                            </TableCell>
                                            <TableCell>{item.nama_merk}</TableCell>

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
                            ) : (
                                <TableRow>
                                    <TableCell align="center" colSpan={3}>
                                        Tidak ada data
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        count={merkData.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        component="div"
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </TableContainer>
            </CardContent>

            {/* MODAL */}
            {role !== "petugas" && (
                <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: "bold" }}>
                        {editingId ? "Edit Merk" : "Tambah Merk"}
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField
                                label="Nama Merk"
                                name="nama_merk"
                                value={formData.nama_merk}
                                onChange={handleFormChange}
                                fullWidth
                                autoFocus
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
            )}
        </Card>
    );
};

export default MerkHpGadaiPage;
