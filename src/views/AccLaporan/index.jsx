import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, Button, Chip, Typography, Card, Stack, CircularProgress,
  Tabs, Tab, Avatar, IconButton, Tooltip, TextField, Divider
} from '@mui/material';
import { 
  CheckCircle, Assignment, ErrorOutline, FactCheck, ReceiptLong, 
  ArrowForwardIos, CalendarMonth, History
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
        endpoint = `manager/approvals/reports${selectedDate ? `?tanggal=${selectedDate}` : ''}`;
      } else {
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

  const handleApproveSBG = async (id) => {
    if (!window.confirm(`Setujui Surat Bukti Gadai ini?`)) return;
    setActionLoading(id);
    try {
      await axiosInstance.post(`manager/approve-sbg/${id}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal ACC");
    } finally {
      setActionLoading(null);
    }
  };

  const formatRupiah = (val) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#fbfbfb', minHeight: '100vh' }}>
      
      {/* HEADER SECTION */}
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <Stack spacing={0.5}>
          <Typography variant="h4" fontWeight="800" sx={{ color: '#1a202c' }}>
            {tabValue === 1 ? "SBG Approval & History" : "Laporan Approval"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Kelola persetujuan digital dan tinjau riwayat transaksi SGI.
          </Typography>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
            <TextField
                type="date"
                size="small"
                label="Filter Tanggal ACC"
                InputLabelProps={{ shrink: true }}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                sx={{ bgcolor: 'white' }}
            />
            {selectedDate && (
                <Button variant="outlined" color="error" size="small" onClick={() => setSelectedDate('')}>Reset</Button>
            )}
        </Stack>
      </Stack>

      <Card sx={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<Assignment sx={{ fontSize: 18 }} />} iconPosition="start" label="ACC LAPORAN" />
          <Tab icon={<History sx={{ fontSize: 18 }} />} iconPosition="start" label="ACC & HISTORY SBG" />
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#fafafa' }}>
              <TableRow>
                {tabValue === 0 ? (
                  <>
                    <TableCell><b>TANGGAL</b></TableCell>
                    <TableCell><b>TIPE</b></TableCell>
                    <TableCell><b>ID DOKUMEN</b></TableCell>
                  </>
                ) : (
                  <>
                    <TableCell><b>NOMOR GADAI</b></TableCell>
                    <TableCell><b>NASABAH</b></TableCell>
                    <TableCell><b>ITEM</b></TableCell>
                    <TableCell align="right"><b>PINJAMAN</b></TableCell>
                  </>
                )}
                <TableCell align="center"><b>STATUS</b></TableCell>
                <TableCell align="center"><b>AKSI</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
              ) : data.length > 0 ? (
                data.map((row) => {
                  const isApproved = tabValue === 1 ? row.approval_status === 'approved' : row.is_approved;
                  
                  return (
                    <TableRow key={row.id} hover>
                      {tabValue === 0 ? (
                        <>
                          <TableCell>{row.report_date}</TableCell>
                          <TableCell><Chip label={row.report_type} size="small" /></TableCell>
                          <TableCell><code>{row.doc_id}</code></TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell><Typography variant="body2" fontWeight="bold" color="primary">{row.no_gadai}</Typography></TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>{row.nasabah?.nama_lengkap?.charAt(0)}</Avatar>
                                <Typography variant="body2">{row.nasabah?.nama_lengkap}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>{row.hp?.nama_barang || row.type?.nama_type}</TableCell>
                          <TableCell align="right">{formatRupiah(row.uang_pinjaman)}</TableCell>
                        </>
                      )}

                      <TableCell align="center">
                        <Chip 
                          label={isApproved ? "APPROVED" : "PENDING"} 
                          color={isApproved ? "success" : "warning"}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        {isApproved ? (
                          <Tooltip title="Sudah Disetujui">
                            <span>
                              <IconButton disabled>
                                <CheckCircle color="success" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        ) : (
                          <Button 
                            variant="contained" 
                            size="small"
                            onClick={() => handleApproveSBG(row.id)}
                            disabled={actionLoading === row.id}
                            sx={{ textTransform: 'none', borderRadius: '8px' }}
                          >
                            {actionLoading === row.id ? '...' : 'ACC'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <ErrorOutline color="disabled" sx={{ fontSize: 40 }} />
                    <Typography variant="body2" color="text.secondary">Tidak ada data ditemukan.</Typography>
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