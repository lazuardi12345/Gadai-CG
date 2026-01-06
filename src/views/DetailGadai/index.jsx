import React, { useEffect, useState, useContext } from "react";
import {
  Card, CardHeader, CardContent, Divider, Table, TableContainer,
  TableHead, TableBody, TableRow, TableCell, TablePagination,
  IconButton, TextField, Button, CircularProgress, Typography,
  Stack, Chip, Tooltip, Box, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Paper, Alert
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
  VerifiedUser as VerifiedIcon,
  Delete as DeleteIcon,
  Smartphone as SmartphoneOutlinedIcon, 
  Diamond as DiamondOutlinedIcon,                           
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { AuthContext } from "AuthContex/AuthContext";

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

  const PopupDetailBarang = ({ open, onClose, itemId, itemType, userRole }) => {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  }
  
  const [nominalBayar, setNominalBayar] = useState("");
  const [metodeBayar, setMetodeBayar] = useState("cash");
  const [fileBukti, setFileBukti] = useState(null);
  const [targetBayar, setTargetBayar] = useState(0);
  const [processLoading, setProcessLoading] = useState(false);

  
  const getApiUrl = (resource) => {
    if (userRole === "petugas") return `/petugas/${resource}`;
    if (userRole === "checker") return `/checker/${resource}`;
    return `/${resource}`;
  };

const [openDelete, setOpenDelete] = useState(false);

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

  const handleValidasiSelesai = async () => {
    setProcessLoading(true);
    try {
      const res = await axiosInstance.patch(`${getApiUrl("detail-gadai")}/${selectedItem.id}/validasi-selesai`);
      if (res.data.success) {
        setOpenValidasi(false);
        fetchData();
      }
    } catch (err) {
      alert("Gagal validasi status");
    } finally {
      setProcessLoading(false);
    }
  };

  const handleSubmitLunas = async () => {
    if (Number(nominalBayar) < targetBayar) {
        alert("Nominal bayar kurang!");
        return;
    }
    
    setProcessLoading(true);
    try {
      const formData = new FormData();
      formData.append("nominal_bayar", nominalBayar);
      formData.append("metode_pembayaran", metodeBayar);
      if (fileBukti) formData.append("bukti_transfer", fileBukti);

      const res = await axiosInstance.post(
        `${getApiUrl("detail-gadai")}/${selectedItem.id}/pelunasan?_method=PATCH`, 
        formData, 
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data.success) {
        setOpenLunas(false);
        setFileBukti(null);
        fetchData();
        alert("Pembayaran Berhasil!");
        navigate(`/print-struk-pelunasan/${selectedItem.id}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Gagal memproses pelunasan");
    } finally {
      setProcessLoading(false);
    }
  };

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
    if (!approval) {
      return <Chip label="Belum" size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />;
    }

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

  // LOGIKA NAVIGASI DINAMIS BERDASARKAN TYPE
  const getPrintSBGRoute = (item) => {
    const typeName = item.type?.nama_type?.toLowerCase() || '';
    if (["retro", "logam_mulia", "perhiasan", "logam mulia"].includes(typeName)) {
      return `/print-surat-bukti-gadai-emas/${item.id}`;
    }
    if (typeName === "handphone") {
      return `/print-surat-bukti-gadai-hp/${item.id}`;
    }
    // Default fallback
    return `/print-surat-bukti-gadai-emas/${item.id}`;
  };

const getUnitIcon = (typeName) => {
  const name = typeName?.toLowerCase() || '';

  if (name.includes('hp') || name.includes('handphone')) {
    return <SmartphoneOutlinedIcon sx={{ fontSize: 14 }} />;
  }
  if (
    name.includes('emas') || 
    name.includes('logam') || 
    name.includes('perhiasan') || 
    name.includes('retro') 
  ) {
    return <DiamondOutlinedIcon sx={{ fontSize: 14 }} />;
  }
  
  return <InfoIcon sx={{ fontSize: 14 }} />;
};

  const isManagement = ["hm", "checker"].includes(userRole);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress />
    </Box>
  );

 // ... (bagian import dan state tetap sama)

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
                {/* BAGIAN ERROR SUDAH DIHAPUS DARI SINI */}
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
    <Typography variant="body2" fontWeight="bold" color="primary">
      {item.no_gadai}
    </Typography>

    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        Nasabah:
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {item.nasabah?.nama_lengkap || '-'}
      </Typography>
    </Box>

    <Box 
      sx={{ 
        mt: 0.5, 
        p: 0.5, 
        bgcolor: '#f1f5f9', 
        borderRadius: 1, 
        borderLeft: '3px solid #1e293b',
        display: 'inline-flex', 
        width: 'fit-content'
      }}
    >
      <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 'bold' }}>
        {getUnitIcon(item.type?.nama_type)} {item.type?.nama_type || 'Tanpa Type'}
      </Typography>
    </Box>
  </Stack>
</TableCell>

                    <TableCell align="center">
                      <Stack spacing={0.2}>
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Gadai: {item.tanggal_gadai}</Typography>
                        <Typography variant="caption" fontWeight="bold" color="error.main" sx={{ fontSize: '0.65rem' }}>
                          JT: {item.jatuh_tempo}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell align="right">
                      <Stack spacing={0.2}>
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Taksiran: {Number(item.taksiran).toLocaleString("id-ID")}</Typography>
                        <Typography variant="body2" fontWeight="bold" color="primary.main">
                          {Number(item.uang_pinjaman).toLocaleString("id-ID")}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell align="center">
                      <Stack spacing={0.5} alignItems="center">
                        <Chip label={item.status.toUpperCase()} color={getStatusColor(item.status)} size="small" sx={{ fontSize: '0.65rem', fontWeight: 'bold' }} />
                        {item.perpanjangan_tempos?.length > 0 && (
                          <Chip 
                            variant="outlined" color="secondary" size="small"
                            icon={<ExtensionIcon style={{ fontSize: 12 }} />}
                            label={`${item.perpanjangan_tempos.filter(p => p.status_bayar === 'lunas').length}x`}
                            sx={{ fontSize: '0.65rem', height: 20 }}
                          />
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
                            <Button 
                              variant="contained" color="info" size="small" 
                              onClick={() => { setSelectedItem(item); setOpenValidasi(true); }}
                              sx={{ fontSize: '0.65rem', textTransform: 'none' }}
                            >
                              Cek Selesai
                            </Button>
                          )}
                          {item.status === "selesai" && (
                            <Button 
                              variant="contained" color="success" size="small" 
                              onClick={() => {
                                setSelectedItem(item);
                                setTargetBayar(item.uang_pinjaman);
                                setNominalBayar("");
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
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => navigate(getPrintSBGRoute(item))}
                          >
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Print Struk Awal">
                          <IconButton size="small" color="secondary" onClick={() => navigate(`/print-struk-awal/${item.id}`)}>
                            <ReceiptIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {item.perpanjangan_tempos?.some(p => p.status_bayar === "pending") && (
                          <Tooltip title="Print Struk Perpanjangan (Pending)">
                            <IconButton 
                              size="small" 
                              color="warning" 
                              onClick={() => navigate(`/print-struk-perpanjangan/${item.id}`)}
                            >
                              <ExtensionIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {item.status === "lunas" && (
                          <Tooltip title="Print Struk Pelunasan">
                            <IconButton size="small" color="success" onClick={() => navigate(`/print-struk-pelunasan/${item.id}`)}>
                              <PaymentsIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>

                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <IconButton size="small" color="secondary" onClick={() => navigate(`/edit-detail-gadai/${item.id}`)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        {userRole === "hm" && (
                          <IconButton size="small" sx={{ color: 'error.main' }} onClick={() => { setSelectedItem(item); setOpenDelete(true); }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
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
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
        />
      </CardContent>

      <Dialog open={openValidasi} onClose={() => setOpenValidasi(false)} maxWidth="xs" fullWidth>
  <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'info.main', color: 'white', mb: 2 }}>
    <InfoIcon /> Konfirmasi Validasi Checker
  </DialogTitle>
  <DialogContent>
    <Stack spacing={2} sx={{ mt: 1 }}>
      <Typography variant="body1">
        Unit <b>{selectedItem?.no_gadai}</b>
      </Typography>
      
      <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
        Pastikan Anda sudah memeriksa foto unit, IMEI/Kadar Emas, dan kelengkapan lainnya sebelum melakukan validasi.
      </Alert>

      {/* TOMBOL LIHAT DETAIL DI DALAM DIALOG */}
      <Button
        fullWidth
        variant="outlined"
        color="primary"
        startIcon={<InfoIcon />}
        onClick={() => {
          // Logika navigasi berdasarkan tipe barang
          const typeName = selectedItem?.type?.nama_type?.toLowerCase() || '';
          if (typeName.includes('hp')) {
            navigate(`/detail-gadai-hp/${selectedItem?.id_hp || selectedItem?.id}`);
          } else {
            navigate(`/detail-gadai-emas/${selectedItem?.id_emas || selectedItem?.id}`);
          }
        }}
        sx={{ py: 1.2, fontWeight: 'bold' }}
      >
        Lihat Detail Unit (Foto & Fisik)
      </Button>
    </Stack>
  </DialogContent>
  <Divider />
  <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
    <Button onClick={() => setOpenValidasi(false)} color="inherit">Batal</Button>
    <Button 
      variant="contained" 
      color="info" 
      onClick={handleValidasiSelesai} 
      disabled={processLoading}
      sx={{ fontWeight: 'bold' }}
    >
      {processLoading ? "Memproses..." : "Ya, Selesaikan"}
    </Button>
  </DialogActions>
</Dialog>


      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
  <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <DeleteIcon color="error" /> Konfirmasi Hapus
  </DialogTitle>
  <DialogContent>
    <Typography>
      Apakah Anda yakin ingin menghapus data gadai <b>{selectedItem?.no_gadai}</b>? 
      <br />
      <Typography variant="caption" color="error.main">
        *Tindakan ini tidak dapat dibatalkan.
      </Typography>
    </Typography>
  </DialogContent>
  <DialogActions sx={{ p: 2 }}>
    <Button onClick={() => setOpenDelete(false)}>Batal</Button>
    <Button 
      variant="contained" 
      color="error" 
      onClick={handleDeleteGadai} 
      disabled={processLoading}
    >
      {processLoading ? "Menghapus..." : "Ya, Hapus Data"}
    </Button>
  </DialogActions>
</Dialog>

      <Dialog open={openLunas} onClose={() => setOpenLunas(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <Box sx={{ bgcolor: 'success.main', color: 'white', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PaymentsIcon />
          <Typography variant="h6" fontWeight="bold">Pelunasan Unit</Typography>
        </Box>
        <DialogContent sx={{ mt: 2 }}>
          <Stack spacing={2.5}>
            <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 3, textAlign: 'center' }}>
              <Typography variant="caption" color="success.dark" fontWeight="bold">TOTAL TEBUSAN</Typography>
              <Typography variant="h4" color="success.main" fontWeight="900">Rp {Number(targetBayar).toLocaleString("id-ID")}</Typography>
            </Box>
            <TextField select fullWidth label="Metode Pembayaran" value={metodeBayar} onChange={(e) => setMetodeBayar(e.target.value)} size="small">
              <MenuItem value="cash">Cash / Tunai</MenuItem>
              <MenuItem value="transfer">Transfer Bank</MenuItem>
            </TextField>
            {metodeBayar === "transfer" && (
              <Button variant="outlined" component="label" fullWidth startIcon={<UploadIcon />} color={fileBukti ? "success" : "primary"}>
                {fileBukti ? fileBukti.name : "Upload Bukti Transfer"}
                <input type="file" hidden accept="image/*" onChange={(e) => setFileBukti(e.target.files[0])} />
              </Button>
            )}
            <Box>
              <TextField fullWidth autoFocus size="small" type="number" label="Nominal Diterima" value={nominalBayar} onChange={(e) => setNominalBayar(e.target.value)} />
            </Box>
            {nominalBayar && (
              <Box sx={{ p: 1.5, borderRadius: 2, display: 'flex', justifyContent: 'space-between', bgcolor: Number(nominalBayar) >= targetBayar ? 'success.50' : 'error.50' }}>
                <Typography variant="caption">{Number(nominalBayar) >= targetBayar ? "Kembalian" : "Kurang"}</Typography>
                <Typography variant="caption" fontWeight="bold">Rp {Number(Math.abs(nominalBayar - targetBayar)).toLocaleString("id-ID")}</Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenLunas(false)}>Batal</Button>
          <Button variant="contained" color="success" disabled={!nominalBayar || Number(nominalBayar) < targetBayar || (metodeBayar === 'transfer' && !fileBukti) || processLoading} onClick={handleSubmitLunas}>
            {processLoading ? "Memproses..." : "Konfirmasi Lunas"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default DetailGadaiPage;