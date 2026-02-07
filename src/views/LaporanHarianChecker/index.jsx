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

const LaporanHarianChecker = () => {
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false); 
  const [dataHarian, setDataHarian] = useState(null); // Hal 1
  const [dataLunas, setDataLunas] = useState(null); // Hal 2
  const [dataPerpanjangan, setDataPerpanjangan] = useState(null); // Hal 3
  const [dataLelang, setDataLelang] = useState(null); // Hal 4
  const [error, setError] = useState(null);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  // --- FETCH SEMUA LAPORAN AUDIT (HAL 1-4) ---
  const fetchSemuaLaporan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resHarian, resLunas, resPerp, resLelang] = await Promise.all([
        axiosInstance.get('/checker/harian/cetak', { params: { tanggal } }),
        axiosInstance.get('/checker/harian/cetak-serah-terima', { params: { tanggal } }),
        axiosInstance.get('/checker/cetak-perpanjangan', { params: { tanggal } }),
        axiosInstance.get('/checker/cetak-lelang', { params: { tanggal } })
      ]);

      setDataHarian(resHarian.data);
      setDataLunas(resLunas.data);
      setDataPerpanjangan(resPerp.data);
      setDataLelang(resLelang.data);
    } catch (err) { 
      setError(err.response?.data?.message || "Gagal mengambil data dari server.");
    } finally { setLoading(false); }
  }, [tanggal]);

  useEffect(() => { 
    if (userRole === 'checker' || userRole === 'admin') fetchSemuaLaporan(); 
  }, [fetchSemuaLaporan, userRole]);

  const handleAjukan = async () => {
    if (!window.confirm("Ajukan semua laporan audit (Hal 1-4) ke Manager?")) return;
    setSubmitting(true);
    try {
      const res = await axiosInstance.post('/checker/report/submit', { report_date: tanggal });
      if (res.data.success) {
        alert("Laporan Berhasil Diajukan!");
        fetchSemuaLaporan(); 
      }
    } catch (err) {
      alert(err.response?.data?.message || "Gagal mengajukan laporan.");
    } finally { setSubmitting(false); }
  };

  const formatTanggalIndo = (dateString) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(dateString));
  };

  const formatRupiah = (val) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

  const renderSignature = (pageData) => {
    const meta = pageData?.metadata;
    const isApproved = meta?.is_approved || false;
    const checkerName = meta?.checker_name || user?.name || 'Checker';
    const qrData = meta?.qr_code;
    const docId = meta?.doc_id;
    const waktuSekarang = new Date().toLocaleString('id-ID');

    return (
      <Box className="signature-area" sx={{ mt: 'auto', pt: 2, position: 'relative' }}>
        <Grid container sx={{ textAlign: 'center', alignItems: 'flex-end', mb: 3 }}>
          <Grid item xs={4}>
            <Typography sx={{ fontSize: '0.7rem', mb: 6 }}>Dibuat Oleh (Checker),</Typography>
            <Box sx={{ borderTop: '1.5px solid #000', mx: 2, pt: 0.5 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{checkerName}</Typography>
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
                 <Typography color="error" sx={{ fontSize: '0.5rem', fontWeight: 'bold' }}>QR VALIDASI<br/>MENUNGGU ACC</Typography>
              </Box>
            )}
          </Grid>
          <Grid item xs={4}>
            <Typography sx={{ fontSize: '0.7rem', mb: 6 }}>Diketahui Oleh (Manajer),</Typography>
            <Box sx={{ position: 'relative', mx: 2 }}>
                {isApproved && (
                  <>
                    <Box component="img" src={TtdManagerImg} sx={{ position: 'absolute', width: '100px', bottom: '5px', left: '50%', transform: 'translateX(-50%)', zIndex: 2 }} />
                    <Box component="img" src={StempelImg} sx={{ position: 'absolute', width: '140px', bottom: '-1px', left: '-10px', zIndex: 4, opacity: 0.8 }} />
                  </>
                )}
                <Box sx={{ borderTop: '1.5px solid #000', pt: 0.5 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>MANAGER SGI</Typography>
                </Box>
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ textAlign: 'right', pr: 1, borderTop: '0.5px solid #eee', pt: 0.5 }}>
          <Typography sx={{ fontSize: '0.5rem', color: '#777', fontStyle: 'italic' }}>
            * Laporan sistem otomatis pada {waktuSekarang} WIB | Validasi: {isApproved ? 'ASLI' : 'DRAFT'}
          </Typography>
        </Box>
      </Box>
    );
  };

  const paperStyle = { 
    width: '210mm', height: '297mm', margin: '0 auto', p: '42mm 15mm 15mm 15mm', 
    position: 'relative', display: 'flex', flexDirection: 'column', bgcolor: '#fff',
    backgroundImage: `url("${KopSuratImg}")`, backgroundSize: '100% auto', backgroundRepeat: 'no-repeat',
    boxShadow: '0 0 20px rgba(0,0,0,0.5)', boxSizing: 'border-box', pageBreakAfter: 'always', overflow: 'hidden'
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#455a64', minHeight: '100vh' }}>
      <Card sx={{ p: 2, mb: 3 }} className="no-print">
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2}>
            <TextField type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} size="small" />
            <Button variant="contained" color="secondary" onClick={fetchSemuaLaporan} startIcon={<Refresh />}>Refresh</Button>
            <Button variant="contained" color="warning" onClick={handleAjukan} disabled={submitting || loading} startIcon={<Send />}>
                Ajukan Approval (Hal 1-4)
            </Button>
            <Button variant="contained" onClick={() => window.print()} startIcon={<Print />}>Cetak PDF</Button>
          </Stack>
          <Chip label="AUDIT CHECKER: HAL 1-4" color="primary" sx={{ fontWeight: 'bold' }} />
        </Stack>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress color="inherit" /><Typography sx={{ color: '#fff', mt: 2 }}>Menyusun Laporan...</Typography></Box>
      ) : (
        <Box className="print-container">
          
          {/* PAGE 1: REKAPITULASI HARIAN */}
          <Paper className="print-page" sx={paperStyle}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, textDecoration: 'underline' }}>REKAPITULASI HARIAN TRANSAKSI GADAI</Typography>
              <Typography sx={{ fontSize: '0.8rem' }}>Tanggal: {formatTanggalIndo(tanggal)}</Typography>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" sx={{ '& td, & th': { border: '1px solid #000', fontSize: '0.7rem' } }}>
                <TableHead sx={{ bgcolor: '#f0f0f0' }}>
                  <TableRow>
                    <TableCell align="center" width="40">NO</TableCell>
                    <TableCell>URAIAN TRANSAKSI</TableCell>
                    <TableCell align="center" width="50">QTY</TableCell>
                    <TableCell align="right" width="120">DEBET (MASUK)</TableCell>
                    <TableCell align="right" width="120">KREDIT (KELUAR)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dataHarian?.data_tabel?.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell align="center">{idx + 1}</TableCell>
                      <TableCell>{row.keterangan}</TableCell>
                      <TableCell align="center">{row.qty}</TableCell>
                      <TableCell align="right">{row.debet > 0 ? formatRupiah(row.debet) : '-'}</TableCell>
                      <TableCell align="right">{row.kredit > 0 ? formatRupiah(row.kredit) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter sx={{ display: 'table-row-group' }}>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>TOTAL</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'blue' }}>{formatRupiah(dataHarian?.summary?.total_pemasukan)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'red' }}>{formatRupiah(dataHarian?.summary?.total_pengeluaran)}</TableCell>
                  </TableRow>
                  <TableRow sx={{ bgcolor: '#fffde7' }}>
                    <TableCell colSpan={3} align="right" sx={{ fontWeight: 900 }}>NET CASHFLOW:</TableCell>
                    <TableCell colSpan={2} align="center" sx={{ fontSize: '1rem', fontWeight: 900, border: '2px solid #000' }}>
                      {formatRupiah(dataHarian?.summary?.selisih_kas)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
            {renderSignature(dataHarian)}
          </Paper>

          {/* PAGE 2: SERAH TERIMA LUNAS */}
          <Paper className="print-page" sx={paperStyle}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, textDecoration: 'underline' }}>LAPORAN SERAH TERIMA BARANG (LUNAS)</Typography>
              <Typography sx={{ fontSize: '0.8rem' }}>Tanggal: {formatTanggalIndo(tanggal)}</Typography>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" sx={{ '& td, & th': { border: '1px solid #000', fontSize: '0.65rem' } }}>
                <TableHead sx={{ bgcolor: '#f0f0f0' }}>
                  <TableRow>
                    <TableCell align="center" width="30">NO</TableCell>
                    <TableCell width="140">NASABAH / NO GADAI</TableCell>
                    <TableCell>BARANG & DETAIL SPESIFIKASI</TableCell>
                    <TableCell align="right" width="120">NOMINAL LUNAS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dataLunas?.data?.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell align="center">{idx + 1}</TableCell>
                      <TableCell><b>{item.nasabah}</b><br/><small>{item.no_gadai}</small></TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{item.nama_barang}</Typography>
                        <Typography sx={{ fontSize: '0.6rem', whiteSpace: 'pre-line' }}>{item.detail_spesifik}</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatRupiah(item.nominal_lunas)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#f9f9f9' }}>
                    <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>TOTAL PELUNASAN ({dataLunas?.metadata?.total_item} ITEM):</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', border: '2px solid #000' }}>{formatRupiah(dataLunas?.metadata?.grand_total_lunas)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            {renderSignature(dataLunas)}
          </Paper>

          {/* PAGE 3: PERPANJANGAN */}
          <Paper className="print-page" sx={paperStyle}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, textDecoration: 'underline' }}>LAPORAN PERPANJANGAN TEMPO GADAI</Typography>
              <Typography sx={{ fontSize: '0.8rem' }}>Tanggal: {formatTanggalIndo(tanggal)}</Typography>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" sx={{ '& td, & th': { border: '1px solid #000', fontSize: '0.65rem' } }}>
                <TableHead sx={{ bgcolor: '#f0f0f0' }}>
                  <TableRow>
                    <TableCell align="center" width="30">NO</TableCell>
                    <TableCell width="130">NASABAH / NO GADAI</TableCell>
                    <TableCell>BARANG & DETAIL</TableCell>
                    <TableCell align="center" width="85">JT LAMA</TableCell>
                    <TableCell align="center" width="85">JT BARU</TableCell>
                    <TableCell align="right" width="110">NOMINAL</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dataPerpanjangan?.data?.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell align="center">{idx + 1}</TableCell>
                      <TableCell><b>{item.nasabah}</b><br/><small>{item.no_gadai}</small></TableCell>
                      <TableCell><b>{item.barang}</b><br/><small>{item.detail}</small></TableCell>
                      <TableCell align="center">{item.jt_lama}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', color: 'blue' }}>{item.jt_baru}</TableCell>
                      <TableCell align="right">{formatRupiah(item.nominal_pembayaran)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#f9f9f9' }}>
                    <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold' }}>TOTAL PERPANJANGAN (DEBET):</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', border: '2px solid #000' }}>{formatRupiah(dataPerpanjangan?.metadata?.total_dana_masuk)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            {renderSignature(dataPerpanjangan)}
          </Paper>

          {/* PAGE 4: LELANG */}
          <Paper className="print-page" sx={paperStyle}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, textDecoration: 'underline' }}>LAPORAN PELELANGAN & PROFIT LELANG</Typography>
              <Typography sx={{ fontSize: '0.8rem' }}>Tanggal: {formatTanggalIndo(tanggal)}</Typography>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" sx={{ '& td, & th': { border: '1px solid #000', fontSize: '0.6rem' } }}>
                <TableHead sx={{ bgcolor: '#f0f0f0' }}>
                  <TableRow>
                    <TableCell align="center" width="30">NO</TableCell>
                    <TableCell width="130">NASABAH / NO GADAI</TableCell>
                    <TableCell>BARANG & DETAIL</TableCell>
                    <TableCell align="center" width="70">STATUS</TableCell>
                    <TableCell align="right">HASIL LELANG</TableCell>
                    <TableCell align="right">PROFIT</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dataLelang?.data?.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell align="center">{idx + 1}</TableCell>
                      <TableCell><b>{item.nasabah}</b><br/><small>{item.no_gadai}</small></TableCell>
                      <TableCell><b>{item.barang}</b><br/><small>{item.detail_barang}</small></TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', color: 'blue' }}>{item.status}</TableCell>
                      <TableCell align="right">{formatRupiah(item.nominal_masuk)}</TableCell>
                      <TableCell align="right" sx={{ color: 'green', fontWeight: 'bold' }}>{formatRupiah(item.keuntungan)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#f9f9f9' }}>
                    <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>GRAND TOTAL:</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', border: '1.5px solid #000' }}>{formatRupiah(dataLelang?.metadata?.grand_total_masuk)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'green', border: '1.5px solid #000' }}>{formatRupiah(dataLelang?.metadata?.grand_total_keuntungan)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            {renderSignature(dataLelang)}
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

          img {
            max-width: none !important;
          }
        }
      `}
    </style>
    </Box>
  );
};

export default LaporanHarianChecker;