import React, { useEffect, useState, useContext } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Divider,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Paper,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from "@mui/material";
import { AuthContext } from "AuthContex/AuthContext";
import axiosInstance from "api/axiosInstance";

const PelelanganPage = () => {
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();
  const isAdmin = userRole === "admin";

  // Admin langsung ke tab Riwayat
  const [tabIndex, setTabIndex] = useState(isAdmin ? 1 : 0);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [selectedGadai, setSelectedGadai] = useState(null);
  const [hargaTerjual, setHargaTerjual] = useState("");

  // Role yang bisa melakukan lelang
  const canLelang = ["hm", "checker"].includes(userRole);

  // Tentukan URL API
  const getApiUrl = (isPost = false) => {
    const baseUrl = (() => {
      switch (userRole) {
        case "petugas": return "/petugas/pelelangan";
        case "checker": return "/checker/pelelangan";
        case "hm": return "/pelelangan";
        case "admin": return "/admin/pelelangan";
        default: return "/pelelangan";
      }
    })();

    // Admin selalu ambil history, tabIndex=1 untuk history
    if (!isPost && (tabIndex === 1 || isAdmin)) return `${baseUrl}/history`;
    return baseUrl;
  };

  // Ambil data dari API
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(getApiUrl());
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError(res.data.message || "Gagal mengambil data");
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setPage(0);
  }, [tabIndex]);

  // Modal Lelang
  const handleOpenModal = (item) => {
    setSelectedGadai(item);
    setHargaTerjual("");
    setOpenModal(true);
  };
  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedGadai(null);
  };

  // Pagination
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // Submit lelang
  const handleSubmitLelang = async () => {
    if (!hargaTerjual || isNaN(hargaTerjual) || Number(hargaTerjual) <= 0) {
      alert("Masukkan harga terjual yang valid!");
      return;
    }

    try {
      const res = await axiosInstance.post(getApiUrl(true), {
        detail_gadai_id: selectedGadai.id,
        harga_terjual: parseFloat(hargaTerjual),
      });

      if (res.data.success) {
        alert("Barang berhasil dilelang!");
        handleCloseModal();
        setData(prev => prev.filter(d => d.id !== selectedGadai.id));
      } else {
        alert(res.data.message || "Gagal lelang barang");
      }
    } catch (err) {
      alert(err.message || "Terjadi kesalahan server");
    }
  };

  // Warna chip hari terlambat
  const getHariTerlambatColor = (hari) => (hari > 30 ? "error" : "warning");
  const cellStyle = { whiteSpace: "nowrap", padding: "8px 16px", height: 52 };

  if (loading) return <CircularProgress sx={{ display: "block", mx: "auto", mt: 5 }} />;
  if (error) return <Typography color="error">{error}</Typography>;

  // Filter search
  const displayedData = data.filter(
    d =>
      d.no_gadai?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.nama_nasabah?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
        <CardHeader
          title={<Typography variant="h6">Pelelangan</Typography>}
          action={
            <TextField
              variant="outlined"
              size="small"
              placeholder="Cari no gadai / nasabah / tipe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ backgroundColor: "white", borderRadius: 2, width: 250 }}
            />
          }
        />
        <Divider />

        {/* Tabs untuk non-admin */}
        {!isAdmin ? (
          <Tabs value={tabIndex} onChange={(_, newIndex) => setTabIndex(newIndex)} sx={{ px: 2 }}>
            <Tab label="Barang Siap Dilelang" />
            <Tab label="Riwayat Lelang" />
          </Tabs>
        ) : (
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Riwayat Lelang
          </Typography>
        )}

        <CardContent>
          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <TableContainer component={Paper}>
              <Table size="small" sx={{ minWidth: 1000 }}>
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    {[
                      "No",
                      "No Gadai",
                      "Nasabah",
                      "Tipe",
                      "Tanggal Gadai",
                      "Jatuh Tempo",
                      "Hari Terlambat",
                      "Uang Pinjaman",
                      tabIndex === 0 && !isAdmin ? "Aksi" : "Harga Terjual",
                    ].map((headCell, idx) => (
                      <TableCell key={idx} align="center" sx={cellStyle}>
                        <b>{headCell}</b>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {displayedData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        Tidak ada data ditemukan.
                      </TableCell>
                    </TableRow>
                  )}
                  {displayedData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((item, index) => (
                      <TableRow key={item.id} hover>
                        <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell sx={cellStyle}>{item.no_gadai}</TableCell>
                        <TableCell sx={cellStyle}>{item.nama_nasabah}</TableCell>
                        <TableCell sx={cellStyle}>{item.type}</TableCell>
                        <TableCell sx={cellStyle}>{item.tanggal_gadai}</TableCell>
                        <TableCell sx={cellStyle}>{item.jatuh_tempo}</TableCell>
                        <TableCell align="center" sx={cellStyle}>
                          <Chip
                            label={`${item.hari_terlambat} hari`}
                            color={getHariTerlambatColor(item.hari_terlambat)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right" sx={cellStyle}>
                          Rp {Number(item.uang_pinjaman).toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell align="center" sx={cellStyle}>
                          {tabIndex === 0 && !isAdmin ? (
                            canLelang ? (
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                onClick={() => handleOpenModal(item)}
                              >
                                Lelang
                              </Button>
                            ) : "-"
                          ) : (
                            <Chip
                              label={`Rp ${Number(item.harga_terjual).toLocaleString("id-ID")}`}
                              color="primary"
                              size="small"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={displayedData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Baris per halaman:"
          />
        </CardContent>
      </Card>

      {/* Modal Lelang */}
      <Dialog open={openModal} onClose={handleCloseModal}>
        <DialogTitle>Input Harga Terjual</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Harga Terjual"
            type="number"
            fullWidth
            value={hargaTerjual}
            onChange={(e) => setHargaTerjual(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Batal</Button>
          <Button variant="contained" color="success" onClick={handleSubmitLelang}>
            Simpan
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PelelanganPage;
