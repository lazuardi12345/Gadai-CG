import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  Grid, Card, Typography, TextField, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Box, Stack, 
  CircularProgress, Paper, Chip, Alert
} from '@mui/material';
import { Print, Refresh } from '@mui/icons-material'; 
import axiosInstance from 'api/axiosInstance';
import { AuthContext } from "AuthContex/AuthContext";

// Import aset yang sama dengan laporan checker
import KopSuratImg from 'assets/images/Kop SUrat.png';  
import TtdManagerImg from 'assets/images/ttd.png'; 
import StempelImg from 'assets/images/stemple.png';     

const LaporanGudangCetak = () => {
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();
  
  const [loading, setLoading] = useState(false);
  const [dataReport, setDataReport] = useState(null); 
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  // API base dinamis sesuai role
  const apiBase = userRole === 'hm' ? '/hm/gudang' : '/gudang';

  const fetchLaporan = useCallback(async () => {
    setLoading(true);
    try {
      // Menggunakan API riwayat tapi kita format untuk tampilan cetak
      const res = await axiosInstance.get(`${apiBase}/riwayat`, { params: { tanggal } });
      if (res.data.success) {
        setDataReport(res.data);
      }
    } catch (err) {
      console.error("Gagal tarik data cetak");
    } finally {
      setLoading(false);
    }
  }, [tanggal, apiBase]);

  useEffect(() => { fetchLaporan(); }, [fetchLaporan]);

  const formatTanggalIndo = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(date);
  };

  const renderSignature = () => {
    const isApproved = false; // Gudang biasanya lapor dulu, baru di-ACC HM/Manager
    const checkerName = user?.name || 'Petugas Gudang';

    return (
      <Box sx={{ mt: 'auto', pt: 3 }}>
        <Grid container sx={{ textAlign: 'center', alignItems: 'flex-end' }}>
          <Grid item xs={6}>
            <Typography sx={{ fontSize: '0.8rem', mb: 8 }}>Dibuat Oleh (Gudang),</Typography>
            <Box sx={{ borderTop: '1.5px solid #000', mx: 5, pt: 0.5 }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{checkerName}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Typography sx={{ fontSize: '0.8rem', mb: 8 }}>Diketahui Oleh (Manager),</Typography>
            <Box sx={{ position: 'relative', mx: 5 }}>
                {isApproved && (
                  <>
                    <Box component="img" src={TtdManagerImg} sx={{ position: 'absolute', width: '120px', bottom: '10px', left: '50%', transform: 'translateX(-50%)' }} />
                    <Box component="img" src={StempelImg} sx={{ position: 'absolute', width: '150px', bottom: '0', left: '0', opacity: 0.8 }} />
                  </>
                )}
                <Box sx={{ borderTop: '1.5px solid #000', pt: 0.5 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}>MANAGER SGI</Typography>
                </Box>
            </Box>
          </Grid>
        </Grid>
        <Typography sx={{ fontSize: '0.6rem', color: '#777', mt: 2, textAlign: 'right', fontStyle: 'italic' }}>
          Dicetak otomatis oleh sistem pada: {new Date().toLocaleString('id-ID')} WIB
        </Typography>
      </Box>
    );
  };

  const paperStyle = { 
    width: '210mm', 
    minHeight: '297mm', 
    margin: '20px auto', 
    p: '45mm 15mm 15mm 15mm', 
    position: 'relative',
    display: 'flex', 
    flexDirection: 'column', 
    backgroundImage: `url("${KopSuratImg}")`, 
    backgroundSize: '100% auto', 
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'top center', 
    bgcolor: '#fff',
    boxShadow: '0 0 10px rgba(0,0,0,0.2)'
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#455a64', minHeight: '100vh' }}>
      {/* Control Panel (No Print) */}
      <Card sx={{ p: 2, mb: 3 }} className="no-print">
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} size="small" />
          <Button variant="contained" startIcon={<Refresh />} onClick={fetchLaporan} color="secondary">Refresh</Button>
          <Button variant="contained" startIcon={<Print />} onClick={() => window.print()} color="primary">Cetak Laporan</Button>
        </Stack>
      </Card>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress color="inherit" /></Box>
      ) : (
        <Paper sx={paperStyle} className="print-area">
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, textDecoration: 'underline' }}>
              LAPORAN MUTASI GUDANG (IN/OUT)
            </Typography>
            <Typography sx={{ fontSize: '0.9rem' }}>
              Periode: {formatTanggalIndo(tanggal)}
            </Typography>
          </Box>

          <TableContainer>
            <Table size="small" sx={{ '& .MuiTableCell-root': { border: '1px solid #000', fontSize: '0.75rem' } }}>
              <TableHead sx={{ bgcolor: '#f0f0f0' }}>
                <TableRow>
                  <TableCell align="center" width="40">NO</TableCell>
                  <TableCell width="120">WAKTU</TableCell>
                  <TableCell>NASABAH / NO GADAI</TableCell>
                  <TableCell>BARANG JAMINAN</TableCell>
                  <TableCell align="center" width="100">STATUS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataReport?.data?.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell align="center">{idx + 1}</TableCell>
                    <TableCell align="center">{item.waktu}</TableCell>
                    <TableCell>
                      <b>{item.nasabah}</b><br/>{item.no_gadai}
                    </TableCell>
                    <TableCell>{item.barang}</TableCell>
                    <TableCell align="center">
                      <Typography sx={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 'bold', 
                        color: item.jenis_pergerakan === 'masuk' ? 'green' : 'red' 
                      }}>
                        {item.jenis_pergerakan.toUpperCase()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {(!dataReport?.data || dataReport?.data.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">Tidak ada aktivitas gudang hari ini.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 3 }}>
            <Typography sx={{ fontSize: '0.75rem', textAlign: 'justify' }}>
              Demikian laporan mutasi barang ini dibuat dengan sebenar-benarnya berdasarkan hasil verifikasi fisik melalui sistem barcode scanner untuk menjamin kesesuaian data antara sistem dan fisik di gudang penyimpanan SGI.
            </Typography>
          </Box>

          {renderSignature()}
        </Paper>
      )}

      <style>
        {`
          @media print {
            body { background: none !important; }
            .no-print { display: none !important; }
            .print-area { 
              box-shadow: none !important; 
              margin: 0 !important; 
              width: 210mm !important;
              height: 297mm !important;
            }
            @page { size: A4; margin: 0; }
          }
        `}
      </style>
    </Box>
  );
};

export default LaporanGudangCetak;