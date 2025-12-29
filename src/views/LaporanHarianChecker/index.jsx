import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  Grid, Card, Typography, TextField, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Box, Stack, 
  CircularProgress, Paper, Chip, Alert
} from '@mui/material';
import { Print, Refresh, EventNote } from '@mui/icons-material';
import axiosInstance from 'api/axiosInstance';
import { AuthContext } from "AuthContex/AuthContext";

// Pastikan file path benar
import KopSuratImg from 'assets/images/Kop SUrat.png'; 

const LaporanHarianChecker = () => {
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  // Helper Bahasa Indonesia untuk Tanggal
  const formatTanggalIndo = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const getApiUrl = useCallback(() => {
    switch (userRole) {
      case 'checker': return `/checker/harian/cetak`;
      case 'hm': return `/harian/cetak`;
      default: return `/admin/harian/cetak`;
    }
  }, [userRole]);

  const fetchLaporan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(getApiUrl(), { params: { tanggal } });
      if (res.data.success) {
        setData(res.data);
      } else {
        setError("Data gagal dimuat dari server.");
      }
    } catch (err) { 
      const msg = err.response?.status === 401 
        ? "Sesi anda habis, silakan login ulang." 
        : (err.response?.data?.message || "Terjadi kesalahan pada server.");
      setError(msg);
    } finally { 
      setLoading(false); 
    }
  }, [getApiUrl, tanggal]);

  useEffect(() => { 
    if (userRole) fetchLaporan(); 
  }, [fetchLaporan, userRole]);

  const formatRupiah = (val) => 
    new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        minimumFractionDigits: 0 
    }).format(val || 0);

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, bgcolor: '#546e7a', minHeight: '100vh' }}>
      
      {/* KONTROL PANEL */}
      <Card sx={{ p: 2, mb: 3, borderRadius: '12px', boxShadow: 3 }} className="no-print">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={2} alignItems="center">
            <EventNote color="primary" />
            <TextField
              type="date"
              label="Pilih Tanggal Laporan"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
            <Button variant="contained" startIcon={<Refresh />} onClick={fetchLaporan} disabled={loading} color="secondary">
              Refresh
            </Button>
            <Button variant="contained" startIcon={<Print />} onClick={() => window.print()} disabled={loading || !data} color="primary">
              Cetak PDF
            </Button>
          </Stack>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Peran:</Typography>
            <Chip label={userRole.toUpperCase()} size="small" color="primary" />
          </Box>
        </Stack>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2, mx: 'auto', maxWidth: '210mm' }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
            <CircularProgress sx={{ color: '#fff', mb: 2 }} />
            <Typography sx={{ color: '#fff' }}>Menyusun Laporan...</Typography>
        </Box>
      ) : (
        <Paper 
          className="print-page"
          sx={{ 
            width: '210mm', 
            height: '297mm', 
            margin: 'auto', 
            p: '42mm 15mm 20mm 15mm', // Padding top dikurangi agar teks naik (sebelumnya 50mm)
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
            backgroundImage: `url("${KopSuratImg}")`,
            backgroundSize: '100% auto',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'top center',
            bgcolor: '#fff',
            boxSizing: 'border-box'
          }}
        >
          {/* JUDUL LAPORAN */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, textDecoration: 'underline', color: '#000', lineHeight: 1, fontSize: '1.1rem' }}>
              LAPORAN HARIAN KAS & BARANG
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, mt: 0.5 }}>
              Tanggal: {formatTanggalIndo(tanggal)}
            </Typography>
          </Box>

          {/* INFO PETUGAS */}
          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', pb: 0.5 }}>
            <Typography sx={{ fontSize: '0.7rem' }}>Petugas: <b>{data?.metadata?.checker_name}</b></Typography>
            <Typography sx={{ fontSize: '0.7rem' }}>Status: <b style={{color: 'green'}}>LAPORAN ASLI</b></Typography>
          </Box>

          {/* TABEL TRANSAKSI (Ukuran diperkecil) */}
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" sx={{ '& .MuiTableCell-root': { border: '1px solid #000', py: 0.4, px: 0.8, fontSize: '0.7rem' } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: '30px' }}>NO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>URAIAN TRANSAKSI</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: '40px' }}>QTY</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', width: '110px' }}>DEBET (MASUK)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', width: '110px' }}>KREDIT (KELUAR)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.data_tabel && data.data_tabel.length > 0 ? (
                    data.data_tabel.map((row, idx) => (
                    <TableRow key={idx}>
                        <TableCell align="center">{idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{row.keterangan}</TableCell>
                        <TableCell align="center">{row.qty || '-'}</TableCell>
                        <TableCell align="right">{row.debet > 0 ? formatRupiah(row.debet) : '-'}</TableCell>
                        <TableCell align="right">{row.kredit > 0 ? formatRupiah(row.kredit) : '-'}</TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3, color: '#888', fontStyle: 'italic' }}>
                            -- Tidak ada data transaksi untuk tanggal ini --
                        </TableCell>
                    </TableRow>
                )}

                {/* FOOTER TOTAL */}
                <TableRow sx={{ bgcolor: '#eee' }}>
                  <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}>TOTAL TRANSAKSI HARI INI</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatRupiah(data?.footer_total?.total_debet)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatRupiah(data?.footer_total?.total_kredit)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* BOX SALDO AKHIR */}
            <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                <Box sx={{ border: '2px solid #000', p: 0.8, minWidth: '220px', bgcolor: '#fff' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>SALDO AKHIR KAS:</Typography>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 900 }}>
                            {data?.saldo_kas?.saldo_akhir_formatted || 'Rp 0'}
                        </Typography>
                    </Stack>
                </Box>
            </Box>
          </TableContainer>

          {/* AREA TANDA TANGAN */}
          <Box sx={{ mt: 'auto', pt: 2 }}>
            <Grid container sx={{ textAlign: 'center' }}>
              <Grid item xs={5}>
                <Typography sx={{ fontSize: '0.75rem', mb: 7 }}>Dibuat Oleh (Checker),</Typography>
                <Box sx={{ borderTop: '1.5px solid #000', mx: 4, pt: 0.5 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{data?.metadata?.checker_name}</Typography>
                </Box>
              </Grid>
              <Grid item xs={2}></Grid>
              <Grid item xs={5}>
                <Typography sx={{ fontSize: '0.75rem', mb: 7 }}>Diketahui Oleh (Manajer),</Typography>
                <Box sx={{ borderTop: '1.5px solid #000', mx: 4, pt: 0.5 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>TANTI MAHARANI</Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Typography variant="caption" sx={{ display: 'block', mt: 2, textAlign: 'left', color: '#666', fontSize: '0.6rem' }}>
                * Laporan ini dicetak secara sistem komputerisasi. <br />
                * Waktu Cetak: {new Date().toLocaleString('id-ID')}
            </Typography>
          </Box>
        </Paper>
      )}

      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            .print-page, .print-page * { visibility: visible; }
            .print-page {
              position: absolute;
              left: 0;
              top: 0;
              width: 210mm !important;
              height: 297mm !important;
              margin: 0 !important;
              padding-top: 42mm !important; /* Menaikkan posisi tulisan judul */
              box-shadow: none !important;
              background-image: url("${KopSuratImg}") !important;
              background-size: 100% auto !important;
              -webkit-print-color-adjust: exact;
            }
            @page { size: A4; margin: 0; }
            .no-print, nav, aside, header, footer { display: none !important; }
          }
        `}
      </style>
    </Box>
  );
};

export default LaporanHarianChecker;