import React, { useState, useEffect } from 'react';
import { 
  Box, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, Button, Chip, Typography, Card, Stack, CircularProgress 
} from '@mui/material';
import { CheckCircle, Assignment, ErrorOutline } from '@mui/icons-material';
import axiosInstance from 'api/axiosInstance'; 

const LaporanApproval = () => {
  const [reports, setReports] = useState([]); // Default harus Array []
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // 1. Fungsi Ambil Data (History)
  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('manager/approvals/reports');
      // PERBAIKAN: Pastikan mengambil res.data.data karena Laravel mengirim Object success & data
      if (res.data && Array.isArray(res.data.data)) {
        setReports(res.data.data);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error("Gagal mengambil data", err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // 2. Fungsi Klik Tombol ACC
  const handleApprove = async (docId) => {
    if (window.confirm(`Apakah Anda yakin ingin menyetujui laporan ${docId}?`)) {
      setActionLoading(docId);
      try {
        const response = await axiosInstance.post(`manager/approvals/reports/${docId}/approve`);
        if (response.data.success) {
          alert("Laporan Berhasil di-ACC!");
          loadReports(); // Refresh tabel
        }
      } catch (err) {
        alert(err.response?.data?.message || "Terjadi kesalahan saat ACC.");
      } finally {
        setActionLoading(null);
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Assignment color="primary" sx={{ fontSize: 30 }} />
          <Typography variant="h5" fontWeight="bold">Approval Laporan Checker</Typography>
        </Stack>

        <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #eee' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell><b>Tanggal</b></TableCell>
                <TableCell><b>Tipe Laporan</b></TableCell>
                <TableCell><b>ID Dokumen</b></TableCell>
                <TableCell><b>Status</b></TableCell>
                <TableCell align="center"><b>Aksi</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell>
                </TableRow>
              ) : (Array.isArray(reports) && reports.length > 0) ? (
                reports.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.report_date}</TableCell>
                    <TableCell><Chip label={row.report_type?.toUpperCase()} size="small" variant="outlined" /></TableCell>
                    <TableCell><code style={{ color: '#d32f2f' }}>{row.doc_id}</code></TableCell>
                    <TableCell>
                      <Chip 
                        label={row.is_approved ? `DI-ACC: ${row.approved_by}` : "Menunggu ACC"} 
                        color={row.is_approved ? "success" : "warning"} 
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {!row.is_approved ? (
                        <Button 
                          variant="contained" 
                          color="success" 
                          size="small"
                          onClick={() => handleApprove(row.doc_id)}
                          disabled={actionLoading === row.doc_id}
                        >
                          {actionLoading === row.doc_id ? 'Proses...' : 'ACC SEKARANG'}
                        </Button>
                      ) : (
                        <CheckCircle color="success" />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <Stack alignItems="center" spacing={1}>
                      <ErrorOutline color="disabled" />
                      <Typography color="text.secondary">Tidak ada data laporan.</Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default LaporanApproval;