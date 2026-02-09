import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  Grid, Card, Typography, TextField, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Box, Stack, 
  CircularProgress, Paper, Chip, Alert
} from '@mui/material';
import { Print, Refresh, Send } from '@mui/icons-material'; 
import axiosInstance from 'api/axiosInstance';
import { AuthContext } from "AuthContex/AuthContext";

import KopSuratImg from 'assets/images/Kop SUrat.png';  
import TtdManagerImg from 'assets/images/ttd.png'; 
import StempelImg from 'assets/images/stemple.png';     

const LaporanBrankasCetak = () => {
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reportData, setReportData] = useState(null); 
  const [error, setError] = useState(null);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  // LOGIKA DINAMIS: HM tidak pakai prefix /kasir sesuai route laravel kamu
  const getApiUrl = (endpoint) => {
    return userRole === 'hm' ? `/laporan/brankas${endpoint}` : `/kasir/laporan/brankas${endpoint}`;
  };

  const fetchLaporan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Menggunakan URL dinamis
      const res = await axiosInstance.get(getApiUrl(''), { params: { tanggal } });
      if (res.data.success) {
        setReportData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Gagal mengambil data laporan brankas.");
    } finally {
      setLoading(false);
    }
  }, [tanggal, userRole]);

  useEffect(() => { fetchLaporan(); }, [fetchLaporan]);

  const handleAjukan = async () => {
    if (!window.confirm("Ajukan Laporan Brankas ini ke Manager?")) return;
    setSubmitting(true);
    try {
      // Menggunakan URL dinamis untuk ajukan
      const res = await axiosInstance.post(getApiUrl('/ajukan'), { report_date: tanggal });
      if (res.data.success) {
        alert("Laporan brankas berhasil diajukan!");
        fetchLaporan(); 
      }
    } catch (err) {
      alert(err.response?.data?.message || "Gagal mengajukan laporan.");
    } finally { setSubmitting(false); }
  };

  const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

  const renderSignature = () => {
    const meta = reportData?.metadata;
    const isApproved = meta?.is_approved || false;
    const petugasName = meta?.kasir_name || user?.name || 'Kasir Toko'; // Ambil nama kasir dari data laporan jika ada
    const qrData = meta?.qr_code;
    const docId = meta?.doc_id;

    const waktuSekarang = new Date().toLocaleString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).replace(/\./g, ':');

    return (
      <Box sx={{ mt: 'auto', pt: 2 }}>
        <Grid container sx={{ textAlign: 'center', alignItems: 'flex-end', mb: 2 }}>
          <Grid item xs={4}>
            <Typography sx={{ fontSize: '0.7rem', mb: 6 }}>Dibuat Oleh (Kasir),</Typography>
            <Box sx={{ borderTop: '1.5px solid #000', mx: 2, pt: 0.5 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{petugasName}</Typography>
            </Box>
          </Grid>
          <Grid item xs={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 0.5 }}>
            {qrData ? (
              <>
                <img src={qrData} alt="QR" style={{ width: '70px', height: '70px' }} />
                <Typography sx={{ fontSize: '0.55rem', mt: 0.5, fontWeight: 'bold', color: '#555', fontFamily: 'monospace' }}>{docId}</Typography>
              </>
            ) : (
                <Box sx={{ height: '75px', display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption" color="error" sx={{ fontSize: '0.5rem', fontWeight: 'bold' }}>QR VALIDASI<br/>MENUNGGU ACC</Typography>
                </Box>
            )}
          </Grid>
          <Grid item xs={4}>
            <Typography sx={{ fontSize: '0.7rem', mb: 6 }}>Diketahui Oleh (Manajer),</Typography>
            <Box sx={{ position: 'relative', mx: 2 }}>
                {isApproved && (
                  <>
                    <Box component="img" src={TtdManagerImg} sx={{ position: 'absolute', width: '100px', bottom: '5px', left: '40%', transform: 'translateX(-50%)', zIndex: 2 }} />
                    <Box component="img" src={StempelImg} sx={{ position: 'absolute', width: '130px', bottom: '-1px', left: '-20px', zIndex: 4, opacity: 0.8 }} />
                  </>
                )}
                <Box sx={{ borderTop: '1.5px solid #000', pt: 0.5, position: 'relative', zIndex: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>MANAGER SGI</Typography>
                  {!isApproved && (
                    <Typography sx={{ fontSize: '0.5rem', color: 'red', fontWeight: 'bold', position: 'absolute', top: -15, width: '100%' }}>(BELUM DI-ACC)</Typography>
                  )}
                </Box>
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ textAlign: 'right', pr: 1 }}>
            <Typography sx={{ fontSize: '0.5rem', color: '#777', fontStyle: 'italic' }}>* Dicetak secara sistem pada {waktuSekarang} WIB</Typography>
            <Typography sx={{ fontSize: '0.5rem', color: isApproved ? 'green' : '#777', fontWeight: 'bold' }}>
                * Validasi Digital: {isApproved ? 'TERVERIFIKASI ASLI' : 'DRAFT / BELUM DIVALIDASI'}
            </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, bgcolor: '#455a64', minHeight: '100vh' }}>
      <Card sx={{ p: 2, mb: 3 }} className="no-print">
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1}>
            <TextField type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} size="small" sx={{ bgcolor: 'white', borderRadius: 1 }} />
            <Button variant="contained" startIcon={<Refresh />} onClick={fetchLaporan} color="secondary">Refresh</Button>
            
            {/* Hanya tampilkan tombol Ajukan jika role BUKAN hm */}
            {userRole !== 'hm' && (
                <Button variant="contained" startIcon={<Send />} onClick={handleAjukan} disabled={submitting || loading} color="warning" sx={{ fontWeight: 'bold' }}>
                    {submitting ? "..." : "Ajukan ACC"}
                </Button>
            )}
            
            <Button variant="contained" startIcon={<Print />} onClick={() => window.print()} color="primary">Cetak PDF</Button>
          </Stack>
          <Chip label={`LAPORAN BRANKAS - ${userRole.toUpperCase()}`} color="primary" sx={{ fontWeight: 'bold' }} />
        </Stack>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress color="inherit" /></Box>
      ) : (
        <Box className="print-area-wrapper" sx={{ display: 'flex', justifyContent: 'center' }}>
          <Paper className="printable-document" sx={{ 
                width: '210mm', minHeight: '297mm', p: '42mm 15mm 15mm 15mm', 
                position: 'relative', display: 'flex', flexDirection: 'column', bgcolor: '#fff',
                backgroundImage: `url("${KopSuratImg}")`, backgroundSize: '100% auto', backgroundRepeat: 'no-repeat',
                boxSizing: 'border-box'
            }}>
            
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, textDecoration: 'underline', fontSize: '1.1rem' }}>LAPORAN MUTASI BRANKAS HARIAN</Typography>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Tanggal: {reportData?.metadata?.tanggal_laporan}</Typography>
            </Box>

            {/* SUMMARY SECTION */}
            <Grid container spacing={1} sx={{ mb: 2 }}>
                {[
                    { label: 'SALDO AWAL', value: reportData?.summary_brankas?.saldo_awal },
                    { label: 'TOTAL MASUK (DEBET)', value: reportData?.summary_brankas?.total_debet, color: 'green' },
                    { label: 'TOTAL KELUAR (KREDIT)', value: reportData?.summary_brankas?.total_kredit, color: 'red' },
                    { label: 'SALDO AKHIR', value: reportData?.summary_brankas?.saldo_akhir, bold: true }
                ].map((box, i) => (
                    <Grid item xs={3} key={i}>
                        <Box sx={{ border: '1px solid #000', p: 1, textAlign: 'center' }}>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 'bold' }}>{box.label}</Typography>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: box.bold ? 900 : 500, color: box.color || 'inherit' }}>
                                {formatIDR(box.value)}
                            </Typography>
                        </Box>
                    </Grid>
                ))}
            </Grid>

            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" sx={{ '& .MuiTableCell-root': { border: '1px solid #000', py: 0.5, px: 0.8, fontSize: '0.65rem' } }}>
                <TableHead sx={{ bgcolor: '#f0f0f0' }}>
                  <TableRow>
                    <TableCell align="center" width="30">NO</TableCell>
                    <TableCell align="center" width="50">JAM</TableCell>
                    <TableCell>KETERANGAN / DESKRIPSI</TableCell>
                    <TableCell align="right" width="90">MASUK (D)</TableCell>
                    <TableCell align="right" width="90">KELUAR (K)</TableCell>
                    <TableCell align="right" width="100">SALDO</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData?.data_mutasi?.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell align="center">{idx + 1}</TableCell>
                      <TableCell align="center">{item.jam}</TableCell>
                      <TableCell sx={{ fontSize: '0.6rem' }}>{item.keterangan}</TableCell>
                      <TableCell align="right" sx={{ color: item.masuk > 0 ? 'green' : '#ccc' }}>{item.masuk > 0 ? formatIDR(item.masuk) : '-'}</TableCell>
                      <TableCell align="right" sx={{ color: item.keluar > 0 ? 'red' : '#ccc' }}>{item.keluar > 0 ? formatIDR(item.keluar) : '-'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatIDR(item.saldo_akhir)}</TableCell>
                    </TableRow>
                  ))}
                  {(!reportData?.data_mutasi || reportData?.data_mutasi.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">Tidak ada mutasi brankas hari ini.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {renderSignature()}
          </Paper>
        </Box>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area-wrapper, .print-area-wrapper *, .printable-document, .printable-document * { visibility: visible; }
          .print-area-wrapper { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
          .printable-document { box-shadow: none !important; margin: 0 !important; padding: 42mm 15mm 15mm 15mm !important; width: 210mm !important; min-height: 297mm !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          nav, aside, header, .no-print, [role="navigation"], .MuiDrawer-root { display: none !important; }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>
    </Box>
  );
};

export default LaporanBrankasCetak;