import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    Card, Table, TableContainer, TableHead, TableBody, 
    TableRow, TableCell, IconButton, Dialog, DialogTitle, DialogContent, 
    DialogActions, Button, CircularProgress, Stack, Grid, Typography, 
    TextField, Paper, MenuItem, FormControl, InputLabel, 
    Select, Box, Breadcrumbs, Link, Avatar, Tabs, Tab,
    TablePagination, Divider, Alert, useTheme, useMediaQuery
} from "@mui/material";

import {
    Calculate as CalculateIcon, Smartphone as PhoneIcon, 
    ArrowBack as BackIcon, AccessTime as TimeIcon, Search as SearchIcon
} from "@mui/icons-material";

import axiosInstance from "api/axiosInstance";

const HargaHpPage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const user = JSON.parse(localStorage.getItem("auth_user"));
    const role = user?.role?.toLowerCase() || "";
    const base = role === "checker" ? "/checker" : role === "petugas" ? "/petugas" : "";

    const [viewMode, setViewMode] = useState("merk"); 
    const [selectedMerk, setSelectedMerk] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [tabIndex, setTabIndex] = useState(0);

    // Pagination State untuk MERK
    const [merkList, setMerkList] = useState([]);
    const [pageMerk, setPageMerk] = useState(0);
    const [rowsPerPageMerk, setRowsPerPageMerk] = useState(12);
    const [totalMerk, setTotalMerk] = useState(0);

    // Pagination State untuk TYPE
    const [typeByMerk, setTypeByMerk] = useState([]);
    const [pageType, setPageType] = useState(0);
    const [rowsPerPageType, setRowsPerPageType] = useState(10);
    const [totalRowsType, setTotalRowsType] = useState(0);

    const [openModal, setOpenModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ type_hp_id: "", harga_barang: "", harga_pasar: "" });
    const [previewData, setPreviewData] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    // 1. Fetch Merk dengan Pagination
    const fetchMerks = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(`${base}/merk-hp`, {
                params: {
                    page: pageMerk + 1,
                    pageSize: rowsPerPageMerk,
                    search: search
                }
            });
            setMerkList(res.data.data || []);
            setTotalMerk(res.data.total || 0);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    }, [base, pageMerk, rowsPerPageMerk, search]);

    // 2. Fetch Type berdasarkan Merk dengan Pagination
    const fetchTypeByMerk = useCallback(async (merkId) => {
        if (!merkId) return;
        setLoading(true);
        try {
            const res = await axiosInstance.get(`${base}/type-hp/by-merk/${merkId}`, {
                params: {
                    page: pageType + 1,
                    pageSize: rowsPerPageType,
                    search: search
                }
            });
            setTypeByMerk(res.data.data || []); 
            setTotalRowsType(res.data.total || 0);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    }, [base, pageType, rowsPerPageType, search]);

    // Trigger Fetch berdasarkan ViewMode
    useEffect(() => {
        if (viewMode === "merk") {
            fetchMerks();
        } else if (viewMode === "type" && selectedMerk) {
            fetchTypeByMerk(selectedMerk.id);
        }
    }, [fetchMerks, fetchTypeByMerk, viewMode, selectedMerk]);

    const handleSelectMerk = (merk) => {
        setSelectedMerk(merk);
        setSearch("");
        setPageType(0); 
        setViewMode("type");
    };

    // Filter Lokal untuk Tab (Sudah Ada / Belum)
    const currentTabData = useMemo(() => {
        if (!Array.isArray(typeByMerk)) return [];
        return tabIndex === 0 
            ? typeByMerk.filter(t => t.id_harga) 
            : typeByMerk.filter(t => !t.id_harga);
    }, [typeByMerk, tabIndex]);

    const handlePreview = async () => {
        if (!formData.harga_barang || !formData.harga_pasar) return;
        setLoadingPreview(true);
        try {
            const res = await axiosInstance.post(`${base}/grade-hp/preview`, {
                harga_barang: parseInt(formData.harga_barang),
                harga_pasar: parseInt(formData.harga_pasar)
            });
            setPreviewData(res.data.hasil_kalkulasi);
        } catch (error) { alert("Gagal simulasi kalkulasi."); } finally { setLoadingPreview(false); }
    };

    const handleOpenModal = (item = null) => {
        setPreviewData(null);
        if (item?.id_harga) {
            setEditingId(item.id_harga);
            setFormData({ type_hp_id: item.id, harga_barang: item.harga_barang, harga_pasar: item.harga_pasar });
        } else {
            setEditingId(null);
            setFormData({ type_hp_id: item ? item.id : "", harga_barang: "", harga_pasar: "" });
        }
        setOpenModal(true);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const payload = {
                harga_barang: parseInt(formData.harga_barang),
                harga_pasar: parseInt(formData.harga_pasar),
                auto_generate_grade: true,
                recalculate_grade: true 
            };
            if (editingId) {
                await axiosInstance.put(`${base}/harga-hp/${editingId}`, payload);
            } else {
                await axiosInstance.post(`${base}/harga-hp`, { ...payload, type_hp_id: formData.type_hp_id });
            }
            setOpenModal(false);
            fetchTypeByMerk(selectedMerk.id);
        } catch (error) { alert(error.response?.data?.message || "Gagal simpan"); } finally { setSubmitting(false); }
    };

    const formatRupiah = (num) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);

    const SimulationRow = ({ label, taksiran, pinjaman }) => (
        <TableRow hover>
            <TableCell sx={{ py: 1, fontWeight: 600, fontSize: '0.75rem' }}>{label}</TableCell>
            <TableCell align="right" sx={{ py: 1, fontSize: '0.75rem' }}>{formatRupiah(taksiran)}</TableCell>
            <TableCell align="right" sx={{ py: 1, fontWeight: 'bold', color: 'success.main', fontSize: '0.85rem' }}>{formatRupiah(pinjaman)}</TableCell>
        </TableRow>
    );

    return (
        <Box sx={{ p: { xs: 1.5, md: 3 } }}>
            {/* HEADER */}
            <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                {viewMode === "type" && (
                    <IconButton onClick={() => { setViewMode("merk"); setSearch(""); setTabIndex(0); setPageType(0); }} sx={{ bgcolor: 'white', boxShadow: 1 }}><BackIcon /></IconButton>
                )}
                <Box>
                    <Typography variant={isMobile ? "h6" : "h5"} fontWeight="900" color="primary.main">
                        {viewMode === "merk" ? "Database Harga" : selectedMerk?.nama_merk}
                    </Typography>
                </Box>
            </Stack>

            {/* SEARCH */}
            <TextField 
                fullWidth 
                placeholder={viewMode === "merk" ? "Cari Merk..." : `Cari Tipe ${selectedMerk?.nama_merk}...`}
                InputProps={{ startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />, sx: { borderRadius: 3, bgcolor: 'white' } }}
                sx={{ mb: 3 }} 
                value={search} 
                onChange={(e) => { 
                    setSearch(e.target.value); 
                    if(viewMode === "merk") setPageMerk(0); else setPageType(0);
                }} 
            />

            {loading ? <Box textAlign="center" py={10}><CircularProgress /></Box> : (
                <>
                    {viewMode === "merk" && (
                        <>
                            <Grid container spacing={isMobile ? 1.5 : 3}>
                                {merkList.map((merk) => (
                                    <Grid item xs={6} sm={4} md={3} key={merk.id}>
                                        <Card sx={{ cursor: 'pointer', textAlign: 'center', p: isMobile ? 2 : 3, borderRadius: 4, transition: '0.3s', '&:hover': { boxShadow: 4, transform: 'translateY(-5px)' } }} onClick={() => handleSelectMerk(merk)}>
                                            <Avatar sx={{ bgcolor: 'primary.light', mx: 'auto', mb: 1, width: isMobile ? 40 : 56, height: isMobile ? 40 : 56 }}><PhoneIcon color="primary" /></Avatar>
                                            <Typography variant="subtitle2" fontWeight="bold">{merk.nama_merk}</Typography>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                            <TablePagination
                                component="div"
                                count={totalMerk}
                                page={pageMerk}
                                onPageChange={(e, p) => setPageMerk(p)}
                                rowsPerPage={rowsPerPageMerk}
                                onRowsPerPageChange={(e) => { setRowsPerPageMerk(parseInt(e.target.value, 10)); setPageMerk(0); }}
                                rowsPerPageOptions={[12, 24, 48]}
                            />
                        </>
                    )}

                    {viewMode === "type" && (
                        <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: 3 }}>
                            <Tabs value={tabIndex} variant="fullWidth" onChange={(e, v) => setTabIndex(v)} sx={{ bgcolor: '#fafafa' }}>
                                <Tab label="Sudah Ada" />
                                <Tab label="Belum Input" />
                            </Tabs>

                            <TableContainer>
                                <Table>
                                    <TableHead sx={{ bgcolor: '#fcfcfc' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Tipe Unit</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Harga Pasar</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Harga Barang</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Aksi</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {currentTabData.map((item) => (
                                            <TableRow key={item.id} hover>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={700}>{item.nama_type}</Typography>
                                                    {item.id_harga && <Typography variant="caption" color="text.secondary">Update: {new Date(item.updated_at_harga).toLocaleDateString()}</Typography>}
                                                </TableCell>
                                                <TableCell align="right">{item.id_harga ? formatRupiah(item.harga_pasar) : "-"}</TableCell>
                                                <TableCell align="right">{item.id_harga ? formatRupiah(item.harga_barang) : "-"}</TableCell>
                                                <TableCell align="center">
                                                    <Button size="small" variant={item.id_harga ? "outlined" : "contained"} onClick={() => handleOpenModal(item)}>{item.id_harga ? "Edit" : "Input"}</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination 
                                component="div" 
                                count={totalRowsType} 
                                rowsPerPage={rowsPerPageType} 
                                page={pageType} 
                                onPageChange={(e, p) => setPageType(p)} 
                                onRowsPerPageChange={(e) => { setRowsPerPageType(parseInt(e.target.value, 10)); setPageType(0); }} 
                            />
                        </Card>
                    )}
                </>
            )}

            {/* MODAL */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} fullScreen={isMobile} fullWidth maxWidth="sm">
                <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 900 }}>
                    {editingId ? "Update Harga" : "Input Harga"}
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
                                <Typography variant="caption">UNIT</Typography>
                                <Typography variant="subtitle1" fontWeight="bold">{selectedMerk?.nama_merk} - {editingId ? typeByMerk.find(t => t.id_harga === editingId)?.nama_type : (typeByMerk.find(t => t.id === formData.type_hp_id)?.nama_type || "Pilih Tipe")}</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={6}><TextField fullWidth label="Harga Pasar" type="number" value={formData.harga_pasar} onChange={(e) => setFormData({ ...formData, harga_pasar: e.target.value })} /></Grid>
                        <Grid item xs={6}><TextField fullWidth label="Harga Barang" type="number" value={formData.harga_barang} onChange={(e) => setFormData({ ...formData, harga_barang: e.target.value })} /></Grid>
                        <Grid item xs={12}>
                            <Button fullWidth variant="contained" color="secondary" startIcon={<CalculateIcon />} onClick={handlePreview} disabled={!formData.harga_barang || !formData.harga_pasar}>Simulasi Taksiran</Button>
                        </Grid>
                        {previewData && (
                            <Grid item xs={12}>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableBody>
                                            <SimulationRow label="A - DUS" taksiran={previewData.taksiran_a_dus} pinjaman={previewData.grade_a_dus} />
                                            <SimulationRow label="B - DUS" taksiran={previewData.taksiran_b_dus} pinjaman={previewData.grade_b_dus} />
                                            <SimulationRow label="C - DUS" taksiran={previewData.taksiran_c_dus} pinjaman={previewData.grade_c_dus} />
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenModal(false)}>Batal</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={submitting}>Simpan Lunas</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default HargaHpPage;