import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Grid,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Divider,
  CircularProgress,
  Box
} from '@mui/material';
import axiosInstance from 'api/axiosInstance';
import dayjs from 'dayjs';

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

const Default = () => {
  const theme = useTheme();

  const [loading, setLoading] = useState(true);

  const [dataCount, setDataCount] = useState({
    hp: 0,
    perhiasan: 0,
    retro: 0,
    logam_mulia: 0,
    total_global: 0
  });

  const [monthlyCount, setMonthlyCount] = useState({
    hp: 0,
    perhiasan: 0,
    retro: 0,
    logam_mulia: 0,
    total: 0
  });

  const [summary, setSummary] = useState({
    totalPinjaman: 'Rp 0',
    jumlahSelesai: 0,
    jumlahLunas: 0,
    totalLunas: 'Rp 0'
  });

  const [lelangStats, setLelangStats] = useState({
    total_barang: 0,
    terjual: 0
  });

  // === Utility format Rupiah ===
  const safeRupiah = (value) => {
    if (typeof value === 'string' && value.startsWith('Rp')) return value;
    if (typeof value === 'number')
      return value.toLocaleString('id-ID', {
        style: 'currency',
        currency: 'IDR'
      });
    return 'Rp 0';
  };

  // === Fetch Data Dashboard ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [totalRes, summaryRes, lelangRes] = await Promise.all([
          axiosInstance.get('/total-semua'),
          axiosInstance.get('/summary'),
          axiosInstance.get('/dashboard/pelelangan-stats')
        ]);

        // Total semua gadai
        if (totalRes?.data?.success) {
          const totalData = totalRes.data;
          const jenis = totalData.total_unit_per_jenis || {};
          const thisMonthIndex = dayjs().month();
          const bulanIni = totalData.data_bulanan?.[thisMonthIndex] || {};

          setDataCount({
            hp: jenis.hp || 0,
            perhiasan: jenis.perhiasan || 0,
            retro: jenis.retro || 0,
            logam_mulia: jenis.logam_mulia || 0,
            total_global: totalData.total_unit_global || 0
          });

          setMonthlyCount({
            hp: bulanIni.hp || 0,
            perhiasan: bulanIni.perhiasan || 0,
            retro: bulanIni.retro || 0,
            logam_mulia: bulanIni.logam_mulia || 0,
            total: bulanIni.total_unit_bulan || 0
          });
        }

        // Summary
        if (summaryRes?.data?.success && summaryRes.data.data) {
          setSummary(summaryRes.data.data);
        }

        // Lelang
        // Lelang
        if (lelangRes?.data?.success) {
          const { total_barang, total_terjual, total_sisa, data_bulanan } = lelangRes.data;

          setLelangStats({
            total_barang: total_barang || 0,
            total_terjual: total_terjual || 0,
            total_sisa: total_sisa || 0,
            data_bulanan: data_bulanan || []
          });
        }



      } catch (error) {
        console.error('Error dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // === Loading State ===
  if (loading)
    return (
      <Grid container justifyContent="center" alignItems="center" style={{ height: '60vh' }}>
        <CircularProgress />
      </Grid>
    );

  return (
    <Grid container spacing={gridSpacing}>

      {/* TOP SUMMARY */}
      <Grid item xs={12}>
        <Grid container spacing={gridSpacing}>
          {[
            {
              key: 'hp',
              label: 'Total Gadai HP',
              color: '#0b06fa',
              icon: SmartphoneIcon
            },
            {
              key: 'perhiasan',
              label: 'Total Gadai Perhiasan',
              color: '#095dcc',
              icon: DiamondIcon
            },
            {
              key: 'retro',
              label: 'Total Gadai Retro',
              color: '#2E7D32',
              icon: AccountBalanceIcon
            },
            {
              key: 'logam_mulia',
              label: 'Total Gadai Logam Mulia',
              color: '#FFC107',
              icon: WorkspacePremiumIcon
            }
          ].map((item) => (
            <Grid item lg={3} sm={6} xs={12} key={item.key}>
              <ReportCard
                primary={String(dataCount[item.key])}
                secondary={item.label}
                color={item.color}
                iconPrimary={item.icon}
              />
            </Grid>
          ))}
        </Grid>
      </Grid>

      {/* MAIN GRID */}
      <Grid item xs={12}>
        <Grid container spacing={gridSpacing} justifyContent="center">

          {/* LEFT – BULAN INI */}
          <Grid item lg={4} xs={12}>
            <SalesLineCard
              title="Total Seluruh Gadai"
              footerData={[{ value: dataCount.total_global, label: 'Total Semua Gadai' }]}
            />

            <Box sx={{ mt: 2 }}>
              {[
                { title: 'HP Bulan Ini', key: 'hp' },
                { title: 'Retro Bulan Ini', key: 'retro' },
                { title: 'Perhiasan Bulan Ini', key: 'perhiasan' },
                { title: 'Logam Mulia Bulan Ini', key: 'logam_mulia' }
              ].map((item) => (
                <SalesLineCard
                  key={item.key}
                  title={item.title}
                  footerData={[{ value: monthlyCount[item.key], label: item.title }]}
                />
              ))}
            </Box>
          </Grid>

          {/* MIDDLE – CHART */}
          <Grid item lg={4} xs={12}>
            <RevenuChartCard />
          </Grid>

          {/* RIGHT – SUMMARY */}
          <Grid item lg={4} xs={12}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
              <CardHeader
                title={<Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>Ringkasan Data Gadai</Typography>}
              />
              <Divider />
              <CardContent sx={{ pt: 2, pb: 3 }}>
                {[
                  { label: 'Total Uang Pinjaman Semua Nasabah', value: safeRupiah(summary.totalPinjaman) },
                  { label: 'Jumlah Nasabah Selesai (Belum Lunas)', value: `${summary.jumlahSelesai} Orang` },
                  { label: 'Jumlah Nasabah Lunas', value: `${summary.jumlahLunas} Orang` },
                  { label: 'Total Uang Pinjaman Lunas', value: safeRupiah(summary.totalLunas) }
                ].map((item) => (
                  <Box
                    key={item.label}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      p: 1.2,
                      borderRadius: 1,
                      bgcolor: 'rgba(200,230,255,0.9)',
                      mb: 1
                    }}
                  >
                    <Typography variant="body2">{item.label}</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{item.value}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* LELANG */}
          <Grid item lg={4} xs={12}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
              <CardHeader
                title={<Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>Statistik Pelelangan</Typography>}
              />
              <Divider />
              <CardContent sx={{ pt: 2, pb: 3 }}>
                {[
                  { label: 'Total Barang Masuk Lelang', value: lelangStats.total_barang, bg: 'rgba(255,230,200,0.9)' },
                  { label: 'Barang Terjual', value: lelangStats.total_terjual, bg: 'rgba(200,255,200,0.9)' },
                  { label: 'Barang Tersisa', value: lelangStats.total_sisa, bg: 'rgba(255,200,200,0.9)' }
                ].map((item) => (
                  <Box
                    key={item.label}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      p: 1.2,
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: item.bg
                    }}
                  >
                    <Typography variant="body2">{item.label}</Typography>
                    <Typography sx={{ fontWeight: 'bold' }}>{item.value}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

        </Grid>
      </Grid>
    </Grid>
  );
};

export default Default;
