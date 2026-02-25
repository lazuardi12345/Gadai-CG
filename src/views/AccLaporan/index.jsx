import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Button, Chip, Typography, Card, Stack, CircularProgress,
  Tabs, Tab, TextField, Checkbox, IconButton
} from '@mui/material';
import { 
  Assignment, ReceiptLong, ErrorOutline, DoneAll, History as HistoryIcon 
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import axiosInstance from 'api/axiosInstance'; 

const LaporanApproval = () => {
  const [tabValue, setTabValue] = useState(0); 
  const [data, setData] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedIds, setSelectedIds] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setSelectedIds([]); 
    try {
      let endpoint = tabValue === 0 
        ? `manager/approvals/reports?tanggal=${selectedDate}`
        : `manager/gadai/list-sbg?status=pending`; // Pakai pending sesuai controller
      
      const res = await axiosInstance.get(endpoint);
      const result = Array.isArray(res.data?.data) ? res.data.data : [];
      
      if (tabValue === 0) {
        setData(result.filter(item => !item.is_approved));
      } else {
        setData(result); 
      }
    } catch (err) {
      console.error("Gagal load data", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [tabValue, selectedDate]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApproveAction = async (target) => {
    const isBulk = Array.isArray(target);
    const isReport = tabValue === 0;
    const targetIds = isBulk ? target : [isReport ? target.doc_id : target.id];

    if (!window.confirm(`Setujui ${targetIds.length} item?`)) return;
    setActionLoading(isBulk ? 'bulk' : targetIds[0]);

    try {
      if (isReport) {
        await axiosInstance.post(`manager/approvals/reports/approve`, { doc_ids: targetIds });
      } else {
        // SBG hit satu-satu atau bulk (Looping FE)
        await Promise.all(targetIds.map(id => axiosInstance.post(`manager/approve-sbg/${id}`)));
      }
      alert("Berhasil di-ACC Brader!");
      loadData();
    } catch (err) {
      alert("Gagal ACC: " + (err.response?.data?.message || "Server Error"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelectAll = (e) => {
    setSelectedIds(e.target.checked ? data.map(row => tabValue === 0 ? row.doc_id : row.id) : []);
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f4f7f9', minHeight: '100vh' }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="900">Manager Approval</Typography>
          <Typography variant="body2" color="text.secondary">Verifikasi antrian laporan & transaksi</Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button component={Link} to="/laporan-acc-history" variant="outlined" startIcon={<HistoryIcon />}>
            LIHAT HISTORY
          </Button>
          {selectedIds.length > 0 && (
            <Button variant="contained" color="success" startIcon={<DoneAll />} onClick={() => handleApproveAction(selectedIds)}>
              ACC MASSAL ({selectedIds.length})
            </Button>
          )}
          {tabValue === 0 && <TextField type="date" size="small" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />}
        </Stack>
      </Stack>

      <Card sx={{ borderRadius: '16px', boxShadow: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<Assignment />} iconPosition="start" label="PENDING AUDIT" />
          <Tab icon={<ReceiptLong />} iconPosition="start" label="PENDING SBG" />
        </Tabs>

        {loading ? <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox"><Checkbox onChange={handleSelectAll} /></TableCell>
                  {tabValue === 0 ? (
                    <><TableCell>TANGGAL</TableCell><TableCell>JENIS</TableCell><TableCell>DOC ID</TableCell></>
                  ) : (
                    <><TableCell>NO GADAI</TableCell><TableCell>NASABAH</TableCell><TableCell>PINJAMAN</TableCell></>
                  )}
                  <TableCell align="center">AKSI</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row) => {
                  const id = tabValue === 0 ? row.doc_id : row.id;
                  return (
                    <TableRow key={id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox checked={selectedIds.includes(id)} onChange={() => handleSelectOne(id)} />
                      </TableCell>
                      {tabValue === 0 ? (
                        <><TableCell>{row.report_date}</TableCell><TableCell>{row.report_type}</TableCell><TableCell><code>{row.doc_id}</code></TableCell></>
                      ) : (
                        <><TableCell>{row.no_gadai}</TableCell><TableCell>{row.nasabah?.nama_lengkap}</TableCell><TableCell>{row.uang_pinjaman}</TableCell></>
                      )}
                      <TableCell align="center">
                        <Button variant="contained" size="small" onClick={() => handleApproveAction(row)} disabled={actionLoading === id}>
                          {actionLoading === id ? '...' : 'ACC'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
};

export default LaporanApproval;