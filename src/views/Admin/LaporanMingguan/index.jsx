import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Card, Typography, TextField, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Box, Stack, 
  CircularProgress, Paper, Chip, TableFooter, Divider
} from '@mui/material';
import { Print, Refresh, DateRange, Assessment } from '@mui/icons-material'; 
import axiosInstance from 'api/axiosInstance';
import KopSuratImg from 'assets/images/Kop SUrat.png';    

const LaporanMingguanAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null); 
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  const fetchLaporanMingguan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/laporan-mingguan', { params: { tanggal } });
      if (res.data.success) setReportData(res.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }, [tanggal]);

  useEffect(() => { fetchLaporanMingguan(); }, [fetchLaporanMingguan]);

  const formatRupiah = (val) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

  const paperStyle = { 
    width: '210mm', 
    height: '297mm', 
    margin: '0 auto', 
    p: '42mm 15mm 15mm 15mm', 
    position: 'relative', 
    display: 'flex', 
    flexDirection: 'column', 
    bgcolor: '#fff',
    backgroundImage: `url("${KopSuratImg}")`, 
    backgroundSize: '100% 100%', 
    backgroundRepeat: 'no-repeat',
    boxShadow: '0 20px 50px rgba(0,0,0,0.2)', 
    boxSizing: 'border-box',
    overflow: 'hidden'
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, bgcolor: '#1e293b', minHeight: '100vh' }}>
      {/* CONTROL PANEL */}
      <Card sx={{ p: 2, mb: 3, borderRadius: '12px' }} className="no-print">
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} size="small" />
            <Button variant="contained" startIcon={<Refresh />} onClick={fetchLaporanMingguan}>Update</Button>
            <Button variant="outlined" startIcon={<Print />} onClick={() => window.print()}>Cetak</Button>
          </Stack>
          <Chip icon={<Assessment />} label="AUDIT MINGGUAN" color="primary" sx={{ fontWeight: 'bold' }} />
        </Stack>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 20 }}><CircularProgress /></Box>
      ) : (
        <Box className="print-container">
          <Paper className="print-page" sx={paperStyle}>
            
            {/* Judul */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase' }}>
                Rekapitulasi Arus Kas Mingguan
              </Typography>
              <Typography sx={{ fontWeight: 600, color: '#64748b' }}>
                Periode: {reportData?.metadata?.rentang_waktu}
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <TableContainer>
                <Table size="small" sx={{ tableLayout: 'fixed', border: '1.5px solid #000' }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell align="center" sx={{ width: '35px', fontWeight: 'bold', border: '1px solid #000' }}>NO</TableCell>
                      <TableCell align="center" sx={{ width: '90px', fontWeight: 'bold', border: '1px solid #000' }}>TANGGAL</TableCell> 
                      <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000' }}>URAIAN TRANSAKSI</TableCell>
                      <TableCell align="center" sx={{ width: '45px', fontWeight: 'bold', border: '1px solid #000' }}>QTY</TableCell>
                      <TableCell align="right" sx={{ width: '120px', fontWeight: 'bold', border: '1px solid #000' }}>DEBET (IN)</TableCell>
                      <TableCell align="right" sx={{ width: '120px', fontWeight: 'bold', border: '1px solid #000' }}>KREDIT (OUT)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData?.data_tabel?.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell align="center" sx={{ border: '1px solid #000' }}>{idx + 1}</TableCell>
                        <TableCell align="center" sx={{ border: '1px solid #000', fontSize: '0.75rem' }}>{row.tanggal}</TableCell>
                        <TableCell sx={{ border: '1px solid #000', fontSize: '0.75rem', textTransform: 'uppercase' }}>{row.keterangan}</TableCell>
                        <TableCell align="center" sx={{ border: '1px solid #000' }}>{row.qty}</TableCell>
                        <TableCell align="right" sx={{ border: '1px solid #000', color: row.debet > 0 ? '#2e7d32' : '#94a3b8', fontWeight: 600 }}>
                          {row.debet > 0 ? formatRupiah(row.debet) : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ border: '1px solid #000', color: row.kredit > 0 ? '#d32f2f' : '#94a3b8', fontWeight: 600 }}>
                          {row.kredit > 0 ? formatRupiah(row.kredit) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter sx={{ display: 'table-row-group' }}>
                    <TableRow>
                      <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold', border: '1px solid #000' }}>TOTAL PEMASUKAN</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', border: '1px solid #000', color: '#2e7d32' }}>{formatRupiah(reportData?.summary?.total_pemasukan)}</TableCell>
                      <TableCell sx={{ border: '1px solid #000' }} />
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold', border: '1px solid #000' }}>TOTAL PENGELUARAN</TableCell>
                      <TableCell sx={{ border: '1px solid #000' }} />
                      <TableCell align="right" sx={{ fontWeight: 'bold', border: '1px solid #000', color: '#d32f2f' }}>{formatRupiah(reportData?.summary?.total_pengeluaran)}</TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: '#1e3a8a' }}>
                      <TableCell colSpan={4} align="right" sx={{ color: '#fff', fontWeight: 'bold', border: '1px solid #000' }}>NET CASHFLOW (SELISIH KAS):</TableCell>
                      <TableCell colSpan={2} align="right" sx={{ color: '#fff', fontWeight: 'bold', border: '1px solid #000', fontSize: '1rem' }}>{formatRupiah(reportData?.summary?.selisih_kas)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </TableContainer>
            </Box>

            <Box sx={{ pt: 4, pb: 4 }}>
              <Grid container justifyContent="space-between" alignItems="flex-end">
                <Grid item xs={5}>
                  <Box sx={{ p: 1.5, border: '1px solid #cbd5e1', borderRadius: '8px', bgcolor: '#f8fafc' }}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 'bold', textDecoration: 'underline', mb: 0.5 }}>CATATAN AUDIT:</Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: '#475569', lineHeight: 1.3 }}>
                      * Laporan ini sah dan dihasilkan otomatis oleh sistem.<br/>
                      * Data sinkron dengan saldo Brankas Utama & Kasir.<br/>
                      * Cetakan ini adalah dokumen internal rahasia.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4} sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 8 }}>Administrator Keuangan,</Typography>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase' }}>
                    Admin PT. SGI
                  </Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: '#64748b' }}>
                    Waktu Cetak: {new Date().toLocaleString('id-ID')} WIB
                  </Typography>
                </Grid>
              </Grid>
            </Box>

          </Paper>
        </Box>
      )}

      <style>
      {`
        @media screen {
          .print-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
            align-items: center;
          }
        }

        @media print {
          * {
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html, body {
            width: 210mm !important;
            height: 297mm !important;
            background: #fff !important;
          }

          body * {
            visibility: hidden;
          }

          .print-container, .print-page, .print-page * {
            visibility: visible;
          }

          .print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: block !important;
          }

          .print-page {
            position: relative !important;
            width: 210mm !important;
            height: 297mm !important;
            padding: 42mm 15mm 20mm 15mm !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            background-image: url("${KopSuratImg}") !important;
            background-size: 100% auto !important;
            background-repeat: no-repeat !important;
            background-position: top center !important;
          }

          /* Agar tabel tidak terpotong di tengah */
          .MuiTableContainer-root {
            overflow: visible !important;
          }

          .MuiTable-root {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important; /* Kunci agar lebar kolom konsisten */
          }

          .MuiTableCell-root {
            border: 1px solid #000 !important;
            padding: 4px 6px !important;
            font-size: 7.5pt !important; /* Ukuran font dioptimalkan */
            line-height: 1.2 !important;
          }

          /* --- KHUSUS PAGE 5 (BRANKAS) --- */
          /* Atur lebar kolom agar nominal Rp tidak numpuk */
          .print-page:nth-of-type(5) .MuiTableCell-root:nth-of-type(1) { width: 45px !important; }  /* JAM */
          .print-page:nth-of-type(5) .MuiTableCell-root:nth-of-type(3) { width: 105px !important; } /* MASUK */
          .print-page:nth-of-type(5) .MuiTableCell-root:nth-of-type(4) { width: 105px !important; } /* KELUAR */
          .print-page:nth-of-type(5) .MuiTableCell-root:nth-of-type(5) { width: 75px !important; }  /* STATUS */

          /* Style untuk baris Grand Total di print */
          tr.MuiTableRow-root[style*="background-color: rgb(245, 245, 245)"], 
          .MuiTableRow-root[class*="bgcolor-[#f5f5f5]"] {
            background-color: #f5f5f5 !important;
          }

          /* Tanda Tangan */
          .signature-area {
            margin-top: auto !important;
            padding-top: 20px !important;
          }

          .signature-area .MuiGrid-item p:first-of-type {
            margin-bottom: 65px !important;
          }

          @page {
            size: A4 portrait;
            margin: 0 !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}
    </style>
    </Box>
  );
};

export default LaporanMingguanAdmin;