import React, { useEffect, useState, useContext, useMemo } from "react";
import {
  Card, CardHeader, CardContent, Table, TableContainer, TableHead, 
  TableBody, TableRow, TableCell, TablePagination, TextField, Button, 
  CircularProgress, Typography, Paper, Chip, Dialog, DialogTitle, 
  DialogContent, DialogActions, Tabs, Tab, Box, Stack, useTheme, 
  MenuItem, Select, FormControl, InputLabel, Alert, AlertTitle, 
  IconButton, Tooltip, Avatar, useMediaQuery
} from "@mui/material";
import {
  Gavel as GavelIcon,
  MonetizationOn as MoneyIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  History as HistoryIcon,
  AccessTime as AccessTimeIcon,
  Print as PrintIcon
} from "@mui/icons-material";
import { AuthContext } from "AuthContex/AuthContext";
import axiosInstance from "api/axiosInstance";
import { useNavigate, useLocation } from "react-router-dom";

const PelelanganPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const userRole = (user?.role || "").toLowerCase();
  const isAdmin = userRole === "admin";
  const canLelang = userRole === "hm" || userRole === "checker";

  const [tabIndex, setTabIndex] = useState(isAdmin ? 2 : 0);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState("proses"); 
  const [selectedGadai, setSelectedGadai] = useState(null);
  const [formData, setFormData] = useState({
    nominal: "",
    metode: "cash",
    keterangan: "",
    bukti: null,
    preview: null
  });

  const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });

  const baseUrl = userRole === "checker" ? "/checker/pelelangan" : isAdmin ? "/admin/pelelangan" : "/pelelangan";

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = (tabIndex === 2 || isAdmin) ? `${baseUrl}/history` : baseUrl;
      const res = await axiosInstance.get(url);
      if (res.data.success) {
        setData(res.data.data || []);
      }
    } catch (err) {
      showAlert('error', 'Gagal memuat data pelelangan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setPage(0);
  }, [tabIndex, userRole]);

  // ✅ Cek state dari navigate untuk set tab history
  useEffect(() => {
    if (location.state?.fromTab !== undefined) {
      setTabIndex(location.state.fromTab);
    }
  }, [location]);

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { 
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0 
  }).format(val || 0);

  const handleDaftarkanLelang = async (item) => {
    if (!window.confirm(`Daftarkan ${item.no_gadai} ke lelang?`)) return;
    try {
      const res = await axiosInstance.post(`${baseUrl}/daftarkan`, { detail_gadai_id: item.id });
      if (res.data.success) {
        showAlert('success', 'Barang berhasil masuk daftar lelang');
        fetchData();
      }
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Gagal daftar lelang');
    }
  };

  const openActionModal = (item, mode) => {
    setSelectedGadai(item);
    setModalMode(mode);
    setFormData({
      nominal: item.total_hutang || item.uang_pinjaman || "",
      metode: "cash",
      keterangan: "",
      bukti: null,
      preview: null
    });
    setOpenModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 2048 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, bukti: file, preview: reader.result }));
      reader.readAsDataURL(file);
    } else {
      showAlert('error', 'File terlalu besar (Maks 2MB)');
    }
  };

  const handleSubmit = async () => {
    if (!formData.nominal || formData.nominal <= 0) return showAlert('error', 'Nominal tidak valid');
    if (formData.metode === "transfer" && !formData.bukti) return showAlert('error', 'Bukti transfer wajib diunggah');

    setSubmitting(true);
    try {
      const dataPayload = new FormData();
      dataPayload.append("nominal_diterima", formData.nominal);
      dataPayload.append("metode_pembayaran", formData.metode);
      dataPayload.append("keterangan", formData.keterangan);
      if (formData.bukti) dataPayload.append("bukti_transfer", formData.bukti);

      const detailGadaiId = selectedGadai.id;
      const actionPath = modalMode === "proses" ? "proses" : "lunasi";
      const endpoint = `${baseUrl}/${detailGadaiId}/${actionPath}`;
      
      const res = await axiosInstance.post(endpoint, dataPayload, { headers: { "Content-Type": "multipart/form-data" } });

      if (res.data.success) {
        showAlert('success', res.data.message);
        setOpenModal(false);
        
        // ✅ Pindah ke tab History dulu
        if (!isAdmin) {
          setTabIndex(2);
        }
        
        // ✅ Tunggu render tab selesai, baru fetch & navigate
        setTimeout(() => {
          fetchData();
          setTimeout(() => {
            navigate(`/struk-pelunasan-lelang/${detailGadaiId}`, {
              state: { fromTab: 2 }
            });
          }, 500);
        }, 300);
      }
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(d => {
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch = (d.no_gadai?.toLowerCase().includes(searchStr) || 
                            d.nama_nasabah?.toLowerCase().includes(searchStr));
      if (isAdmin || tabIndex === 2) return matchesSearch;
      const statusMap = tabIndex === 0 ? "belum_terdaftar" : "siap";
      return matchesSearch && d.status_lelang === statusMap;
    });
  }, [data, searchTerm, tabIndex, isAdmin]);

  // ✅ Fungsi untuk menentukan label status
  const getStatusLabel = (item) => {
    if (item.status === 'lunas') return 'LUNAS';
    if (item.status_lelang) return item.status_lelang.toUpperCase();
    if (item.harga_terjual) return 'TERLELANG';
    return 'ANTRIAN';
  };

  // ✅ Fungsi untuk menentukan warna status
  const getStatusColor = (item) => {
    if (item.status === 'lunas') return 'success';
    if (item.status_lelang === 'terlelang' || item.harga_terjual) return 'primary';
    if (item.status_lelang === 'siap') return 'warning';
    return 'default';
  };

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      {alert.show && (
        <Alert severity={alert.type} sx={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, boxShadow: 3 }}>
          <AlertTitle>{alert.type === 'success' ? 'Berhasil' : 'Peringatan'}</AlertTitle>
          {alert.message}
        </Alert>
      )}

      <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: theme.shadows[4] }}>
        <CardHeader 
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Avatar sx={{ bgcolor: 'primary.main' }}><GavelIcon /></Avatar>
              <Typography variant="h6" fontWeight="800">Manajemen Pelelangan</Typography>
            </Stack>
          }
          action={
            <TextField 
              size="small" 
              placeholder="Cari..." 
              InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: isMobile ? 150 : 250 }}
            />
          }
        />
        
        {!isAdmin && (
          <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab icon={<AccessTimeIcon fontSize="small" />} iconPosition="start" label="Antrian" />
            <Tab icon={<GavelIcon fontSize="small" />} iconPosition="start" label="Siap Lelang" />
            <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label="Riwayat" />
          </Tabs>
        )}

        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box textAlign="center" py={10}><CircularProgress size={40} thickness={4} /></Box>
          ) : (
            <TableContainer>
              <Table size="medium">
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Info Unit & Nasabah</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Modal & Tagihan</TableCell>
                    {(tabIndex === 2 || isAdmin) && (
                      <>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Uang Masuk</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Profit/Loss</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Tanggal</TableCell>
                      </>
                    )}
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item) => {
                    const modal = parseFloat(item.uang_pinjaman || 0);
                    const nominalMasuk = parseFloat(item.harga_terjual || item.nominal_masuk || 0);
                    const totalDenda = (parseFloat(item.nominal_denda || item.denda) || 0) + (parseFloat(item.nominal_penalty || item.penalty) || 0);
                    const profit = nominalMasuk - modal;

                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold" color="primary">{item.no_gadai}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.nama_nasabah}</Typography>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                            <Chip label={item.type} size="small" variant="outlined" sx={{ height: 16, fontSize: '0.6rem' }} />
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: item.hari_terlambat > 30 ? 'error.main' : 'warning.dark', bgcolor: item.hari_terlambat > 30 ? '#ffeeee' : '#fff9e6', px: 0.8, py: 0.1, borderRadius: 1 }}>
                              Telat {item.hari_terlambat || 0} Hari
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell align="right">
                          <Tooltip arrow placement="left" title={
                            <Paper elevation={0} sx={{ p: 2, minWidth: 220, bgcolor: "#1a1a1a", borderRadius: 2, border: "1px solid #444" }}>
                              <Typography variant="subtitle2" sx={{ mb: 1.5, borderBottom: "1px solid #555", pb: 1, fontWeight: '800', color: "#ffffff", textTransform: 'uppercase' }}>
                                Rincian Tagihan
                              </Typography>
                              <Stack spacing={1.2}>
                                <Box display="flex" justifyContent="space-between">
                                  <Typography variant="caption" sx={{ color: "#ffffff", opacity: 0.9 }}>Pinjaman Pokok:</Typography>
                                  <Typography variant="caption" sx={{ color: "#ffffff", fontWeight: 'bold' }}>{formatCurrency(modal)}</Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                  <Typography variant="caption" sx={{ color: "#ffffff", opacity: 0.9 }}>Total Denda:</Typography>
                                  <Typography variant="caption" sx={{ color: "#ffffff", fontWeight: 'bold' }}>{formatCurrency(item.nominal_denda || item.denda)}</Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                  <Typography variant="caption" sx={{ color: "#ffffff", opacity: 0.9 }}>Penalty Telat:</Typography>
                                  <Typography variant="caption" sx={{ color: "#ffffff", fontWeight: 'bold' }}>{formatCurrency(item.nominal_penalty || item.penalty)}</Typography>
                                </Box>
                                <Box sx={{ my: 1, borderTop: "1px dashed #666", pt: 1.5 }} display="flex" justifyContent="space-between">
                                  <Typography variant="body2" sx={{ color: "#ffffff", fontWeight: '800' }}>Total Tagihan:</Typography>
                                  <Typography variant="body2" sx={{ color: "#ffffff", fontWeight: '900' }}>{formatCurrency(item.total_hutang || item.hutang)}</Typography>
                                </Box>
                              </Stack>
                            </Paper>
                          }>
                            <Box sx={{ cursor: 'help', p: 1, borderRadius: 2, transition: '0.3s', '&:hover': { bgcolor: 'action.hover' } }}>
                              <Typography variant="body2" fontWeight="800">{formatCurrency(modal)}</Typography>
                              <Typography variant="caption" color="error.main" fontWeight="bold">+{formatCurrency(totalDenda)}</Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>

                        {(tabIndex === 2 || isAdmin) && (
                          <>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="bold" color="success.main">{formatCurrency(nominalMasuk)}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="bold" color={profit >= 0 ? 'success.main' : 'error.main'}>
                                {formatCurrency(profit)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="caption" display="block" fontWeight="bold">
                                {item.tanggal_dilelang || item.tanggal ? (item.tanggal_dilelang || item.tanggal).split('T')[0] : '-'}
                              </Typography>
                            </TableCell>
                          </>
                        )}

                        <TableCell align="center">
                          <Chip 
                            size="small" 
                            label={getStatusLabel(item)}
                            color={getStatusColor(item)}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            {tabIndex === 0 && canLelang && <Button size="small" variant="contained" onClick={() => handleDaftarkanLelang(item)}>Daftarkan</Button>}
                            {tabIndex === 1 && canLelang && (
                              <>
                                <Tooltip title="Proses Lelang"><IconButton size="small" color="warning" onClick={() => openActionModal(item, 'proses')}><GavelIcon fontSize="small" /></IconButton></Tooltip>
                                <Tooltip title="Pelunasan / Tebus"><IconButton size="small" color="success" onClick={() => openActionModal(item, 'lunasi')}><MoneyIcon fontSize="small" /></IconButton></Tooltip>
                              </>
                            )}
                            {(tabIndex === 2 || isAdmin) && (
                              <Tooltip title="Cetak Struk">
                                <IconButton size="small" color="secondary" onClick={() => navigate(`/struk-pelunasan-lelang/${item.detail_gadai_id || item.id}`)}>
                                  <PrintIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <TablePagination component="div" count={filteredData.length} rowsPerPage={rowsPerPage} page={page} onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))} />
        </CardContent>
      </Card>

      {/* MODAL TRANSAKSI */}
      <Dialog open={openModal} onClose={() => !submitting && setOpenModal(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          {modalMode === 'proses' ? <GavelIcon color="warning" /> : <MoneyIcon color="success" />}
          {modalMode === 'proses' ? 'Konfirmasi Barang Terlelang' : 'Konfirmasi Penebusan'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Box sx={{ p: 2, bgcolor: modalMode === 'proses' ? 'warning.light' : 'success.light', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">Total Tagihan:</Typography>
              <Typography variant="h6" fontWeight="bold">{formatCurrency(selectedGadai?.total_hutang || selectedGadai?.hutang)}</Typography>
            </Box>
            <TextField fullWidth label="Nominal Diterima" type="number" value={formData.nominal} onChange={(e) => setFormData({...formData, nominal: e.target.value})} helperText={modalMode === 'proses' ? "Masukkan harga terjual lelang" : "Masukkan nominal pelunasan"} />
            <FormControl fullWidth>
              <InputLabel>Metode Pembayaran</InputLabel>
              <Select value={formData.metode} label="Metode Pembayaran" onChange={(e) => setFormData({...formData, metode: e.target.value})}>
                <MenuItem value="cash">Tunai / Cash</MenuItem>
                <MenuItem value="transfer">Transfer Bank</MenuItem>
              </Select>
            </FormControl>
            {formData.metode === "transfer" && (
              <Box>
                <Button variant="outlined" component="label" fullWidth>
                  Upload Bukti Transfer
                  <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                </Button>
                {formData.preview && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <img src={formData.preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
                  </Box>
                )}
              </Box>
            )}
            <TextField fullWidth label="Keterangan" multiline rows={2} value={formData.keterangan} onChange={(e) => setFormData({...formData, keterangan: e.target.value})} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)} color="inherit" disabled={submitting}>Batal</Button>
          <Button variant="contained" color={modalMode === 'proses' ? "warning" : "success"} onClick={handleSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Selesaikan'}
          </Button>
        </DialogActions>  
      </Dialog>
    </Box>
  );
};

export default PelelanganPage;