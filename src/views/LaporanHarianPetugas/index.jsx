import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  Grid, Card, Typography, TextField, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Box, Stack, 
  CircularProgress, Paper, Chip, Alert, TableFooter
} from '@mui/material';
import { Print, Refresh, Send } from '@mui/icons-material'; 
import axiosInstance from 'api/axiosInstance';
import { AuthContext } from "AuthContex/AuthContext";

import KopSuratImg from 'assets/images/Kop SUrat.png'; 
import TtdManagerImg from 'assets/images/ttd.png'; 
import StempelImg from 'assets/images/stemple.png';     

const LaporanHarianPetugas = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false); 
  const [reportData, setReportData] = useState(null); 
  const [error, setError] = useState(null);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  const fetchLaporanHarian = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/petugas/harian/cetak', { params: { tanggal } });
      if (res.data.success) {
        setReportData(res.data);
      }
    } catch (err) { 
      setError(err.response?.data?.message || "Gagal mengambil data laporan harian.");
    } finally { setLoading(false); }
  }, [tanggal]);

  useEffect(() => { fetchLaporanHarian(); }, [fetchLaporanHarian]);

  const handleAjukan = async () => {
    if (!window.confirm("Ajukan Laporan Rekapitulasi Harian ini ke Manager?")) return;
    setSubmitting(true);
    try {
      const res = await axiosInstance.post('/petugas/report/submit', { report_date: tanggal });
      if (res.data.success) {
        alert("Laporan berhasil diajukan!");
        fetchLaporanHarian(); 
      }
    } catch (err) {
      alert(err.response?.data?.message || "Gagal mengajukan laporan.");
    } finally { setSubmitting(false); }
  };

  const formatTanggalIndo = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(date);
  };

  const formatRupiah = (val) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

  const renderSignature = () => {
    const meta = reportData?.metadata;
    const isApproved = meta?.is_approved || false;
    const checkerName = user?.name || 'Petugas';
    const qrData = meta?.qr_code;
    const docId = meta?.doc_id;

    const waktuSekarang = new Date().toLocaleString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).replace(/\./g, ':');

    return (
      <Box className="signature-area" sx={{ mt: 'auto', pt: 2, position: 'relative' }}>
        <Grid container sx={{ textAlign: 'center', alignItems: 'flex-end', mb: 3 }}>
          <Grid item xs={4}>
            <Typography sx={{ fontSize: '0.7rem', mb: 6 }}>Dibuat Oleh (Petugas),</Typography>
            <Box sx={{ borderTop: '1.5px solid #000', mx: 2, pt: 0.5 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{checkerName}</Typography>
            </Box>
          </Grid>

          <Grid item xs={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 0.5 }}>
            {qrData ? (
              <>
                <img src={qrData} alt="QR" style={{ width: '70px', height: '70px' }} />
                <Typography sx={{ fontSize: '0.55rem', mt: 0.5, fontWeight: 'bold', color: '#555', fontFamily: 'monospace' }}>
                    {docId}
                </Typography>
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
                    <Typography sx={{ fontSize: '0.5rem', color: 'red', fontWeight: 'bold', position: 'absolute', top: -15, width: '100%' }}>
                      (BELUM DI-ACC)
                    </Typography>
                  )}
                </Box>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ textAlign: 'right', mt: 1, pr: 1, borderTop: '0.5px solid #eee', pt: 0.5 }}>
            <Typography sx={{ fontSize: '0.5rem', color: '#777', fontStyle: 'italic', lineHeight: 1.2 }}>
                * Laporan ini dicetak secara sistem komputerisasi pada {waktuSekarang} WIB
            </Typography>
            <Typography sx={{ fontSize: '0.5rem', color: isApproved ? 'green' : '#777', fontWeight: 'bold', lineHeight: 1.2 }}>
                * Validasi Digital: {isApproved ? 'TERVERIFIKASI ASLI' : 'DRAFT / BELUM DIVALIDASI'}
            </Typography>
        </Box>
      </Box>
    );
  };

  const paperStyle = { 
    width: '210mm', height: '297mm', margin: '0 auto', p: '42mm 15mm 15mm 15mm', 
    position: 'relative', display: 'flex', flexDirection: 'column', bgcolor: '#fff',
    backgroundImage: `url("${KopSuratImg}")`, backgroundSize: '100% auto', backgroundRepeat: 'no-repeat',
    backgroundPosition: 'top center', boxShadow: '0 0 20px rgba(0,0,0,0.5)', boxSizing: 'border-box',
    overflow: 'hidden'
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, bgcolor: '#455a64', minHeight: '100vh' }}>
      <Card sx={{ p: 2, mb: 3, borderRadius: '12px' }} className="no-print">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} size="small" />
            <Button variant="contained" startIcon={<Refresh />} onClick={fetchLaporanHarian} color="secondary">Refresh</Button>
            <Button variant="contained" startIcon={<Send />} onClick={handleAjukan} disabled={submitting || loading} color="warning" sx={{fontWeight: 'bold'}}>
                {submitting ? "Proses..." : "Ajukan ACC"}
            </Button>
            <Button variant="contained" startIcon={<Print />} onClick={() => window.print()} color="primary">Cetak PDF</Button>
          </Stack>
          <Chip label="PETUGAS: REKAPITULASI HARIAN" color="primary" sx={{fontWeight: 'bold'}} />
        </Stack>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2, mx: 'auto', maxWidth: '210mm' }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
            <CircularProgress sx={{ color: '#fff', mb: 2 }} />
            <Typography sx={{ color: '#fff' }}>Mengambil Data...</Typography>
        </Box>
      ) : (
        <Box className="print-container" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Paper className="print-page" sx={paperStyle}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, textDecoration: 'underline', color: '#000', fontSize: '1.1rem' }}>
                REKAPITULASI HARIAN TRANSAKSI GADAI
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Tanggal: {formatTanggalIndo(tanggal)}</Typography>
            </Box>

            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" sx={{ '& .MuiTableCell-root': { border: '1px solid #000', py: 0.8, px: 1, fontSize: '0.7rem' } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                    <TableCell align="center" width="40">NO</TableCell>
                    <TableCell>URAIAN / KETERANGAN TRANSAKSI</TableCell>
                    <TableCell align="center" width="60">QTY</TableCell>
                    <TableCell align="right" width="130">DEBET (MASUK)</TableCell>
                    <TableCell align="right" width="130">KREDIT (KELUAR)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData?.data_tabel?.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell align="center">{idx + 1}</TableCell>
                      <TableCell>{row.keterangan}</TableCell>
                      <TableCell align="center">{row.qty}</TableCell>
                      <TableCell align="right">{row.debet > 0 ? formatRupiah(row.debet) : '-'}</TableCell>
                      <TableCell align="right">{row.kredit > 0 ? formatRupiah(row.kredit) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                {/* FOOTER DISESUAIKAN DENGAN BE SUMMARY */}
                <TableFooter sx={{ display: 'table-row-group' }}>
                   <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>TOTAL PEMASUKAN (DEBET)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'blue' }}>{formatRupiah(reportData?.summary?.total_pemasukan)}</TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>TOTAL PENGELUARAN (KREDIT)</TableCell>
                    <TableCell />
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'red' }}>{formatRupiah(reportData?.summary?.total_pengeluaran)}</TableCell>
                  </TableRow>
                  <TableRow sx={{ bgcolor: '#fffde7' }}>
                    <TableCell colSpan={3} align="right" sx={{ fontWeight: 900, fontSize: '0.75rem' }}>SELISIH KAS / NET CASHFLOW:</TableCell>
                    <TableCell colSpan={2} align="center" sx={{ fontSize: '1rem', fontWeight: 900, border: '2px solid #000' }}>
                      {formatRupiah(reportData?.summary?.selisih_kas)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
              <Box sx={{ mt: 2, px: 1 }}>
                <Typography sx={{ fontSize: '0.65rem', fontStyle: 'italic' }}>
                  * Seluruh data transaksi di atas adalah sah dan sesuai dengan fisik uang yang ada di kas pada saat penutupan harian.
                </Typography>
              </Box>
            </TableContainer>

            {renderSignature()}
          </Paper>
        </Box>
      )}

      <style>
        {`
          @media print {
            * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; }
            body { background: #fff !important; visibility: hidden; }
            .no-print { display: none !important; }
            .print-container, .print-page, .print-page * { visibility: visible; }
            .print-container { position: absolute; left: 0; top: 0; width: 100%; }
            .print-page { 
              width: 210mm !important; height: 297mm !important; 
              padding: 42mm 15mm 20mm 15mm !important;
              background-image: url("${KopSuratImg}") !important;
              background-size: 100% auto !important;
              background-position: top center !important;
              background-repeat: no-repeat !important;
              box-shadow: none !important;
            }
            @page { size: A4 portrait; margin: 0; }
          }
        `}
      </style>
    </Box>
  );
};

export default LaporanHarianPetugas;