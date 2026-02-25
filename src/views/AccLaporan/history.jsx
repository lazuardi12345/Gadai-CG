import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Chip, Typography, Card, Stack, CircularProgress, Tabs, Tab, TextField, IconButton 
} from '@mui/material';
import { ArrowBack, Assignment, ReceiptLong } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import axiosInstance from 'api/axiosInstance'; 

const LaporanHistory = () => {
  const [tabValue, setTabValue] = useState(0); 
  const [data, setData] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      // Sesuai Route yang lu kasih tadi
      let endpoint = tabValue === 0 
        ? `manager/approvals/reports?tanggal=${selectedDate}` 
        : `/manager/acc-history?tanggal=${selectedDate}`;
      
      const res = await axiosInstance.get(endpoint);
      const result = Array.isArray(res.data?.data) ? res.data.data : [];
      
      setData(tabValue === 0 ? result.filter(item => item.is_approved) : result);
    } catch (err) {
      console.error("Gagal load history", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [tabValue, selectedDate]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f4f7f9', minHeight: '100vh' }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <IconButton component={Link} to="/pengajuan-laporan" sx={{ bgcolor: 'white', boxShadow: 1 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" fontWeight="900">History Approved</Typography>
          <Typography variant="body2" color="text.secondary">Arsip dokumen yang telah berstatus Lunas</Typography>
        </Box>
        <TextField type="date" size="small" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
      </Stack>

      <Card sx={{ borderRadius: '16px' }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<Assignment />} label="AUDIT HISTORY" />
          <Tab icon={<ReceiptLong />} label="SBG HISTORY" />
        </Tabs>

        {loading ? <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  {tabValue === 0 ? (
                    <><TableCell>TANGGAL</TableCell><TableCell>DOC ID</TableCell><TableCell>MANAGER</TableCell><TableCell>WAKTU ACC</TableCell></>
                  ) : (
                    <><TableCell>NO GADAI</TableCell><TableCell>NASABAH</TableCell><TableCell>PINJAMAN</TableCell><TableCell>ACC BY</TableCell></>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id || row.doc_id}>
                    {tabValue === 0 ? (
                      <><TableCell>{row.report_date}</TableCell><TableCell><code>{row.doc_id}</code></TableCell><TableCell>{row.approved_by}</TableCell><TableCell>{new Date(row.updated_at).toLocaleString('id-ID')}</TableCell></>
                    ) : (
                      <><TableCell>{row.no_gadai}</TableCell><TableCell>{row.nasabah?.nama_lengkap}</TableCell><TableCell>{row.uang_pinjaman}</TableCell><TableCell>{row.approvals?.[0]?.user?.name || 'Manager'}</TableCell></>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
};

export default LaporanHistory;