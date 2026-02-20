import React, { useEffect, useState, useCallback } from "react";
import {
  Box, Card, Typography, Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Stack, CircularProgress, Pagination, Button, Divider, useMediaQuery, useTheme
} from "@mui/material";
import { 
  ArrowBack as BackIcon, 
  CheckCircle as ApprovedIcon, 
  Cancel as RejectedIcon, 
  DoneAll as FinishedIcon,
  Person as PersonIcon,
  Smartphone as DeviceIcon
} from "@mui/icons-material";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

const formatRp = (val) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val || 0);

const HistoryHMPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Deteksi HP
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("approved");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let endpoint = "/approvals/history/hm-approved";
      if (tab === "rejected") endpoint = "/approvals/history/hm-rejected";
      if (tab === "finished") endpoint = "/approvals/history/finished";

      const res = await axiosInstance.get(endpoint, { params: { page } });
      
      if (res.data.payload) {
        const { items, pagination } = res.data.payload.data;
        setData(items || []);
        setTotalPages(Math.ceil((pagination?.total || 0) / 10));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const StatusChip = ({ label, type }) => {
    const s = label?.toLowerCase();
    // Warna dinamis berdasarkan status
    const getColors = () => {
      if (s === 'approved' || s === 'lunas' || s === 'selesai') return { bg: '#E8F5E9', text: '#2E7D32' };
      if (s === 'pending' || s === 'proses') return { bg: '#FFF3E0', text: '#E65100' };
      if (s === 'rejected') return { bg: '#FFEBEE', text: '#C62828' };
      return { bg: '#F5F5F5', text: '#616161' };
    };

    const colors = getColors();
    return (
      <Chip 
        label={label?.toUpperCase()} 
        size="small" 
        sx={{ 
          fontWeight: 800, 
          fontSize: '0.62rem',
          height: '20px',
          bgcolor: colors.bg,
          color: colors.text,
          borderRadius: '6px'
        }} 
      />
    );
  };

  // Tampilan Mobile (Card)
  const MobileCard = ({ item }) => (
    <Card sx={{ mb: 2, p: 2, borderRadius: '15px', border: '1px solid #E0E0E0', boxShadow: 'none' }}>
      <Stack spacing={1.5}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>{item.no_gadai}</Typography>
            <Typography variant="subtitle1" fontWeight={800} color="#004D40">{item.nama_nasabah}</Typography>
          </Box>
          <Typography variant="subtitle1" fontWeight={800} color="#2E7D32">
            {formatRp(item.uang_pinjaman)}
          </Typography>
        </Box>
        
        <Divider sx={{ borderStyle: 'dashed' }} />
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <DeviceIcon sx={{ fontSize: 16, color: '#757575' }} />
            <Typography variant="body2">{item.detail_barang}</Typography>
          </Stack>
          <Typography variant="caption" color="textSecondary">{item.tanggal_gadai}</Typography>
        </Box>

        <Box sx={{ bgcolor: '#F8FAFB', p: 1, borderRadius: '8px', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" sx={{ display: 'block', fontSize: '0.6rem', fontWeight: 700, mb: 0.5 }}>CHECKER</Typography>
            <StatusChip label={item.status_checker} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ display: 'block', fontSize: '0.6rem', fontWeight: 700, mb: 0.5 }}>HM</Typography>
            <StatusChip label={item.status_hm} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ display: 'block', fontSize: '0.6rem', fontWeight: 700, mb: 0.5 }}>GADAI</Typography>
            <StatusChip label={item.status_gadai} />
          </Box>
        </Box>
      </Stack>
    </Card>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: "#F4F7F7", minHeight: "100vh" }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={4} alignItems={{ xs: 'flex-start', sm: 'center' }}>
        <Button 
          variant="outlined" 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/approval-hm-gadai')}
          sx={{ borderRadius: '10px', color: '#004D40', borderColor: '#004D40', bgcolor: '#FFF' }}
        >
          Kembali
        </Button>
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight={900} color="#004D40">Riwayat Approval</Typography>
          <Typography variant="body2" color="textSecondary">Log status Checker & Head Manager</Typography>
        </Box>
      </Stack>

      <Card sx={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
        <Tabs 
          value={tab} 
          onChange={(e, v) => { setTab(v); setPage(1); }} 
          variant="fullWidth" // Agar pas di layar HP
          sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#FFF' }}
        >
          <Tab icon={<ApprovedIcon />} label={!isMobile && "Approved"} value="approved" />
          <Tab icon={<RejectedIcon />} label={!isMobile && "Rejected"} value="rejected" />
          <Tab icon={<FinishedIcon />} label={!isMobile && "Finished"} value="finished" />
        </Tabs>

        <Box sx={{ p: { xs: 1, md: 0 } }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress color="success" /></Box>
          ) : data.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}><Typography color="textSecondary">Tidak ada riwayat.</Typography></Box>
          ) : isMobile ? (
            // Layout Mobile
            <Box sx={{ py: 2 }}>
              {data.map((item) => <MobileCard key={item.id} item={item} />)}
            </Box>
          ) : (
            // Layout Desktop (Table)
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#F8FAFB' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>NASABAH</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>PINJAMAN</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>CHECKER</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>HM STATUS</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>STATUS GADAI</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700}>{item.nama_nasabah}</Typography>
                        <Typography variant="caption" color="textSecondary">{item.no_gadai}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" fontWeight={800}>{formatRp(item.uang_pinjaman)}</Typography>
                      </TableCell>
                      <TableCell align="center"><StatusChip label={item.status_checker} /></TableCell>
                      <TableCell align="center"><StatusChip label={item.status_hm} /></TableCell>
                      <TableCell align="center"><StatusChip label={item.status_gadai} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', bgcolor: '#FFF', borderTop: '1px solid #EEE' }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={(e, v) => setPage(v)} 
            color="success" 
            size={isMobile ? "small" : "medium"}
            shape="rounded" 
          />
        </Box>
      </Card>
    </Box>
  );
};

export default HistoryHMPage;