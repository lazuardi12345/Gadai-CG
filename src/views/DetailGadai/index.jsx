import React, { useEffect, useState, useContext } from "react";
import {
  Card, CardHeader, CardContent, Divider, Table, TableContainer,
  TableHead, TableBody, TableRow, TableCell, TablePagination,
  IconButton, TextField, Button, CircularProgress, Typography,
  Stack, Chip, Tooltip, Box, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Paper, Alert, Avatar, Grid
} from "@mui/material";
import {
  Edit as EditIcon,
  Print as PrintIcon,
  CheckCircle as CheckCircleIcon,
  Payments as PaymentsIcon,
  Info as InfoIcon,
  HistoryEdu as ExtensionIcon,
  CloudUpload as UploadIcon,
  ReceiptLong as ReceiptIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Smartphone as SmartphoneOutlinedIcon, 
  Diamond as DiamondOutlinedIcon,
  Inventory as InventoryIcon,
  Balance as BalanceIcon,
  Straighten as StraightenIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Visibility as VisibilityIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { AuthContext } from "AuthContex/AuthContext";
import Swal from 'sweetalert2';

const DetailGadaiPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [openValidasi, setOpenValidasi] = useState(false);
  const [openLunas, setOpenLunas] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [nominalBayar, setNominalBayar] = useState("");
  const [metodeBayar, setMetodeBayar] = useState("cash");
  const [fileBukti, setFileBukti] = useState(null);
  const [targetBayar, setTargetBayar] = useState(0);
  const [processLoading, setProcessLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  // State untuk Preview Foto
  const [previewImage, setPreviewImage] = useState(null);

  const getApiUrl = (resource) => {
    if (userRole === "petugas") return `/petugas/${resource}`;
    if (userRole === "checker") return `/checker/${resource}`;
    return `/${resource}`;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(getApiUrl("detail-gadai"), {
        params: { per_page: 1000 },
      });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Terjadi kesalahan server", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenValidasi = async (id) => {
    setProcessLoading(true);
    setSelectedItem(null); 
    try {
      const res = await axiosInstance.get(`${getApiUrl("detail-gadai")}/${id}`);
      if (res.data.success) {
        setSelectedItem(res.data.data); 
        setOpenValidasi(true);
      }
    } catch (err) {
      alert("Gagal mengambil detail unit");
    } finally {
      setProcessLoading(false);
    }
  };

  const handleValidasiSelesai = async () => {
  if (!selectedItem) return;
  setProcessLoading(true);

  try {
    const res = await axiosInstance.patch(`${getApiUrl("detail-gadai")}/${selectedItem.id}/validasi-selesai`);
    
    if (res.data.success) {
      setOpenValidasi(false);
      fetchData();
      Swal.fire({
        icon: 'success',
        title: 'Validasi Berhasil!',
        html: `Status transaksi sudah menjadi <b style="color: #2e7d32;">LUNAS</b>.<br/>.`,
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        background: '#ffffff',
        iconColor: '#0288d1',
      });
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Validasi Gagal',
      text: err.response?.data?.message || "Terjadi kesalahan saat validasi status",
      confirmButtonColor: '#d33',
    });
  } finally {
    setProcessLoading(false);
  }
};

  const handleDeleteGadai = async () => {
    setProcessLoading(true);
    try {
      const res = await axiosInstance.delete(`${getApiUrl("detail-gadai")}/${selectedItem.id}`);
      if (res.data.success) {
        setOpenDelete(false);
        fetchData();
        alert("Data berhasil dihapus");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menghapus data");
    } finally {
      setProcessLoading(false);
    }
  };

const handleSubmitLunas = async () => {
  if (!nominalBayar || !metodeBayar) {
    Swal.fire('Peringatan', 'Harap isi nominal dan pilih metode pembayaran.', 'warning');
    return;
  }

  if (Number(nominalBayar) <= 0) {
    Swal.fire('Peringatan', 'Nominal bayar harus lebih dari 0', 'warning');
    return;
  }

  setProcessLoading(true);
  try {
    const formData = new FormData();
    formData.append("nominal_bayar", nominalBayar);
    const metodeFix = (metodeBayar === "tunai" || metodeBayar === "cash") ? "cash" : "transfer";
    formData.append("metode_pembayaran", metodeFix);

    if (fileBukti) {
      formData.append("bukti_transfer", fileBukti);
    }

    const res = await axiosInstance.post(
      `${getApiUrl("detail-gadai")}/${selectedItem.id}/pelunasan?_method=PATCH`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    console.log('Response dari backend:', res.data); 

    if (res.data.success) {
      const responseData = res.data.data;
      const perhitungan = responseData.detail_gadai?.perhitungan || {};
      const kembalian = responseData.kembalian || 0;
      const nominal_dibayar = responseData.nominal_dibayar || 0;
      setOpenLunas(false);
      setFileBukti(null);
      setNominalBayar("");
      setMetodeBayar("cash");
      await fetchData();
      await Swal.fire({
        title: 'Pelunasan Berhasil!',
        icon: 'success',
        html: `
          <div style="text-align: left; background: #f9f9f9; padding: 15px; border-radius: 10px; font-family: sans-serif;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Pokok:</span> <b>Rp ${Number(perhitungan.pokok || 0).toLocaleString("id-ID")}</b>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Denda & Jasa:</span> <b>Rp ${Number(perhitungan.denda || 0).toLocaleString("id-ID")}</b>
            </div>
            <hr style="border: 0.5px solid #ddd">
            <div style="display: flex; justify-content: space-between; font-size: 1.1em; color: #2e7d32;">
              <span>Total Tagihan:</span> <b>Rp ${Number(perhitungan.total_bayar || 0).toLocaleString("id-ID")}</b>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 5px;">
              <span>Uang Diterima:</span> <b>Rp ${Number(nominal_dibayar).toLocaleString("id-ID")}</b>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 10px; padding: 10px; background: #e8f5e9; border-radius: 5px;">
              <span style="font-weight: bold;">KEMBALIAN:</span> 
              <span style="font-weight: bold; color: #2e7d32;">Rp ${Number(kembalian).toLocaleString("id-ID")}</span>
            </div>
          </div>
          <p style="margin-top: 15px; font-size: 0.9em; color: #666;">Klik OK untuk mencetak struk</p>
        `,
        confirmButtonText: 'Cetak Struk',
        confirmButtonColor: '#2e7d32',
        allowOutsideClick: false
      });

      navigate(`/print-struk-pelunasan/${selectedItem.id}`);
    }
  } catch (err) {
    console.error('Error pelunasan:', err);
    console.error('Error response:', err.response?.data);

    if (err.response?.status === 400) {
      Swal.fire({
        icon: 'warning',
        title: 'Gadai Sudah Lunas',
        text: err.response?.data?.message || 'Data gadai ini sudah dilunasi sebelumnya.',
        confirmButtonColor: '#f59e0b',
      }).then(() => {
        setOpenLunas(false);
        fetchData();
      });
    } else if (err.response?.status === 422) {
      const errorData = err.response.data;
      
      if (errorData.perhitungan) {
        Swal.fire({
          icon: 'warning',
          title: 'Nominal Kurang',
          html: `
            <p>Total yang harus dibayar:</p>
            <h3 style="color: #d32f2f; margin: 10px 0;">Rp ${Number(errorData.perhitungan.total_bayar).toLocaleString("id-ID")}</h3>
            <p style="font-size: 0.9em; color: #666;">Silakan masukkan nominal yang sesuai atau lebih</p>
          `,
          confirmButtonColor: '#f59e0b',
        });
      } else if (errorData.errors) {
        const msg = Object.values(errorData.errors).flat().join("<br>");
        Swal.fire({
          icon: 'error',
          title: 'Gagal Validasi',
          html: msg,
          confirmButtonColor: '#d33',
        });
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Terjadi Kesalahan',
        text: err.response?.data?.message || 'Gagal memproses pelunasan. Silakan coba lagi.',
        confirmButtonColor: '#d33',
      });
    }
  } finally {
    setProcessLoading(false);
  }
};


  useEffect(() => { fetchData(); }, [userRole]);

  useEffect(() => {
    const filtered = data.filter(item => {
      const isCurrentlyExtending = item.perpanjangan_tempos?.some(p => p.status_bayar === "pending");
      if (isCurrentlyExtending) return false;
      const matchSearch = 
        item.no_gadai?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nasabah?.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
    setFilteredData(filtered);
    setPage(0);
  }, [searchTerm, data]);

  const getStatusColor = (status) => {
    if (status === "proses") return "warning";
    if (status === "selesai") return "info";
    if (status === "lunas") return "success";
    return "default";
  };

  const getApprovalStatus = (approvals) => {
    const checker = approvals?.find(a => a.role === 'checker');
    const hm = approvals?.find(a => a.role === 'hm');
    return { checker, hm };
  };

  const renderApprovalBadge = (approval) => {
    if (!approval) return <Chip label="Belum" size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />;
    const isApproved = approval.status?.includes('approved');
    return (
      <Chip 
        label={isApproved ? "Approved" : "Rejected"}
        size="small"
        color={isApproved ? "success" : "error"}
        icon={isApproved ? <CheckCircleIcon style={{ fontSize: 14 }} /> : <CancelIcon style={{ fontSize: 14 }} />}
        sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}
      />
    );
  };

  const getPrintSBGRoute = (item) => {
    const typeName = item.type?.nama_type?.toLowerCase() || '';
    if (["retro", "logam_mulia", "perhiasan", "logam mulia"].includes(typeName)) {
      return `/print-surat-bukti-gadai-emas/${item.id}`;
    }
    if (typeName === "handphone") return `/print-surat-bukti-gadai-hp/${item.id}`;
    return `/print-surat-bukti-gadai-emas/${item.id}`;
  };

  const getUnitIcon = (typeName) => {
    const name = typeName?.toLowerCase() || '';
    if (name.includes('hp') || name.includes('handphone')) return <SmartphoneOutlinedIcon sx={{ fontSize: 14 }} />;
    if (name.includes('emas') || name.includes('logam') || name.includes('perhiasan') || name.includes('retro')) return <DiamondOutlinedIcon sx={{ fontSize: 14 }} />;
    return <InfoIcon sx={{ fontSize: 14 }} />;
  };

  const ImageThumbnail = ({ url, label }) => {
    if (!url) return null;
    return (
      <Grid item xs={4} sm={3}>
        <Box 
          onClick={() => setPreviewImage({ url, label })}
          sx={{ 
            position: 'relative', 
            cursor: 'pointer', 
            borderRadius: 2, 
            overflow: 'hidden', 
            border: '1px solid #ddd',
            '&:hover .overlay': { opacity: 1 }
          }}
        >
          <img src={url} alt={label} style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} />
          <Box className="overlay" sx={{ 
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
            bgcolor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: '0.3s'
          }}>
            <VisibilityIcon sx={{ color: 'white' }} />
          </Box>
        </Box>
        <Typography variant="caption" align="center" display="block" sx={{ fontSize: '0.6rem', mt: 0.5, noWrap: true }}>{label}</Typography>
      </Grid>
    );
  };

  const isManagement = ["hm", "checker"].includes(userRole);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Card sx={{ boxShadow: 4, borderRadius: 4 }}>
      <CardHeader
        title={<Typography variant="h6" fontWeight="bold">Data Detail Gadai</Typography>}
        action={
          <TextField
            size="small"
            placeholder="Cari No Gadai / Nasabah..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: 300, bgcolor: 'white', borderRadius: 1 }}
          />
        }
      />
      <Divider />
      <CardContent sx={{ p: 0 }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f8f9fa" }}>
              <TableRow>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>No</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Gadai & Nasabah</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Waktu (Gadai / JT)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Keuangan (Rp)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status & Perpanjangan</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status Pengajuan</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Alur Transaksi</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Cetak Struk / Bukti</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, index) => {
                const { checker, hm } = getApprovalStatus(item.approvals);
                return (
                  <TableRow key={item.id} hover>
                    <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>
                      <Stack spacing={0.3}>
                        <Typography variant="body2" fontWeight="bold" color="primary">{item.no_gadai}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>Nasabah:</Typography>
                          <Typography variant="caption" color="text.secondary">{item.nasabah?.nama_lengkap || '-'}</Typography>
                        </Box>
                        <Box sx={{ mt: 0.5, p: 0.5, bgcolor: '#f1f5f9', borderRadius: 1, borderLeft: '3px solid #1e293b', display: 'inline-flex', width: 'fit-content' }}>
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 'bold' }}>
                            {getUnitIcon(item.type?.nama_type)} {item.type?.nama_type || 'Tanpa Type'}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                   <TableCell align="center">
  <Stack spacing={0.2} alignItems="center">
    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
      Gadai: {item.tanggal_gadai}
    </Typography>
    <Typography variant="caption" fontWeight="bold" color="error.main" sx={{ fontSize: '0.65rem' }}>
      JT: {item.jatuh_tempo}
    </Typography>

    {/* PERBAIKAN DISINI: Langsung akses item.hari_keterlambatan */}
    {item.hari_keterlambatan > 0 && (
      <Tooltip title={`Terlambat ${item.hari_keterlambatan} hari`}>
        <Chip 
          label={`Telat ${item.hari_keterlambatan} Hari`} 
          size="small" 
          color="error" 
          sx={{ 
            fontSize: '0.6rem', 
            height: 18, 
            fontWeight: 'bold', 
            mt: 0.5,
            animation: 'pulse 1.5s infinite',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.6 },
              '100%': { opacity: 1 }
            }
          }} 
        />
      </Tooltip>
    )}
  </Stack>
