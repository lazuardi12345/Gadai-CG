import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    Card, Table, TableContainer, TableHead, TableBody, 
    TableRow, TableCell, IconButton, Dialog, DialogTitle, DialogContent, 
    DialogActions, Button, CircularProgress, Stack, Grid, Typography, 
    TextField, Paper, MenuItem, FormControl, InputLabel, 
    Select, Box, Breadcrumbs, Link, Avatar, Alert, Tabs, Tab,
    TablePagination
} from "@mui/material";

import {
    Calculate as CalculateIcon, Smartphone as PhoneIcon, 
    ArrowBack as BackIcon, CheckCircleOutline, PendingActions
} from "@mui/icons-material";

import axiosInstance from "api/axiosInstance";

const HargaHpPage = () => {
    const user = JSON.parse(localStorage.getItem("auth_user"));
    const role = user?.role?.toLowerCase() || "";
    const base = role === "checker" ? "/checker" : role === "petugas" ? "/petugas" : "";

    const [viewMode, setViewMode] = useState("merk"); 
    const [selectedMerk, setSelectedMerk] = useState(null);
    const [merkList, setMerkList] = useState([]);
    const [typeByMerk, setTypeByMerk] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    
    // State Tab
    const [tabIndex, setTabIndex] = useState(0);

    // State Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // State Modal & Form
    const [openModal, setOpenModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ type_hp_id: "", harga_barang: "", pasar_trend: "turun" });
    const [previewData, setPreviewData] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    const fetchMerks = useCallback(async () => {
        setLoading(true);
        try {
            const resMerk = await axiosInstance.get(`${base}/merk-hp`);
            setMerkList(resMerk.data.data || []);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    }, [base]);

    useEffect(() => { fetchMerks(); }, [fetchMerks]);

    const handleSelectMerk = async (merk) => {
        setLoading(true);
        setSelectedMerk(merk);
        setSearch("");
        setPage(0); // Reset page saat ganti merk
        try {
            const res = await axiosInstance.get(`${base}/type-hp/by-merk/${merk.id}`);
            setTypeByMerk(res.data.data || []); 
            setViewMode("type");
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    // --- LOGIC FILTERING & PAGINATION ---
    
    // 1. Kelompokkan Data Berdasarkan Tab dan Search
    const filteredData = useMemo(() => {
        const source = tabIndex === 0 
            ? typeByMerk.filter(t => t.id_harga) 
            : typeByMerk.filter(t => !t.id_harga);
        
        return source.filter(t => 
            t.nama_type.toLowerCase().includes(search.toLowerCase())
        );
    }, [typeByMerk, tabIndex, search]);

    // 2. Potong Data untuk Tampilan Per Halaman
    const paginatedData = useMemo(() => {
        return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredData, page, rowsPerPage]);

    // Handler Ganti Tab
    const handleTabChange = (event, newValue) => {
        setTabIndex(newValue);
        setPage(0); // Reset ke halaman 1 saat ganti tab
    };

    // Handler Pagination
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // ------------------------------------

    const handlePreview = async () => {
        if (!formData.harga_barang) return;
        setLoadingPreview(true);
        try {
            const res = await axiosInstance.post(`${base}/grade-hp/preview`, {
                harga_barang: parseInt(formData.harga_barang),
                pasar_trend: formData.pasar_trend
            });
            setPreviewData(res.data.hasil_kalkulasi);
        } catch (error) { alert("Gagal simulasi"); } finally { setLoadingPreview(false); }
    };

    const handleOpenModal = (item = null) => {
        setPreviewData(null);
        if (item?.id_harga) {
            setEditingId(item.id_harga);
            setFormData({ type_hp_id: item.id, harga_barang: item.harga_barang, pasar_trend: "turun" });
        } else {
            setEditingId(null);
            setFormData({ type_hp_id: item ? item.id : "", harga_barang: "", pasar_trend: "turun" });
        }
        setOpenModal(true);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const payload = {
                harga_barang: parseInt(formData.harga_barang),
                pasar_trend: formData.pasar_trend,
                auto_generate_grade: true,
                recalculate_grade: true 
            };
            if (editingId) {
                await axiosInstance.put(`${base}/harga-hp/${editingId}`, payload);
            } else {
                await axiosInstance.post(`${base}/harga-hp`, { ...payload, type_hp_id: formData.type_hp_id });
            }
            setOpenModal(false);
            handleSelectMerk(selectedMerk); 
        } catch (error) {
            alert(error.response?.data?.message || "Gagal simpan harga");
        } finally {
            setSubmitting(false);
        }
    };

    const formatRupiah = (num) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);

    const SimulationRow = ({ label, taksiran, pinjaman }) => (
        <TableRow>
            <TableCell sx={{ py: 1, fontWeight: 'bold', fontSize: '0.75rem' }}>{label}</TableCell>
            <TableCell align="right" sx={{ py: 1, fontSize: '0.75rem' }}>{formatRupiah(taksiran)}</TableCell>
            <TableCell align="right" sx={{ py: 1, fontWeight: 'bold', color: 'success.main', fontSize: '0.8rem' }}>{formatRupiah(pinjaman)}</TableCell>
        </TableRow>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                {viewMode === "type" && (
                    <IconButton onClick={() => { setViewMode("merk"); setSearch(""); setTabIndex(0); }} sx={{ bgcolor: 'white', boxShadow: 1 }}><BackIcon /></IconButton>
                )}
                <Box>
                    <Typography variant="h5" fontWeight="bold">{viewMode === "merk" ? "Master Merk" : `Merk: ${selectedMerk?.nama_merk}`}</Typography>
                    <Breadcrumbs>
                        <Link underline="hover" color="inherit" sx={{cursor:'pointer'}} onClick={() => { setViewMode("merk"); setTabIndex(0); }}>Home</Link>
                        {viewMode === "type" && <Typography>{selectedMerk?.nama_merk}</Typography>}
                    </Breadcrumbs>
                </Box>
            </Stack>

            <TextField 
                fullWidth 
                placeholder="Cari tipe atau merk..." 
                sx={{ mb: 3, bgcolor: 'white' }} 
                value={search} 
                onChange={(e) => { setSearch(e.target.value); setPage(0); }} 
            />

            {loading ? <Box textAlign="center" py={5}><CircularProgress /></Box> : (
                <>
                    {viewMode === "merk" && (
                        <Grid container spacing={3}>
                            {merkList.filter(m => m.nama_merk.toLowerCase().includes(search.toLowerCase())).map((merk) => (
                                <Grid item xs={12} sm={6} md={3} key={merk.id}>
                                    <Card sx={{ cursor: 'pointer', textAlign: 'center', p: 3, borderRadius: 3, border: '1px solid #eee', '&:hover': { boxShadow: 4, transform: 'translateY(-4px)', transition: '0.3s' } }} onClick={() => handleSelectMerk(merk)}>
                                        <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2, width: 60, height: 60 }}><PhoneIcon /></Avatar>
                                        <Typography variant="h6" fontWeight="bold">{merk.nama_merk}</Typography>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {viewMode === "type" && (
                        <Card sx={{ borderRadius: 3 }}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}>
                                <Tabs value={tabIndex} onChange={handleTabChange} aria-label="tab harga hp">
                                    <Tab 
                                        icon={<CheckCircleOutline fontSize="small" />} 
                                        iconPosition="start" 
                                        label={`Sudah Ada (${typeByMerk.filter(t => t.id_harga).length})`} 
                                    />
                                    <Tab 
                                        icon={<PendingActions fontSize="small" />} 
                                        iconPosition="start" 
                                        label={`Belum Input (${typeByMerk.filter(t => !t.id_harga).length})`} 
                                    />
                                </Tabs>
                            </Box>
                            
                            <TableContainer>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#fafafa' }}>
                                        <TableRow>
                                            <TableCell>Tipe</TableCell>
                                            <TableCell align="right">Harga Pasar</TableCell>
                                            <TableCell align="center">Aksi</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginatedData.length > 0 ? paginatedData.map((item) => (
                                            <TableRow key={item.id} hover>
                                                <TableCell sx={{ fontWeight: 500 }}>{item.nama_type}</TableCell>
                                                <TableCell align="right">{item.id_harga ? formatRupiah(item.harga_barang) : "Belum diatur"}</TableCell>
                                                <TableCell align="center">
                                                    <Button 
                                                        size="small" 
                                                        variant={item.id_harga ? "outlined" : "contained"} 
                                                        color={item.id_harga ? "primary" : "warning"} 
                                                        onClick={() => handleOpenModal(item)}
                                                    >
                                                        {item.id_harga ? "Edit Harga" : "Input Harga"}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                                                    Tidak ada data tipe ditemukan.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <TablePagination
                                rowsPerPageOptions={[5, 10, 25, 50]}
                                component="div"
                                count={filteredData.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                labelRowsPerPage="Baris per halaman:"
                            />
                        </Card>
                    )}
                </>
            )}

            {/* MODAL INPUT / EDIT */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 'bold' }}>{editingId ? "Update Harga" : "Input Harga Baru"}</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant="body2" mb={1}>Unit: <b>{selectedMerk?.nama_merk} - {editingId ? typeByMerk.find(t => t.id === formData.type_hp_id)?.nama_type : "Pilih Tipe"}</b></Typography>
                            {!editingId && (
                                <FormControl fullWidth size="small">
                                    <InputLabel>Pilih Tipe</InputLabel>
                                    <Select 
                                        value={formData.type_hp_id} 
                                        label="Pilih Tipe" 
                                        onChange={(e) => setFormData({ ...formData, type_hp_id: e.target.value })}
                                    >
                                        {/* Dropdown hanya menampilkan tipe yang belum ada harganya jika di mode Input Baru */}
                                        {typeByMerk.filter(t => !t.id_harga).map(t => (
                                            <MenuItem key={t.id} value={t.id}>{t.nama_type}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        </Grid>
                        <Grid item xs={8}>
                            <TextField 
                                fullWidth 
                                size="small" 
                                label="Harga Pasar (Modal Toko)" 
                                type="number" 
                                value={formData.harga_barang} 
                                onChange={(e) => setFormData({ ...formData, harga_barang: e.target.value })} 
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <FormControl fullWidth size="small">
                                <Select value={formData.pasar_trend} onChange={(e) => setFormData({ ...formData, pasar_trend: e.target.value })}>
                                    <MenuItem value="turun">Trend Turun</MenuItem>
                                    <MenuItem value="naik">Trend Naik</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <Button 
                                fullWidth 
                                variant="outlined" 
                                startIcon={<CalculateIcon />} 
                                onClick={handlePreview} 
                                disabled={!formData.harga_barang || loadingPreview}
                            >
                                {loadingPreview ? "Menghitung..." : "Simulasi Kalkulasi Lengkap"}
                            </Button>
                        </Grid>

                        {previewData && (
                            <Grid item xs={12}>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: '#f9f9f9' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>KONDISI UNIT</TableCell>
                                                <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>TAKSIRAN</TableCell>
                                                <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>MAX PINJAMAN</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <SimulationRow label="GRADE A - DUS" taksiran={previewData.taksiran_a_dus} pinjaman={previewData.grade_a_dus} />
                                            <SimulationRow label="GRADE A - BATANGAN" taksiran={previewData.taksiran_a_tanpa_dus} pinjaman={previewData.grade_a_tanpa_dus} />
                                            <SimulationRow label="GRADE B - DUS" taksiran={previewData.taksiran_b_dus} pinjaman={previewData.grade_b_dus} />
                                            <SimulationRow label="GRADE B - BATANGAN" taksiran={previewData.taksiran_b_tanpa_dus} pinjaman={previewData.grade_b_tanpa_dus} />
                                            <SimulationRow label="GRADE C - DUS" taksiran={previewData.taksiran_c_dus} pinjaman={previewData.grade_c_dus} />
                                            <SimulationRow label="GRADE C - BATANGAN" taksiran={previewData.taksiran_c_tanpa_dus} pinjaman={previewData.grade_c_tanpa_dus} />
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <Alert severity="info" sx={{ mt: 1, py: 0 }}>* Kalkulasi di atas adalah simulasi sementara.</Alert>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenModal(false)}>Batal</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSubmit} 
                        disabled={submitting || !formData.type_hp_id || !formData.harga_barang}
                    >
                        {submitting ? "Menyimpan..." : "Simpan Harga"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default HargaHpPage;