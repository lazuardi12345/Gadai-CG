import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  Grid, Box, CircularProgress, Typography, Card, CardContent, Avatar, Stack
} from '@mui/material';
import Chart from 'react-apexcharts'; // Pastikan sudah install ini
import axiosInstance from 'api/axiosInstance';
import { AuthContext } from "AuthContex/AuthContext"; 
import { gridSpacing } from 'config.js';

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

// Komponen Card Kecil untuk Summary
const LocalReportCard = ({ primary, secondary, color, iconPrimary: Icon }) => (
  <Card sx={{ 
    bgcolor: color, 
    color: '#fff',
    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)',
    borderRadius: '12px',
    overflow: 'hidden'
  }}>
    <CardContent>
      <Grid container justifyContent="space-between" alignItems="center">
        <Grid item>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800 }}>{primary}</Typography>
          <Typography variant="subtitle2" sx={{ color: '#fff', opacity: 0.8, fontWeight: 500 }}>{secondary}</Typography>
        </Grid>
        <Grid item>
          <Avatar variant="rounded" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', width: 48, height: 48 }}>
            <Icon fontSize="medium" />
          </Avatar>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

const BrankasDashboard = () => {
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();

  const [loading, setLoading] = useState(true);
  const [brankasSummary, setBrankasSummary] = useState({
    saldo_akhir: 0,
    total_masuk: 0,
    total_keluar: 0,
    info: { bulan: '', tahun: '' }
  });

  const [chartData, setChartData] = useState({
    pemasukan: [],
    pengeluaran: [],
    labels: []
  });

  const greenScheme = {
    dark: '#0c786aff',   
    medium: '#2e7d32',   
    light: '#c62828'     
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Fetch semua data (Stats & Chart)
  const fetchData = useCallback(async () => {
    if (!userRole) return;
    setLoading(true);
    const base = userRole === "admin" ? "/admin" : "/checker";
    
    try {
      const [resStats, resChart] = await Promise.all([
        axiosInstance.get(`${base}/dashboard/brankas-stats`),
        axiosInstance.get(`${base}/dashboard/brankas-chart`)
      ]);

      if (resStats.data.success) {
        const data = resStats.data.summary;
        setBrankasSummary({
          saldo_akhir: data.saldo_akhir_saat_ini || 0,
          total_masuk: data.total_pemasukan_bulan_ini || 0,
          total_keluar: data.total_pengeluaran_bulan_ini || 0,
          info: resStats.data.info
        });
      }

      if (resChart.data.success) {
        setChartData(resChart.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Konfigurasi ApexCharts
  const chartOptions = {
    chart: { 
      type: 'area', 
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'Inter, sans-serif'
    },
    colors: [greenScheme.medium, greenScheme.light],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 }
    },
    xaxis: {
      categories: chartData.labels,
      axisBorder: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (val) => `Rp ${(val / 1000000).toFixed(1)}jt`
      }
    },
    tooltip: {
      y: { formatter: (val) => formatRupiah(val) }
    },
    legend: { position: 'top', horizontalAlign: 'right' },
    grid: { borderColor: '#f1f1f1', strokeDashArray: 3 }
  };

  const chartSeries = [
    { name: 'Pemasukan', data: chartData.pemasukan },
    { name: 'Pengeluaran', data: chartData.pengeluaran }
  ];

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" height="300px">
      <CircularProgress sx={{ color: greenScheme.dark }} />
    </Box>
  );

  return (
    <Grid container spacing={gridSpacing}>
      {/* HEADER JUDUL */}
      <Grid item xs={12}>
        <Box sx={{ mb: 1 }}>
            <Typography variant="h3" sx={{ color: greenScheme.dark, fontWeight: 900 }}>
                Analitik Brankas Toko
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
                Periode berjalan: <b>{brankasSummary.info.bulan} {brankasSummary.info.tahun}</b>
            </Typography>
        </Box>
      </Grid>

      {/* SUMMARY CARDS */}
      <Grid item lg={4} md={6} xs={12}>
        <LocalReportCard 
          primary={formatRupiah(brankasSummary.saldo_akhir)} 
          secondary="Total Saldo Fisik" 
          color={greenScheme.dark} 
          iconPrimary={AccountBalanceWalletIcon} 
        />
      </Grid>

      <Grid item lg={4} md={6} xs={12}>
        <LocalReportCard 
          primary={formatRupiah(brankasSummary.total_masuk)} 
          secondary="Pemasukan Bulan Ini" 
          color={greenScheme.medium} 
          iconPrimary={TrendingUpIcon} 
        />
      </Grid>

      <Grid item lg={4} md={6} xs={12}>
        <LocalReportCard 
          primary={formatRupiah(brankasSummary.total_keluar)} 
          secondary="Pengeluaran Bulan Ini" 
          color={greenScheme.light} 
          iconPrimary={TrendingDownIcon} 
        />
      </Grid>

      {/* GRAFIK TAHUNAN */}
      <Grid item xs={12}>
        <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight="800">Tren Arus Kas Tahunan</Typography>
                    <Typography variant="caption" color="textSecondary">Perbandingan akumulasi masuk & keluar per bulan</Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#f0f4ff', color: greenScheme.dark }}>
                    <TrendingUpIcon />
                </Avatar>
            </Stack>
            <Box sx={{ width: '100%', pt: 2 }}>
                <Chart options={chartOptions} series={chartSeries} type="area" height={350} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default BrankasDashboard;