import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  Grid, Box, CircularProgress, Typography, Card, CardContent, Avatar, Stack
} from '@mui/material';
import Chart from 'react-apexcharts';
import axiosInstance from 'api/axiosInstance';
import { AuthContext } from "AuthContex/AuthContext"; 
import { gridSpacing } from 'config.js';

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'; 
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

const LocalReportCard = ({ primary, secondary, color, iconPrimary: Icon }) => (
  <Card sx={{ 
    bgcolor: color, 
    color: '#fff',
    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)',
    borderRadius: '12px',
    overflow: 'hidden',
    height: '100%'
  }}>
    <CardContent>
      <Grid container justifyContent="space-between" alignItems="center">
        <Grid item xs={8}>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
            {primary}
          </Typography>
          <Typography variant="subtitle2" sx={{ color: '#fff', opacity: 0.8, fontWeight: 500 }}>
            {secondary}
          </Typography>
        </Grid>
        <Grid item>
          <Avatar variant="rounded" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', width: 40, height: 40 }}>
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
    saldo_toko: 0,
    saldo_rekening: 0,
    total_masuk: 0,
    total_keluar: 0,
    total_pending: 0,
    info: { bulan: '', tahun: '' }
  });

  const [chartData, setChartData] = useState({
    pemasukan: [],
    pengeluaran: [],
    labels: []
  });

  const colors = {
    fisik: '#1e40af',      
    rekening: '#0e7490',  
    modal: '#065f46',      
    diterima: '#16a34a',   
    pending: '#ea580c',   
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value || 0);
  };


  const fetchData = useCallback(async () => {
    if (!userRole) return;
    setLoading(true);

    // 2. Logic role-based path
    const base = userRole === "admin" 
        ? "/admin" 
        : userRole === "checker" 
            ? "/checker" 
            : "/kasir";

    try {
      const [resStats, resChart] = await Promise.all([
        axiosInstance.get(`${base}/brankas`), 
        axiosInstance.get(`${base}/dashboard/brankas-chart`)
      ]);

      if (resStats.data.success) {
        const data = resStats.data.summary;
        setBrankasSummary({
          saldo_toko: data?.saldo_toko_saat_ini || 0,
          saldo_rekening: data?.saldo_rekening_saat_ini || 0,
          total_masuk: data?.total_modal_dari_pusat || 0, 
          total_keluar: data?.total_setoran_ke_admin || 0,
          total_pending: data?.total_setoran_pending || 0,
          info: resStats.data.info || { 
            bulan: new Date().toLocaleString('id-ID', { month: 'long' }), 
            tahun: new Date().getFullYear() 
          }
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
  }, [userRole]); // Penutup useCallback yang benar

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartOptions = {
    chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'Inter, sans-serif' },
    colors: [colors.diterima, '#dc2626'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    xaxis: { categories: chartData.labels || [] },
    yaxis: { labels: { formatter: (val) => `Rp ${(val / 1000000).toFixed(1)}jt` } },
    tooltip: { y: { formatter: (val) => formatRupiah(val) } },
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" height="300px">
      <CircularProgress sx={{ color: colors.fisik }} />
    </Box>
  );

  return (
    <Grid container spacing={gridSpacing}>
      <Grid item xs={12}>
        <Box sx={{ mb: 1 }}>
            <Typography variant="h3" sx={{ color: colors.fisik, fontWeight: 900 }}>
                Analitik Brankas Toko
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
                Periode berjalan: <b>{brankasSummary?.info?.bulan} {brankasSummary?.info?.tahun}</b>
            </Typography>
        </Box>
      </Grid>

      {/* BARIS KOTAK SUMMARY */}
      <Grid item lg={2.4} md={6} xs={12}>
        <LocalReportCard 
          primary={formatRupiah(brankasSummary.saldo_toko)} 
          secondary="SALDO DI TOKO (FISIK)" 
          color={colors.fisik} 
          iconPrimary={AccountBalanceWalletIcon} 
        />
      </Grid>

      <Grid item lg={2.4} md={6} xs={12}>
        <LocalReportCard 
          primary={formatRupiah(brankasSummary.saldo_rekening)} 
          secondary="SALDO REKENING" 
          color={colors.rekening} 
          iconPrimary={AccountBalanceIcon} 
        />
      </Grid>

      <Grid item lg={2.4} md={6} xs={12}>
        <LocalReportCard 
          primary={formatRupiah(brankasSummary.total_masuk)} 
          secondary="TOTAL INJEKSI MODAL" 
          color={colors.modal} 
          iconPrimary={AccountBalanceIcon} 
        />
      </Grid>

      <Grid item lg={2.4} md={6} xs={12}>
        <LocalReportCard 
          primary={formatRupiah(brankasSummary.total_keluar)} 
          secondary="SETORAN DITERIMA" 
          color={colors.diterima} 
          iconPrimary={TrendingUpIcon} 
        />
      </Grid>

      <Grid item lg={2.4} md={6} xs={12}>
        <LocalReportCard 
          primary={formatRupiah(brankasSummary.total_pending)} 
          secondary="SETORAN BELUM DIVALIDASI" 
          color={colors.pending} 
          iconPrimary={HourglassEmptyIcon} 
        />
      </Grid>

      {/* GRAFIK */}
      <Grid item xs={12}>
        <Card sx={{ borderRadius: '16px', border: '1px solid #eee' }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight="800">Tren Arus Kas Tahunan</Typography>
                    <Typography variant="caption" color="textSecondary">Perbandingan akumulasi masuk & keluar per bulan</Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#f0f4ff', color: colors.fisik }}>
                    <TrendingUpIcon />
                </Avatar>
            </Stack>
            <Box sx={{ width: '100%', pt: 2 }}>
                <Chart options={chartOptions} series={[
                  { name: 'Pemasukan', data: chartData.pemasukan || [] },
                  { name: 'Pengeluaran', data: chartData.pengeluaran || [] }
                ]} type="area" height={350} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default BrankasDashboard;