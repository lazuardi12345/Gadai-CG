import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    Card, Table, TableContainer, TableHead, TableBody, 
    TableRow, TableCell, IconButton, Dialog, DialogTitle, DialogContent, 
    DialogActions, Button, CircularProgress, Stack, Grid, Typography, 
    TextField, Paper, MenuItem, FormControl, InputLabel, 
    Select, Box, Breadcrumbs, Link, Avatar, Alert, Tabs, Tab,
    TablePagination, Chip
} from "@mui/material";

import {
    Calculate as CalculateIcon, Smartphone as PhoneIcon, 
    ArrowBack as BackIcon, CheckCircleOutline, PendingActions,
    AccessTime as TimeIcon
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
    const [tabIndex, setTabIndex] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

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
        setPage(0); 
        try {
            const res = await axiosInstance.get(`${base}/type-hp/by-merk/${merk.id}`);
            setTypeByMerk(res.data.data || []); 
            setViewMode("type");
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const filteredData = useMemo(() => {
        const source = tabIndex === 0 
            ? typeByMerk.filter(t => t.id_harga) 
            : typeByMerk.filter(t => !t.id_harga);
        
        return source.filter(t => 
            t.nama_type.toLowerCase().includes(search.toLowerCase())
        );
    }, [typeByMerk, tabIndex, search]);

    const paginatedData = useMemo(() => {
        return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredData, page, rowsPerPage]);

    const handlePreview = async () => {
        if (!formData.harga_barang) return;
        setLoadingPreview(true);
        try {
            const res = await axiosInstance.post(`${base}/grade-hp/preview`, {
                harga_barang: parseInt(formData.harga_barang),
                pasar_trend: formData.pasar_trend
            });
            setPreviewData(res.data.hasil_kalkulasi);
        } catch (error) { 
            console.error(error);
            alert("Gagal melakukan simulasi kalkulasi."); 
        } finally { 
            setLoadingPreview(false); 
        }
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
        <TableRow hover>
            <TableCell sx={{ py: 1, fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>{label}</TableCell>
            <TableCell align="right" sx={{ py: 1, fontSize: '0.75rem' }}>{formatRupiah(taksiran)}</TableCell>
            <TableCell align="right" sx={{ py: 1, fontWeight: 'bold', color: 'success.main', fontSize: '0.85rem' }}>{formatRupiah(pinjaman)}</TableCell>
        </TableRow>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                {viewMode === "type" && (
                    <IconButton onClick={() => { setViewMode("merk"); setSearch(""); setTabIndex(0); }} sx={{ bgcolor: 'white', boxShadow: 1 }}><BackIcon /></IconButton>
                )}
                <Box>
                    <Typography variant="h5" fontWeight="900" color="primary.main">{viewMode === "merk" ? "Master Database Harga" : selectedMerk?.nama_merk}</Typography>
                    <Breadcrumbs sx={{ fontSize: '0.85rem' }}>
                        <Link underline="hover" color="inherit" sx={{ cursor: 'pointer' }} onClick={() => { setViewMode("merk"); setTabIndex(0); }}>Home</Link>
                        {viewMode === "type" && <Typography color="text.primary">{selectedMerk?.nama_merk}</Typography>}
                    </Breadcrumbs>
                </Box>
            </Stack>

            <TextField 
                fullWidth 
                placeholder="Cari tipe atau merk..." 
                sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: 'white' } }} 
                value={search} 
                onChange={(e) => { setSearch(e.target.value); setPage(0); }} 
            />

            {loading ? <Box textAlign="center" py={10}><CircularProgress /></Box> : (
                <>
                    {viewMode === "merk" && (
                        <Grid container spacing={3}>
                            {merkList.filter(m => m.nama_merk.toLowerCase().includes(search.toLowerCase())).map((merk) => (
                                <Grid item xs={12} sm={6} md={3} key={merk.id}>
                                    <Card sx={{ cursor: 'pointer', textAlign: 'center', p: 3, borderRadius: 4, border: '1px solid #eee', transition: '0.3s', '&:hover': { boxShadow: 2, transform: 'translateY(-5px)' } }} onClick={() => handleSelectMerk(merk)}>
                                        <Avatar sx={{ bgcolor: 'primary.light', mx: 'auto', mb: 2, width: 56, height: 56 }}><PhoneIcon sx={{ color: 'primary.main' }} /></Avatar>
                                        <Typography variant="subtitle1" fontWeight="bold">{merk.nama_merk}</Typography>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {viewMode === "type" && (
                        <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
                            <Tabs value={tabIndex} onChange={(e, v) => { setTabIndex(v); setPage(0); }} sx={{ px: 2, pt: 1, bgcolor: '#fafafa', borderBottom: 1, borderColor: 'divider' }}>
                                <Tab icon={<CheckCircleOutline fontSize="small" />} iconPosition="start" label={`Sudah Ada (${typeByMerk.filter(t => t.id_harga).length})`} />
                                <Tab icon={<PendingActions fontSize="small" />} iconPosition="start" label={`Belum Input (${typeByMerk.filter(t => !t.id_harga).length})`} />
                            </Tabs>
                            <TableContainer>
                                <Table size="medium">
                                    <TableHead sx={{ bgcolor: '#fcfcfc' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Tipe Unit & Status Update</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Harga Pasar</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Aksi</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginatedData.map((item) => (
                                            <TableRow key={item.id} hover>
                                                <TableCell>
    <Stack direction="row" alignItems="center" spacing={1.5}>
        <Typography variant="body2" fontWeight={700}>
            {item.nama_type}
        </Typography>
        
        {/* Render Chip hanya jika ada id_harga dan tanggal valid */}
        {item.id_harga && item.updated_at && (
            <Chip 
                size="small"
                icon={<TimeIcon style={{ fontSize: '0.75rem' }} />}
                label={new Date(item.updated_at).toLocaleString('id-ID', { 
                    day: '2-digit', 
                    month: 'short', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })}
                sx={{ 
                    fontSize: '0.65rem', 
                    height: 20, 
                    bgcolor: '#f0f4f8', 
                    color: 'text.secondary',
                    fontWeight: 600,
                    border: '1px solid #e0e6ed'
                }}
            />
        )}
    </Stack>
    
    {item.updated_at && (new Date() - new Date(item.updated_at)) < 86400000 && (
        <Typography 
            variant="caption" 
            sx={{ color: 'success.main', fontSize: '0.6rem', display: 'block', mt: 0.2, fontWeight: 700 }}
        >
            • Baru Diperbarui
        </Typography>
    )}
</TableCell>
                                                <TableCell align="right">
                                                    {item.id_harga ? <Typography variant="body2" fontWeight="900" color="primary.main">{formatRupiah(item.harga_barang)}</Typography> : <Typography variant="caption" color="error">Data Kosong</Typography>}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Button size="small" variant={item.id_harga ? "outlined" : "contained"} color={item.id_harga ? "primary" : "warning"} onClick={() => handleOpenModal(item)} sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}>
                                                        {item.id_harga ? "Edit" : "Input"}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination component="div" count={filteredData.length} rowsPerPage={rowsPerPage} page={page} onPageChange={(e, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
                        </Card>
                    )}
                </>
            )}

            <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 900, bgcolor: 'primary.main', color: 'white' }}>{editingId ? "Update Data Harga" : "Input Master Harga Baru"}</DialogTitle>
                <DialogContent dividers sx={{ mt: 1 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: '#f8fafc', borderStyle: 'dashed' }}>
                                <Typography variant="caption" color="text.secondary" gutterBottom display="block">UNIT TERPILIH</Typography>
                                <Typography variant="h6" fontWeight="bold">
                                    {selectedMerk?.nama_merk} - {editingId ? typeByMerk.find(t => t.id_harga === editingId)?.nama_type : (typeByMerk.find(t => t.id === formData.type_hp_id)?.nama_type || "Pilih Tipe")}
                                </Typography>
                            </Paper>
                        </Grid>

                        {!editingId && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Pilih Tipe Perangkat</InputLabel>
                                    <Select value={formData.type_hp_id} label="Pilih Tipe Perangkat" onChange={(e) => setFormData({ ...formData, type_hp_id: e.target.value })} sx={{ borderRadius: 2 }}>
                                        {typeByMerk.filter(t => !t.id_harga).map(t => <MenuItem key={t.id} value={t.id}>{t.nama_type}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <TextField fullWidth label="Harga Pasar Saat Ini" type="number" value={formData.harga_barang} onChange={(e) => setFormData({ ...formData, harga_barang: e.target.value })} InputProps={{ sx: { borderRadius: 2, fontWeight: 'bold' } }} />
                        </Grid>

                        <Grid item xs={12}>
                            <Button fullWidth variant="contained" color="inherit" startIcon={<CalculateIcon />} onClick={handlePreview} disabled={!formData.harga_barang || loadingPreview} sx={{ py: 1.2, borderRadius: 2, bgcolor: '#334155', color: 'white', '&:hover': { bgcolor: '#1e293b' } }}>
                                {loadingPreview ? "Menghitung..." : "Simulasi Taksiran Grade"}
                            </Button>
                        </Grid>

                        {previewData && (
                            <Grid item xs={12}>
                                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: '#f1f5f9' }}>
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
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, bgcolor: '#f8fafc' }}>
                    <Button onClick={() => setOpenModal(false)} sx={{ fontWeight: 'bold' }}>Batal</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={submitting || (!editingId && !formData.type_hp_id) || !formData.harga_barang} sx={{ px: 4, borderRadius: 2 }}>
                        {submitting ? "Proses..." : "Simpan"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default HargaHpPage;