import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, Button, Chip, Typography, Card, Stack, CircularProgress,
  Tabs, Tab, Avatar, IconButton, Tooltip, TextField
} from '@mui/material';
import { 
  CheckCircle, Assignment, ErrorOutline, History 
} from '@mui/icons-material';
import axiosInstance from 'api/axiosInstance'; 

const LaporanApproval = () => {
  const [tabValue, setTabValue] = useState(0); 
  const [data, setData] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (tabValue === 0) {
        // Tab 0: List Laporan Harian (Audit)
        endpoint = `manager/approvals/reports${selectedDate ? `?tanggal=${selectedDate}` : ''}`;
      } else {
        // Tab 1: List SBG (Gadai)
        endpoint = selectedDate 
          ? `manager/acc-history?tanggal=${selectedDate}` 
          : `manager/gadai/list-sbg?status=all`; 
      }

      const res = await axiosInstance.get(endpoint);
      setData(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error("Gagal ambil data", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [tabValue, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // LOGIKA APPROVAL TERPISAH
const handleApproveAction = async (row) => {
    const isReport = tabValue === 0;
    
    // 1. Ambil ID yang tepat
    const targetId = isReport ? row.doc_id : row.id;
    
    // 2. Samakan persis dengan Route di api.php
    // Untuk Laporan: manager/approvals/reports/{doc_id}/approve
    // Untuk SBG: manager/approve-sbg/{id}
    const endpoint = isReport 
      ? `manager/approvals/reports/${targetId}/approve` 
      : `manager/approve-sbg/${targetId}`;

    const confirmMsg = isReport 
      ? `Setujui Laporan ${row.report_type.replace('_', ' ').toUpperCase()}?`
      : `Setujui Surat Bukti Gadai (SBG) ${row.no_gadai}?`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(targetId);
    try {
      // Eksekusi POST
      const res = await axiosInstance.post(endpoint);
      
      if (res.data.success) {
        alert(res.data.message || "Berhasil disetujui");
        loadData(); // Refresh data tabel
      }
    } catch (err) {
      console.error("Error Detail:", err.response);
      alert(err.response?.data?.message || "Gagal memproses approval");
    } finally {
      setActionLoading(null);
    }
  };
  const formatRupiah = (val) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#fbfbfb', minHeight: '100vh' }}>
      
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <Stack spacing={0.5}>
          <Typography variant="h4" fontWeight="800" sx={{ color: '#1a202c' }}>
            {tabValue === 0 ? "Approval Laporan Harian" : "Approval SBG & History"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tabValue === 0 ? "Verifikasi laporan audit dari Checker." : "Persetujuan transaksi gadai nasabah."}
          </Typography>
        </Stack>

        <TextField
          type="date"
          size="small"
          label="Filter Tanggal"
          InputLabelProps={{ shrink: true }}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          sx={{ bgcolor: 'white' }}
        />
      </Stack>

      <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Tabs value={tabValue} onChange={(e, v) => { setTabValue(v); setData([]); }} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<Assignment sx={{ fontSize: 18 }} />} iconPosition="start" label="ACC LAPORAN" />
          <Tab icon={<History sx={{ fontSize: 18 }} />} iconPosition="start" label="ACC SBG (GADAI)" />
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#fafafa' }}>
              <TableRow>
                {tabValue === 0 ? (
                  <>
                    <TableCell><b>TANGGAL</b></TableCell>
                    <TableCell><b>JENIS LAPORAN</b></TableCell>
                    <TableCell><b>ID DOKUMEN</b></TableCell>
                  </>
                ) : (
                  <>
                    <TableCell><b>NO GADAI</b></TableCell>
                    <TableCell><b>NASABAH</b></TableCell>
                    <TableCell align="right"><b>PINJAMAN</b></TableCell>
                  </>
                )}
                <TableCell align="center"><b>STATUS</b></TableCell>
                <TableCell align="center"><b>AKSI</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
              ) : data.length > 0 ? (
                data.map((row) => {
                  const isApproved = tabValue === 0 ? row.is_approved : row.approval_status === 'approved';
                  const rowId = tabValue === 0 ? row.doc_id : row.id;

                  return (
                    <TableRow key={rowId} hover>
                      {tabValue === 0 ? (
                        <>
                          <TableCell>{row.report_date}</TableCell>
                          <TableCell><Chip label={row.report_type.replace('_', ' ')} size="small" color="info" variant="outlined" /></TableCell>
                          <TableCell><code>{row.doc_id}</code></TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell><b>{row.no_gadai}</b></TableCell>
                          <TableCell>{row.nasabah?.nama_lengkap}</TableCell>
                          <TableCell align="right">{formatRupiah(row.uang_pinjaman)}</TableCell>
                        </>
                      )}

                      <TableCell align="center">
                        <Chip 
                          label={isApproved ? "APPROVED" : "PENDING"} 
                          color={isApproved ? "success" : "warning"}
                          size="small"
                        />
                      </TableCell>

                      <TableCell align="center">
                        {isApproved ? (
                          <IconButton disabled><CheckCircle color="success" /></IconButton>
                        ) : (
                          <Button 
                            variant="contained" 
                            size="small"
                            onClick={() => handleApproveAction(row)}
                            disabled={actionLoading === rowId}
                          >
                            {actionLoading === rowId ? '...' : 'ACC'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}>Data tidak ditemukan.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default LaporanApproval;