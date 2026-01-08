import React, { useEffect, useState, useContext, useCallback } from "react";
import {
    Card, CardHeader, CardContent, Divider,
    Table, TableContainer, TableHead, TableBody,
    TableRow, TableCell, TablePagination,
    Stack, Box, CircularProgress, Paper,
    Typography, TextField, Chip, Tabs, Tab, Tooltip, Button
} from "@mui/material";
import { Check, Close as CloseIcon, WarningAmber, ListAlt, AssignmentTurnedIn, History } from "@mui/icons-material";
import axiosInstance from "api/axiosInstance";
import { AuthContext } from "AuthContex/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminLaporanPage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [data, setData] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [types, setTypes] = useState([]);
    
    // State Filter
    const [activeTabStatus, setActiveTabStatus] = useState("all"); // Filter Status (Baru)
    const [activeTabType, setActiveTabType] = useState("all");     // Filter Type
    
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

    // ✅ FETCH DATA dengan Parameter Status
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Jika tab status bukan 'all', masukkan ke parameter query
            const params = activeTabStatus !== "all" ? { status: activeTabStatus } : {};
            const res = await axiosInstance.get(endpoint, { params });
            
            if (res.data?.success) {
                const list = Array.isArray(res.data.data) ? res.data.data : [];
                setData(list);
                setFiltered(list);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Server error");
        } finally {
            setLoading(false);
        }
    }, [activeTabStatus, endpoint]);

    const fetchTypes = async () => {
        try {
            const res = await axiosInstance.get(typeEndpoint);
            if (res.data?.success) {
                setTypes(res.data.data);
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchData();
        fetchTypes();
    }, [fetchData]);

    useEffect(() => {
        let result = [...data];
        
        // Filter Type (Local Filter)
        if (activeTabType !== "all") {
            result = result.filter((item) => safe(item.type) === safe(activeTabType));
        }
        
        // Filter Search
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
    }, [activeTabType, searchTerm, data]);

    const getStatusStyle = (status) => {
        const s = safe(status);
        if (s === "lunas") return { color: "success", label: "LUNAS" };
        if (s === "proses") return { color: "warning", label: "PROSES" };
        if (s === "terlelang") return { color: "error", label: "TERLELANG" };
        return { color: "default", label: s.toUpperCase() };
    };

    if (loading && data.length === 0)
        return ( <Stack alignItems="center" justifyContent="center" sx={{ height: "80vh" }}><CircularProgress /></Stack> );

    return (
        <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardHeader
                title={user?.role === "hm" ? "Laporan HM" : "Laporan Admin"}
                action={
                    <TextField
                        variant="outlined" size="small" placeholder="Cari nasabah / no gadai..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ width: { xs: "100%", sm: 300 }, backgroundColor: 'white' }}
                    />
                }
            />
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc' }}>
    <Tabs
    value={activeTabStatus}
    onChange={(e, v) => setActiveTabStatus(v)}
    sx={{ px: 2, bgcolor: '#f8fafc' }}
>
    <Tab label="SEMUA" value="all" />
    <Tab label="PROSES" value="proses" />
    <Tab label="SELESAI" value="selesai" />
    <Tab label="LUNAS" value="lunas" />
</Tabs>
</Box>

            {/* ✅ TABS TYPE (Local Filter) */}
            <Tabs
                value={activeTabType}
                onChange={(e, v) => setActiveTabType(v)}
                variant="scrollable"
                sx={{ px: 2, bgcolor: '#fff' }}
            >
                <Tab label="Semua Jenis" value="all" />
                {types.map((t) => (
                    <Tab key={t.id} label={t.nama_type} value={t.nama_type.toLowerCase()} />
                ))}
            </Tabs>

            <CardContent sx={{ p: 0 }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                                <TableCell>No</TableCell>
                                <TableCell>No Gadai</TableCell>
                                <TableCell>Nasabah</TableCell>
                                <TableCell>Status</TableCell> {/* Field Baru */}
                                <TableCell align="right">Pinjaman</TableCell>
                                <TableCell align="center">Telat</TableCell>
                                <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 'bold' }}>Hutang</TableCell>
                                <TableCell align="center">Checker</TableCell>
                                <TableCell align="center">HM</TableCell>
                                <TableCell align="center">Aksi</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => {
                                const st = getStatusStyle(row.status);
                                return (
                                    <TableRow key={row.id} hover>
                                        <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">{row.no_gadai}</Typography>
                                            <Typography variant="caption" color="textSecondary">{row.type}</Typography>
                                        </TableCell>
                                        <TableCell>{row.nama_nasabah}</TableCell>
                                        
                                        {/* ✅ KOLOM STATUS */}
                                        <TableCell>
                                            <Chip label={st.label} color={st.color} size="small" sx={{ fontWeight: 'bold', fontSize: '0.65rem' }} />
                                        </TableCell>

                                        <TableCell align="right">{formatRp(row.pinjaman_pokok)}</TableCell>
                                        
                                        <TableCell align="center">
                                            {row.hari_terlambat > 0 ? (
                                                <Typography color="error" variant="body2" fontWeight="bold">+{row.hari_terlambat} h</Typography>
                                            ) : "-"}
                                        </TableCell>

                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight="bold" color="primary.main">{formatRp(row.total_hutang)}</Typography>
                                        </TableCell>

                                        <TableCell align="center">
                                            <Chip color={row.acc_checker === 'approved' ? 'success' : 'default'} sx={{ width: 10, height: 10 }} />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip color={row.acc_hm === 'approved' ? 'success' : 'default'} sx={{ width: 10, height: 10 }} />
                                        </TableCell>

                                        <TableCell align="center">
                                            <Button 
                                                size="small" variant="contained" 
                                                onClick={() => navigate(`/admin-detail/${row.id}`)}
                                                sx={{ fontSize: '10px' }}
                                            >
                                                DETAIL
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={filtered.length}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    onPageChange={(e, p) => setPage(p)}
                    onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
                />
            </CardContent>
        </Card>
    );
};

export default AdminLaporanPage;