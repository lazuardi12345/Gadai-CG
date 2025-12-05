import React, { useEffect, useState, useContext } from 'react';
import {
  Card, CardHeader, CardContent, Divider, Table, TableContainer,
  TableHead, TableBody, TableRow, TableCell, TablePagination,
  IconButton, TextField, Button, Stack, Box, CircularProgress, Typography, Paper, Tooltip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axiosInstance from 'api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from 'AuthContex/AuthContext';

const GadaiHpPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || '').toLowerCase();

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const canAdd = userRole === 'hm' || userRole === 'checker';
  const canEdit = userRole === 'checker' || userRole === 'hm';
  const canDelete = userRole === 'hm';

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = userRole === 'checker'
        ? '/checker/gadai-hp'
        : userRole === 'petugas'
          ? '/petugas/gadai-hp'
          : userRole === 'hm'
            ? '/gadai-hp'
            : '';

      if (!url) return setError("Role tidak diizinkan");

      const res = await axiosInstance.get(url, { params: { per_page: 1000 } });

      if (res.data.success) {
        setData(res.data.data);
        setFilteredData(res.data.data);
      } else setError(res.data.message || "Gagal mengambil data");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const filtered = data.filter(item =>
      (item.nama_barang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.merk?.nama_merk?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type_hp?.nama_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.detail_gadai?.nasabah?.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredData(filtered);
    setPage(0);
  }, [searchTerm, data]);

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah yakin ingin menghapus data ini?")) return;
    await axiosInstance.delete(`/gadai-hp/${id}`);
    fetchData();
  };

  if (loading) return (
    <Stack justifyContent="center" alignItems="center" sx={{ height: "80vh" }}>
      <CircularProgress />
    </Stack>
  );

  if (error) return (
    <Typography variant="h6" color="error" align="center">Error: {error}</Typography>
  );

  return (
    <Box sx={{ p: 2 }}>
      <Card sx={{ borderRadius: 4, boxShadow: 5 }}>
        <CardHeader
          title={<Typography variant="h5" fontWeight={700}>Data Gadai HP</Typography>}
          action={
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
              <TextField
                size="small"
                placeholder="Cari nama, imei, merk, type, nasabah..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ width: { xs: "100%", sm: 350 } }}
              />
              {canAdd && (
                <Button variant="contained" sx={{ borderRadius: 3, px: 3 }} onClick={() => navigate("/tambah-gadai-hp")}>
                  + Tambah
                </Button>
              )}
            </Stack>
          }
        />

        <Divider />

        <CardContent>
          <Box sx={{ overflowX: "auto" }}>
            <TableContainer component={Paper} sx={{ borderRadius: 3, maxHeight: "70vh" }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#ededed" }}>
                    {[
                      "No", "Nama", "IMEI", "Merk", "Type", "Warna",
                      "RAM", "ROM", "Grade", "Kunci", "Kelengkapan",
                      "Kerusakan", "Nasabah", "Aksi"
                    ].map((head, i) => (
                      <TableCell key={i} sx={{ fontWeight: "bold", whiteSpace: "nowrap", fontSize: 13 }}>
                        {head}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredData.length > 0 ? filteredData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((item, index) => (
                      <TableRow
                        key={item.id}
                        hover
                        sx={{ "&:nth-of-type(odd)": { background: "#fafafa" } }}
                      >
                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>

                        {/* Truncate dan Tooltip untuk teks panjang */}
                        <TableCell sx={{ maxWidth: 120, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <Tooltip title={item.nama_barang || "-"}>{item.nama_barang || "-"}</Tooltip>
                        </TableCell>

                        <TableCell>{item.imei || "-"}</TableCell>
                        <TableCell sx={{ maxWidth: 100, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <Tooltip title={item.merk?.nama_merk || "-"}>{item.merk?.nama_merk || "-"}</Tooltip>
                        </TableCell>
                        <TableCell>{item.type_hp?.nama_type || "-"}</TableCell>
                        <TableCell>{item.warna || "-"}</TableCell>
                        <TableCell>{item.ram || "-"}</TableCell>
                        <TableCell>{item.rom || "-"}</TableCell>
                        <TableCell>{item.grade_type || "-"}</TableCell>
                        <TableCell>{item.kunci_password || item.kunci_pin || item.kunci_pola || "-"}</TableCell>

                        <TableCell sx={{ maxWidth: 150, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <Tooltip title={item.kelengkapan_list?.map(k => k.nama_kelengkapan).join(", ") || "-"}>
                            {item.kelengkapan_list?.map(k => k.nama_kelengkapan).join(", ") || "-"}
                          </Tooltip>
                        </TableCell>

                        <TableCell sx={{ maxWidth: 150, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <Tooltip title={item.kerusakan_list?.map(k => k.nama_kerusakan).join(", ") || "-"}>
                            {item.kerusakan_list?.map(k => k.nama_kerusakan).join(", ") || "-"}
                          </Tooltip>
                        </TableCell>

                        <TableCell sx={{ maxWidth: 120, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <Tooltip title={item.detail_gadai?.nasabah?.nama_lengkap || "-"}>
                            {item.detail_gadai?.nasabah?.nama_lengkap || "-"}
                          </Tooltip>
                        </TableCell>

                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Lihat Detail">
                              <IconButton color="info" onClick={() => navigate(`/detail-gadai-hp/${item.id}`)}>
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            {canEdit && (
                              <Tooltip title="Edit">
                                <IconButton color="primary" onClick={() => navigate(`/edit-gadai-hp/${item.id}`)}>
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            {canDelete && (
                              <Tooltip title="Hapus">
                                <IconButton color="error" onClick={() => handleDelete(item.id)}>
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )) : (
                    <TableRow>
                      <TableCell colSpan={14} align="center">Tidak ada data ditemukan.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={filteredData.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default GadaiHpPage;
