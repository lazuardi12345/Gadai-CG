import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Typography, TextField, Button, Table, TableBody,
  TableCell, TableHead, TableRow, Box, Stack, 
  CircularProgress, Paper, Divider
} from '@mui/material';
import { Print, Refresh } from '@mui/icons-material';
import axiosInstance from 'api/axiosInstance';
import KopSuratImg from 'assets/images/Kop SUrat.png';

// Batasan data per halaman agar layout tidak hancur saat print
const ROW_PER_PAGE = 15; 

const LaporanDetailTransaksiKas = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/laporan-mingguan-detail', {
        params: { start_date: startDate, end_date: endDate }
      });
      if (res.data.success) setReportData(res.data.data);
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

  const prepareAllRows = () => {
    if (!reportData) return [];
    const allData = [];
    let currentNumber = 1; // Counter untuk penomoran transaksi

    const categories = [
      { key: 'gadai_baru', title: 'DATA GADAI BARU', totalLabel: 'TOTAL GADAI BARU' },
      { key: 'perpanjangan', title: 'DATA PERPANJANGAN', totalLabel: 'TOTAL PERPANJANGAN' },
      { key: 'pelunasan', title: 'DATA PELUNASAN', totalLabel: 'TOTAL PELUNASAN' },
      { key: 'pelelangan', title: 'DATA PELELANGAN', totalLabel: 'TOTAL PELELANGAN' }
    ];

    categories.forEach(cat => {
      const items = reportData[cat.key] || [];
      if (items.length > 0) {
        // Baris Header Kategori
        allData.push({ isHeader: true, title: cat.title });
        
        let subTotalCol1 = 0;
        let subTotalCol2 = 0;
        let subTotalFinal = 0;

        items.forEach(item => {
          let c1 = 0, c2 = 0, tf = 0;

          // Kalkulasi berdasarkan tipe untuk akumulasi total kolom
          if (cat.key === 'gadai_baru') {
            c1 = parseFloat(item.pokok_pinjaman) || 0;
            c2 = (parseFloat(item.jasa_sewa) || 0) + (parseFloat(item.admin) || 0) + (parseFloat(item.asuransi) || 0);
            tf = parseFloat(item.total_diterima) || 0;
          } else if (cat.key === 'perpanjangan') {
            c1 = parseFloat(item.jasa) || 0;
            c2 = (parseFloat(item.denda) || 0) + (parseFloat(item.admin) || 0) + (parseFloat(item.penalty) || 0);
            tf = parseFloat(item.total_bayar) || 0;
          } else if (cat.key === 'pelunasan') {
            c1 = parseFloat(item.pokok) || 0;
            c2 = (parseFloat(item.denda) || 0) + (parseFloat(item.penalty) || 0);
            tf = parseFloat(item.total_dibayar) || 0;
          } else if (cat.key === 'pelelangan') {
            c1 = parseFloat(item.total_hutang) || 0;
            c2 = parseFloat(item.profit_loss) || 0;
            tf = parseFloat(item.harga_terjual) || 0;
          }

          subTotalCol1 += c1;
          subTotalCol2 += c2;
          subTotalFinal += tf;

          // Masukkan data transaksi
          allData.push({ ...item, type: cat.key, displayNo: currentNumber });
          currentNumber++; 
        });

        // Baris Total per Kategori (Breakdown per kolom)
        allData.push({ 
          isTotalRow: true, 
          label: cat.totalLabel, 
          sumCol1: subTotalCol1, 
          sumCol2: subTotalCol2, 
          sumFinal: subTotalFinal 
        });
      }
    });

    return allData;
  };

  const chunkData = (data = []) => {
    const pages = [];
    for (let i = 0; i < data.length; i += ROW_PER_PAGE) {
      pages.push(data.slice(i, i + ROW_PER_PAGE));
    }
    return pages.length > 0 ? pages : [[]];
  };

  const allRows = prepareAllRows();
  const pages = chunkData(allRows);

  return (
    <Box sx={{ p: 3, bgcolor: '#0f172a', minHeight: '100vh' }}>
      {/* Control Panel (Hanya muncul di layar, tidak saat print) */}
      <Card sx={{ p: 2, mb: 3, maxWidth: '210mm', mx: 'auto' }} className="no-print">
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={2}>
            <TextField type="date" size="small" label="Dari" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField type="date" size="small" label="Sampai" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            <Button variant="contained" startIcon={<Refresh />} onClick={fetchData}>Refresh</Button>
          </Stack>
          <Button variant="contained" color="success" startIcon={<Print />} onClick={() => window.print()}>Cetak Ke PDF</Button>
        </Stack>
      </Card>

      {loading ? (
        <Box textAlign="center" py={10}><CircularProgress color="inherit" /></Box>
      ) : (
        <Box className="printable-content">
          {pages.map((rows, pageIdx) => (
            <Paper key={pageIdx} className="a4-page" elevation={0}>
              <img src={KopSuratImg} className="kop-img" alt="kop" />
              
              <Box className="content-body">
                {/* Header judul hanya muncul di halaman pertama */}
                {pageIdx === 0 && (
                  <Box textAlign="center" mb={2}>
                    <Typography variant="h6" fontWeight={800} sx={{ textDecoration: 'underline' }}>LAPORAN DETAIL TRANSAKSI KAS</Typography>
                    <Typography variant="body2" fontWeight={600}>Periode: {startDate} s/d {endDate}</Typography>
                  </Box>
                )}

                <Table className="report-table">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" width="40px">NO</TableCell>
                      <TableCell>KETERANGAN</TableCell>
                      <TableCell align="right" width="130px">NOMINAL 1</TableCell>
                      <TableCell align="right" width="130px">NOMINAL 2</TableCell>
                      <TableCell align="right" width="130px">TOTAL</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row, rowIdx) => {
                      if (row.isHeader) {
                        return (
                          <TableRow key={`h-${rowIdx}`} sx={{ bgcolor: '#f1f5f9' }}>
                            <TableCell colSpan={5} sx={{ fontWeight: 'bold', py: 1, border: '1px solid black !important' }}>{row.title}</TableCell>
                          </TableRow>
                        );
                      }
                      
                      if (row.isTotalRow) {
                        return (
                          <TableRow key={`t-${rowIdx}`} sx={{ bgcolor: '#fffbeb' }}>
                            <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold', border: '1px solid black !important' }}>{row.label}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', border: '1px solid black !important' }}>{formatRupiah(row.sumCol1)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', border: '1px solid black !important' }}>{formatRupiah(row.sumCol2)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: '#b91c1c', border: '1px solid black !important' }}>{formatRupiah(row.sumFinal)}</TableCell>
                          </TableRow>
                        );
                      }

                      let col1, col1Label, col2, col2Label, total;
                      if (row.type === 'gadai_baru') {
                        col1 = row.pokok_pinjaman; col1Label = "Pokok";
                        col2 = (row.jasa_sewa || 0) + (row.admin || 0) + (row.asuransi || 0); col2Label = "Jasa+Adm+Asr";
                        total = row.total_diterima;
                      } else if (row.type === 'perpanjangan') {
                        col1 = row.jasa; col1Label = "Jasa";
                        col2 = (row.denda || 0) + (row.admin || 0) + (row.penalty || 0); col2Label = "Denda+Adm+Pnlty";
                        total = row.total_bayar;
                      } else if (row.type === 'pelunasan') {
                        col1 = row.pokok; col1Label = "Pokok";
                        col2 = (row.denda || 0) + (row.penalty || 0); col2Label = "Denda+Pnlty";
                        total = row.total_dibayar;
                      } else if (row.type === 'pelelangan') {
                        col1 = row.total_hutang; col1Label = "Hutang";
                        col2 = row.profit_loss; col2Label = "Profit/Loss";
                        total = row.harga_terjual;
                      }

                      return (
                        <TableRow key={rowIdx}>
                          <TableCell align="center" sx={{ border: '1px solid black !important' }}>{row.displayNo}</TableCell>
                          <TableCell sx={{ border: '1px solid black !important' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>{row.no_gadai}</Typography>
                            <Typography variant="caption" sx={{ color: '#000' }}>{row.nasabah}</Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ border: '1px solid black !important' }}>
                            {formatRupiah(col1)}<br/><small>{col1Label}</small>
                          </TableCell>
                          <TableCell align="right" sx={{ border: '1px solid black !important' }}>
                            {formatRupiah(col2)}<br/><small>{col2Label}</small>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', border: '1px solid black !important' }}>
                            {formatRupiah(total)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Footer Tanda Tangan hanya muncul di halaman terakhir */}
                {pageIdx === pages.length - 1 && (
                  <Box sx={{ mt: 4, px: 2 }}>
                    <Stack direction="row" justifyContent="space-between" textAlign="center">
                      <Box sx={{ width: '200px' }}>
                        <Typography variant="body2" fontWeight={700}>Admin Kasir,</Typography>
                        <Box sx={{ height: '60px' }} />
                        <Typography variant="body2" fontWeight={700}>( ................................. )</Typography>
                      </Box>
                      <Box sx={{ width: '200px' }}>
                        <Typography variant="body2" fontWeight={700}>Manager SGI,</Typography>
                        <Box sx={{ height: '60px' }} />
                        <Typography variant="body2" fontWeight={700}>( ................................. )</Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}

                <Box className="footer-info">
                  <Divider sx={{ my: 1, borderColor: 'black', borderBottomWidth: 1.5 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography fontSize="10px" sx={{ fontWeight: 900, color: '#000' }}>Waktu Cetak: {new Date().toLocaleString('id-ID')}</Typography>
                    <Typography fontSize="10px" sx={{ fontWeight: 900, color: '#000' }}>Halaman {pageIdx + 1} dari {pages.length}</Typography>
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
        .content-body { position: relative; z-index: 2; padding: 45mm 15mm 30mm 15mm; height: 100%; display: flex; flex-direction: column; }
        .report-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .report-table th { background: #f8fafc !important; border: 1.2px solid black !important; font-weight: bold !important; font-size: 11px; color: #000; }
        .report-table td { font-size: 10px; padding: 4px !important; color: #000; line-height: 1.2; }
        .footer-info { margin-top: auto; padding-bottom: 5mm; }
        @media print {
          body * { visibility: hidden; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .printable-content, .printable-content * { visibility: visible; }
          .printable-content { position: absolute; left: 0; top: 0; width: 210mm; display: block !important; }
          .no-print { display: none !important; }
          .a4-page { width: 210mm; height: 296mm; margin: 0 !important; padding: 0 !important; page-break-after: always; box-shadow: none !important; position: relative; -webkit-print-color-adjust: exact; }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </Box>
  );
};

export default LaporanDetailTransaksiKas;