</TableCell>
                    <TableCell align="right">
                      <Stack spacing={0.2}>
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Taksiran: {Number(item.taksiran).toLocaleString("id-ID")}</Typography>
                        <Typography variant="body2" fontWeight="bold" color="primary.main">{Number(item.uang_pinjaman).toLocaleString("id-ID")}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Stack spacing={0.5} alignItems="center">
                        <Chip label={item.status.toUpperCase()} color={getStatusColor(item.status)} size="small" sx={{ fontSize: '0.65rem', fontWeight: 'bold' }} />
                        {item.perpanjangan_tempos?.length > 0 && (
                          <Chip variant="outlined" color="secondary" size="small" icon={<ExtensionIcon style={{ fontSize: 12 }} />} label={`${item.perpanjangan_tempos.filter(p => p.status_bayar === 'lunas').length}x`} sx={{ fontSize: '0.65rem', height: 20 }} />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Stack spacing={0.5} alignItems="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary', minWidth: 50 }}>Checker:</Typography>
                          {renderApprovalBadge(checker)}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary', minWidth: 50 }}>HM:</Typography>
                          {renderApprovalBadge(hm)}
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      {isManagement && (
                        <Stack direction="row" spacing={1} justifyContent="center">
                          {item.status === "proses" && (
                            <Button variant="contained" color="info" size="small" onClick={() => handleOpenValidasi(item.id)} sx={{ fontSize: '0.65rem', textTransform: 'none' }}>
                              Cek Selesai
                            </Button>
                          )}
                         {item.status === "selesai" && (
  <Button 
    variant="contained" 
    color="success" 
    size="small" 
    onClick={() => { 
      setSelectedItem(item);
      setNominalBayar("");
      setFileBukti(null);
      
      const pokok = Number(item.uang_pinjaman || 0);
      const perpanjanganTerbaru = item.perpanjangan_tempos?.length
        ? item.perpanjangan_tempos[item.perpanjangan_tempos.length - 1]
        : null;
      const jatuhTempoTerbaru = perpanjanganTerbaru?.jatuh_tempo_baru || item.jatuh_tempo;
      const today = new Date();
      const jatuhTempoDate = new Date(jatuhTempoTerbaru);
      let selisihHari = Math.ceil((today - jatuhTempoDate) / (1000 * 60 * 60 * 24));
      
      const toleransi = 1;
      if (selisihHari <= toleransi) {
        selisihHari = 0;
      } else {
        selisihHari -= toleransi;
      }
      const typeNama = (item.type?.nama_type || '').toLowerCase();
      const jenisSkema = ['handphone', 'elektronik'].includes(typeNama) ? 'hp' : 'non-hp';
      let denda = 0, penalty = 0;
      if (selisihHari > 0) {
        const persenDendaPerHari = jenisSkema === 'hp' ? 0.003 : 0.001;
        denda = pokok * persenDendaPerHari * selisihHari;
        if (selisihHari > 15) {
          penalty = 180000;
        }
      }
      const totalBayarSebelum = pokok + denda + penalty;
      const totalBayar = Math.ceil(totalBayarSebelum / 1000) * 1000;
      
      console.log('Perhitungan Preview:', {
        pokok,
        denda,
        penalty,
        selisihHari,
        totalBayar
      });
      
      setTargetBayar(totalBayar);
      setOpenLunas(true);
    }} 
    sx={{ fontSize: '0.65rem', textTransform: 'none' }}
  >
    Bayar Lunas
  </Button>
)}
                          {item.status === "lunas" && <Typography variant="caption" color="success.main" fontWeight="bold">LUNAS ✓</Typography>}
                        </Stack>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title={`Print SBG (${item.type?.nama_type || 'Gadai'})`}>
                          <IconButton size="small" color="primary" onClick={() => navigate(getPrintSBGRoute(item))}><PrintIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Print Struk Awal">
                          <IconButton size="small" color="secondary" onClick={() => navigate(`/print-struk-awal/${item.id}`)}><ReceiptIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        {item.perpanjangan_tempos?.some(p => p.status_bayar === "pending") && (
                          <Tooltip title="Print Struk Perpanjangan (Pending)">
                            <IconButton size="small" color="warning" onClick={() => navigate(`/print-struk-perpanjangan/${item.id}`)}><ExtensionIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                        {item.status === "lunas" && (
                          <Tooltip title="Print Struk Pelunasan">
                            <IconButton size="small" color="success" onClick={() => navigate(`/print-struk-pelunasan/${item.id}`)}><PaymentsIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <IconButton size="small" color="secondary" onClick={() => navigate(`/edit-detail-gadai/${item.id}`)}><EditIcon fontSize="small" /></IconButton>
                        {userRole === "hm" && (
                          <IconButton size="small" sx={{ color: 'error.main' }} onClick={() => { setSelectedItem(item); setOpenDelete(true); }}><DeleteIcon fontSize="small" /></IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination rowsPerPageOptions={[10, 25, 50]} component="div" count={filteredData.length} rowsPerPage={rowsPerPage} page={page} onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))} />
      </CardContent>

      {/* --- DIALOG CEK SELESAI (DENGAN DOKUMEN PENDUKUNG) --- */}
      <Dialog open={openValidasi} onClose={() => setOpenValidasi(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'info.main', color: 'white', py: 2 }}>
          <Avatar sx={{ bgcolor: 'white', color: 'info.main', width: 32, height: 32 }}><InventoryIcon fontSize="small" /></Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>Validasi Unit & Dokumen</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Pastikan fisik & foto dokumen sesuai</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ bgcolor: '#fbfbfb' }}>
          {processLoading && !selectedItem ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={30} /></Box>
          ) : (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* KOLOM KIRI: Data Teknis */}
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'white' }}>
                    <Typography variant="caption" color="textSecondary">Nomor Gadai / Nasabah</Typography>
                    <Typography variant="body2" fontWeight="bold">{selectedItem?.no_gadai}</Typography>
                    <Typography variant="body1" fontWeight="bold" color="primary">{selectedItem?.nasabah?.nama_lengkap}</Typography>
                  </Paper>

                  {/* DATA SPESIFIK UNIT */}
                  {selectedItem?.hp && (
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}><SmartphoneOutlinedIcon fontSize="small" color="primary"/> Detail HP</Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}><Typography variant="caption">Merk/Type</Typography><Typography variant="body2">{selectedItem.hp.merk?.nama_merk} {selectedItem.hp.type_hp?.nama_type}</Typography></Grid>
                        <Grid item xs={6}><Typography variant="caption">IMEI</Typography><Typography variant="body2">{selectedItem.hp.imei}</Typography></Grid>
                        <Grid item xs={12}>
                          <Typography variant="caption">Kerusakan:</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selectedItem.hp.kerusakan_list?.map((k, i) => <Chip key={i} label={k.nama_kerusakan} size="small" color="error" variant="outlined" sx={{ fontSize: '0.6rem' }} />)}
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  )}

                  {selectedItem?.perhiasan && (
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}><DiamondOutlinedIcon fontSize="small" color="warning"/> Detail Perhiasan</Typography>
                      <Typography variant="body2">{selectedItem.perhiasan.nama_barang}</Typography>
                      <Typography variant="body2" fontWeight="bold">{selectedItem.perhiasan.berat_bersih} gr | {selectedItem.perhiasan.kadar_emas}%</Typography>
                    </Paper>
                  )}

                  {selectedItem?.retro && (
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}><DiamondOutlinedIcon fontSize="small" color="secondary"/> Detail Retro</Typography>
                      <Typography variant="body2">{selectedItem.retro.nama_barang}</Typography>
                      <Typography variant="body2" fontWeight="bold">{selectedItem.retro.karat} K | {selectedItem.retro.berat} gr</Typography>
                    </Paper>
                  )}
                </Stack>
              </Grid>

              {selectedItem?.logam_mulia && (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
      <DiamondOutlinedIcon fontSize="small" color="warning"/> Detail Logam Mulia
    </Typography>
    <Typography variant="body2">
      {selectedItem.logam_mulia.nama_barang}
    </Typography>
    <Typography variant="body2" fontWeight="bold">
      {selectedItem.logam_mulia.berat} gr | {selectedItem.logam_mulia.karat} K
    </Typography>
  </Paper>
)}

              {/* KOLOM KANAN: Galeri Dokumen Pendukung */}
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 2, bgcolor: '#fff' }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><PhotoLibraryIcon fontSize="small" /> Dokumen Pendukung</Typography>
                  
                  <Grid container spacing={1.5}>
                    {/* FOTO HP */}
                    {selectedItem?.dokumen_pendukung_hp && (
                      <>
                        <ImageThumbnail url={selectedItem.dokumen_pendukung_hp.body} label="Body" />
                        <ImageThumbnail url={selectedItem.dokumen_pendukung_hp.imei} label="IMEI" />
                        <ImageThumbnail url={selectedItem.dokumen_pendukung_hp.about} label="About" />
                        <ImageThumbnail url={selectedItem.dokumen_pendukung_hp.akun} label="Akun" />
                        <ImageThumbnail url={selectedItem.dokumen_pendukung_hp.cam_depan} label="Cam Depan" />
                        <ImageThumbnail url={selectedItem.dokumen_pendukung_hp.cam_belakang} label="Cam Belakang" />
                        <ImageThumbnail url={selectedItem.dokumen_pendukung_hp.battery} label="Battery" />
                        <ImageThumbnail url={selectedItem.dokumen_pendukung_hp.utools} label="uTools" />
                      </>
                    )}

                    {/* FOTO EMAS/RETRO */}
                    {selectedItem?.dokumen_pendukung_emas && (
                      <>
                        <ImageThumbnail url={selectedItem.dokumen_pendukung_emas.emas_timbangan_url} label="Timbangan" />
                        <ImageThumbnail url={selectedItem.dokumen_pendukung_emas.gosokan_timer_url} label="Gosokan Timer" />
                        <ImageThumbnail url={selectedItem.dokumen_pendukung_emas.gosokan_ktp_url} label="Gosokan KTP" />
                        <ImageThumbnail url={selectedItem.dokumen_pendukung_emas.batu_url} label="Batu" />
                        <ImageThumbnail url={selectedItem.dokumen_pendukung_emas.cap_merek_url} label="Cap Merek" />
                        <ImageThumbnail url={selectedItem.dokumen_pendukung_emas.karatase_url} label="Karatase" />
                      </>
                    )}

                    {(!selectedItem?.dokumen_pendukung_hp && !selectedItem?.dokumen_pendukung_emas) && (
                      <Grid item xs={12}><Typography variant="caption" color="textSecondary">Tidak ada foto dokumen pendukung.</Typography></Grid>
                    )}
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f1f3f4', borderTop: '1px solid #e0e0e0' }}>
  <Button 
    onClick={() => setOpenValidasi(false)} 
    color="inherit" 
    disabled={processLoading}
    sx={{ textTransform: 'none', fontWeight: 'bold' }}
  >
    Batal
  </Button>
  
  <Button 
    variant="contained" 
    color="info" 
    onClick={handleValidasiSelesai} 
    disabled={processLoading} 
    startIcon={processLoading ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
    sx={{ 
      px: 4, 
      borderRadius: '8px', 
      textTransform: 'none', 
      fontWeight: 'bold',
      boxShadow: '0 4px 6px rgba(2, 136, 209, 0.2)' 
    }}
  >
    {processLoading ? "Memvalidasi..." : "Ya, Nyatakan Lunas"}
  </Button>
</DialogActions>
      </Dialog>

      {/* --- DIALOG PREVIEW FOTO --- */}
      <Dialog open={Boolean(previewImage)} onClose={() => setPreviewImage(null)} maxWidth="md">
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {previewImage?.label}
          <IconButton onClick={() => setPreviewImage(null)} size="small"><CancelIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: 'black', display: 'flex', justifyContent: 'center' }}>
          <img src={previewImage?.url} alt="Preview" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
        </DialogContent>
      </Dialog>

      {/* --- DIALOG DELETE --- */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><DeleteIcon color="error" /> Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>Apakah Anda yakin ingin menghapus data gadai <b>{selectedItem?.no_gadai}</b>?<br />
          <Typography variant="caption" color="error.main">*Tindakan ini tidak dapat dibatalkan.</Typography></Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDelete(false)}>Batal</Button>
          <Button variant="contained" color="error" onClick={handleDeleteGadai} disabled={processLoading}>{processLoading ? "Menghapus..." : "Ya, Hapus Data"}</Button>
        </DialogActions>
      </Dialog>


