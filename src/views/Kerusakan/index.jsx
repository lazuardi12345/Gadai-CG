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
    InputAdornment
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import axiosInstance from "api/axiosInstance";

const KerusakanPage = () => {
    // Ambil role user
    const user = JSON.parse(localStorage.getItem("auth_user"));
    const role = user?.role?.toLowerCase() || "";

    const getApiUrl = (role) => {
        switch (role) {
            case "checker": return "/checker/kerusakan";
            case "hm":
            default: return "/kerusakan";
        }
    };

    const apiUrl = getApiUrl(role);

    // States
    const [kerusakanData, setKerusakanData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Server-side Pagination States
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);

    const [openTambahModal, setOpenTambahModal] = useState(false);
    const [formData, setFormData] = useState({ nama_kerusakan: "", persen: "" });
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Fetch Data from Backend Pagination
    const fetchData = useCallback(async () => {
        setTableLoading(true);
        try {
            // BE menggunakan page 1-based, MUI 0-based
            const res = await axiosInstance.get(`${apiUrl}?page=${page + 1}&per_page=${rowsPerPage}`);
            if (res.data.success) {
                // Sesuai struktur BE: res.data.data.items
                setKerusakanData(res.data.data.items || []);
                setTotalRows(res.data.data.total || 0);
            } else {
                setError("Gagal mengambil data");
            }
        } catch (err) {
            setError("Terjadi kesalahan koneksi ke server");
            console.error(err);
        } finally {
            setTableLoading(false);
            setLoading(false);
        }
    }, [apiUrl, page, rowsPerPage]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenTambahModal = (kerusakan = null) => {
        if (kerusakan) {
            setFormData({ 
                nama_kerusakan: kerusakan.nama_kerusakan, 
                persen: kerusakan.persen 
            });
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
            // Hanya angka dan desimal, max 100
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
            const payload = {
                nama_kerusakan,
                persen: parseFloat(persen),
            };

            let res;
            if (editingId) {
                res = await axiosInstance.put(`${apiUrl}/${editingId}`, payload);
            } else {
                res = await axiosInstance.post(apiUrl, payload);
            }

            if (res.data.success) {
                setOpenTambahModal(false);
                fetchData();
            } else {
                alert(res.data.message || "Gagal menyimpan");
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Terjadi kesalahan server";
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus data kerusakan ini?")) return;

        try {
            const res = await axiosInstance.delete(`${apiUrl}/${id}`);
            if (res.data.success) fetchData();
        } catch (err) {
            alert("Gagal menghapus data");
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
                title={<Typography variant="h6" sx={{ fontWeight: "bold" }}>Master Kerusakan (Sistem Persentase)</Typography>}
                action={
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenTambahModal()}
                        sx={{ textTransform: "none", borderRadius: 2 }}
                    >
                        Tambah Kerusakan
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
                                <TableCell><b>Nama Kerusakan</b></TableCell>
                                <TableCell align="center"><b>Potongan Harga (%)</b></TableCell>
                                <TableCell align="center"><b>Aksi</b></TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {kerusakanData.length > 0 ? (
                                kerusakanData.map((item, index) => (
                                    <TableRow hover key={item.id}>
                                        <TableCell align="center">
                                            {page * rowsPerPage + index + 1}
                                        </TableCell>
                                        <TableCell>{item.nama_kerusakan}</TableCell>
                                        <TableCell align="center">
                                            <Typography sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                                {item.persen}%
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center">
                                                <IconButton color="primary" onClick={() => handleOpenTambahModal(item)}>
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
                                    <TableCell align="center" colSpan={4}>Tidak ada data kerusakan</TableCell>
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
            <Dialog open={openTambahModal} onClose={() => setOpenTambahModal(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: "bold" }}>
                    {editingId ? "Edit Data Kerusakan" : "Tambah Data Kerusakan"}
                </DialogTitle>
                <DialogContent>
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
                            helperText="Nilai 0 - 100"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenTambahModal(false)}>Batal</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? <CircularProgress size={22} /> : "Simpan Data"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default KerusakanPage;