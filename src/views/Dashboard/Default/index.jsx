import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Grid, Card, CardHeader, CardContent, Typography, Divider,
  CircularProgress, Box, Stack, Avatar, FormControl, Select, MenuItem
} from '@mui/material';
import axiosInstance from 'api/axiosInstance';
import dayjs from 'dayjs';
import Chart from 'react-apexcharts';

// Components
import SalesLineCard from 'views/Dashboard/card/SalesLineCard';
import RevenuChartCard from 'views/Dashboard/card/RevenuChartCard';
import ReportCard from './ReportCard'; 
import { gridSpacing } from 'config.js';

// Icons
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import DiamondIcon from '@mui/icons-material/Diamond';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const WalletReportCard = ({ primary, secondary, color, icon: Icon }) => (
  <Card sx={{ bgcolor: color, color: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.15)' }}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h3" color="inherit" sx={{ fontWeight: 700 }}>{primary}</Typography>
          <Typography variant="subtitle1" color="inherit" sx={{ opacity: 0.8 }}>{secondary}</Typography>
        </Box>
        <Avatar variant="rounded" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', width: 48, height: 48 }}>
          <Icon fontSize="large" />
        </Avatar>
      </Stack>
    </CardContent>
  </Card>
);

const Default = () => {
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [dashboardData, setDashboardData] = useState(null);

  const safeRupiah = (value) => {
    const num = Number(value) || 0;
    return num.toLocaleString('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0
    });
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/dashboard?tahun=${selectedYear}`);
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (error) {
      console.error('Gagal memuat dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedYear]);

  if (loading || !dashboardData) return (
    <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
      <CircularProgress sx={{ color: '#004D40' }} />
    </Box>
  );

  // DESTRUCTURING SESUAI JSON BACKEND
  const { gadai_summary, unit_stats, pelelangan, brankas } = dashboardData;

  return (
    <Grid container spacing={gridSpacing}>
      {/* SECTION 1: BRANKAS CARDS */}
      <Grid item xs={12}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 700, color: '#004D40' }}>
          Kalkulasi Brankas & Rekening ({dayjs().format('MMMM YYYY')})
        </Typography>
        
        <Grid container spacing={gridSpacing}>
          <Grid item lg={3} md={6} xs={12}>
            <WalletReportCard 
              primary={safeRupiah(brankas.summary.saldo_toko)} 
              secondary="Saldo Fisik (Toko)" color="#1e3c72" icon={AccountBalanceWalletIcon} 
            />
          </Grid>
          <Grid item lg={3} md={6} xs={12}>
            <WalletReportCard 
              primary={safeRupiah(brankas.summary.saldo_rekening)} 
              secondary="Saldo Rekening" color="#0e7490" icon={AccountBalanceIcon} 
            />
          </Grid>
          <Grid item lg={3} md={6} xs={12}>
            <WalletReportCard 
              primary={safeRupiah(brankas.summary.modal_pusat)} 
              secondary="Total Injeksi Modal" color="#00796B" icon={TrendingUpIcon} 
            />
          </Grid>
          <Grid item lg={3} md={6} xs={12}>
            <WalletReportCard 
              primary={safeRupiah(brankas.summary.setoran_admin)} 
              secondary="Setoran Admin" color="#2e7d32" icon={CheckCircleIcon} 
            />
          </Grid>
        </Grid>
      </Grid>

      {/* SECTION 2: BRANKAS CHART */}
      <Grid item xs={12}>
        <Card sx={{ borderRadius: 2 }}>
          <CardHeader 
            title={<Typography variant="h5" fontWeight="bold">Trend Brankas Tahunan</Typography>} 
            action={
              <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} size="small">
                {[2024, 2025, 2026].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            }
          />
          <Divider />
          <CardContent>
            <Chart
              height={300}
              type="line"
              series={[
                { name: 'Pemasukan', type: 'column', data: brankas.chart.masuk },
                { name: 'Pengeluaran', type: 'column', data: brankas.chart.keluar },
                { name: 'Saldo Kumulatif', type: 'line', data: brankas.chart.kumulatif }
              ]}
              options={{
                chart: { id: 'brankas-yearly-chart', toolbar: { show: false } },
                colors: ['#4caf50', '#f44336', '#2196f3'],
                labels: brankas.chart.labels,
                stroke: { width: [0, 0, 3], curve: 'smooth' },
                yaxis: { labels: { formatter: (v) => v.toLocaleString() } },
                tooltip: { y: { formatter: (v) => safeRupiah(v) } }
              }}
            />
          </CardContent>
        </Card>
      </Grid>

      {/* SECTION 3: UNIT CARDS (Statistik Berdasarkan Jenis) */}
      <Grid item xs={12}>
        <Grid container spacing={gridSpacing}>
          <Grid item lg={3} sm={6} xs={12}>
            <ReportCard primary={String(unit_stats.per_jenis.hp)} secondary="Gadai HP" color="#00796B" iconPrimary={SmartphoneIcon} />
          </Grid>
          <Grid item lg={3} sm={6} xs={12}>
            <ReportCard primary={String(unit_stats.per_jenis.perhiasan)} secondary="Perhiasan" color="#26A69A" iconPrimary={DiamondIcon} />
          </Grid>
          <Grid item lg={3} sm={6} xs={12}>
            <ReportCard primary={String(unit_stats.per_jenis.retro)} secondary="Gadai Retro" color="#4DB6AC" iconPrimary={AccountBalanceIcon} />
          </Grid>
          <Grid item lg={3} sm={6} xs={12}>
            <ReportCard primary={String(unit_stats.per_jenis.logam_mulia)} secondary="Logam Mulia" color="#80CBC4" iconPrimary={WorkspacePremiumIcon} />
          </Grid>
        </Grid>
      </Grid>

      {/* SECTION 4: LOWER DASHBOARD */}
      <Grid item xs={12}>
        <Grid container spacing={gridSpacing}>
          {/* LEFT: TOTAL & MONTHLY DETAIL */}
          <Grid item lg={4} md={6} xs={12}>
            <Stack spacing={gridSpacing}>
              <SalesLineCard title="Total Seluruh Gadai" footerData={[{ value: unit_stats.total_global, label: 'Total Unit' }]} />
              <Card sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary">Unit Masuk ({dayjs().format('MMMM')})</Typography>
                <Divider sx={{ my: 1.5 }} />
                {(() => {
                   // Cari data bulan ini dari array chart_detail
                   const currentMonthName = dayjs().format('MMMM');
                   const curr = unit_stats.chart_detail.find(c => c.bulan === currentMonthName) || unit_stats.chart_detail[dayjs().month()];
                   
                   return [
                     { label: 'HP', val: curr?.hp || 0 }, 
                     { label: 'Retro', val: curr?.retro || 0 },
                     { label: 'Perhiasan', val: curr?.perhiasan || 0 }, 
                     { label: 'LM', val: curr?.logam_mulia || 0 }
                   ].map((row) => (
                     <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                       <Typography variant="body2">{row.label}</Typography>
                       <Typography variant="subtitle2" fontWeight="bold">{row.val} Unit</Typography>
                     </Box>
                   ));
                })()}
              </Card>
            </Stack>
          </Grid>

<Grid item lg={4} md={6} xs={12}>
  <RevenuChartCard data={dashboardData.gadai_chart} tahun={selectedYear} />
</Grid>

          {/* RIGHT: FINANCE & AUCTION */}
          <Grid item lg={4} md={12} xs={12}>
            <Stack spacing={gridSpacing}>
              <Card sx={{ borderRadius: 2 }}>
                <CardHeader sx={{ bgcolor: '#004D40', color: 'white', py: 1.5 }} title={<Typography variant="subtitle1" color="white" fontWeight="bold">Ringkasan Nilai Gadai</Typography>} />
                <CardContent>
                  <Box sx={{ bgcolor: '#e3f2fd', p: 1.5, borderRadius: 1.5, mb: 1.5 }}>
                    <Typography variant="caption" fontWeight="bold" color="#1565c0">PINJAMAN BEREDAR</Typography>
                    <Box display="flex" justifyContent="space-between" mt={0.5}>
                      <Typography variant="h6">{gadai_summary.beredar.jumlah} <small>Nasabah</small></Typography>
                      <Typography variant="subtitle1" fontWeight="bold">{safeRupiah(gadai_summary.beredar.nominal)}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ bgcolor: '#fff3e0', p: 1.5, borderRadius: 1.5, mb: 1.5 }}>
                    <Typography variant="caption" fontWeight="bold" color="#e65100">BELUM LUNAS (SELESAI)</Typography>
                    <Box display="flex" justifyContent="space-between" mt={0.5}>
                      <Typography variant="h6">{gadai_summary.belum_lunas.jumlah} <small>Nasabah</small></Typography>
                      <Typography variant="subtitle1" fontWeight="bold">{safeRupiah(gadai_summary.belum_lunas.nominal)}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ bgcolor: '#e8f5e9', p: 1.5, borderRadius: 1.5 }}>
                    <Typography variant="caption" fontWeight="bold" color="#2e7d32">SUDAH LUNAS</Typography>
                    <Box display="flex" justifyContent="space-between" mt={0.5}>
                      <Typography variant="h6">{gadai_summary.lunas.jumlah} <small>Nasabah</small></Typography>
                      <Typography variant="subtitle1" fontWeight="bold">{safeRupiah(gadai_summary.lunas.nominal)}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 2 }}>
                <CardHeader sx={{ bgcolor: 'secondary.main', color: 'white', py: 1.5 }} title={<Typography variant="subtitle1" color="white" fontWeight="bold">Statistik Pelelangan</Typography>} />
                <CardContent>
                  <Box sx={{ mb: 1.5, p: 1, borderLeft: '4px solid #1565C0', bgcolor: '#fbfbfb' }}>
                    <Typography variant="caption" fontWeight="bold" color="#1565C0">SIAP LELANG</Typography>
                    <Box display="flex" justifyContent="space-between" mt={0.5}>
                      <Typography variant="h6">{pelelangan.summary.siap.jumlah} Unit</Typography>
                      <Typography variant="subtitle2" fontWeight="bold">{safeRupiah(pelelangan.summary.siap.nominal)}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mb: 0, p: 1, borderLeft: '4px solid #E65100', bgcolor: '#fbfbfb' }}>
                    <Typography variant="caption" fontWeight="bold" color="#E65100">BARANG TERLELANG</Typography>
                    <Box display="flex" justifyContent="space-between" mt={0.5}>
                      <Typography variant="h6">{pelelangan.summary.terlelang.jumlah} Unit</Typography>
                      <Typography variant="subtitle2" fontWeight="bold">{safeRupiah(pelelangan.summary.terlelang.nominal)}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Default;