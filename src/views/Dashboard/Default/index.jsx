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

// Komponen Card Brankas Lokal
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
  const theme = useTheme();
  const [loading, setLoading] = useState(true);

  // 1. States
 const [brankas, setBrankas] = useState({ 
  saldo_toko_saat_ini: 0, 
  saldo_rekening_saat_ini: 0, 
  total_modal_dari_pusat: 0,
  total_setoran_ke_admin: 0,
  total_setoran_pending: 0,
  info_bulan: '' 
});
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [chartBrankas, setChartBrankas] = useState({ pemasukan: [], pengeluaran: [], saldo: [] });
  const [dataCount, setDataCount] = useState({ hp: 0, perhiasan: 0, retro: 0, logam_mulia: 0, total_global: 0 });
  const [monthlyCount, setMonthlyCount] = useState({ hp: 0, perhiasan: 0, retro: 0, logam_mulia: 0, total: 0 });
  const [summary, setSummary] = useState({
    beredar: { jumlah: 0, nominal: 0 },
    belum_lunas: { jumlah: 0, nominal: 0 },
    lunas: { jumlah: 0, nominal: 0 }
  });
  const [lelangStats, setLelangStats] = useState({
    siap: { jumlah: 0, nominal: 0 },
    terlelang: { jumlah: 0, nominal: 0 },
    lunas: { jumlah: 0, nominal: 0 }
  });

  // Helper Rupiah
  const safeRupiah = (value) => {
    if (typeof value === 'string' && value.startsWith('Rp')) return value;
    const num = Number(value) || 0;
    return num.toLocaleString('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0
    });
  };

  // 2. Fetchers
  const fetchChartData = async () => {
    try {
      const res = await axiosInstance.get(`/dashboard/brankas-chart?tahun=${selectedYear}`);
      if (res.data.success) {
        setChartBrankas({
          pemasukan: res.data.data.pemasukan || [],
          pengeluaran: res.data.data.pengeluaran || [],
          saldo: res.data.data.saldo_kumulatif || []
        });
      }
    } catch (e) {
      console.error("Gagal load chart brankas:", e);
    }
  };

 const fetchMainDashboardData = async () => {
  setLoading(true);
  try {
    const [totalRes, summaryRes, lelangRes, brankasRes] = await Promise.all([
      axiosInstance.get('/total-semua'),
      axiosInstance.get('/summary'),
      axiosInstance.get('/dashboard/pelelangan-stats'),
      axiosInstance.get('/dashboard/brankas-stats') 
    ]);

      // Process Total Units
      if (totalRes?.data?.success) {
        const { total_unit_per_jenis, total_unit_global, data_bulanan } = totalRes.data;
        const currentMonthIndex = dayjs().month();
        const currentMonthData = data_bulanan[currentMonthIndex] || {};

        setDataCount({
          hp: total_unit_per_jenis.hp || 0,
          perhiasan: total_unit_per_jenis.perhiasan || 0,
          retro: total_unit_per_jenis.retro || 0,
          logam_mulia: total_unit_per_jenis.logam_mulia || 0,
          total_global: total_unit_global || 0
        });

        setMonthlyCount({
          hp: currentMonthData.hp || 0,
          perhiasan: currentMonthData.perhiasan || 0,
          retro: currentMonthData.retro || 0,
          logam_mulia: currentMonthData.logam_mulia || 0,
          total: currentMonthData.total_unit_bulan || 0
        });
      }

      // Process Summaries
      if (summaryRes?.data?.success) setSummary(summaryRes.data.data);

      // Process Lelang
      if (lelangRes?.data?.success) {
        const { total } = lelangRes.data;
        setLelangStats({
          siap: total.siap,
          terlelang: total.terlelang,
          lunas: total.lunas
        });
      }

      // Process Brankas Stats
      if (brankasRes?.data?.success) {
      const { summary, info } = brankasRes.data;
      setBrankas({
        saldo_toko_saat_ini: summary.saldo_toko_saat_ini,
        saldo_rekening_saat_ini: summary.saldo_rekening_saat_ini,
        total_modal_dari_pusat: summary.total_modal_dari_pusat,
        total_setoran_ke_admin: summary.total_setoran_ke_admin,
        total_setoran_pending: summary.total_setoran_pending,
        info_bulan: info.bulan 
      });
    }
  } catch (error) {
    console.error('Dashboard Fetch Error:', error);
  } finally {
    setLoading(false);
  }
};
  // 3. Effects
  useEffect(() => {
    fetchMainDashboardData();
  }, []);

  useEffect(() => {
    fetchChartData();
  }, [selectedYear]);

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
      <CircularProgress sx={{ color: '#004D40' }} />
    </Box>
  );

  return (
    <Grid container spacing={gridSpacing}>
      {/* SECTION 1: BRANKAS CARDS */}
    <Grid item xs={12}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700, color: '#004D40' }}>
        Kalkulasi Brankas & Rekening ({brankas.info_bulan})
      </Typography>
      
      <Grid container spacing={gridSpacing}>
        {/* 1. Saldo Fisik di Toko */}
        <Grid item lg={2.4} md={6} xs={12}>
          <WalletReportCard 
            primary={safeRupiah(brankas.saldo_toko_saat_ini)} 
            secondary="Saldo Fisik (Toko)" 
            color="#1e3c72" 
            icon={AccountBalanceWalletIcon} 
          />
        </Grid>

        {/* 2. Saldo di Rekening Bank (INI YANG BARU) */}
        <Grid item lg={2.4} md={6} xs={12}>
          <WalletReportCard 
            primary={safeRupiah(brankas.saldo_rekening_saat_ini)} 
            secondary="Saldo Rekening (Bank)" 
            color="#0e7490" 
            icon={AccountBalanceIcon} 
          />
        </Grid>

        {/* 3. Total Modal Masuk */}
        <Grid item lg={2.4} md={6} xs={12}>
          <WalletReportCard 
            primary={safeRupiah(brankas.total_modal_dari_pusat)} 
            secondary="Total Injeksi Modal" 
            color="#00796B" 
            icon={TrendingUpIcon} 
          />
        </Grid>

        {/* 4. Setoran Lunas (Verified) */}
        <Grid item lg={2.4} md={6} xs={12}>
          <WalletReportCard 
            primary={safeRupiah(brankas.total_setoran_ke_admin)} 
            secondary="Setoran Terverifikasi" 
            color="#2e7d32" 
            icon={CheckCircleIcon} 
          />
        </Grid>

        {/* 5. Setoran Pending (Selesai Proses tapi Belum Lunas di Pusat) */}
        <Grid item lg={2.4} md={6} xs={12}>
          <WalletReportCard 
            primary={safeRupiah(brankas.total_setoran_pending)} 
            secondary="Setoran Pending" 
            color="#ef6c00" 
            icon={TrendingDownIcon} 
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
              <Select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                size="small"
                sx={{ minWidth: 100 }}
              >
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
                { name: 'Pemasukan', type: 'column', data: chartBrankas.pemasukan },
                { name: 'Pengeluaran', type: 'column', data: chartBrankas.pengeluaran },
                { name: 'Saldo Kumulatif', type: 'line', data: chartBrankas.saldo }
              ]}
              options={{
                chart: { id: 'brankas-yearly-chart', toolbar: { show: false } },
                colors: ['#00796B', '#D32F2F', '#1976D2'],
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
                stroke: { width: [0, 0, 3], curve: 'smooth' },
                plotOptions: { bar: { columnWidth: '50%', borderRadius: 4 } },
                yaxis: [
                  { title: { text: 'Mutasi (Rp)' } },
                  { opposite: true, title: { text: 'Kumulatif (Rp)' } }
                ],
                tooltip: { y: { formatter: (v) => safeRupiah(v) } }
              }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

      {/* SECTION 3: UNIT CARDS */}
      <Grid item xs={12}>
        <Grid container spacing={gridSpacing}>
          {[
            { key: 'hp', label: 'Gadai HP', color: '#00796B', icon: SmartphoneIcon },
            { key: 'perhiasan', label: 'Perhiasan', color: '#26A69A', icon: DiamondIcon },
            { key: 'retro', label: 'Gadai Retro', color: '#4DB6AC', icon: AccountBalanceIcon },
            { key: 'logam_mulia', label: 'Logam Mulia', color: '#80CBC4', icon: WorkspacePremiumIcon }
          ].map((item) => (
            <Grid item lg={3} sm={6} xs={12} key={item.key}>
              <ReportCard primary={String(dataCount[item.key])} secondary={item.label} color={item.color} iconPrimary={item.icon} />
            </Grid>
          ))}
        </Grid>
      </Grid>

      {/* SECTION 4: LOWER DASHBOARD CONTENT */}
      <Grid item xs={12}>
        <Grid container spacing={gridSpacing}>
          {/* LEFT: ACTIVITY */}
          <Grid item lg={4} md={6} xs={12}>
            <Stack spacing={gridSpacing}>
              <SalesLineCard title="Total Seluruh Gadai" footerData={[{ value: dataCount.total_global, label: 'Total Unit' }]} />
              <Card sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary">Unit Masuk ({dayjs().format('MMMM')})</Typography>
                <Divider sx={{ my: 1.5 }} />
                {[
                  { label: 'HP', val: monthlyCount.hp }, { label: 'Retro', val: monthlyCount.retro },
                  { label: 'Perhiasan', val: monthlyCount.perhiasan }, { label: 'LM', val: monthlyCount.logam_mulia }
                ].map((row) => (
                  <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{row.label}</Typography>
                    <Typography variant="subtitle2" fontWeight="bold">{row.val} Unit</Typography>
                  </Box>
                ))}
                <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed #ccc', display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2" fontWeight="bold">Total</Typography>
                  <Typography variant="subtitle2" fontWeight="bold" color="secondary">{monthlyCount.total}</Typography>
                </Box>
              </Card>
            </Stack>
          </Grid>

          {/* MIDDLE: MAIN REVENUE CHART */}
          <Grid item lg={4} md={6} xs={12}>
            <RevenuChartCard />
          </Grid>

          {/* RIGHT: FINANCE & LELANG */}
          <Grid item lg={4} md={12} xs={12}>
            <Stack spacing={gridSpacing}>
              {/* FINANCE SUMMARY */}
              <Card sx={{ borderRadius: 2 }}>
                <CardHeader 
                  sx={{ bgcolor: '#004D40', color: 'white', py: 1.5 }} 
                  title={<Typography variant="subtitle1" color="white" fontWeight="bold">Ringkasan Nilai Gadai</Typography>} 
                />
                <CardContent>
                  {[
                    { label: 'Total Pinjaman Beredar', count: summary.beredar.jumlah, money: summary.beredar.nominal, color: '#e3f2fd', textColor: '#1565c0' },
                    { label: 'Nasabah Belum Lunas', count: summary.belum_lunas.jumlah, money: summary.belum_lunas.nominal, color: '#fff3e0', textColor: '#e65100' },
                    { label: 'Nasabah Sudah Lunas', count: summary.lunas.jumlah, money: summary.lunas.nominal, color: '#e8f5e9', textColor: '#2e7d32' }
                  ].map((item) => (
                    <Box key={item.label} sx={{ bgcolor: item.color, p: 1.5, borderRadius: 1.5, mb: 1.5 }}>
                      <Typography variant="caption" fontWeight="bold" sx={{ color: item.textColor, textTransform: 'uppercase' }}>{item.label}</Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {item.count} <small style={{ fontSize: '11px', fontWeight: 400 }}>Nasabah</small>
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="bold">{safeRupiah(item.money)}</Typography>
                      </Box>
                    </Box>
                  ))}
                </CardContent>
              </Card>

              {/* LELANG SUMMARY */}
              <Card sx={{ borderRadius: 2 }}>
                <CardHeader 
                  sx={{ bgcolor: 'secondary.main', color: 'white', py: 1.5 }} 
                  title={<Typography variant="subtitle1" color="white" fontWeight="bold">Statistik Pelelangan</Typography>} 
                />
                <CardContent>
                  {[
                    { label: 'Siap Lelang', count: lelangStats.siap.jumlah, money: lelangStats.siap.nominal, c: '#1565C0' },
                    { label: 'Barang Terlelang', count: lelangStats.terlelang.jumlah, money: lelangStats.terlelang.nominal, c: '#E65100' },
                    { label: 'Pelunasan Lelang', count: lelangStats.lunas.jumlah, money: lelangStats.lunas.nominal, c: '#2E7D32' }
                  ].map((item) => (
                    <Box key={item.label} sx={{ mb: 1.5, p: 1, borderLeft: `4px solid ${item.c}`, bgcolor: '#fbfbfb' }}>
                      <Typography variant="caption" fontWeight="bold" sx={{ color: item.c }}>{item.label}</Typography>
                      <Box display="flex" justifyContent="space-between" mt={0.5}>
                        <Typography variant="h6">{item.count} Unit</Typography>
                        <Typography variant="subtitle2" fontWeight="bold">{safeRupiah(item.money)}</Typography>
                      </Box>
                    </Box>
                  ))}
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