<Dialog open={openLunas} onClose={() => setOpenLunas(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
  <Box sx={{ bgcolor: 'success.main', color: 'white', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
    <PaymentsIcon />
    <Typography variant="h6" fontWeight="bold">Pelunasan Unit</Typography>
  </Box>
  <DialogContent sx={{ mt: 2 }}>
    <Stack spacing={2.5}>
      {/* Info Total Tebusan */}
      <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 3, textAlign: 'center' }}>
        <Typography variant="caption" color="success.dark" fontWeight="bold">TOTAL TEBUSAN (POKOK+DENDA+PENALTY)</Typography>
        <Typography variant="h4" color="success.main" fontWeight="900">
          Rp {Number(targetBayar).toLocaleString("id-ID")}
        </Typography>
      </Box>

      <TextField
        fullWidth
        label="Nominal Bayar (Uang dari Nasabah)"
        type="number"
        variant="outlined"
        value={nominalBayar}
        onChange={(e) => setNominalBayar(e.target.value)}
        helperText="Masukkan jumlah uang yang diterima"
      />

      <TextField
        select
        fullWidth
        label="Metode Pembayaran"
        value={metodeBayar}
        onChange={(e) => setMetodeBayar(e.target.value)}
      >
        <MenuItem value="cash">Tunai (Cash)</MenuItem>
        <MenuItem value="transfer">Transfer Bank</MenuItem>
      </TextField>

      {metodeBayar === "transfer" && (
        <Button
          variant="outlined"
          component="label"
          startIcon={<UploadIcon />}
          color={fileBukti ? "success" : "primary"}
          fullWidth
        >
          {fileBukti ? fileBukti.name : "Upload Bukti Transfer"}
          <input type="file" hidden accept="image/*" onChange={(e) => setFileBukti(e.target.files[0])} />
        </Button>
      )}
    </Stack>
  </DialogContent>
  <DialogActions sx={{ p: 3 }}>
    <Button onClick={() => setOpenLunas(false)} color="inherit">Batal</Button>
    <Button 
      variant="contained" 
      color="success" 
      onClick={handleSubmitLunas} 
      disabled={processLoading}
      sx={{ px: 4, borderRadius: 2 }}
    >
      {processLoading ? "Memproses..." : "Bayar Sekarang"}
    </Button>
  </DialogActions>
</Dialog>
    </Card>
  );
};

export default DetailGadaiPage;