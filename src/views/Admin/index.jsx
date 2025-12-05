import React, { useEffect, useState, useContext } from "react";
import {
    Card, CardHeader, CardContent, Divider,
    Table, TableContainer, TableHead, TableBody,
    TableRow, TableCell, TablePagination,
    Stack, Box, CircularProgress, Paper,
    Typography, TextField, Chip, Tabs, Tab, Tooltip
} from "@mui/material";
import { Check, Close as CloseIcon } from "@mui/icons-material";
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

    const safe = (v) => (v ?? "").toString().toLowerCase();

    const formatRp = (val) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val || 0);

    /** ==========================
     * FETCH DATA LAPORAN
     =========================== */
    const fetchData = async () => {
        try {
            const res = await axiosInstance.get(endpoint);
            if (res.data?.success) {
                const list = Array.isArray(res.data.data) ? res.data.data : [];
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

    /** ==========================
     * FETCH DATA TYPE
     =========================== */
    const fetchTypes = async () => {
        const typeEndpoint = user?.role === "hm" ? "/type" : "/admin/type";
        try {
            const res = await axiosInstance.get(typeEndpoint);
            if (res.data?.success) {
                setTypes(res.data.data);
            }
        } catch (e) {
            console.error("Gagal load types:", e);
        }
    };

    useEffect(() => {
        fetchData();
        fetchTypes();
    }, []);

    /** ==========================
     * SEARCH & FILTER PER TAB
     =========================== */
    useEffect(() => {
        let result = [...data];

        if (activeTab !== "all") {
            result = result.filter(
                (item) => safe(item.type) === safe(activeTab)
            );
        }

        const search = safe(searchTerm);
        result = result.filter(
            (item) =>
                safe(item.nama_nasabah).includes(search) ||
                safe(item.no_gadai).includes(search)
        );

        setFiltered(result);
        setPage(0);
    }, [activeTab, searchTerm, data]);

    const handleChangePage = (_, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (e) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

    /** ==========================
     * STATUS ICON & COLOR
     =========================== */
    const getStatusIcon = (val) => {
        if (!val) return null;
        const v = val.toLowerCase();
        if (v.includes("approved")) return <Check sx={{ color: "white" }} />;
        if (v.includes("rejected")) return <CloseIcon sx={{ color: "white" }} />;
        return null;
    };

    const getStatusColor = (val) => {
        if (!val) return "default";
        const v = val.toLowerCase();
        if (v.includes("approved")) return "success";
        if (v.includes("rejected")) return "error";
        return "default";
    };

    if (loading)
        return (
            <Stack alignItems="center" justifyContent="center" sx={{ height: "80vh" }}>
                <CircularProgress />
            </Stack>
        );

    if (error)
        return (
            <Typography color="error" variant="h6" align="center" sx={{ mt: 2 }}>
                Error: {error}
            </Typography>
        );

    return (
        <Card>
            <CardHeader
                title={user?.role === "hm" ? "Laporan HM" : "Laporan Admin"}
                action={
                    <TextField
                        variant="outlined"
                        size="small"
                        placeholder="Cari nama nasabah / no gadai..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ width: { xs: "100%", sm: 300 } }}
                    />
                }
            />
            <Divider />

            {/* TAB FILTER TYPE */}
            <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ px: 2 }}
            >
                <Tab label="Semua" value="all" />
                {types.map((t) => (
                    <Tab
                        key={t.id}
                        label={t.nama_type}
                        value={t.nama_type.toLowerCase()}
                    />
                ))}
            </Tabs>

            <Divider />

            <CardContent>
                <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
                    <Box sx={{ minWidth: 1200 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "#f4f6f8" }}>
                                    <TableCell>No</TableCell>
                                    <TableCell>No Gadai</TableCell>
                                    <TableCell>Nama Nasabah</TableCell>
                                    <TableCell>Tipe</TableCell>
                                    <TableCell align="right">Pinjaman</TableCell>
                                    <TableCell align="center">Tenor</TableCell>
                                    <TableCell align="right">Admin</TableCell>
                                    <TableCell align="right">Asuransi</TableCell>
                                    <TableCell align="right">Jasa</TableCell>
                                    <TableCell align="right">Total</TableCell>
                                    <TableCell align="center">Checker</TableCell>
                                    <TableCell align="center">HM</TableCell>
                                    <TableCell align="center">Aksi</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {(rowsPerPage > 0
                                    ? filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    : filtered
                                ).map((row, idx) => (
                                    <TableRow key={row.id} hover>
                                        <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                                        <TableCell>{row.no_gadai}</TableCell>
                                        <TableCell>{row.nama_nasabah}</TableCell>
                                        <TableCell>{row.type}</TableCell>
                                        <TableCell align="right">{formatRp(row.pinjaman_pokok)}</TableCell>
                                        <TableCell align="center">{row.tenor_hari}</TableCell>
                                        <TableCell align="right">{formatRp(row.admin_fee)}</TableCell>
                                        <TableCell align="right">{formatRp(row.asuransi)}</TableCell>
                                        <TableCell align="right">{formatRp(row.jasa)}</TableCell>
                                        <TableCell align="right">{formatRp(row.total_diterima)}</TableCell>

                                        <TableCell align="center">
                                            <Tooltip title={row.acc_checker || "Pending"}>
                                                <Chip
                                                    icon={getStatusIcon(row.acc_checker)}
                                                    color={getStatusColor(row.acc_checker)}
                                                    size="small"
                                                />
                                            </Tooltip>
                                        </TableCell>

                                        <TableCell align="center">
                                            <Tooltip title={row.acc_hm || "Pending"}>
                                                <Chip
                                                    icon={getStatusIcon(row.acc_hm)}
                                                    color={getStatusColor(row.acc_hm)}
                                                    size="small"
                                                />
                                            </Tooltip>
                                        </TableCell>

                                        <TableCell align="center">
                                            <button
                                                onClick={() => navigate(`/admin-detail/${row.id}`)}
                                                style={{
                                                    padding: "5px 12px",
                                                    border: "none",
                                                    borderRadius: "6px",
                                                    backgroundColor: "#1976d2",
                                                    color: "white",
                                                    cursor: "pointer",
                                                    fontSize: "13px",
                                                }}
                                            >
                                                Detail
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={13} align="center">
                                            Tidak ada data
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Box>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filtered.length}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Baris per halaman:"
                />
            </CardContent>
        </Card>
    );
};

export default AdminLaporanPage;
