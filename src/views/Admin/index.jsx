import React, { useEffect, useState, useContext } from "react";
import {
    Card, CardHeader, CardContent, Divider,
    Table, TableContainer, TableHead, TableBody,
    TableRow, TableCell, TablePagination,
    Stack, Box, CircularProgress, Paper,
    Typography, TextField, Chip, Tabs, Tab, Tooltip
} from "@mui/material";
import { Check, Close as CloseIcon, WarningAmber } from "@mui/icons-material";
import axiosInstance from "api/axiosInstance";
import { AuthContext } from "AuthContex/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminLaporanPage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [data, setData] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [types, setTypes] = useState([]);
    const [activeTab, setActiveTab] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const endpoint = user?.role === "hm" ? "/laporan" : "/admin/laporan";
    const typeEndpoint = user?.role === "hm" ? "/type" : "/admin/type";

    const safe = (v) => (v ?? "").toString().toLowerCase();

    const formatRp = (val) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val || 0);

    const fetchData = async () => {
        try {
            const res = await axiosInstance.get(endpoint);
            if (res.data?.success) {
                const list = Array.isArray(res.data.data) ? res.data.data : [];
                
                // 🔍 DEBUG: Cek struktur data dari backend
                console.log("📦 Total data:", list.length);
                console.log("📦 Sample data pertama:", list[0]);
                console.log("📦 Semua field type di data:", list.map(d => ({
                    no_gadai: d.no_gadai,
                    type: d.type,
                    nama_nasabah: d.nama_nasabah
                })));
                
                setData(list);
                setFiltered(list);
            } else {
                setError(res.data?.message || "Gagal memuat data laporan.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Server error");
        } finally {
            setLoading(false);
        }
    };

    const fetchTypes = async () => {
        try {
            const res = await axiosInstance.get(typeEndpoint);
            if (res.data?.success) {
                // Pastikan data types terurut berdasarkan nomor_type atau nama
                const sortedTypes = res.data.data.sort((a, b) => 
                    a.nomor_type.localeCompare(b.nomor_type)
                );
                setTypes(sortedTypes);
            }
        } catch (e) {
            console.error("Gagal load types:", e);
        }
    };

    useEffect(() => {
        fetchData();
        fetchTypes();
    }, []);

    useEffect(() => {
        let result = [...data];
        
        // ✅ FIX: Filter berdasarkan tab type yang aktif
        if (activeTab !== "all") {
            console.log("🔍 Active Tab:", activeTab);
            console.log("🔍 Data sebelum filter:", result.length);
            
            result = result.filter((item) => {
                const itemType = safe(item.type || "");
                const tabType = safe(activeTab);
                
                console.log(`  - Item: "${item.no_gadai}" | Type: "${itemType}" | Match: ${itemType === tabType}`);
                
                return itemType === tabType;
            });
            
            console.log("✅ Data setelah filter:", result.length);
        }
        
        // Filter berdasarkan search term
        const search = safe(searchTerm);
        if (search) {
            result = result.filter(
                (item) =>
                    safe(item.nama_nasabah).includes(search) ||
                    safe(item.no_gadai).includes(search)
            );
        }
        
        setFiltered(result);
        setPage(0);
    }, [activeTab, searchTerm, data]);

    const handleChangePage = (_, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (e) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

    const getStatusIcon = (val) => {
        if (!val) return null;
        const v = val.toLowerCase();
        if (v.includes("approved")) return <Check sx={{ color: "white", fontSize: 16 }} />;
        if (v.includes("rejected")) return <CloseIcon sx={{ color: "white", fontSize: 16 }} />;
        return null;
    };

    const getStatusColor = (val) => {
        if (!val) return "default";
        const v = val.toLowerCase();
        if (v.includes("approved")) return "success";
        if (v.includes("rejected")) return "error";
        return "default";
    };

    // ✅ FIX: Fungsi untuk hitung total data per type
    const getTypeCount = (typeName) => {
        if (typeName === "all") return data.length;
        
        const count = data.filter((item) => {
            const itemType = safe(item.type || "");
            const searchType = safe(typeName);
            
            // Debug per item
            console.log(`🔍 Comparing: "${itemType}" === "${searchType}"`, itemType === searchType);
            
            return itemType === searchType;
        }).length;
        
        console.log(`📊 Count untuk "${typeName}":`, count);
        return count;
    };

    if (loading)
        return (
            <Stack alignItems="center" justifyContent="center" sx={{ height: "80vh" }}>
                <CircularProgress />
            </Stack>
        );

    if (error) {
        return (
            <Card sx={{ borderRadius: 2, boxShadow: 3, p: 3 }}>
                <Typography color="error" align="center">{error}</Typography>
            </Card>
        );
    }

    return (
        <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardHeader
                title={user?.role === "hm" ? "Laporan HM" : "Laporan Admin"}
                titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                action={
                    <TextField
                        variant="outlined"
                        size="small"
                        placeholder="Cari nasabah / no gadai..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ width: { xs: "100%", sm: 300 }, backgroundColor: 'white' }}
                    />
                }
            />
            <Divider />

            {/* ✅ TAB FILTER BERDASARKAN TYPE */}
            <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ 
                    px: 2, 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: '0.9rem'
                    }
                }}
            >
                <Tab 
                    label={`Semua (${getTypeCount("all")})`} 
                    value="all" 
                />
                {types.map((t) => (
                    <Tab 
                        key={t.id} 
                        label={`${t.nama_type} (${getTypeCount(t.nama_type)})`} 
                        value={t.nama_type.toLowerCase()} 
                    />
                ))}
            </Tabs>

            <CardContent sx={{ p: 0 }}>
                {filtered.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body1" color="textSecondary">
                            {searchTerm 
                                ? `Tidak ada data yang cocok dengan "${searchTerm}"`
                                : "Tidak ada data untuk ditampilkan"
                            }
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                                        <TableCell sx={{ fontWeight: 'bold' }}>No</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>No Gadai</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Nasabah</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Tenor</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Pinjaman</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Telat</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Denda</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>Hutang</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Checker</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>HM</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Aksi</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                                        <TableRow key={row.id} hover>
                                            <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                                            
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="medium">{row.no_gadai}</Typography>
                                                <Typography variant="caption" color="textSecondary">JT: {row.jatuh_tempo}</Typography>
                                            </TableCell>
                                            
                                            <TableCell>{row.nama_nasabah}</TableCell>
                                            
                                            {/* ✅ KOLOM TYPE - Ambil dari berbagai kemungkinan field */}
                                            <TableCell>
                                                <Chip 
                                                    label={row.type || row.nama_type || row.type_barang || "-"} 
                                                    size="small" 
                                                    variant="outlined"
                                                    color="primary"
                                                    sx={{ fontWeight: 500 }}
                                                />
                                            </TableCell>

                                            {/* ✅ KOLOM TENOR */}
                                            <TableCell align="center">
                                                <Typography variant="body2" sx={{ fontWeight: '500' }}>
                                                    {row.tenor_pilihan || "15 Hari"}
                                                </Typography>
                                            </TableCell>

                                            <TableCell align="right">{formatRp(row.pinjaman_pokok)}</TableCell>
                                            
                                            {/* ✅ KOLOM TELAT */}
                                            <TableCell align="center">
                                                {row.hari_terlambat > 0 ? (
                                                    <Chip 
                                                        label={`${row.hari_terlambat} Hari`} 
                                                        size="small" 
                                                        sx={{ 
                                                            fontWeight: 'bold',
                                                            backgroundColor: '#ffebee',
                                                            color: '#c62828',
                                                            border: '1px solid #ef5350'
                                                        }}
                                                        icon={<WarningAmber style={{ fontSize: 14, color: '#c62828' }} />}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" color="textSecondary">-</Typography>
                                                )}
                                            </TableCell>

                                            <TableCell align="right">{formatRp(row.denda)}</TableCell>
                                            
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight="bold" color="primary.main">
                                                    {formatRp(row.total_hutang)}
                                                </Typography>
                                            </TableCell>

                                            {/* KOLOM CHECKER */}
                                            <TableCell align="center">
                                                <Tooltip title={row.acc_checker || "-"}>
                                                    <Chip
                                                        icon={getStatusIcon(row.acc_checker)}
                                                        color={getStatusColor(row.acc_checker)}
                                                        size="small"
                                                        sx={{ width: 28, height: 28, '& .MuiChip-icon': { ml: 1, mr: -1 } }}
                                                    />
                                                </Tooltip>
                                            </TableCell>

                                            {/* KOLOM HM */}
                                            <TableCell align="center">
                                                <Tooltip title={row.acc_hm || "-"}>
                                                    <Chip
                                                        icon={getStatusIcon(row.acc_hm)}
                                                        color={getStatusColor(row.acc_hm)}
                                                        size="small"
                                                        sx={{ width: 28, height: 28, '& .MuiChip-icon': { ml: 1, mr: -1 } }}
                                                    />
                                                </Tooltip>
                                            </TableCell>

                                            {/* KOLOM AKSI */}
                                            <TableCell align="center">
                                                <button
                                                    onClick={() => navigate(`/admin-detail/${row.id}`)}
                                                    style={{
                                                        padding: "6px 16px",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        backgroundColor: "#1976d2",
                                                        color: "white",
                                                        cursor: "pointer",
                                                        fontSize: "12px",
                                                        fontWeight: "bold",
                                                        transition: "all 0.2s"
                                                    }}
                                                    onMouseOver={(e) => e.target.style.backgroundColor = "#1565c0"}
                                                    onMouseOut={(e) => e.target.style.backgroundColor = "#1976d2"}
                                                >
                                                    DETAIL
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50, 100]}
                            component="div"
                            count={filtered.length}
                            page={page}
                            rowsPerPage={rowsPerPage}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            labelRowsPerPage="Baris per halaman:"
                            labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count}`}
                        />
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default AdminLaporanPage;