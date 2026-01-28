import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import {
  Grid, Card, Typography, TextField, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Box, Stack, 
  CircularProgress, Paper, Chip, Pagination, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material';
import { Refresh, PhotoCamera, Lock } from '@mui/icons-material'; 
import { Html5Qrcode } from "html5-qrcode"; 
import axiosInstance from 'api/axiosInstance';
import { AuthContext } from "AuthContex/AuthContext";

const LaporanMutasiGudang = () => {
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();


  const canExecute = userRole === 'gudang' || userRole === 'hm';


  const getApiBase = () => {
    if (userRole === 'gudang') return '/gudang';
    if (userRole === 'hm') return '/hm/gudang';
    return '/all/gudang'; 
  };

  const apiBase = getApiBase();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0); 
  const [dataList, setDataList] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [page, setPage] = useState(1);
  const [noGadaiInput, setNoGadaiInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const scannerRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const path = activeTab === 0 ? '/riwayat' : '/pending';
      const res = await axiosInstance.get(`${apiBase}${path}`, { 
        params: { tanggal, page, per_page: 15 } 
      });
      
      if (res.data.success) {
        setDataList(res.data.data);
        setPagination(res.data.pagination || { current_page: 1, last_page: 1 });
      }
    } catch (err) {
      console.error("Fetch error", err);
    } finally { setLoading(false); }
  }, [activeTab, tanggal, page, apiBase]);

  useEffect(() => { fetchData(); }, [fetchData]);


const handleIdentify = async (codeValue = null) => {
  if (!canExecute) return; 

  // Ambil code dari scanner atau input manual
  let code = codeValue || noGadaiInput;
  if (!code) return;

  // Bersihkan code (hapus spasi atau karakter aneh)
  code = code.trim();

  try {
    setLoading(true); 
    const res = await axiosInstance.post(`${apiBase}/scan`, { no_gadai: code });
    
    if (res.data.success) {

      if (navigator.vibrate) navigator.vibrate(200);
      setScannedData(res.data.data);
      
      setOpenConfirm(true);
    }
  } catch (err) {
    const msg = err.response?.data?.message || "Gagal mengidentifikasi data.";
    alert(`❌ ${msg}`);
  } finally { 
    setLoading(false);
    setNoGadaiInput(''); 
  }
};

const handleFinalVerify = async () => {
  try {
    setLoading(true);

    const res = await axiosInstance.post(`${apiBase}/verifikasi`, {
      detail_gadai_id: scannedData.detail_gadai_id,
      jenis_pergerakan: scannedData.aksi,
      keterangan: "Verifikasi Terminal Gudang"
    });

    if (res.data.success) {
      setOpenConfirm(false);
      fetchData(); // Refresh list riwayat otomatis
      
      // Tampilan Sukses yang Clean
      console.log("✅ Success:", res.data.message);
      alert(`SUKSES: ${res.data.message}`);
    }
  } catch (err) {
    // --- TEKNIK LOGGING PROFESIONAL ---
    const serverResponse = err.response?.data;
    const statusCode = err.response?.status;

    console.error(`[Error ${statusCode}]`, serverResponse);

    // Menampilkan pesan error yang "berisi"
    let errorMessage = "Terjadi kesalahan sistem.";
    
    if (statusCode === 422) {
        errorMessage = "Data tidak valid. Periksa kembali inputan Anda.";
    } else if (serverResponse?.message) {
        errorMessage = serverResponse.message;
    }

    // Gabungkan dengan info debug jika ada (SQL Error tadi bakal muncul di sini)
    const debugInfo = serverResponse?.debug ? `\n\nLog System: ${serverResponse.debug}` : "";
    
    alert(`⚠️ VERIFIKASI GAGAL\n----------------------------\n${errorMessage}${debugInfo}`);

  } finally {
    setLoading(false);
  }
};

const startCamera = async () => {
  if (!canExecute) return;
  
  // 1. Set scanning true dulu supaya DIV "reader-gudang" muncul di DOM
  setIsScanning(true);

  // 2. Gunakan requestAnimationFrame atau setTimeout sedikit lebih lama 
  // untuk memastikan React selesai merender elemen DIV tersebut
  setTimeout(async () => {
    try {
      const element = document.getElementById("reader-gudang");
      if (!element) {
        console.error("Elemen reader-gudang tidak ditemukan!");
        setIsScanning(false);
        return;
      }

      const html5QrCode = new Html5Qrcode("reader-gudang");
      scannerRef.current = html5QrCode;

      const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0 
      };

      await html5QrCode.start(
        { facingMode: "environment" }, 
        config,
        (text) => { 
          stopCamera(); 
          handleIdentify(text); 
        }
      );
    } catch (err) {
      console.error("Gagal start kamera:", err);
      alert("Kamera gagal diakses. Pastikan izin kamera diberikan dan tidak sedang dibuka aplikasi lain.");
      setIsScanning(false);
    }
  }, 500); // Naikkan ke 500ms agar lebih aman
};

