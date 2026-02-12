import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    Card, Table, TableContainer, TableHead, TableBody, 
    TableRow, TableCell, IconButton, Dialog, DialogTitle, DialogContent, 
    DialogActions, Button, CircularProgress, Stack, Grid, Typography, 
    TextField, Paper, MenuItem, FormControl, InputLabel, 
    Select, Box, Breadcrumbs, Link, Avatar, Tabs, Tab,
    TablePagination, Chip, useTheme, useMediaQuery, Divider, Alert
} from "@mui/material";

import {
    Calculate as CalculateIcon, Smartphone as PhoneIcon, 
    ArrowBack as BackIcon, CheckCircleOutline, PendingActions,
    AccessTime as TimeIcon, Search as SearchIcon
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
    const [merkList, setMerkList] = useState([]);
    const [typeByMerk, setTypeByMerk] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [tabIndex, setTabIndex] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);

    const [openModal, setOpenModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ type_hp_id: "", harga_barang: "", harga_pasar: "" });
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

    // Fungsi fetch data type berdasarkan merk dengan pagination & search
    const fetchTypeByMerk = useCallback(async (merkId) => {
        if (!merkId) return;
        setLoading(true);
        try {
            const res = await axiosInstance.get(`${base}/type-hp/by-merk/${merkId}`, {
                params: {
                    page: page + 1,
                    per_page: rowsPerPage,
                    search: search
                }
            });
            setTypeByMerk(res.data.data || []); 
            setTotalRows(res.data.total || 0);
        } catch (error) { 
            console.error(error); 
        } finally { 
            setLoading(false); 
        }
    }, [base, page, rowsPerPage, search]);

    // Re-fetch saat filter atau page berubah
    useEffect(() => {
        if (viewMode === "type" && selectedMerk) {
            fetchTypeByMerk(selectedMerk.id);
        }
    }, [fetchTypeByMerk, viewMode, selectedMerk]);

    const handleSelectMerk = (merk) => {
        setSelectedMerk(merk);
        setSearch("");
        setPage(0); 
        setViewMode("type");
    };

    // Filter lokal hanya untuk memisahkan Tab "Sudah Ada" dan "Belum Input"
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
        } catch (error) { 
            alert("Gagal melakukan simulasi kalkulasi."); 
        } finally { 
            setLoadingPreview(false); 
        }
    };

    const handleOpenModal = (item = null) => {
        setPreviewData(null);
        if (item?.id_harga) {
            setEditingId(item.id_harga);
            setFormData({ 
                type_hp_id: item.id, 
                harga_barang: item.harga_barang || "", 
                harga_pasar: item.harga_pasar || "" 
            });
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
            fetchTypeByMerk(selectedMerk.id); // Refresh data setelah simpan
        } catch (error) {
            alert(error.response?.data?.message || "Gagal simpan harga");
        } finally { setSubmitting(false); }
    };

    const formatRupiah = (num) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);

    const SimulationRow = ({ label, taksiran, pinjaman }) => (
        <TableRow hover>
            <TableCell sx={{ py: 1, fontWeight: 600, fontSize: isMobile ? '0.65rem' : '0.75rem', color: 'text.secondary' }}>{label}</TableCell>
            <TableCell align="right" sx={{ py: 1, fontSize: isMobile ? '0.65rem' : '0.75rem' }}>{formatRupiah(taksiran)}</TableCell>
            <TableCell align="right" sx={{ py: 1, fontWeight: 'bold', color: 'success.main', fontSize: isMobile ? '0.7rem' : '0.85rem' }}>{formatRupiah(pinjaman)}</TableCell>
        </TableRow>
    );

    return (
        <Box sx={{ p: { xs: 1.5, md: 3 } }}>
            {/* HEADER SECTION */}
            <Stack direction="row" alignItems="center" spacing={isMobile ? 1 : 2} mb={3}>
                {viewMode === "type" && (
                    <IconButton onClick={() => { setViewMode("merk"); setSearch(""); setTabIndex(0); setPage(0); }} sx={{ bgcolor: 'white', boxShadow: 1, width: 40, height: 40 }}><BackIcon /></IconButton>
                )}
                <Box>
                    <Typography variant={isMobile ? "h6" : "h5"} fontWeight="900" color="primary.main">
                        {viewMode === "merk" ? "Database Harga" : selectedMerk?.nama_merk}
                    </Typography>
                    {!isMobile && (
                        <Breadcrumbs sx={{ fontSize: '0.85rem' }}>
                            <Link underline="hover" color="inherit" sx={{ cursor: 'pointer' }} onClick={() => { setViewMode("merk"); setTabIndex(0); setPage(0); }}>Home</Link>
                            {viewMode === "type" && <Typography color="text.primary">{selectedMerk?.nama_merk}</Typography>}
                        </Breadcrumbs>
                    )}
                </Box>
            </Stack>

            {/* SEARCH BAR */}
            <TextField 
                fullWidth 
                placeholder={viewMode === "merk" ? "Cari Merk..." : `Cari Tipe ${selectedMerk?.nama_merk}...`}
                InputProps={{
                    startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                    sx: { borderRadius: 3, bgcolor: 'white' }
                }}
                sx={{ mb: 3 }} 
                value={search} 
                onChange={(e) => { setSearch(e.target.value); setPage(0); }} 
            />

            {loading && viewMode === "merk" ? <Box textAlign="center" py={10}><CircularProgress /></Box> : (
                <>
                    {/* VIEW MODE MERK */}
                    {viewMode === "merk" && (
                        <Grid container spacing={isMobile ? 1.5 : 3}>
                            {merkList.filter(m => m.nama_merk.toLowerCase().includes(search.toLowerCase())).map((merk) => (
                                <Grid item xs={6} sm={4} md={3} key={merk.id}>
                                    <Card sx={{ cursor: 'pointer', textAlign: 'center', p: isMobile ? 2 : 3, borderRadius: 4, border: '1px solid #eee', transition: '0.3s', '&:hover': { boxShadow: 2, transform: 'translateY(-5px)' } }} onClick={() => handleSelectMerk(merk)}>
                                        <Avatar sx={{ bgcolor: 'primary.light', mx: 'auto', mb: 1, width: isMobile ? 40 : 56, height: isMobile ? 40 : 56 }}><PhoneIcon sx={{ color: 'primary.main', fontSize: isMobile ? 20 : 28 }} /></Avatar>
                                        <Typography variant={isMobile ? "caption" : "subtitle1"} fontWeight="bold" sx={{ display: 'block', mt: 1 }}>{merk.nama_merk}</Typography>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {/* VIEW MODE TYPE */}
                    {viewMode === "type" && (
                        <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: 3 }}>
                            <Tabs 
                                value={tabIndex} 
                                variant="fullWidth"
                                onChange={(e, v) => { setTabIndex(v); setPage(0); }} 
                                sx={{ bgcolor: '#fafafa', borderBottom: 1, borderColor: 'divider' }}
                            >
                                <Tab label="Sudah Ada" />
                                <Tab label="Belum Input" />
                            </Tabs>

                            {loading ? <Box textAlign="center" py={5}><CircularProgress /></Box> : (
                                <>
                                    {isMobile ? (
                                        <Stack divider={<Divider />} sx={{ bgcolor: 'white' }}>
                                            {currentTabData.map((item) => (
                                                <Box key={item.id} sx={{ p: 2 }}>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                                        <Box sx={{ maxWidth: '70%' }}>
                                                            <Typography variant="subtitle2" fontWeight="800">{item.nama_type}</Typography>
                                                            {item.id_harga && item.updated_at_harga && (
                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                                    <TimeIcon sx={{ fontSize: 12, mr: 0.5 }} />
                                                                    {new Date(item.updated_at_harga).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        <Button size="small" variant={item.id_harga ? "outlined" : "contained"} color={item.id_harga ? "primary" : "warning"} onClick={() => handleOpenModal(item)} sx={{ borderRadius: 2, minWidth: 70, fontSize: '0.7rem' }}>
                                                            {item.id_harga ? "Edit" : "Input"}
                                                        </Button>
                                                    </Stack>
                                                    
                                                    {item.id_harga ? (
                                                        <Grid container spacing={1} sx={{ mt: 1, bgcolor: '#f8fafc', p: 1, borderRadius: 2 }}>
                                                            <Grid item xs={6}>
                                                                <Typography variant="caption" color="text.secondary">Pasar:</Typography>
                                                                <Typography variant="body2" fontWeight="bold" color="secondary.main">{formatRupiah(item.harga_pasar)}</Typography>
                                                            </Grid>
                                                            <Grid item xs={6}>
                                                                <Typography variant="caption" color="text.secondary">Barang:</Typography>
                                                                <Typography variant="body2" fontWeight="bold" color="primary.main">{formatRupiah(item.harga_barang)}</Typography>
                                                            </Grid>
                                                        </Grid>
                                                    ) : (
                                                        <Alert severity="warning" icon={false} sx={{ py: 0, px: 1, '& .MuiAlert-message': { fontSize: '0.65rem' } }}>Harga belum ditentukan</Alert>
                                                    )}
                                                </Box>
                                            ))}
                                        </Stack>
                                    ) : (
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
                                                                {item.id_harga && (
                                                                    <Typography variant="caption" color="text.secondary">Update: {new Date(item.updated_at_harga).toLocaleString('id-ID')}</Typography>
                                                                )}
                                                            </TableCell>
                                                            <TableCell align="right">{item.id_harga ? <Typography variant="body2" fontWeight="900" color="secondary.main">{formatRupiah(item.harga_pasar)}</Typography> : "-"}</TableCell>
                                                            <TableCell align="right">{item.id_harga ? <Typography variant="body2" fontWeight="900" color="primary.main">{formatRupiah(item.harga_barang)}</Typography> : "-"}</TableCell>
                                                            <TableCell align="center">
                                                                <Button size="small" variant={item.id_harga ? "outlined" : "contained"} onClick={() => handleOpenModal(item)} sx={{ borderRadius: 2 }}>{item.id_harga ? "Edit" : "Input"}</Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}
                                </>
                            )}
                            <TablePagination 
                                component="div" 
                                count={totalRows} 
                                rowsPerPage={rowsPerPage} 
                                page={page} 
                                onPageChange={(e, p) => setPage(p)} 
                                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} 
                                labelRowsPerPage={isMobile ? "Hal:" : "Rows:"} 
                            />
                        </Card>
                    )}
                </>
            )}

            {/* MODAL INPUT / UPDATE */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} fullScreen={isMobile} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 900, bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {editingId ? "Update Harga" : "Input Harga"}
                    {isMobile && <IconButton onClick={() => setOpenModal(false)} color="inherit"><BackIcon /></IconButton>}
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={isMobile ? 2 : 3}>
                        <Grid item xs={12}>
                            <Paper shadow={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                                <Typography variant="caption" display="block">UNIT</Typography>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    {selectedMerk?.nama_merk} - {
                                        editingId 
                                        ? typeByMerk.find(t => t.id_harga === editingId)?.nama_type 
                                        : (typeByMerk.find(t => t.id === formData.type_hp_id)?.nama_type || "Pilih Tipe")
                                    }
                                </Typography>
                            </Paper>
                        </Grid>
                        {!editingId && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Pilih Tipe</InputLabel>
                                    <Select 
                                        value={formData.type_hp_id} 
                                        onChange={(e) => setFormData({ ...formData, type_hp_id: e.target.value })}
                                        label="Pilih Tipe"
                                    >
                                        {Array.isArray(typeByMerk) && typeByMerk.filter(t => !t.id_harga).map(t => (
                                            <MenuItem key={t.id} value={t.id}>{t.nama_type}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}
                        <Grid item xs={6}><TextField fullWidth label="Harga Pasar" type="number" value={formData.harga_pasar} onChange={(e) => setFormData({ ...formData, harga_pasar: e.target.value })} /></Grid>
                        <Grid item xs={6}><TextField fullWidth label="Harga Barang" type="number" value={formData.harga_barang} onChange={(e) => setFormData({ ...formData, harga_barang: e.target.value })} /></Grid>
                        <Grid item xs={12}>
                            <Button fullWidth variant="contained" color="inherit" startIcon={<CalculateIcon />} onClick={handlePreview} disabled={!formData.harga_barang || !formData.harga_pasar || loadingPreview} sx={{ bgcolor: '#334155', color: 'white' }}>Simulasi Taksiran</Button>
                        </Grid>
                        {previewData && (
                            <Grid item xs={12}>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableBody>
                                            <SimulationRow label="A - DUS" taksiran={previewData.taksiran_a_dus} pinjaman={previewData.grade_a_dus} />
                                            <SimulationRow label="A - BATANGAN" taksiran={previewData.taksiran_a_tanpa_dus} pinjaman={previewData.grade_a_tanpa_dus} />
                                            <SimulationRow label="B - DUS" taksiran={previewData.taksiran_b_dus} pinjaman={previewData.grade_b_dus} />
                                            <SimulationRow label="B - BATANGAN" taksiran={previewData.taksiran_b_tanpa_dus} pinjaman={previewData.grade_b_tanpa_dus} />
                                            <SimulationRow label="C - DUS" taksiran={previewData.taksiran_c_dus} pinjaman={previewData.grade_c_dus} />
                                            <SimulationRow label="C - BATANGAN" taksiran={previewData.taksiran_c_tanpa_dus} pinjaman={previewData.grade_c_tanpa_dus} />
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenModal(false)}>Batal</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={submitting}>Simpan</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default HargaHpPage;