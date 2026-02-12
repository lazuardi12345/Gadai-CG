import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, Button, Chip, Typography, Card, Stack, CircularProgress,
  Tabs, Tab, IconButton, TextField, Divider, useTheme, useMediaQuery
} from '@mui/material';
import { 
  CheckCircle, 
  Assignment, 
  History, 
  Search,
  ErrorOutline // Sudah aman sekarang
} from '@mui/icons-material';
import axiosInstance from 'api/axiosInstance'; 

const LaporanApproval = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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

  const handleApproveAction = async (row) => {
    const isReport = tabValue === 0;
    const targetId = isReport ? row.doc_id : row.id;
    const endpoint = isReport 
      ? `manager/approvals/reports/${targetId}/approve` 
      : `manager/approve-sbg/${targetId}`;

    const confirmMsg = isReport 
      ? `Setujui Laporan ${row.report_type.replace('_', ' ').toUpperCase()}?`
      : `Setujui Surat Bukti Gadai (SBG) ${row.no_gadai}?`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(targetId);
    try {
      const res = await axiosInstance.post(endpoint);
      if (res.data.success) {
        alert(res.data.message || "Berhasil disetujui");
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Gagal memproses approval");
    } finally {
      setActionLoading(null);
    }
  };

  const formatRupiah = (val) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#fbfbfb', minHeight: '100vh' }}>
      
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={isMobile ? "flex-start" : "center"} spacing={2} sx={{ mb: 4 }}>
        <Stack spacing={0.5}>
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight="800" sx={{ color: '#1a202c' }}>
            {tabValue === 0 ? "Approval Laporan" : "Approval SBG"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tabValue === 0 ? "Verifikasi laporan harian audit." : "Persetujuan transaksi gadai."}
          </Typography>
        </Stack>

        <TextField
          type="date"
          fullWidth={isMobile}
          size="small"
          label="Filter Tanggal"
          InputLabelProps={{ shrink: true }}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          sx={{ bgcolor: 'white', maxWidth: { md: 250 } }}
        />
      </Stack>

      <Card sx={{ borderRadius: isMobile ? '12px' : '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, v) => { setTabValue(v); setData([]); }} 
          variant={isMobile ? "fullWidth" : "standard"}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<Assignment sx={{ fontSize: 18 }} />} iconPosition="start" label="LAPORAN" />
          <Tab icon={<History sx={{ fontSize: 18 }} />} iconPosition="start" label="SBG" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
        ) : data.length > 0 ? (
          isMobile ? (
            <Box sx={{ p: 2, bgcolor: '#f8f9fa' }}>
              {data.map((row) => {
                const isApproved = tabValue === 0 ? row.is_approved : row.approval_status === 'approved';
                const rowId = tabValue === 0 ? row.doc_id : row.id;

                return (
                  <Card key={rowId} sx={{ mb: 2, borderRadius: '12px', p: 2, border: '1px solid #eee' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                      <Box>
                        <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 'bold' }}>
                          {tabValue === 0 ? row.report_date : row.no_gadai}
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="700" sx={{ display: 'block', mt: 0.5 }}>
                          {tabValue === 0 ? row.report_type?.replace('_', ' ').toUpperCase() : row.nasabah?.nama_lengkap}
                        </Typography>
                      </Box>
                      <Chip 
                        label={isApproved ? "APPROVED" : "PENDING"} 
                        color={isApproved ? "success" : "warning"}
                        size="small"
                        sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}
                      />
                    </Stack>
                    
                    <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        {tabValue === 0 ? (
                          <Typography variant="body2" color="text.secondary">ID: <code>{row.doc_id}</code></Typography>
                        ) : (
                          <Typography variant="body1" fontWeight="800" color="primary.main">{formatRupiah(row.uang_pinjaman)}</Typography>
                        )}
                      </Box>
                      
                      {isApproved ? (
                        <CheckCircle color="success" />
                      ) : (
                        <Button 
                          variant="contained" 
                          size="small"
                          onClick={() => handleApproveAction(row)}
                          disabled={actionLoading === rowId}
                        >
                          {actionLoading === rowId ? '...' : 'SETUJUI'}
                        </Button>
                      )}
                    </Stack>
                  </Card>
                );
              })}
            </Box>
          ) : (
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
                  {data.map((row) => {
                    const isApproved = tabValue === 0 ? row.is_approved : row.approval_status === 'approved';
                    const rowId = tabValue === 0 ? row.doc_id : row.id;

                    return (
                      <TableRow key={rowId} hover>
                        {tabValue === 0 ? (
                          <>
                            <TableCell>{row.report_date}</TableCell>
                            <TableCell><Chip label={row.report_type?.replace('_', ' ')} size="small" color="info" variant="outlined" /></TableCell>
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
                          <Chip label={isApproved ? "APPROVED" : "PENDING"} color={isApproved ? "success" : "warning"} size="small" />
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
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )
        ) : (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <ErrorOutline sx={{ fontSize: 50, color: 'grey.300', mb: 1 }} />
            <Typography color="text.secondary">Data tidak ditemukan.</Typography>
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default LaporanApproval;