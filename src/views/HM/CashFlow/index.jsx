import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Typography, TextField, Button, Table, TableBody,
  TableCell, TableHead, TableRow, Box, Stack,
  CircularProgress, Paper, Divider, Chip
} from '@mui/material';
import { Print, Refresh, TrendingUp, TrendingDown, AccountBalance } from '@mui/icons-material';
import axiosInstance from 'api/axiosInstance';
import KopSuratImg from 'assets/images/Kop SUrat.png';

const ROW_PER_PAGE = 20;

const LaporanCashFlow = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/cashflow', {
        params: { tanggal_mulai: startDate, tanggal_selesai: endDate }
      });
      if (res.data.success) setReportData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatRupiah = (val) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val || 0);

  const chunkData = (data = []) => {
    const pages = [];
    for (let i = 0; i < data.length; i += ROW_PER_PAGE) {
      pages.push(data.slice(i, i + ROW_PER_PAGE));
    }
    return pages.length > 0 ? pages : [[]];
  };

  const dataTabel = reportData?.data_tabel || [];
  const summary   = reportData?.summary || {};
  const metadata  = reportData?.metadata || {};
  const pages     = chunkData(dataTabel);

  return (
    <Box sx={{ p: 3, bgcolor: '#0f172a', minHeight: '100vh' }}>

      {/* ── Control Panel (hidden on print) ── */}
      <Card sx={{ p: 2, mb: 3, maxWidth: '210mm', mx: 'auto' }} className="no-print">
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              type="date" size="small" label="Dari"
              value={startDate} onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date" size="small" label="Sampai"
              value={endDate} onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="contained" startIcon={<Refresh />} onClick={fetchData}>
              Refresh
            </Button>
          </Stack>
          <Button variant="contained" color="success" startIcon={<Print />} onClick={() => window.print()}>
            Cetak ke PDF
          </Button>
        </Stack>

        {/* Summary Card (hanya di screen) */}
        {reportData && !loading && (
          <Stack direction="row" spacing={2} mt={2} flexWrap="wrap" gap={1}>
            <Box sx={{ flex: 1, minWidth: 180, bgcolor: '#f0fdf4', borderRadius: 2, p: 1.5, border: '1px solid #bbf7d0' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrendingUp sx={{ color: '#16a34a', fontSize: 20 }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>TOTAL PEMASUKAN</Typography>
              </Stack>
              <Typography variant="h6" fontWeight={800} color="#16a34a">{formatRupiah(summary.total_pemasukan)}</Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 180, bgcolor: '#fef2f2', borderRadius: 2, p: 1.5, border: '1px solid #fecaca' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrendingDown sx={{ color: '#dc2626', fontSize: 20 }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>TOTAL PENGELUARAN</Typography>
              </Stack>
              <Typography variant="h6" fontWeight={800} color="#dc2626">{formatRupiah(summary.total_pengeluaran)}</Typography>
            </Box>
            <Box sx={{
              flex: 1, minWidth: 180, borderRadius: 2, p: 1.5,
              bgcolor: summary.selisih_kas >= 0 ? '#eff6ff' : '#fff7ed',
              border: `1px solid ${summary.selisih_kas >= 0 ? '#bfdbfe' : '#fed7aa'}`
            }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <AccountBalance sx={{ color: summary.selisih_kas >= 0 ? '#2563eb' : '#ea580c', fontSize: 20 }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>SELISIH KAS</Typography>
              </Stack>
              <Typography variant="h6" fontWeight={800} color={summary.selisih_kas >= 0 ? '#2563eb' : '#ea580c'}>
                {formatRupiah(summary.selisih_kas)}
              </Typography>
            </Box>
          </Stack>
        )}
      </Card>

      {loading ? (
        <Box textAlign="center" py={10}><CircularProgress color="inherit" /></Box>
      ) : (
        <Box className="printable-content">
          {pages.map((rows, pageIdx) => (
            <Paper key={pageIdx} className="a4-page" elevation={0}>
              <img src={KopSuratImg} className="kop-img" alt="kop" />

              <Box className="content-body">
                {/* Judul hanya di halaman pertama */}
                {pageIdx === 0 && (
                  <Box textAlign="center" mb={2}>
                    <Typography variant="h6" fontWeight={800} sx={{ textDecoration: 'underline' }}>
                     Arus Kas SGI
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      Periode: {metadata.rentang_waktu}
                    </Typography>
                  </Box>
                )}

                <Table className="report-table">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" width="35px">NO</TableCell>
                      <TableCell width="75px">TANGGAL</TableCell>
                      <TableCell>KETERANGAN</TableCell>
                      <TableCell align="center" width="40px">QTY</TableCell>
                      <TableCell align="right" width="140px">PEMASUKAN</TableCell>
                      <TableCell align="right" width="140px">PENGELUARAN</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row, rowIdx) => {
                      const isPemasukan   = row.pemasukan > 0;
                      const isPengeluaran = row.pengeluaran > 0;

                      return (
                        <TableRow
                          key={rowIdx}
                          sx={{
                            bgcolor: isPemasukan ? '#f0fdf4' : isPengeluaran ? '#fef2f2' : 'white',
                            '&:hover': { filter: 'brightness(0.97)' }
                          }}
                        >
                          <TableCell align="center" sx={{ border: '1px solid #000 !important', fontWeight: 700 }}>
                            {row.no}
                          </TableCell>
                          <TableCell sx={{ border: '1px solid #000 !important', fontSize: '9px', whiteSpace: 'nowrap' }}>
                            {row.tanggal}
                          </TableCell>
                          <TableCell sx={{ border: '1px solid #000 !important' }}>
                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#000' }}>
                              {row.keterangan}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ border: '1px solid #000 !important', fontSize: '10px' }}>
                            {row.qty}
                          </TableCell>
                          <TableCell align="right" sx={{ border: '1px solid #000 !important', fontWeight: 700, color: isPemasukan ? '#16a34a' : '#9ca3af' }}>
                            {isPemasukan ? formatRupiah(row.pemasukan) : '-'}
                          </TableCell>
                          <TableCell align="right" sx={{ border: '1px solid #000 !important', fontWeight: 700, color: isPengeluaran ? '#dc2626' : '#9ca3af' }}>
                            {isPengeluaran ? formatRupiah(row.pengeluaran) : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {/* Baris Grand Total hanya di halaman terakhir */}
                    {pageIdx === pages.length - 1 && (
                      <>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                          <TableCell colSpan={4} align="right" sx={{ border: '1px solid #000 !important', fontWeight: 800, fontSize: '11px' }}>
                            TOTAL PEMASUKAN
                          </TableCell>
                          <TableCell align="right" sx={{ border: '1px solid #000 !important', fontWeight: 800, color: '#16a34a', fontSize: '11px' }}>
                            {formatRupiah(summary.total_pemasukan)}
                          </TableCell>
                          <TableCell sx={{ border: '1px solid #000 !important' }} />
                        </TableRow>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                          <TableCell colSpan={4} align="right" sx={{ border: '1px solid #000 !important', fontWeight: 800, fontSize: '11px' }}>
                            TOTAL PENGELUARAN
                          </TableCell>
                          <TableCell sx={{ border: '1px solid #000 !important' }} />
                          <TableCell align="right" sx={{ border: '1px solid #000 !important', fontWeight: 800, color: '#dc2626', fontSize: '11px' }}>
                            {formatRupiah(summary.total_pengeluaran)}
                          </TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: summary.selisih_kas >= 0 ? '#eff6ff' : '#fff7ed' }}>
                          <TableCell colSpan={4} align="right" sx={{ border: '1px solid #000 !important', fontWeight: 900, fontSize: '12px' }}>
                            SELISIH KAS (NET CASH FLOW)
                          </TableCell>
                          <TableCell colSpan={2} align="right" sx={{
                            border: '1px solid #000 !important',
                            fontWeight: 900,
                            fontSize: '12px',
                            color: summary.selisih_kas >= 0 ? '#2563eb' : '#ea580c'
                          }}>
                            {formatRupiah(summary.selisih_kas)}
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>

                {/* Tanda tangan hanya di halaman terakhir */}
                {pageIdx === pages.length - 1 && (
                  <Box sx={{ mt: 3, px: 2 }}>
                    <Typography variant="body2" align="center" sx={{ fontStyle: 'italic', mb: 1.5, color: '#374151', fontSize: '10px' }}>
                      Bahwasanya rekap laporan cash flow ini adalah sah dan dapat dipertanggungjawabkan.
                    </Typography>
                    <Stack direction="row" justifyContent="flex-end" textAlign="center">
                      <Box sx={{ width: '200px' }}>
                        <Typography variant="body2" fontWeight={700}>Manager SGI,</Typography>
                        <Box sx={{ height: '55px' }} />
                        <Typography variant="body2" fontWeight={700}>( ................................. )</Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}

                <Box className="footer-info">
                  <Divider sx={{ my: 1, borderColor: 'black', borderBottomWidth: 1.5 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography fontSize="10px" fontWeight={900} color="#000">
                      Waktu Cetak: {new Date().toLocaleString('id-ID')}
                    </Typography>
                    <Typography fontSize="10px" fontWeight={900} color="#000">
                      Halaman {pageIdx + 1} dari {pages.length}
                    </Typography>
                  </Stack>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <style>{`
        ::-webkit-scrollbar { display: none; }
        @media screen {
          .printable-content { display: flex; flex-direction: column; align-items: center; gap: 30px; padding-bottom: 50px; }
          .a4-page { width: 210mm; height: 297mm; background: white; position: relative; box-shadow: 0 0 15px rgba(0,0,0,0.5); overflow: hidden; }
        }
        .kop-img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; object-fit: fill; }
        .content-body { position: relative; z-index: 2; padding: 45mm 15mm 25mm 15mm; height: 100%; display: flex; flex-direction: column; }
        .report-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .report-table th { background: #f8fafc !important; border: 1.2px solid black !important; font-weight: bold !important; font-size: 10px; color: #000; padding: 5px !important; }
        .report-table td { font-size: 10px; padding: 4px 5px !important; color: #000; line-height: 1.3; }
        .footer-info { margin-top: auto; padding-bottom: 5mm; }
        @media print {
          body * { visibility: hidden; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .printable-content, .printable-content * { visibility: visible; }
          .printable-content { position: absolute; left: 0; top: 0; width: 210mm; display: block !important; }
          .no-print { display: none !important; }
          .a4-page { width: 210mm; height: 296mm; margin: 0 !important; padding: 0 !important; page-break-after: always; box-shadow: none !important; position: relative; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </Box>
  );
};

export default LaporanCashFlow;