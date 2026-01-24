import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    Card, CardHeader, CardContent, Divider,
    Table, TableContainer, TableHead, TableBody,
    TableRow, TableCell, TablePagination,
    IconButton, Button, CircularProgress,
    Stack, Grid, Typography, Paper, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Chip, Avatar
} from "@mui/material";

import {
    ArrowBackIosNew, ArrowForwardIos, 
    Visibility as VisibilityIcon,
    Smartphone as PhoneIcon, 
    Inventory as BoxIcon,     
    PhonelinkErase as NoBoxIcon 
} from "@mui/icons-material";

import axiosInstance from "api/axiosInstance";

const GradeHpPage = () => {
    // 1. Auth & API Configuration
    const authData = JSON.parse(localStorage.getItem("auth_user"));
    const role = authData?.role?.toLowerCase() || "";

    const getBaseApi = useCallback(() => {
        if (role === "checker") return "/checker";
        if (role === "petugas") return "/petugas";
        return ""; 
    }, [role]);

    const baseApi = getBaseApi();
    const apiUrl = `${baseApi}/grade-hp`;

    // 2. State Management
    const [merkList, setMerkList] = useState([]);
    const [selectedMerk, setSelectedMerk] = useState("");
    const [searchMerk, setSearchMerk] = useState("");
    const [searchType, setSearchType] = useState("");
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    
    // Pagination State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Modal State
    const [openDetailModal, setOpenDetailModal] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);

    const scrollRef = useRef(null);

    // 3. Data Fetching
    useEffect(() => {
        const loadMerk = async () => {
            try {
                const res = await axiosInstance.get(`${baseApi}/merk-hp`);
                const list = res.data.data || [];
                setMerkList(list);
                if (list.length > 0) setSelectedMerk(list[0].id);
            } catch (err) {
                console.error("Gagal load merk", err);
            }
        };
        loadMerk();
    }, [baseApi]);

    const fetchData = useCallback(async () => {
        if (!selectedMerk) return;
        setTableLoading(true);
        try {
            const res = await axiosInstance.get(`${apiUrl}/by-merk/${selectedMerk}`);
            setData(res.data.data || []);
            setPage(0); 
        } catch (err) {
            console.error("Gagal fetch data grade", err);
        } finally {
            setTableLoading(false);
            setLoading(false);
        }
    }, [apiUrl, selectedMerk]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 4. Handlers
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const formatRupiah = (v) =>
        v ? new Intl.NumberFormat("id-ID", { 
            style: "currency", 
            currency: "IDR", 
            minimumFractionDigits: 0 
        }).format(v) : "Rp 0";

    // 5. Filter & Pagination Logic
    const filteredMerk = merkList.filter(m => 
        m.nama_merk.toLowerCase().includes(searchMerk.toLowerCase())
    );
    
    const filteredData = data.filter(item => 
        item.harga_hp?.type_hp?.nama_type?.toLowerCase().includes(searchType.toLowerCase())
    );

    const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

    return (
        <>
            <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                <CardHeader 
                    title={<Typography variant="h6" fontWeight="bold">Daftar Grade & Taksiran HP</Typography>} 
                    sx={{ pb: 0 }}
                />
                <CardContent>
                    {/* Search Section */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3} mt={1}>
                        <TextField 
                            label="Cari Merk..." 
                            size="small" 
                            fullWidth
                            value={searchMerk} 
                            onChange={(e) => setSearchMerk(e.target.value)} 
                        />
                        <TextField 
                            label="Cari Type..." 
                            size="small" 
                            fullWidth
                            value={searchType} 
                            onChange={(e) => {
                                setSearchType(e.target.value);
                                setPage(0);
                            }} 
                        />
                    </Stack>

                    {/* Merk Slider */}
                    <Stack direction="row" alignItems="center" mb={3} spacing={1}>
                        <IconButton onClick={() => scrollRef.current.scrollBy({ left: -200, behavior: "smooth" })}><ArrowBackIosNew /></IconButton>
                        <Box ref={scrollRef} sx={{ display: "flex", overflowX: "hidden", gap: 1, flex: 1, py: 1 }}>
                            {filteredMerk.map((m) => (
                                <Button 
                                    key={m.id} 
                                    variant={selectedMerk === m.id ? "contained" : "outlined"} 
                                    onClick={() => setSelectedMerk(m.id)} 
                                    sx={{ borderRadius: 5, flexShrink: 0, textTransform: 'none', px: 3 }}
                                >
                                    {m.nama_merk}
                                </Button>
                            ))}
                        </Box>
                        <IconButton onClick={() => scrollRef.current.scrollBy({ left: 200, behavior: "smooth" })}><ArrowForwardIos /></IconButton>
                    </Stack>

                    {/* Table Section */}
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, border: '1px solid #eee' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: "#f8f9fa" }}>
                                <TableRow>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>No</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Type HP</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Harga Pasar</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Harga Barang</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Grade A (Dus)</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Grade B (Dus)</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Grade C (Dus)</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Aksi</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tableLoading ? (
                                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
                                ) : paginatedData.length > 0 ? (
                                    paginatedData.map((item, index) => (
                                        <TableRow key={item.id} hover>
                                            <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {item.harga_hp?.type_hp?.nama_type}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ color: 'secondary.main', fontWeight: 600 }}>
                                                {formatRupiah(item.harga_hp?.harga_pasar)}
                                            </TableCell>
                                            <TableCell sx={{ color: 'primary.main', fontWeight: 600 }}>
                                                {formatRupiah(item.harga_hp?.harga_barang)}
                                            </TableCell>
                                            <TableCell align="center">{formatRupiah(item.grade_a_dus)}</TableCell>
                                            <TableCell align="center">{formatRupiah(item.grade_b_dus)}</TableCell>
                                            <TableCell align="center">{formatRupiah(item.grade_c_dus)}</TableCell>
                                            <TableCell align="center">
                                                <IconButton 
                                                    color="info" 
                                                    size="small"
                                                    onClick={() => { setSelectedDetail(item); setOpenDetailModal(true); }}
                                                >
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                                            <Typography variant="body2" color="text.secondary">Data tidak tersedia</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        component="div"
                        count={filteredData.length}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[5, 10, 25]}
                        labelRowsPerPage="Tampilkan:"
                    />
                </CardContent>
            </Card>

            {/* MODAL DETAIL */}
            <Dialog 
                open={openDetailModal} 
                onClose={() => setOpenDetailModal(false)} 
                fullWidth 
                maxWidth="sm"
                PaperProps={{ sx: { borderRadius: 4, px: 1 } }}
            >
                <DialogTitle sx={{ pb: 0 }}>
                    <Stack direction="row" spacing={2} alignItems="center" pt={1}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 50, height: 50 }}>
                            <PhoneIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight="800">Detail Taksiran</Typography>
                            <Typography variant="body2" color="text.secondary" mb={1}>
                                {selectedDetail?.harga_hp?.type_hp?.nama_type || "Memuat..."}
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                <Chip 
                                    label={`Harga Pasar: ${formatRupiah(selectedDetail?.harga_hp?.harga_pasar || 0)}`}
                                    size="small"
                                    color="secondary"
                                    sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                                />
                                <Chip 
                                    label={`Harga Barang: ${formatRupiah(selectedDetail?.harga_hp?.harga_barang || 0)}`}
                                    size="small"
                                    color="primary"
                                    sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                                />
                            </Stack>
                        </Box>
                    </Stack>
                </DialogTitle>

                <DialogContent dividers sx={{ border: 'none', mt: 2 }}>
                    {!selectedDetail ? (
                        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
                    ) : (
                        <Grid container spacing={2}>
                            {['a', 'b', 'c'].map((g) => (
                                <Grid item xs={12} key={g}>
                                    <Paper 
                                        variant="outlined" 
                                        sx={{ 
                                            p: 2, 
                                            borderRadius: 3, 
                                            bgcolor: g === 'a' ? '#f0f9ff' : g === 'b' ? '#fffbeb' : '#f9fafb',
                                            border: '1px solid',
                                            borderColor: g === 'a' ? 'primary.light' : g === 'b' ? 'warning.light' : 'divider'
                                        }}
                                    >
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Chip 
                                                label={`GRADE ${g.toUpperCase()}`} 
                                                color={g === 'a' ? "primary" : g === 'b' ? "warning" : "default"}
                                                size="small"
                                                sx={{ fontWeight: 'bold' }}
                                            />
                                            <Typography variant="caption" color="text.secondary">Pinjaman Maksimal</Typography>
                                        </Stack>

                                        <Grid container spacing={2}>
                                            {/* DUS SECTION */}
                                            <Grid item xs={6}>
                                                <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
                                                    <BoxIcon sx={{ fontSize: 16 }} color="success" />
                                                    <Typography variant="caption" fontWeight="bold">Lengkap (Dus)</Typography>
                                                </Stack>
                                                <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 2, border: '1px solid rgba(0,0,0,0.05)' }}>
                                                    <Typography variant="caption" color="text.secondary" display="block">Taksiran:</Typography>
                                                    <Typography variant="body2" fontWeight="bold" color="success.main">
                                                        {formatRupiah(selectedDetail[`taksiran_${g}_dus`])}
                                                    </Typography>
                                                    <Divider sx={{ my: 0.5 }} />
                                                    <Typography variant="caption" display="block">Plafon Max:</Typography>
                                                    <Typography variant="subtitle2" fontWeight="800" color="primary.main">
                                                        {formatRupiah(selectedDetail[`grade_${g}_dus`])}
                                                    </Typography>
                                                </Box>
                                            </Grid>

                                            {/* NO DUS SECTION */}
                                            <Grid item xs={6}>
                                                <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
                                                    <NoBoxIcon sx={{ fontSize: 16 }} color="error" />
                                                    <Typography variant="caption" fontWeight="bold">Batangan</Typography>
                                                </Stack>
                                                <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 2, border: '1px solid rgba(0,0,0,0.05)' }}>
                                                    <Typography variant="caption" color="text.secondary" display="block">Taksiran:</Typography>
                                                    <Typography variant="body2" fontWeight="bold" color="error.main">
                                                        {formatRupiah(selectedDetail[`taksiran_${g}_tanpa_dus`])}
                                                    </Typography>
                                                    <Divider sx={{ my: 0.5 }} />
                                                    <Typography variant="caption" display="block">Plafon Max:</Typography>
                                                    <Typography variant="subtitle2" fontWeight="800" color="primary.main">
                                                        {formatRupiah(selectedDetail[`grade_${g}_tanpa_dus`])}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2, pb: 3 }}>
                    <Button 
                        onClick={() => setOpenDetailModal(false)} 
                        fullWidth 
                        variant="contained" 
                        sx={{ borderRadius: 3, py: 1, fontWeight: 'bold', textTransform: 'none' }}
                    >
                        Tutup Detail
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default GradeHpPage;