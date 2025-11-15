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
import { useNavigate } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import PhotoIcon from "@mui/icons-material/Photo";
import VisibilityIcon from "@mui/icons-material/Visibility";
import axiosInstance from "api/axiosInstance";

const DataNasabahPage = () => {
    const navigate = useNavigate();

    // Dapatkan data user dari localStorage
    const user = JSON.parse(localStorage.getItem("auth_user"));
    const role = user?.role?.toLowerCase() || "";

    // Tentukan URL API otomatis berdasarkan role
    const getApiUrl = (resource, role) => {
        switch (role) {
            case "petugas":
                return `/petugas/${resource}`;
            case "checker":
                return `/checker/${resource}`;
            case "hm":
            default:
                return `/${resource}`;
        }
    };

    const apiUrl = getApiUrl("data-nasabah", role);


    const [nasabahData, setNasabahData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [openModal, setOpenModal] = useState(false);
    const [modalFotoSrc, setModalFotoSrc] = useState("");

    const [openTambahModal, setOpenTambahModal] = useState(false);

    // REVISI 1: Tambahkan 'no_rek' ke state formData
    const [formData, setFormData] = useState({
        nama_lengkap: "",
        nik: "",
        alamat: "",
        no_hp: "",
        no_rek: "", // <-- Tambah No Rek
        foto_ktp: null,
    });
    const [submitting, setSubmitting] = useState(false);

    // Fetch data
    const fetchData = useCallback(async () => {
        setTableLoading(true);
        try {
            const res = await axiosInstance.get(apiUrl, { params: { search: searchTerm } });
            if (res.data.success) {
                // Pastikan menggunakan properti 'data' jika API mengembalikan data dalam format paginated
                const items = res.data.data.data || res.data.data || [];
                setNasabahData(items);
            }
            else setError(res.data.message || "Gagal mengambil data");
        } catch (err) {
            setError(err.message || "Terjadi kesalahan server");
        } finally {
            setLoading(false);
            setTableLoading(false);
        }
    }, [apiUrl, searchTerm]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleChangePage = (_, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };
    const handleSearchChange = (e) => setSearchTerm(e.target.value);

    const handleOpenModal = (fotoUrl) => { setModalFotoSrc(fotoUrl); setOpenModal(true); };

    const handleOpenTambahModal = () => {
        // Reset form data saat modal dibuka
        setFormData({
            nama_lengkap: "",
            nik: "",
            alamat: "",
            no_hp: "",
            no_rek: "", // <-- Reset No Rek
            foto_ktp: null
        });
        setOpenTambahModal(true);
    };

    const handleFormChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "foto_ktp") setFormData(prev => ({ ...prev, foto_ktp: files[0] }));
        else setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        // REVISI 2: Tambahkan no_rek ke destructuring dan validasi lokal
        const { nama_lengkap, nik, alamat, no_hp, no_rek, foto_ktp } = formData;

        // Asumsi: no_rek bersifat nullable (tidak wajib diisi) sesuai migrasi yang Anda buat
        if (!nama_lengkap || !nik || !alamat || !no_hp || !foto_ktp) {
            // Jika foto_ktp wajib:
            if (!foto_ktp) return alert("Semua field wajib diisi, termasuk Foto KTP.");
            // Jika Anda ingin nama, nik, alamat, dan no_hp wajib:
            if (!nama_lengkap || !nik || !alamat || !no_hp) return alert("Nama, NIK, Alamat, dan No HP wajib diisi.");
        }

        const fd = new FormData();
        fd.append("nama_lengkap", nama_lengkap);
        fd.append("nik", nik);
        fd.append("alamat", alamat);
        fd.append("no_hp", no_hp);
        fd.append("no_rek", no_rek); // <-- REVISI 3: Tambahkan no_rek ke FormData
        if (foto_ktp) fd.append("foto_ktp", foto_ktp);

        try {
            setSubmitting(true);
            const res = await axiosInstance.post(apiUrl, fd, { headers: { "Content-Type": "multipart/form-data" } });
            if (res.data.success) {
                setOpenTambahModal(false);
                fetchData();
            }
            else {
                // Menangani error dari backend, termasuk error validasi
                const errorMessage = res.data.errors ? Object.values(res.data.errors).flat().join('\n') : (res.data.message || "Gagal menambahkan nasabah");
                alert(errorMessage);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "Terjadi kesalahan server";
            alert(errorMessage);
        } finally { setSubmitting(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus data ini?")) return;
        try {
            const res = await axiosInstance.delete(`${apiUrl}/${id}`);
            if (res.data.success) fetchData();
            else alert(res.data.message || "Gagal menghapus data");
        } catch (err) { alert(err.message || "Terjadi kesalahan server"); }
    };

    if (loading) return (<Grid container justifyContent="center" alignItems="center" sx={{ height: "100vh" }}><CircularProgress /></Grid>);
    if (error) return (<Typography color="error" align="center" sx={{ mt: 2 }}>{error}</Typography>);

    return (
        <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
            <CardHeader
                title={<Typography variant="h6">Data Nasabah</Typography>}
                // Hanya izinkan Petugas dan HM/Admin menambah data
                action={role !== "checker" && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenTambahModal}>
                        Tambah
                    </Button>
                )}
            />
            <Divider />
            <CardContent>
                <Stack direction="row" spacing={1} mb={2}>
                    <TextField size="small" placeholder="Cari nasabah..." value={searchTerm} onChange={handleSearchChange} />
                    <Button variant="contained" onClick={fetchData} disabled={tableLoading}>
                        {tableLoading ? <CircularProgress size={20} color="inherit" /> : "Cari"}
                    </Button>
                </Stack>

                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                            <TableRow>
                                {/* REVISI 4: Tambahkan 'No Rek' ke header tabel */}
                                {["No", "Nama Lengkap", "NIK", "Alamat", "No HP", "No Rek", "Foto", "Aksi"].map(head => (
                                    <TableCell key={head} align="center"><b>{head}</b></TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(rowsPerPage > 0
                                ? nasabahData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                : nasabahData
                            ).map((nasabah, index) => (
                                <TableRow key={nasabah.id} hover>
                                    <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                                    <TableCell>{nasabah.nama_lengkap}</TableCell>
                                    <TableCell>{nasabah.nik}</TableCell>
                                    <TableCell>{nasabah.alamat}</TableCell>
                                    <TableCell>{nasabah.no_hp}</TableCell>
                                    <TableCell>{nasabah.no_rek || '-'}</TableCell> {/* REVISI 5: Tampilkan No Rek */}
                                    <TableCell align="center">
                                        <IconButton color="primary" onClick={() => handleOpenModal(nasabah.foto_ktp)} disabled={!nasabah.foto_ktp}>
                                            <PhotoIcon />
                                        </IconButton>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={0.5} justifyContent="center">
                                            <IconButton color="secondary" onClick={() => navigate(`/detail-nasabah/${nasabah.id}`)}>
                                                <VisibilityIcon />
                                            </IconButton>
                                            {(role === "checker" || role === "hm") && (
                                                <IconButton color="primary" onClick={() => navigate(`/edit-nasabah/${nasabah.id}`)}>
                                                    <EditIcon />
                                                </IconButton>
                                            )}
                                            {/* Hanya HM/Admin yang bisa hapus (sesuaikan dengan logic backend Anda) */}
                                            {role === "hm" && (
                                                <IconButton color="error" onClick={() => handleDelete(nasabah.id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            )}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {nasabahData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">Tidak ada data ditemukan.</TableCell> {/* Colspan disesuaikan */}
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={nasabahData.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="Baris per halaman:"
                    />
                </TableContainer>
            </CardContent>

            {/* Modal Foto (Tidak ada perubahan) */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Foto KTP Nasabah</DialogTitle>
                <DialogContent sx={{ textAlign: "center" }}>
                    <img
                        src={modalFotoSrc}
                        alt="Foto KTP"
                        style={{
                            width: "100%",
                            height: 400,
                            objectFit: "cover",
                            borderRadius: 8,
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            if (modalFotoSrc) window.open(modalFotoSrc, "_blank");
                        }}
                        color="primary"
                        variant="outlined"
                    >
                        Perbesar
                    </Button>
                    <Button onClick={() => setOpenModal(false)} variant="contained" color="inherit">
                        Tutup
                    </Button>
                </DialogActions>
            </Dialog>


            {/* Modal Tambah */}
            <Dialog open={openTambahModal} onClose={() => setOpenTambahModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Tambah Nasabah</DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        <TextField label="Nama Lengkap" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleFormChange} required />
                        <TextField label="NIK" name="nik" value={formData.nik} onChange={handleFormChange} required />
                        <TextField label="Alamat" name="alamat" value={formData.alamat} onChange={handleFormChange} required />
                        <TextField label="No HP" name="no_hp" value={formData.no_hp} onChange={handleFormChange} required />
                        {/* REVISI 6: Tambahkan input No Rek */}
                        <TextField label="No Rekening" name="no_rek" value={formData.no_rek} onChange={handleFormChange} helperText="Kosongkan jika tidak ada/belum memiliki" />

                        <Button variant="contained" component="label">
                            Upload Foto KTP ({formData.foto_ktp ? 'Sudah Ada' : 'Wajib Diisi'})
                            <input type="file" hidden name="foto_ktp" onChange={handleFormChange} />
                        </Button>
                        {formData.foto_ktp && <Typography variant="caption" sx={{ ml: 1 }}>File terpilih: **{formData.foto_ktp.name}**</Typography>}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenTambahModal(false)} disabled={submitting}>Batal</Button>
                    <Button onClick={handleSubmit} disabled={submitting || !formData.foto_ktp} variant="contained" color="primary">
                        {submitting ? <CircularProgress size={24} /> : "Simpan"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default DataNasabahPage;