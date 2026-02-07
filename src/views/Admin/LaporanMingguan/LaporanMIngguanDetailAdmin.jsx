import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Typography, TextField, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Box, Stack, 
  CircularProgress, Chip, Paper, Divider
} from '@mui/material';
import { FileDownload, Refresh, DateRange } from '@mui/icons-material'; 
import axiosInstance from 'api/axiosInstance';
import * as XLSX from 'xlsx';

const LaporanMingguanDetailAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null); 
  
  // Ambil role dari localStorage (Pastikan key-nya sesuai dengan yang lu simpan di app lu)
  const userRole = localStorage.getItem('role') || 'admin'; 

  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // LOGIC URL SESUAI PERMINTAAN LU
  const getApiUrl = useCallback(() => {
    const path = 'laporan-mingguan-detail'; 
    // Jika admin: admin/laporan-mingguan-detail
    // Jika HM: laporan-mingguan-detail
    const finalPath = userRole === "admin" ? `admin/${path}` : path;
    
    console.log("DEBUG: Nembak ke URL ->", finalPath); 
    return finalPath;
  }, [userRole]);

  const fetchLaporan = useCallback(async () => {
    setLoading(true);
    const apiUrl = getApiUrl();
    try {
      const res = await axiosInstance.get(apiUrl, { 
        params: { start_date: startDate, end_date: endDate } 
      });
      if (res.data.success) {
        setReportData(res.data);
      }
    } catch (err) { 
        console.error("Error Fetching Data:", err.response?.data || err.message); 
    } finally { 
        setLoading(false); 
    }
  }, [startDate, endDate, getApiUrl]);

  useEffect(() => { 
    fetchLaporan(); 
  }, [fetchLaporan]);

  const formatRupiah = (val) => 
    new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        minimumFractionDigits: 0 
    }).format(val || 0);

  const sumData = (data, key) => data?.reduce((acc, curr) => acc + (parseFloat(curr[key]) || 0), 0) || 0;

  const exportToExcel = () => {
    if (!reportData?.data) return;
    const wb = XLSX.utils.book_new();

    Object.keys(reportData.data).forEach(key => {
        if (key !== 'ringkasan' && Array.isArray(reportData.data[key])) {
            const ws = XLSX.utils.json_to_sheet(reportData.data[key]);
            XLSX.utils.book_append_sheet(wb, ws, key.toUpperCase());
        }
    });
    XLSX.writeFile(wb, `Laporan_${userRole.toUpperCase()}_${startDate}_${endDate}.xlsx`);
  };

  // Styling
  const cellStyle = { border: '1px solid #ccc', fontSize: '0.75rem', py: 0.8, px: 1 };
  const headerStyle = { ...cellStyle, fontWeight: 'bold', bgcolor: '#f1f5f9', textAlign: 'center' };
  const totalRowStyle = { ...cellStyle, fontWeight: 'bold', bgcolor: '#fff7ed', color: '#b91c1c' };

  return (
    <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Card sx={{ p: 2, mb: 3 }} className="no-print">
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <DateRange color="action" />
            <TextField label="Mulai" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="Sampai" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
            <Button variant="contained" onClick={fetchLaporan} startIcon={<Refresh />}>Filter</Button>
            <Button variant="contained" color="success" onClick={exportToExcel} startIcon={<FileDownload />}>Export Excel</Button>
          </Stack>
          <Chip label={`LOGIN SEBAGAI: ${userRole.toUpperCase()}`} color={userRole === 'admin' ? 'primary' : 'secondary'} sx={{ fontWeight: 'bold' }} />
        </Stack>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>
      ) : (
        <Paper sx={{ p: 4, bgcolor: '#fff', borderRadius: 0, border: '1px solid #e2e8f0' }}>
          <Typography variant="h5" align="center" sx={{ fontWeight: 'bold', mb: 1 }}>LAPORAN RINCIAN TRANSAKSI KAS</Typography>
          <Typography align="center" variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>Status: Selesai & Lunas (Periode: {startDate} - {endDate})</Typography>
          <Divider />

          {/* --- 1. GADAI BARU --- */}
          <Typography sx={{ fontWeight: 'bold', mt: 4, mb: 1, color: '#1e40af' }}>1. DETAIL GADAI BARU</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headerStyle} width="50">NO</TableCell>
                  <TableCell sx={headerStyle}>NO GADAI</TableCell>
                  <TableCell sx={headerStyle}>NASABAH</TableCell>
                  <TableCell sx={headerStyle}>POKOK</TableCell>
                  <TableCell sx={headerStyle}>JASA MUKA</TableCell>
                  <TableCell sx={headerStyle}>ADM+ASU</TableCell>
                  <TableCell sx={headerStyle}>DITERIMA</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData?.data?.gadai_baru?.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell sx={cellStyle} align="center">{i+1}</TableCell>
                    <TableCell sx={cellStyle}>{row.no_gadai}</TableCell>
                    <TableCell sx={cellStyle}>{row.nasabah}</TableCell>
                    <TableCell sx={cellStyle} align="right">{formatRupiah(row.pokok_pinjaman)}</TableCell>
                    <TableCell sx={cellStyle} align="right">{formatRupiah(row.jasa_sewa)}</TableCell>
                    <TableCell sx={cellStyle} align="right">{formatRupiah(row.admin + row.asuransi)}</TableCell>
                    <TableCell sx={{ ...cellStyle, fontWeight: 'bold' }} align="right">{formatRupiah(row.total_diterima)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} sx={totalRowStyle} align="center">TOTAL GADAI BARU</TableCell>
                  <TableCell sx={totalRowStyle} align="right">{formatRupiah(sumData(reportData?.data?.gadai_baru, 'pokok_pinjaman'))}</TableCell>
                  <TableCell sx={totalRowStyle} align="right">{formatRupiah(sumData(reportData?.data?.gadai_baru, 'jasa_sewa'))}</TableCell>
                  <TableCell sx={totalRowStyle} align="right">{formatRupiah(sumData(reportData?.data?.gadai_baru, 'admin') + sumData(reportData?.data?.gadai_baru, 'asuransi'))}</TableCell>
                  <TableCell sx={totalRowStyle} align="right">{formatRupiah(sumData(reportData?.data?.gadai_baru, 'total_diterima'))}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* --- 2. PERPANJANGAN --- */}
          <Typography sx={{ fontWeight: 'bold', mt: 6, mb: 1, color: '#1e40af' }}>2. DETAIL PERPANJANGAN</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headerStyle}>NO GADAI</TableCell>
                  <TableCell sx={headerStyle}>JASA</TableCell>
                  <TableCell sx={headerStyle}>DENDA</TableCell>
                  <TableCell sx={headerStyle}>ADMIN</TableCell>
                  <TableCell sx={headerStyle}>PENALTY</TableCell>
                  <TableCell sx={headerStyle}>TOTAL BAYAR</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData?.data?.perpanjangan?.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell sx={cellStyle}>{row.no_gadai}</TableCell>
                    <TableCell sx={cellStyle} align="right">{formatRupiah(row.jasa)}</TableCell>
                    <TableCell sx={cellStyle} align="right">{formatRupiah(row.denda)}</TableCell>
                    <TableCell sx={cellStyle} align="right">{formatRupiah(row.admin)}</TableCell>
                    <TableCell sx={cellStyle} align="right">{formatRupiah(row.penalty)}</TableCell>
                    <TableCell sx={{ ...cellStyle, fontWeight: 'bold' }} align="right">{formatRupiah(row.total_bayar)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell sx={totalRowStyle} align="center">TOTAL PERPANJANGAN</TableCell>
                  <TableCell sx={totalRowStyle} align="right">{formatRupiah(sumData(reportData?.data?.perpanjangan, 'jasa'))}</TableCell>
                  <TableCell sx={totalRowStyle} align="right">{formatRupiah(sumData(reportData?.data?.perpanjangan, 'denda'))}</TableCell>
                  <TableCell sx={totalRowStyle} align="right">{formatRupiah(sumData(reportData?.data?.perpanjangan, 'admin'))}</TableCell>
                  <TableCell sx={totalRowStyle} align="right">{formatRupiah(sumData(reportData?.data?.perpanjangan, 'penalty'))}</TableCell>
                  <TableCell sx={totalRowStyle} align="right">{formatRupiah(sumData(reportData?.data?.perpanjangan, 'total_bayar'))}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* --- 3. PELUNASAN --- */}
          <Typography sx={{ fontWeight: 'bold', mt: 6, mb: 1, color: '#1e40af' }}>3. DETAIL PELUNASAN</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headerStyle}>NO GADAI</TableCell>
                  <TableCell sx={headerStyle}>NASABAH</TableCell>
                  <TableCell sx={headerStyle}>POKOK</TableCell>
                  <TableCell sx={headerStyle}>DENDA</TableCell>
                  <TableCell sx={headerStyle}>PENALTY</TableCell>
                  <TableCell sx={headerStyle}>TOTAL MASUK</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData?.data?.pelunasan?.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell sx={cellStyle}>{row.no_gadai}</TableCell>
                    <TableCell sx={cellStyle}>{row.nasabah}</TableCell>
                    <TableCell sx={cellStyle} align="right">{formatRupiah(row.pokok)}</TableCell>
                    <TableCell sx={cellStyle} align="right">{formatRupiah(row.denda)}</TableCell>
                    <TableCell sx={cellStyle} align="right">{formatRupiah(row.penalty)}</TableCell>
                    <TableCell sx={{ ...cellStyle, fontWeight: 'bold' }} align="right">{formatRupiah(row.total_dibayar)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={2} sx={totalRowStyle} align="center">TOTAL PELUNASAN</TableCell>
                  <TableCell sx={totalRowStyle} align="right">{formatRupiah(sumData(reportData?.data?.pelunasan, 'pokok'))}</TableCell>
                  <TableCell sx={totalRowStyle} align="right">{formatRupiah(sumData(reportData?.data?.pelunasan, 'denda'))}</TableCell>
                  <TableCell sx={totalRowStyle} align="right">{formatRupiah(sumData(reportData?.data?.pelunasan, 'penalty'))}</TableCell>
                  <TableCell sx={totalRowStyle} align="right">{formatRupiah(sumData(reportData?.data?.pelunasan, 'total_dibayar'))}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography sx={{ fontWeight: 'bold', mt: 6, mb: 1, color: '#1e40af' }}>4. DETAIL PELELANGAN (BARANG TERLELANG)</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headerStyle} width="50">NO</TableCell>
                  <TableCell sx={headerStyle}>NO GADAI</TableCell>
                  <TableCell sx={headerStyle}>NASABAH</TableCell>
                  <TableCell sx={headerStyle}>TOTAL HUTANG</TableCell>
                  <TableCell sx={headerStyle}>HARGA TERJUAL</TableCell>
                  <TableCell sx={headerStyle}>PROFIT / LOSS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData?.data?.pelelangan?.length > 0 ? (
                  reportData.data.pelelangan.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell sx={cellStyle} align="center">{i + 1}</TableCell>
                      <TableCell sx={cellStyle}>{row.no_gadai}</TableCell>
                      <TableCell sx={cellStyle}>{row.nasabah}</TableCell>
                      <TableCell sx={cellStyle} align="right">{formatRupiah(row.total_hutang)}</TableCell>
                      <TableCell sx={cellStyle} align="right">{formatRupiah(row.harga_terjual)}</TableCell>
                      <TableCell 
                        sx={{ 
                          ...cellStyle, 
                          fontWeight: 'bold', 
                          color: row.profit_loss >= 0 ? '#15803d' : '#b91c1c' 
                        }} 
                        align="right"
                      >
                        {formatRupiah(row.profit_loss)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} sx={cellStyle} align="center">Tidak ada data lelang pada periode ini</TableCell>
                  </TableRow>
                )}
                
                {/* TOTAL BARIS PELELANGAN */}
                <TableRow>
                  <TableCell colSpan={3} sx={totalRowStyle} align="center">TOTAL REKAP LELANG</TableCell>
                  <TableCell sx={totalRowStyle} align="right">{formatRupiah(sumData(reportData?.data?.pelelangan, 'total_hutang'))}</TableCell>
                  <TableCell sx={totalRowStyle} align="right">{formatRupiah(sumData(reportData?.data?.pelelangan, 'harga_terjual'))}</TableCell>
                  <TableCell sx={totalRowStyle} align="right">{formatRupiah(sumData(reportData?.data?.pelelangan, 'profit_loss'))}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* --- SUMMARY TOTAL KAS MASUK (OPSIONAL TAPI PENTING) --- */}
          <Box sx={{ mt: 5, p: 2, bgcolor: '#f8fafc', border: '2px solid #e2e8f0' }}>
             <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>RINGKASAN KAS MASUK PERIODE INI:</Typography>
             <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography>Total Penerimaan (Gadai Baru + Perpanjangan + Pelunasan + Lelang):</Typography>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                   {formatRupiah(
                      sumData(reportData?.data?.gadai_baru, 'total_potongan') + // Jasa + Admin yang diambil di awal
                      sumData(reportData?.data?.perpanjangan, 'total_bayar') + 
                      sumData(reportData?.data?.pelunasan, 'total_dibayar') + 
                      sumData(reportData?.data?.pelelangan, 'harga_terjual')
                   )}
                </Typography>
             </Stack>
          </Box>

          {/* SIGNATURE SECTION */}
          <Stack direction="row" justifyContent="space-around" sx={{ mt: 10 }}>
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ mb: 10 }}>Pemeriksa ({userRole === 'admin' ? 'Kepala Cabang' : 'Head Manager'})</Typography>
                <Typography sx={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                    {userRole === 'admin' ? '( ________________ )' : '( HEAD MANAGER )'}
                </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ mb: 10 }}>Pembuat (Admin Kasir)</Typography>
                <Typography sx={{ fontWeight: 'bold', textDecoration: 'underline' }}>( ________________ )</Typography>
            </Box>
          </Stack>
        </Paper>
      )}
    </Box>
  );
};

export default LaporanMingguanDetailAdmin;