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
  Info as InfoIcon
} from "@mui/icons-material";
import { AuthContext } from "AuthContex/AuthContext";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

const PelelanganPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Roles & Permissions
  const userRole = (user?.role || "").toLowerCase();
  const isAdmin = userRole === "admin";
  const canLelang = userRole === "hm" || userRole === "checker";

  // State Management
  const [tabIndex, setTabIndex] = useState(isAdmin ? 2 : 0);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal & Form State
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
      if (res.data.success) setData(res.data.data || []);
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
      nominal: item.total_hutang || item.hutang || "",
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
      dataPayload.append(modalMode === "proses" ? "keterangan" : "catatan", formData.keterangan);
      if (formData.bukti) dataPayload.append("bukti_transfer", formData.bukti);

      const endpoint = `${baseUrl}/${selectedGadai.id}/${modalMode === "proses" ? 'proses' : 'lunasi'}`;
      const res = await axiosInstance.post(endpoint, dataPayload, { headers: { "Content-Type": "multipart/form-data" } });

      if (res.data.success) {
        showAlert('success', res.data.message);
        setOpenModal(false);
        fetchData();
        if (modalMode === "lunasi") navigate(`/struk-pelunasan-lelang/${selectedGadai.id}`);
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
      const matchesSearch = d.no_gadai?.toLowerCase().includes(searchStr) || 
                            d.nama_nasabah?.toLowerCase().includes(searchStr);
      if (isAdmin || tabIndex === 2) return matchesSearch;
      const statusMap = tabIndex === 0 ? "belum_terdaftar" : "siap";
      return matchesSearch && d.status_lelang === statusMap;
    });
  }, [data, searchTerm, tabIndex, isAdmin]);

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
                    <TableCell sx={{ fontWeight: 'bold' }}>Info Nasabah & Keterlambatan</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Hutang / Biaya</TableCell>
                    {(tabIndex === 2 || isAdmin) && (
                      <>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Uang Masuk</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Keuntungan</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Waktu & Metode</TableCell>
                      </>
                    )}
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item) => (
                    <TableRow key={item.id} hover>
                      {/* KOLOM 1: INFO NASABAH & TELAT */}
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold" color="primary">{item.no_gadai}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.nama_nasabah}</Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                          <Chip label={item.type} size="small" variant="outlined" sx={{ height: 16, fontSize: '0.6rem' }} />
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontWeight: 'bold', 
                              color: item.hari_terlambat > 30 ? 'error.main' : 'warning.dark',
                              bgcolor: item.hari_terlambat > 30 ? '#ffeeee' : '#fff9e6',
                              px: 0.8, py: 0.1, borderRadius: 1
                            }}
                          >
                            Telat {item.hari_terlambat || 0} Hari
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* KOLOM 2: TOTAL TAGIHAN */}
                      <TableCell align="right">
                        <Tooltip arrow title={
                          <Box sx={{ p: 0.5 }}>
                            <Typography variant="caption" display="block">Pokok: {formatCurrency(item.uang_pinjaman)}</Typography>
                            <Typography variant="caption" display="block">Bunga: {formatCurrency(item.bunga)}</Typography>
                            <Typography variant="caption" display="block">Denda: {formatCurrency(item.denda)}</Typography>
                            <Typography variant="caption" display="block">Admin: {formatCurrency(item.penalty)}</Typography>
                          </Box>
                        }>
                          <Box sx={{ cursor: 'help' }}>
                            <Typography variant="body2" fontWeight="800">
                                {formatCurrency(item.hutang || item.total_hutang)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                Biaya: {formatCurrency((item.bunga||0)+(item.denda||0)+(item.penalty||0))}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>

                      {/* KOLOM RIWAYAT (DIPISAH) */}
                      {(tabIndex === 2 || isAdmin) && (
                        <>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold" color="primary.main">
                              {formatCurrency(item.nominal_masuk)}
                            </Typography>
                          </TableCell>
                          
                          <TableCell align="right">
                            <Typography 
                              variant="body2" 
                              fontWeight="bold" 
                              color={item.keuntungan >= 0 ? 'success.main' : 'error.main'}
                            >
                              {formatCurrency(item.keuntungan)}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>
                                {item.keuntungan >= 0 ? 'PROFIT' : 'LOSS'}
                            </Typography>
                          </TableCell>

                          <TableCell align="center">
                            <Typography variant="caption" display="block" fontWeight="bold">{item.tanggal?.split(' ')[0]}</Typography>
                            <Chip label={item.metode?.toUpperCase()} size="small" variant="outlined" sx={{ height: 16, fontSize: '0.6rem' }} />
                          </TableCell>
                        </>
                      )}

                      <TableCell align="center">
                        <Chip 
                          size="small" 
                          label={item.status === 'lunas' ? 'LUNAS' : item.status === 'terlelang' ? 'TERLELANG' : 'SIAP'} 
                          color={item.status === 'lunas' ? 'success' : item.status === 'terlelang' ? 'primary' : 'default'}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          {tabIndex === 0 && canLelang && (
                            <Button size="small" variant="contained" onClick={() => handleDaftarkanLelang(item)}>Daftarkan</Button>
                          )}
                          {tabIndex === 1 && canLelang && (
                            <>
                              <Tooltip title="Proses Lelang"><IconButton size="small" color="warning" onClick={() => openActionModal(item, 'proses')}><GavelIcon fontSize="small" /></IconButton></Tooltip>
                              <Tooltip title="Pelunasan/Tebus"><IconButton size="small" color="success" onClick={() => openActionModal(item, 'lunasi')}><MoneyIcon fontSize="small" /></IconButton></Tooltip>
                            </>
                          )}
                          {item.bukti && (
                            <Tooltip title="Lihat Bukti"><IconButton size="small" color="info" onClick={() => window.open(item.bukti, '_blank')}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
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
          {modalMode === 'proses' ? 'Konfirmasi Terlelang' : 'Konfirmasi Penebusan'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Box sx={{ p: 2, bgcolor: modalMode === 'proses' ? 'warning.light' : 'success.light', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">Total Tagihan:</Typography>
              <Typography variant="h6" fontWeight="bold">{formatCurrency(selectedGadai?.total_hutang || selectedGadai?.hutang)}</Typography>
            </Box>
            
            <TextField fullWidth label="Nominal Diterima" type="number" value={formData.nominal} onChange={(e) => setFormData({...formData, nominal: e.target.value})} />
            
            <FormControl fullWidth>
              <InputLabel>Metode Bayar</InputLabel>
              <Select value={formData.metode} label="Metode Bayar" onChange={(e) => setFormData({...formData, metode: e.target.value})}>
                <MenuItem value="cash">Tunai / Cash</MenuItem>
                <MenuItem value="transfer">Transfer Bank</MenuItem>
              </Select>
            </FormControl>

            {formData.metode === "transfer" && (
              <Box>
                <Button variant="outlined" component="label" fullWidth sx={{ borderStyle: 'dashed' }}>
                  Upload Bukti Transfer
                  <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                </Button>
                {formData.preview && <Box component="img" src={formData.preview} sx={{ width: '100%', mt: 1, borderRadius: 2, border: '1px solid #ddd' }} />}
              </Box>
            )}

            <TextField fullWidth label="Keterangan" multiline rows={2} value={formData.keterangan} onChange={(e) => setFormData({...formData, keterangan: e.target.value})} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)} color="inherit">Batal</Button>
          <Button variant="contained" color={modalMode === 'proses' ? "warning" : "success"} onClick={handleSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Konfirmasi'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PelelanganPage;