import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    Card, CardHeader, CardContent, Divider,
    Table, TableContainer, TableHead, TableBody,
    TableRow, TableCell, TablePagination,
    IconButton, Button, CircularProgress,
    Stack, Grid, Typography, Paper, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Chip, Avatar, useTheme, useMediaQuery
} from "@mui/material";

import {
    ArrowBackIosNew, ArrowForwardIos, 
    Visibility as VisibilityIcon,
    Smartphone as PhoneIcon, 
    Inventory as BoxIcon,     
    PhonelinkErase as NoBoxIcon,
    Search as SearchIcon,
    AttachMoney as MoneyIcon,
    Assessment as AssessmentIcon,
    Store as StoreIcon
} from "@mui/icons-material";

import axiosInstance from "api/axiosInstance";

const GradeHpPage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const authData = JSON.parse(localStorage.getItem("auth_user"));
    const role = authData?.role?.toLowerCase() || "";

    const getBaseApi = useCallback(() => {
        if (role === "checker") return "/checker";
        if (role === "petugas") return "/petugas";
        return ""; 
    }, [role]);

    const baseApi = getBaseApi();
    const apiUrl = `${baseApi}/grade-hp`;

    const [merkList, setMerkList] = useState([]);
    const [selectedMerk, setSelectedMerk] = useState("");
    const [searchMerk, setSearchMerk] = useState("");
    const [searchType, setSearchType] = useState("");
    const [data, setData] = useState([]);
    const [totalData, setTotalData] = useState(0);
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [openDetailModal, setOpenDetailModal] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);

    const scrollRef = useRef(null);

    const formatRupiah = (v) =>
        v ? new Intl.NumberFormat("id-ID", { 
            style: "currency", 
            currency: "IDR", 
            minimumFractionDigits: 0 
        }).format(v) : "Rp 0";

    // Calculate taksiran as 110% (harga + 10%) of grade value
    const calculateTaksiranGrade = (gradeValue) => {
        if (!gradeValue) return 0;
        return Math.round(gradeValue * 1.1); // 110% = harga + 10%
    };

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
            const res = await axiosInstance.get(`${apiUrl}/by-merk/${selectedMerk}`, {
                params: {
                    page: page + 1, 
                    per_page: rowsPerPage,
                    search: searchType 
                }
            });
            // FILTER: Buang data null dari API sebelum disimpan ke state
            const cleanData = (res.data.data || []).filter(item => item !== null);
            setData(cleanData); 
            setTotalData(res.data.meta?.total || 0); 
        } catch (err) {
            console.error("Gagal fetch data grade", err);
        } finally {
            setTableLoading(false);
            setLoading(false);
        }
    }, [apiUrl, selectedMerk, page, rowsPerPage, searchType]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredMerk = merkList.filter(m => 
        m.nama_merk.toLowerCase().includes(searchMerk.toLowerCase())
    );

    if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

    return (
        <Box sx={{ p: { xs: 1, md: 2 } }}>
            <Card sx={{ borderRadius: { xs: 2, md: 3 }, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                <CardHeader 
                    title={<Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="bold">Daftar Grade & Taksiran HP</Typography>} 
                    sx={{ pb: 0, px: { xs: 2, md: 3 } }}
                />
                <CardContent sx={{ px: { xs: 1.5, md: 3 } }}>
                    {/* Search Section */}
                    <Grid container spacing={2} mb={3} mt={0.5}>
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                label="Cari Merk..." 
                                size="small" 
                                fullWidth
                                value={searchMerk} 
                                onChange={(e) => setSearchMerk(e.target.value)}
                                InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                label="Cari Type..." 
                                size="small" 
                                fullWidth
                                value={searchType} 
                                onChange={(e) => { setSearchType(e.target.value); setPage(0); }}
                                InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
                            />
                        </Grid>
                    </Grid>

                    {/* Merk Slider */}
                    <Stack direction="row" alignItems="center" mb={3} spacing={1}>
                        <IconButton size="small" onClick={() => scrollRef.current.scrollBy({ left: -150, behavior: "smooth" })} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                            <ArrowBackIosNew fontSize="small" />
                        </IconButton>
                        <Box 
                            ref={scrollRef} 
                            sx={{ 
                                display: "flex", 
                                overflowX: "auto", 
                                gap: 1, 
                                flex: 1, 
                                py: 0.5,
                                scrollbarWidth: 'none', 
                                '&::-webkit-scrollbar': { display: 'none' } 
                            }}
                        >
                            {filteredMerk.map((m) => (
                                <Button 
                                    key={m.id} 
                                    variant={selectedMerk === m.id ? "contained" : "outlined"} 
                                    onClick={() => { setSelectedMerk(m.id); setPage(0); }} 
                                    sx={{ borderRadius: 5, flexShrink: 0, textTransform: 'none', px: 2.5, whiteSpace: 'nowrap', fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                                >
                                    {m.nama_merk}
                                </Button>
                            ))}
                        </Box>
                        <IconButton size="small" onClick={() => scrollRef.current.scrollBy({ left: 150, behavior: "smooth" })} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                            <ArrowForwardIos fontSize="small" />
                        </IconButton>
                    </Stack>

                    {/* Content Area */}
                    {isMobile ? (
                        <Stack spacing={2}>
                            {tableLoading ? (
                                <Box textAlign="center" py={3}><CircularProgress size={30} /></Box>
                            ) : data.length > 0 ? (
                                data.map((item) => (
                                    <Paper key={item?.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Box>
                                                <Typography variant="body1" fontWeight="bold">
                                                    {item?.harga_hp?.type_hp?.nama_type || "Unknown"}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                                    Pasar: {formatRupiah(item?.harga_hp?.harga_pasar)}
                                                </Typography>
                                                <Stack direction="row" spacing={1}>
                                                    <Chip label={`A: ${formatRupiah(item?.grade_a_dus)}`} size="small" color="primary" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                                                    <Chip label={`B: ${formatRupiah(item?.grade_b_dus)}`} size="small" color="warning" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                                                </Stack>
                                            </Box>
                                            <IconButton color="info" size="small" onClick={() => { setSelectedDetail(item); setOpenDetailModal(true); }}>
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </Paper>
                                ))
                            ) : (
                                <Typography align="center" color="text.secondary" py={4}>Data tidak tersedia</Typography>
                            )}
                        </Stack>
                    ) : (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflowX: "auto" }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: "#f8f9fa" }}>
                                    <TableRow>
                                        <TableCell align="center">No</TableCell>
                                        <TableCell>Type HP</TableCell>
                                        <TableCell>Harga Pasar</TableCell>
                                        <TableCell align="center">Grade A (Dus)</TableCell>
                                        <TableCell align="center">Grade B (Dus)</TableCell>
                                        <TableCell align="center">Grade C (Dus)</TableCell>
                                        <TableCell align="center">Aksi</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tableLoading ? (
                                        <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
                                    ) : data.length > 0 ? (
                                        data.map((item, index) => (
                                            <TableRow key={item?.id} hover>
                                                <TableCell align="center">{(page * rowsPerPage) + index + 1}</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>{item?.harga_hp?.type_hp?.nama_type || "-"}</TableCell>
                                                <TableCell sx={{ color: 'secondary.main', fontWeight: 600 }}>{formatRupiah(item?.harga_hp?.harga_pasar)}</TableCell>
                                                <TableCell align="center">{formatRupiah(item?.grade_a_dus)}</TableCell>
                                                <TableCell align="center">{formatRupiah(item?.grade_b_dus)}</TableCell>
                                                <TableCell align="center">{formatRupiah(item?.grade_c_dus)}</TableCell>
                                                <TableCell align="center">
                                                    <IconButton color="info" size="small" onClick={() => { setSelectedDetail(item); setOpenDetailModal(true); }}>
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}>Data tidak ditemukan</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    <TablePagination
                        component="div"
                        count={totalData} 
                        page={page}
                        onPageChange={(e, p) => setPage(p)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        rowsPerPageOptions={[5, 10, 25]}
                        labelRowsPerPage={isMobile ? "Hlm:" : "Tampilkan:"}
                    />
                </CardContent>
            </Card>

            {/* MODAL DETAIL - Enhanced with Taksiran per Grade */}
            <Dialog 
                open={openDetailModal} 
                onClose={() => setOpenDetailModal(false)} 
                fullWidth 
                maxWidth="sm"
                fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4 } }}
            >
                <DialogTitle>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: 'primary.main', width: 45, height: 45 }}>
                            <PhoneIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold" noWrap>
                                {selectedDetail?.harga_hp?.type_hp?.nama_type || "Detail"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">Detail Taksiran Lengkap</Typography>
                        </Box>
                        {isMobile && (
                            <IconButton onClick={() => setOpenDetailModal(false)} size="small">
                                <ArrowBackIosNew fontSize="small" />
                            </IconButton>
                        )}
                    </Stack>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ p: { xs: 1.5, sm: 3 } }}>
                    {selectedDetail ? (
                        <Stack spacing={2.5}>
                            {/* PRICE INFORMATION SECTION */}
                            <Paper 
                                variant="outlined" 
                                sx={{ 
                                    p: 2.5, 
                                    borderRadius: 2, 
                                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                    border: '2px solid',
                                    borderColor: 'primary.light'
                                }}
                            >
                                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                                    <MoneyIcon sx={{ color: 'primary.main' }} />
                                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                                        INFORMASI HARGA
                                    </Typography>
                                </Stack>
                                
                                <Grid container spacing={2}>
                                    {/* Harga Pasar */}
                                    <Grid item xs={12} sm={6}>
                                        <Paper 
                                            elevation={0}
                                            sx={{ 
                                                p: 1.5, 
                                                borderRadius: 1.5,
                                                bgcolor: 'white',
                                                border: '1px solid',
                                                borderColor: 'divider'
                                            }}
                                        >
                                            <Stack spacing={0.5}>
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <StoreIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                                                    <Typography variant="caption" color="text.secondary" fontWeight="600">
                                                        Harga Pasar
                                                    </Typography>
                                                </Stack>
                                                <Typography variant="body2" fontWeight="bold" color="secondary.main">
                                                    {formatRupiah(selectedDetail?.harga_hp?.harga_pasar || 0)}
                                                </Typography>
                                            </Stack>
                                        </Paper>
                                    </Grid>

                                    {/* Harga Barang */}
                                    <Grid item xs={12} sm={6}>
                                        <Paper 
                                            elevation={0}
                                            sx={{ 
                                                p: 1.5, 
                                                borderRadius: 1.5,
                                                bgcolor: 'white',
                                                border: '1px solid',
                                                borderColor: 'divider'
                                            }}
                                        >
                                            <Stack spacing={0.5}>
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <MoneyIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                                    <Typography variant="caption" color="text.secondary" fontWeight="600">
                                                        Harga Barang
                                                    </Typography>
                                                </Stack>
                                                <Typography variant="body2" fontWeight="bold" color="success.main">
                                                    {formatRupiah(selectedDetail?.harga_hp?.harga_barang || 0)}
                                                </Typography>
                                            </Stack>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* GRADE SECTION with TAKSIRAN per Grade */}
                            <Box>
                                <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                                    <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                    <Typography variant="body2" fontWeight="bold" color="text.secondary">
                                        GRADE, KELENGKAPAN & TAKSIRAN
                                    </Typography>
                                </Stack>
                                
                                <Grid container spacing={2}>
                                    {['a', 'b', 'c'].map((g) => (
                                        <Grid item xs={12} key={g}>
                                            <Paper 
                                                variant="outlined" 
                                                sx={{ 
                                                    p: 2, 
                                                    borderRadius: 2, 
                                                    bgcolor: g === 'a' ? '#f0f9ff' : g === 'b' ? '#fffbeb' : '#f9fafb',
                                                    border: '2px solid',
                                                    borderColor: g === 'a' ? 'primary.light' : g === 'b' ? 'warning.light' : 'grey.300'
                                                }}
                                            >
                                                <Chip 
                                                    label={`GRADE ${g.toUpperCase()}`} 
                                                    color={g === 'a' ? "primary" : g === 'b' ? "warning" : "default"} 
                                                    size="small" 
                                                    sx={{ fontWeight: 'bold', mb: 2 }} 
                                                />
                                                <Grid container spacing={2}>
                                                    {/* Lengkap (Dus) */}
                                                    <Grid item xs={6}>
                                                        <Stack spacing={1}>
                                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                                <BoxIcon sx={{ fontSize: 14 }} color="success" />
                                                                <Typography variant="caption" fontWeight="bold">Lengkap</Typography>
                                                            </Stack>
                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary" display="block">
                                                                    Harga:
                                                                </Typography>
                                                                <Typography variant="body2" fontWeight="bold" color="primary.main" mb={0.5}>
                                                                    {formatRupiah(selectedDetail[`grade_${g}_dus`] || 0)}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary" display="block">
                                                                    Taksiran :
                                                                </Typography>
                                                                <Typography variant="body2" fontWeight="bold" color="success.main" sx={{ fontSize: '0.95rem' }}>
                                                                    {formatRupiah(calculateTaksiranGrade(selectedDetail[`grade_${g}_dus`]))}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                    </Grid>

                                                    {/* Batangan (Tanpa Dus) */}
                                                    <Grid item xs={6}>
                                                        <Stack spacing={1}>
                                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                                <NoBoxIcon sx={{ fontSize: 14 }} color="error" />
                                                                <Typography variant="caption" fontWeight="bold">Batangan</Typography>
                                                            </Stack>
                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary" display="block">
                                                                    Harga:
                                                                </Typography>
                                                                <Typography variant="body2" fontWeight="bold" color="primary.main" mb={0.5}>
                                                                    {formatRupiah(selectedDetail[`grade_${g}_tanpa_dus`] || 0)}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary" display="block">
                                                                    Taksiran (+10%):
                                                                </Typography>
                                                                <Typography variant="body2" fontWeight="bold" color="success.main" sx={{ fontSize: '0.95rem' }}>
                                                                    {formatRupiah(calculateTaksiranGrade(selectedDetail[`grade_${g}_tanpa_dus`]))}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                    </Grid>
                                                </Grid>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        </Stack>
                    ) : (
                        <Box textAlign="center" py={3}><CircularProgress /></Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button 
                        onClick={() => setOpenDetailModal(false)} 
                        fullWidth 
                        variant="contained" 
                        sx={{ borderRadius: 2 }}
                    >
                        Tutup
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default GradeHpPage;