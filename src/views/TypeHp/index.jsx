import React, { useEffect, useState, useRef, useCallback } from "react";
import {
    Card, CardHeader, CardContent, Divider, Table, TableContainer,
    TableHead, TableBody, TableRow, TableCell, TablePagination,
    IconButton, Button, CircularProgress, Stack, Grid, Typography, Paper,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip,
    Box, useTheme, useMediaQuery, Avatar
} from "@mui/material";

import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    ArrowBackIosNew, ArrowForwardIos, Search as SearchIcon,
    CheckCircle as CheckCircleIcon, Cancel as CancelIcon,
    PhoneIphone as PhoneIcon
} from "@mui/icons-material";

import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

const TypeHpPage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    
    const user = JSON.parse(localStorage.getItem("auth_user"));
    const role = (user?.role || "").toLowerCase();
    const canManage = role === "hm" || role === "checker";

    const getBaseApi = () => {
        if (role === "checker") return "/checker";
        if (role === "petugas") return "/petugas";
        return ""; 
    };
    const baseApi = getBaseApi();

    const [merkList, setMerkList] = useState([]);
    const [selectedMerk, setSelectedMerk] = useState("");
    const [typeList, setTypeList] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchMerk, setSearchMerk] = useState("");
    const [searchType, setSearchType] = useState("");

    const scrollRef = useRef(null);
    const scrollLeft = () => scrollRef.current.scrollBy({ left: -150, behavior: "smooth" });
    const scrollRight = () => scrollRef.current.scrollBy({ left: 150, behavior: "smooth" });

    const [openEdit, setOpenEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ nama_type: "", merk_hp_id: "" });

    useEffect(() => {
        const loadMerk = async () => {
            try {
                const res = await axiosInstance.get(`${baseApi}/merk-hp`);
                const list = res.data.data || [];
                setMerkList(list);
                if (list.length > 0) setSelectedMerk(list[0].id);
            } catch {
                console.error("Gagal mengambil data merk");
            } finally {
                setLoading(false);
            }
        };
        loadMerk();
    }, [baseApi]);

    const fetchTypes = useCallback(async () => {
        if (!selectedMerk) return;
        setTableLoading(true);
        try {
            const res = await axiosInstance.get(`${baseApi}/type-hp/by-merk/${selectedMerk}`, {
                params: {
                    page: page + 1,
                    per_page: rowsPerPage,
                    search: searchType
                }
            });
            setTypeList(res.data.data || []);
            setTotalRows(res.data.total || 0);
        } catch (error) {
            console.error("Gagal mengambil data tipe HP");
        } finally {
            setTableLoading(false);
        }
    }, [selectedMerk, page, rowsPerPage, searchType, baseApi]);

    useEffect(() => {
        fetchTypes();
    }, [fetchTypes]);

    const handleOpenEdit = (item) => {
        setEditId(item.id);
        setForm({ nama_type: item.nama_type, merk_hp_id: item.merk_hp_id });
        setOpenEdit(true);
    };

    const handleUpdate = async () => {
        try {
            await axiosInstance.put(`${baseApi}/type-hp/${editId}`, form);
            setOpenEdit(false);
            fetchTypes();
        } catch (error) {
            alert("Gagal update");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus?")) return;
        try {
            await axiosInstance.delete(`${baseApi}/type-hp/${id}`);
            fetchTypes();
        } catch {
            alert("Gagal menghapus");
        }
    };

    if (loading) return (
        <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
            <CircularProgress />
        </Box>
    );

    const filteredMerk = merkList.filter(m =>
        m.nama_merk.toLowerCase().includes(searchMerk.toLowerCase())
    );

    return (
        <Box sx={{ p: { xs: 1, md: 3 } }}>
            <Card sx={{ boxShadow: 3, borderRadius: { xs: 2, md: 3 } }}>
                <CardHeader
                    title={<Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="bold">Master Type HP</Typography>}
                    action={
                        canManage && (
                            <Button 
                                variant="contained" 
                                size={isMobile ? "small" : "medium"}
                                startIcon={<AddIcon />} 
                                onClick={() => navigate("/type-hp/tambah")}
                            >
                                {isMobile ? "Tambah" : "Tambah Type"}
                            </Button>
                        )
                    }
                />
                <Divider />

                <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
                    {/* Filter Section */}
                    <Grid container spacing={1.5} mb={3}>
                        <Grid item xs={6} sm={4}>
                            <TextField
                                fullWidth
                                label="Cari Merk..."
                                size="small"
                                value={searchMerk}
                                onChange={(e) => setSearchMerk(e.target.value)}
                                InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5 }} /> }}
                            />
                        </Grid>
                        <Grid item xs={6} sm={4}>
                            <TextField
                                fullWidth
                                label="Cari Type..."
                                size="small"
                                value={searchType}
                                onChange={(e) => { setSearchType(e.target.value); setPage(0); }}
                                InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5 }} /> }}
                            />
                        </Grid>
                    </Grid>

                    {/* Merk Slider */}
                    <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                        {!isMobile && <IconButton onClick={scrollLeft} sx={{ bgcolor: "#eee" }} size="small"><ArrowBackIosNew fontSize="inherit" /></IconButton>}
                        <Stack
                            ref={scrollRef}
                            direction="row"
                            spacing={1}
                            sx={{ 
                                overflowX: "auto", 
                                whiteSpace: "nowrap", 
                                flex: 1, 
                                py: 1, 
                                scrollbarWidth: 'none', // Firefox
                                "&::-webkit-scrollbar": { display: "none" } // Chrome/Safari
                            }}
                        >
                            {filteredMerk.map((m) => (
                                <Button
                                    key={m.id}
                                    variant={selectedMerk === m.id ? "contained" : "outlined"}
                                    size={isMobile ? "small" : "medium"}
                                    onClick={() => { setSelectedMerk(m.id); setPage(0); }}
                                    sx={{ 
                                        flexShrink: 0, 
                                        borderRadius: 5, 
                                        textTransform: 'none',
                                        px: isMobile ? 2 : 3
                                    }}
                                >
                                    {m.nama_merk}
                                </Button>
                            ))}
                        </Stack>
                        {!isMobile && <IconButton onClick={scrollRight} sx={{ bgcolor: "#eee" }} size="small"><ArrowForwardIos fontSize="inherit" /></IconButton>}
                    </Stack>

                    {isMobile ? (
                        /* MOBILE VIEW: Card List */
                        <Stack spacing={1.5}>
                            {tableLoading ? (
                                <Box textAlign="center" py={3}><CircularProgress size={30} /></Box>
                            ) : typeList.length === 0 ? (
                                <Typography variant="body2" align="center" color="text.secondary">Tidak ada data</Typography>
                            ) : (
                                typeList.map((item, index) => (
                                    <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Stack direction="row" spacing={2} alignItems="center">
                                                <Avatar sx={{ bgcolor: item.has_grade ? 'success.light' : 'warning.light', width: 35, height: 35 }}>
                                                    <PhoneIcon sx={{ fontSize: 18 }} />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold">{item.nama_type}</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        No: {page * rowsPerPage + index + 1} • {item.has_grade ? "Ready" : "No Grade"}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                            
                                            {canManage && (
                                                <Stack direction="row">
                                                    <IconButton size="small" color="primary" onClick={() => handleOpenEdit(item)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            )}
                                        </Stack>
                                    </Paper>
                                ))
                            )}
                        </Stack>
                    ) : (
                        /* DESKTOP VIEW: Table */
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead sx={{ background: "#f8fafc" }}>
                                    <TableRow>
                                        <TableCell align="center" width={70}><b>No</b></TableCell>
                                        <TableCell><b>Type HP</b></TableCell>
                                        <TableCell align="center"><b>Status Grade</b></TableCell>
                                        {canManage && <TableCell align="center"><b>Aksi</b></TableCell>}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tableLoading ? (
                                        <TableRow><TableCell colSpan={4} align="center"><CircularProgress size={25} sx={{ my: 2 }} /></TableCell></TableRow>
                                    ) : (
                                        typeList.map((item, index) => (
                                            <TableRow key={item.id} hover>
                                                <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                                                <TableCell sx={{ fontWeight: 500 }}>{item.nama_type}</TableCell>
                                                <TableCell align="center">
                                                    <Chip 
                                                        icon={item.has_grade ? <CheckCircleIcon /> : <CancelIcon />} 
                                                        label={item.has_grade ? "Ready" : "No Grade"} 
                                                        color={item.has_grade ? "success" : "warning"} 
                                                        size="small" variant="outlined" 
                                                    />
                                                </TableCell>
                                                {canManage && (
                                                    <TableCell align="center">
                                                        <IconButton color="primary" size="small" onClick={() => handleOpenEdit(item)}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton color="error" size="small" onClick={() => handleDelete(item.id)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    <TablePagination
                        component="div"
                        count={totalRows}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_, p) => setPage(p)}
                        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        labelRowsPerPage={isMobile ? "Hal:" : "Rows:"}
                    />
                </CardContent>
            </Card>

            <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Nama Type</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth label="Nama Type HP" margin="dense" variant="outlined"
                        value={form.nama_type}
                        onChange={(e) => setForm({ ...form, nama_type: e.target.value })}
                        autoFocus
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenEdit(false)} color="inherit">Batal</Button>
                    <Button variant="contained" onClick={handleUpdate} disabled={!form.nama_type}>Simpan</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TypeHpPage;