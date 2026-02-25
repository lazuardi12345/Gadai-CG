import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import {
  Grid, Card, Typography, TextField, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Box, Stack, 
  CircularProgress, Paper, Chip, Pagination, Tabs, Tab, Dialog, 
  DialogTitle, DialogContent, DialogActions, Alert, MenuItem 
} from '@mui/material';
import { Refresh, PhotoCamera } from '@mui/icons-material'; 
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

  // --- STATES ---
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0); 
  const [dataList, setDataList] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [page, setPage] = useState(1);
  const [noGadaiInput, setNoGadaiInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  
  // States untuk Konfirmasi & Penerima
  const [openConfirm, setOpenConfirm] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [users, setUsers] = useState([]); // Akan diisi dari response scan
  const [penerimaId, setPenerimaId] = useState('');
  const scannerRef = useRef(null);

  // --- FETCH DATA LIST ---
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

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  // --- SCAN & IDENTIFY ---
  const handleIdentify = async (codeValue = null) => {
    if (!canExecute) return; 
    let code = (codeValue || noGadaiInput).trim();
    if (!code) return;

    try {
      setLoading(true); 
      const res = await axiosInstance.post(`${apiBase}/scan`, { no_gadai: code });
      
      if (res.data.success) {
        if (navigator.vibrate) navigator.vibrate(200);
        
        console.log('Scanned data:', res.data.data);
        

        setScannedData(res.data.data);

        setUsers(res.data.data.list_users || []);
        console.log(' List users:', res.data.data.list_users);
        
        setPenerimaId(''); 
        setOpenConfirm(true);
      }
    } catch (err) {
      alert(`❌ ${err.response?.data?.message || "Gagal identifikasi"}`);
    } finally { 
      setLoading(false);
      setNoGadaiInput(''); 
    }
  };

  const handleFinalVerify = async () => {
    if (!penerimaId) {
      alert("Wajib memilih Nama Penerima!");
      return;
    }

    try {
      setLoading(true);
     const res = await axiosInstance.post(`${apiBase}/verifikasi`, {
  detail_gadai_id: scannedData.detail_gadai_id,
  jenis_pergerakan: scannedData.aksi,
  user_pilihan_id: penerimaId,  
  keterangan: `Verifikasi Gudang via Scanner`
});

      if (res.data.success) {
        setOpenConfirm(false);
        fetchData(); 
        alert(`✅ SUKSES: Barang dicatat ${scannedData.aksi.toUpperCase()}`);
      }
    } catch (err) {
      alert(`⚠️ GAGAL: ${err.response?.data?.message || "Terjadi kesalahan"}`);
    } finally {
      setLoading(false);
    }
  };

  // --- CAMERA LOGIC ---
  const startCamera = async () => {
    setIsScanning(true);
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader-gudang");
        scannerRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: "environment" }, 
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (text) => { stopCamera(); handleIdentify(text); }
        );
      } catch (err) {
        setIsScanning(false);
        alert("Kamera gagal diakses.");
      }
    }, 500);
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      const element = document.getElementById("reader-gudang");
      if (element) element.innerHTML = ""; 
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, bgcolor: '#1a252f', minHeight: '100vh' }}>
      {/* HEADER SECTION */}
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 900 }}>GUDANG TERMINAL</Typography>
        <Chip label={userRole.toUpperCase()} color={canExecute ? "success" : "warning"} />
      </Stack>

      {/* SCANNER SECTION */}
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
          Akun Anda hanya VIEW ONLY.
        </Alert>
      )}

      {/* DATA TABLE */}
      <Card sx={{ borderRadius: '12px' }}>
        <Tabs value={activeTab} onChange={(e, v) => { setActiveTab(v); setPage(1); }} variant="fullWidth">
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
                {activeTab === 0 && (
                  <>
                    <TableCell>PENYERAH</TableCell>
                    <TableCell>PENERIMA</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={activeTab === 0 ? 6 : 4} align="center"><CircularProgress sx={{ my: 2 }} /></TableCell></TableRow>
              ) : dataList.length > 0 ? (
                dataList.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{activeTab === 0 ? item.waktu : item.waktu_update || '-'}</TableCell>
                    <TableCell><b>{item.no_gadai}</b></TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.barang}</Typography>
                      <Typography variant="caption" color="textSecondary">{item.nasabah}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={activeTab === 0 ? item.jenis_pergerakan?.toUpperCase() : "WAJIB SCAN"} 
                        color={item.jenis_pergerakan === 'masuk' ? 'success' : 'error'} 
                        variant={activeTab === 0 ? "filled" : "outlined"}
                        size="small"
                      />
                    </TableCell>
                    {activeTab === 0 && (
                      <>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>{item.penyerah}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>{item.penerima}</Typography>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={activeTab === 0 ? 6 : 4} align="center">Tidak ada data.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
          <Pagination count={pagination.last_page} page={page} onChange={(e,v) => setPage(v)} color="primary" />
        </Box>
      </Card>

      {/* --- CONFIRMATION DIALOG --- */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: scannedData?.aksi === 'masuk' ? '#e8f5e9' : '#ffebee' }}>
          Konfirmasi Barang {scannedData?.aksi?.toUpperCase()}
        </DialogTitle>
        <DialogContent dividers>
          {scannedData && (
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <Alert severity={scannedData.aksi === 'masuk' ? "success" : "error"}>
                Status Gadai: <b>{scannedData.status_gadai}</b>
              </Alert>
              
              <Box>
                <Typography variant="caption" color="textSecondary">Unit / Nasabah</Typography>
                <Typography variant="body1" fontWeight="bold">{scannedData.barang}</Typography>
                <Typography variant="body2">{scannedData.nasabah} ({scannedData.no_gadai})</Typography>
              </Box>

             {/* PENYERAH */}
<Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
  <Typography variant="caption" color="textSecondary" fontWeight={600}>PENYERAH</Typography>
  
  {scannedData.aksi === 'keluar' ? (
    // KELUAR → penyerah = user login (fixed/otomatis)
    <>
      <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>
        {scannedData.penyerah?.name || user?.name || '-'}
      </Typography>
      <Typography variant="caption" color="textSecondary">
        ({scannedData.penyerah?.role || '-'}) — Otomatis
      </Typography>
    </>
  ) : (
    // MASUK → penyerah = dipilih (siapapun bisa antar)
    <TextField
      select fullWidth label="Pilih Penyerah"
      value={penerimaId}
      onChange={(e) => setPenerimaId(e.target.value)}
      helperText="Pilih siapa yang mengantarkan barang masuk"
      variant="outlined" required sx={{ mt: 1 }}
    >
      {users.map((u) => (
        <MenuItem key={u.id} value={u.id}>
          {u.name} <span style={{ color: '#666', fontSize: '0.85em' }}>({u.role_label})</span>
        </MenuItem>
      ))}
    </TextField>
  )}
</Box>

<hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #ddd' }} />

{/* PENERIMA */}
<Box>
  <Typography variant="caption" color="textSecondary" fontWeight={600}>PENERIMA</Typography>
  
  {scannedData.aksi === 'masuk' ? (
    // MASUK → penerima = user login (fixed/otomatis)
    <>
      <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>
        {user?.name || '-'}
      </Typography>
      <Typography variant="caption" color="textSecondary">
        (Staff Gudang) — Otomatis
      </Typography>
    </>
  ) : (
    // KELUAR → penerima = dipilih
    <TextField
      select fullWidth label="Pilih Penerima"
      value={penerimaId}
      onChange={(e) => setPenerimaId(e.target.value)}
      helperText="Pilih siapa yang mengambil barang keluar"
      variant="outlined" required sx={{ mt: 1 }}
    >
      {users.map((u) => (
        <MenuItem key={u.id} value={u.id}>
          {u.name} <span style={{ color: '#666', fontSize: '0.85em' }}>({u.role_label})</span>
        </MenuItem>
      ))}
    </TextField>
  )}
</Box>
              <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #ddd' }} />

              {/* DROPDOWN PEMILIHAN PENERIMA */}
              <TextField
                select
                fullWidth
                label="Pilih Penerima"
                value={penerimaId}
                onChange={(e) => setPenerimaId(e.target.value)}
                helperText={users.length === 0 ? "⚠️ Tidak ada user tersedia" : "Wajib pilih orang yang menerima fisik barang"}
                variant="outlined"
                required
                disabled={users.length === 0}
              >
                {users.length === 0 ? (
                  <MenuItem disabled>Tidak ada data user</MenuItem>
                ) : (
                  users.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.name} <span style={{ color: '#666', fontSize: '0.85em' }}>({u.role_label})</span>
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenConfirm(false)} color="inherit">Batal</Button>
          <Button 
            onClick={handleFinalVerify} 
            variant="contained" 
            disabled={!penerimaId || loading}
            color={scannedData?.aksi === 'masuk' ? 'success' : 'error'}
          >
            {loading ? 'Proses...' : `Konfirmasi ${scannedData?.aksi === 'masuk' ? 'Masuk' : 'Keluar'}`}
          </Button>
        </DialogActions>  
      </Dialog>
    </Box>
  );
};

export default LaporanMutasiGudang;