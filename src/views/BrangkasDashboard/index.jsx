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
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

const LocalReportCard = ({ primary, secondary, color, iconPrimary: Icon }) => (
  <Card sx={{ 
    bgcolor: color, 
    color: '#fff',
    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)',
    borderRadius: '12px',
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
          <Avatar variant="rounded" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
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
  const [data, setData] = useState({
    summary: {},
    chart: { pemasukan: [], pengeluaran: [], labels: [] },
    info: { bulan_aktif: '', tahun_aktif: '' }
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

    // Penyesuaian Path sesuai Route baru kamu
    const basePath = userRole === "admin" ? "/admin" : (userRole === "checker" ? "/checker" : "/kasir");
    
    try {
      // Cukup satu request sekarang, lebih kenceng!
      const response = await axiosInstance.get(`${basePath}/brankasDashboard`);
      
      if (response.data.success) {
        setData({
          summary: response.data.summary,
          chart: response.data.chart,
          info: response.data.info
        });
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

  const chartOptions = {
    chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'Inter, sans-serif' },
    colors: [colors.diterima, '#dc2626', colors.fisik], // Ditambah warna untuk saldo kumulatif
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    xaxis: { categories: data.chart.labels || [] },
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
                Periode: <b>{data.info.bulan_aktif} {data.info.tahun_aktif}</b>
            </Typography>
        </Box>
      </Grid>

      {/* SUMMARY CARDS */}
      <Grid item lg={2.4} md={6} xs={12}>
        <LocalReportCard 
          primary={formatRupiah(data.summary.saldo_toko_saat_ini)} 
          secondary="SALDO TOKO (FISIK)" 
          color={colors.fisik} 
          iconPrimary={AccountBalanceWalletIcon} 
        />
      </Grid>

      <Grid item lg={2.4} md={6} xs={12}>
        <LocalReportCard 
          primary={formatRupiah(data.summary.saldo_rekening_saat_ini)} 
          secondary="SALDO REKENING" 
          color={colors.rekening} 
          iconPrimary={AccountBalanceIcon} 
        />
      </Grid>

      <Grid item lg={2.4} md={6} xs={12}>
        <LocalReportCard 
          primary={formatRupiah(data.summary.total_modal_dari_pusat)} 
          secondary="INJEKSI MODAL" 
          color={colors.modal} 
          iconPrimary={AccountBalanceIcon} 
        />
      </Grid>

      <Grid item lg={2.4} md={6} xs={12}>
        <LocalReportCard 
          primary={formatRupiah(data.summary.total_setoran_ke_admin)} 
          secondary="SETORAN LUNAS" 
          color={colors.diterima} 
          iconPrimary={TrendingUpIcon} 
        />
      </Grid>

      <Grid item lg={2.4} md={6} xs={12}>
        <LocalReportCard 
          primary={formatRupiah(data.summary.total_setoran_pending)} 
          secondary="SETORAN PENDING" 
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
                    <Typography variant="caption" color="textSecondary">Perbandingan pemasukan, pengeluaran, dan saldo kumulatif</Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#f0f4ff', color: colors.fisik }}>
                    <TrendingUpIcon />
                </Avatar>
            </Stack>
            <Box sx={{ width: '100%', pt: 2 }}>
                <Chart 
                  options={chartOptions} 
                  series={[
                    { name: 'Pemasukan', data: data.chart.pemasukan || [] },
                    { name: 'Pengeluaran', data: data.chart.pengeluaran || [] },
                    { name: 'Saldo Kumulatif', data: data.chart.saldo_kumulatif || [] }
                  ]} 
                  type="area" 
                  height={350} 
                />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default BrankasDashboard;