const stopCamera = async () => {
  if (scannerRef.current) {
    try {
      await scannerRef.current.stop();
      // Penting: bersihkan isi div setelah stop
      const element = document.getElementById("reader-gudang");
      if (element) element.innerHTML = ""; 
    } catch (err) {
      console.warn("Gagal stop kamera secara bersih:", err);
    }
    scannerRef.current = null;
  }
  setIsScanning(false);
};

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, bgcolor: '#1a252f', minHeight: '100vh' }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 900 }}>GUDANG TERMINAL</Typography>
        <Chip label={userRole.toUpperCase()} color={canExecute ? "success" : "warning"} />
      </Stack>

      {canExecute ? (
        <Card sx={{ p: 2, mb: 3, borderRadius: '12px', borderLeft: '6px solid #2e7d32' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={9}>
              <TextField 
                fullWidth 
                label="Scan atau Ketik No Gadai" 
                value={noGadaiInput} 
                onChange={(e) => setNoGadaiInput(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && handleIdentify()}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button fullWidth variant="contained" color="success" size="large" startIcon={<PhotoCamera />} onClick={startCamera}>
                SCAN BARCODE
              </Button>
            </Grid>
          </Grid>
          {isScanning && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <div id="reader-gudang" style={{ width: '100%', maxWidth: '400px', margin: 'auto' }}></div>
              <Button onClick={stopCamera} color="error">Batal Scan</Button>
            </Box>
          )}
        </Card>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          Akun lo (<b>{userRole}</b>) hanya punya akses <b>VIEW ONLY</b>. Lo nggak bisa input atau scan barang.
        </Alert>
      )}

      {/* DATA TABLE */}
      <Card sx={{ borderRadius: '12px' }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="fullWidth">
          <Tab label="Riwayat Mutasi" />
          <Tab label="Barang Menunggu" />
        </Tabs>
        
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField type="date" size="small" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
          <Button startIcon={<Refresh />} variant="outlined" onClick={fetchData}>Refresh</Button>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>WAKTU</TableCell>
                <TableCell>NO GADAI</TableCell>
                <TableCell>UNIT / NASABAH</TableCell>
                <TableCell align="center">AKSI</TableCell>
              </TableRow>
            </TableHead>
<TableBody>
  {loading ? (
    <TableRow>
      <TableCell colSpan={4} align="center">
        <CircularProgress sx={{ my: 2 }} />
      </TableCell>
    </TableRow>
  ) : dataList.length > 0 ? (
    dataList.map((item) => (
      <TableRow key={item.id} hover>
        <TableCell>
          {activeTab === 0 ? (
            item.waktu
          ) : (
            <Chip 
              size="small" 
              label={item.status} 
              color="secondary" 
              variant="outlined"
            />
          )}
        </TableCell>
        <TableCell>
          <b>{item.no_gadai}</b>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{item.barang}</Typography>
          <Typography variant="caption" color="textSecondary">
            {item.nasabah}
          </Typography>
        </TableCell>
        <TableCell align="center">
          {activeTab === 0 ? (
            // TAB RIWAYAT: Menampilkan status pergerakan yang sudah terjadi
            <Chip 
              label={item.jenis_pergerakan?.toUpperCase()} 
              color={item.jenis_pergerakan === 'masuk' ? 'success' : 'error'} 
              size="small"
            />
          ) : (
            // TAB MENUNGGU: Tombol "PROSES" DIBUANG untuk mencegah kecurangan.
            // Diganti dengan instruksi visual agar petugas melakukan scan.
            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
              <PhotoCamera sx={{ fontSize: 16, color: '#9e9e9e' }} />
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#9e9e9e', 
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}
              >
                Wajib Scan Fisik
              </Typography>
            </Stack>
          )}
        </TableCell>
      </TableRow>
    ))
  ) : (
    <TableRow>
      <TableCell colSpan={4} align="center">
        <Typography variant="body2" sx={{ py: 2, color: '#9e9e9e' }}>
          Tidak ada data untuk ditampilkan.
        </Typography>
      </TableCell>
    </TableRow>
  )}
</TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
          <Pagination count={pagination.last_page} page={page} onChange={(e,v) => setPage(v)} color="primary" />
        </Box>
      </Card>

      {/* CONFIRMATION DIALOG */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: scannedData?.aksi === 'masuk' ? '#e8f5e9' : '#fff3e0' }}>
          Konfirmasi {scannedData?.aksi?.toUpperCase()}
        </DialogTitle>
        <DialogContent dividers>
          {scannedData && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity={scannedData.aksi === 'masuk' ? "success" : "warning"}>
                Barang berstatus <b>{scannedData.status_gadai}</b>
              </Alert>
              <Box>
                <Typography variant="caption" color="textSecondary">No Gadai</Typography>
                <Typography variant="body1" fontWeight="bold">{scannedData.no_gadai}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Nasabah / Unit</Typography>
                <Typography variant="body2">{scannedData.nasabah} - {scannedData.barang}</Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenConfirm(false)} color="inherit">Batal</Button>
          <Button 
            onClick={handleFinalVerify} 
            variant="contained" 
            color={scannedData?.aksi === 'masuk' ? 'success' : 'error'}
          >
            Sesuai, Catat {scannedData?.aksi === 'masuk' ? 'Masuk' : 'Keluar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LaporanMutasiGudang;