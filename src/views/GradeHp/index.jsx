import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    Card, CardHeader, CardContent, Divider,
    Table, TableContainer, TableHead, TableBody,
    TableRow, TableCell, TablePagination,
    IconButton, Button, CircularProgress,
    Stack, Grid, Typography, Paper, TextField
} from "@mui/material";

import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    ArrowBackIosNew, ArrowForwardIos
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import axiosInstance from "api/axiosInstance";

const GradeHpPage = () => {
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("auth_user"));
    const role = user?.role?.toLowerCase() || "";

    const getBaseApi = () => {
        if (role === "checker") return "/checker";
        if (role === "petugas") return "/petugas";
        return "";
    };

    const baseApi = getBaseApi();
    const apiUrl = `${baseApi}/grade-hp`;

    const [merkList, setMerkList] = useState([]);
    const [selectedMerk, setSelectedMerk] = useState("");
    const [searchMerk, setSearchMerk] = useState("");
    const [searchType, setSearchType] = useState("");

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const scrollRef = useRef(null);

    const scrollLeft = () => {
        scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
    };

    const scrollRight = () => {
        scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
    };

    useEffect(() => {
        const loadMerk = async () => {
            try {
                const res = await axiosInstance.get(`${baseApi}/merk-hp`);
                const list = res.data.data || [];
                setMerkList(list);
                if (list.length > 0) setSelectedMerk(list[0].id);
            } catch (err) {
                console.error(err);
                alert("Gagal mengambil Merk HP");
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
        } catch (err) {
            console.error(err);
            alert("Gagal mengambil data Grade HP");
        } finally {
            setTableLoading(false);
            setLoading(false);
        }
    }, [apiUrl, selectedMerk]);

    useEffect(() => {
        fetchData();
    }, [selectedMerk, fetchData]);

    const formatRupiah = (v) =>
        v ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(v) : "-";

    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus data ini?")) return;
        try {
            await axiosInstance.delete(`${apiUrl}/${id}`);
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Gagal menghapus data");
        }
    };

    if (loading) {
        return (
            <Grid container justifyContent="center" sx={{ height: "100vh" }}>
                <CircularProgress />
            </Grid>
        );
    }

    // Filter merk berdasarkan search
    const filteredMerk = merkList.filter(m =>
        m.nama_merk.toLowerCase().includes(searchMerk.toLowerCase())
    );

    // Filter data type berdasarkan pencarian
    const filteredData = data.filter(item =>
        item.type?.nama_type?.toLowerCase().includes(searchType.toLowerCase())
    );

    return (
        <Card sx={{ boxShadow: 4, borderRadius: 3 }}>
            <CardHeader
                title={<Typography variant="h6" fontWeight="bold">Master Grade HP</Typography>}
                action={
                    role !== "petugas" && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate("/grade-hp/tambah")}
                        >
                            Tambah Grade
                        </Button>
                    )
                }
            />
            <Divider />

            <CardContent>
                {/* SEARCH INPUTS */}
                <Stack direction="row" spacing={2} mb={2}>
                    <TextField
                        label="Cari Merk..."
                        size="small"
                        value={searchMerk}
                        onChange={(e) => setSearchMerk(e.target.value)}
                        sx={{ width: 250 }}
                    />

                    <TextField
                        label="Cari Type..."
                        size="small"
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                        sx={{ width: 250 }}
                    />
                </Stack>

                {/* SLIDER SELECTION MERK */}
                <Stack direction="row" alignItems="center" mb={2} spacing={1}>
                    <IconButton onClick={scrollLeft}>
                        <ArrowBackIosNew fontSize="small" />
                    </IconButton>

                    <Stack
                        ref={scrollRef}
                        direction="row"
                        spacing={1}
                        sx={{
                            overflowX: "auto",
                            whiteSpace: "nowrap",
                            flex: 1,
                            py: 1,
                            "&::-webkit-scrollbar": { display: "none" }
                        }}
                    >
                        {filteredMerk.map((m) => (
                            <Button
                                key={m.id}
                                variant={selectedMerk === m.id ? "contained" : "outlined"}
                                onClick={() => setSelectedMerk(m.id)}
                                sx={{ flexShrink: 0 }}
                            >
                                {m.nama_merk}
                            </Button>
                        ))}
                    </Stack>

                    <IconButton onClick={scrollRight}>
                        <ArrowForwardIos fontSize="small" />
                    </IconButton>
                </Stack>

                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                    <Table>
                        <TableHead sx={{ background: "#fafafa" }}>
                            <TableRow>
                                <TableCell align="center"><b>No</b></TableCell>
                                <TableCell><b>Type</b></TableCell>
                                <TableCell><b>Grade A</b></TableCell>
                                <TableCell><b>Grade B</b></TableCell>
                                <TableCell><b>Grade C</b></TableCell>
                                {role !== "petugas" && <TableCell align="center"><b>Aksi</b></TableCell>}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {tableLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center"><CircularProgress size={25} /></TableCell>
                                </TableRow>
                            ) : filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">Tidak ada data</TableCell>
                                </TableRow>
                            ) : (
                                filteredData
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((item, index) => (
                                        <TableRow key={item.id} hover>
                                            <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                                            <TableCell>{item.type?.nama_type || "-"}</TableCell>
                                            <TableCell>{formatRupiah(item.harga_grade_a)}</TableCell>
                                            <TableCell>{formatRupiah(item.harga_grade_b)}</TableCell>
                                            <TableCell>{formatRupiah(item.harga_grade_c)}</TableCell>
                                            {role !== "petugas" && (
                                                <TableCell align="center">
                                                    <Stack direction="row" spacing={1} justifyContent="center">
                                                        <IconButton color="primary" onClick={() => navigate(`/grade-hp/edit/${item.id}`)}>
                                                            <EditIcon />
                                                        </IconButton>
                                                        <IconButton color="error" onClick={() => handleDelete(item.id)}>
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Stack>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                            )}
                        </TableBody>
                    </Table>

                    <TablePagination
                        component="div"
                        count={filteredData.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                    />
                </TableContainer>
            </CardContent>
        </Card>
    );
};

export default GradeHpPage;
