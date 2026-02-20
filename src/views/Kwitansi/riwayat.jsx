import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Card, Typography, Tab, Tabs, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Button,
  Paper, CircularProgress, Stack, TextField, IconButton, Chip
} from '@mui/material';
import { ArrowBack, Refresh, Person, Receipt } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from 'api/axiosInstance';

const RiwayatKwitansi = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [dataList, setDataList] = useState([]);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  const fetchRiwayat = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/kwitansi/riwayat-hari-ini', { 
        params: { tipe: tabValue, tanggal: tanggal } 
      });
      if (res.data.success) setDataList(res.data.data);
    } catch (err) { 
      console.error("Gagal load riwayat", err); 
    } finally { 
      setLoading(false); 
    }
  }, [tabValue, tanggal]);

  useEffect(() => { fetchRiwayat(); }, [fetchRiwayat]);

  return (
    <Box sx={{ p: 3, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
      
      {/* HEADER */}
      <Card sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton onClick={() => navigate(-1)} sx={{ color: 'primary.main' }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" fontWeight="bold">Riwayat Transaksi</Typography>
            <TextField 
              type="date" 
              value={tanggal} 
              onChange={(e) => setTanggal(e.target.value)} 
              size="small" 
            />
            <Button variant="contained" startIcon={<Refresh />} onClick={fetchRiwayat} color="secondary" sx={{ ml: 1 }}>
              Filter
            </Button>
          </Stack>

          <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} sx={{ bgcolor: '#eee', borderRadius: 2 }}>
            <Tab label="Pelunasan" />
            <Tab label="Perpanjangan" />
            <Tab label="Lelang" />
          </Tabs>
        </Stack>
      </Card>

      {/* TABEL DATA */}
      {loading ? (
        <Box sx={{ textAlign: 'center', mt: 10 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#37474f' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>JAM</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>NO. KWITANSI</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>NO. GADAI</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>NASABAH</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>METODE</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>TOTAL</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>KASIR/PETUGAS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dataList.length > 0 ? dataList.map((row) => (
                <TableRow key={`${row.jenis}-${row.id}`} hover>
                  <TableCell>{row.waktu}</TableCell>
                  <TableCell>
                    <Chip 
                      label={row.no_kwitansi} 
                      size="small" 
                      color={row.no_kwitansi === '-' ? "default" : "success"}
                      variant="outlined"
                      icon={<Receipt fontSize="small" />}
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                  <TableCell><b>{row.no_gadai}</b></TableCell>
                  <TableCell>{row.nasabah}</TableCell>
                  <TableCell>{row.metode.toUpperCase()}</TableCell>
                  <TableCell>Rp {row.total_bayar.toLocaleString('id-ID')}</TableCell>
                  <TableCell>
                    <Chip 
                      icon={<Person fontSize="small" />} 
                      label={row.petugas} 
                      size="small" 
                      variant="outlined" 
                      color="primary"
                    />
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    Tidak ada data pada tanggal {tanggal}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default RiwayatKwitansi;