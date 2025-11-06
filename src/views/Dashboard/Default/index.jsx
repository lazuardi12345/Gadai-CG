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

// components
import SalesLineCard from 'views/Dashboard/card/SalesLineCard';
import RevenuChartCard from 'views/Dashboard/card/RevenuChartCard';
import ReportCard from './ReportCard';
import { gridSpacing } from 'config.js';

// icons
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [totalRes, summaryRes] = await Promise.all([
          axiosInstance.get('/total-semua'),
          axiosInstance.get('/summary')
        ]);

        if (totalRes?.data?.success) {
          const totalData = totalRes.data;
          const jenis = totalData.total_unit_per_jenis || {};
          const bulanIni = dayjs().month(); // 0 = Jan, 10 = Nov, dst

          const dataBulanIni = (totalData.data_bulanan || [])[bulanIni] || {};

          setDataCount({
            hp: jenis.hp || 0,
            perhiasan: jenis.perhiasan || 0,
            retro: jenis.retro || 0,
            logam_mulia: jenis.logam_mulia || 0,
            total_global: totalData.total_unit_global || 0
          });

          setMonthlyCount({
            hp: dataBulanIni.hp || 0,
            perhiasan: dataBulanIni.perhiasan || 0,
            retro: dataBulanIni.retro || 0,
            logam_mulia: dataBulanIni.logam_mulia || 0,
            total: dataBulanIni.total_unit_bulan || 0
          });
        }

        if (summaryRes?.data?.success && summaryRes.data.data) {
          setSummary(summaryRes.data.data);
        }
      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading)
    return (
      <Grid container justifyContent="center" alignItems="center" style={{ height: '60vh' }}>
        <CircularProgress />
      </Grid>
    );

  const safeRupiah = (value) => {
    if (typeof value === 'string' && value.startsWith('Rp')) return value;
    if (typeof value === 'number')
      return value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
    return 'Rp 0';
  };

  return (
    <Grid container spacing={gridSpacing}>
      {/* 🔹 Summary Cards */}
      <Grid item xs={12}>
        <Grid container spacing={gridSpacing}>
          <Grid item lg={3} sm={6} xs={12}>
            <ReportCard
              primary={dataCount.hp.toString()}
              secondary="Total Gadai HP"
              color="#0b06fa"
              iconPrimary={SmartphoneIcon}
            />
          </Grid>
          <Grid item lg={3} sm={6} xs={12}>
            <ReportCard
              primary={dataCount.perhiasan.toString()}
              secondary="Total Gadai Perhiasan"
              color="#095dcc"
              iconPrimary={DiamondIcon}
            />
          </Grid>
          <Grid item lg={3} sm={6} xs={12}>
            <ReportCard
              primary={dataCount.retro.toString()}
              secondary="Total Gadai Retro"
              color="#2E7D32"
              iconPrimary={AccountBalanceIcon}
            />
          </Grid>
          <Grid item lg={3} sm={6} xs={12}>
            <ReportCard
              primary={dataCount.logam_mulia.toString()}
              secondary="Total Gadai Logam Mulia"
              color="#FFC107"
              iconPrimary={WorkspacePremiumIcon}
            />
          </Grid>
        </Grid>
      </Grid>

      {/* 🔹 Charts + Ringkasan */}
      <Grid item xs={12}>
        <Grid container spacing={gridSpacing} justifyContent="center">
          {/* Kiri: Ringkasan Bulan Ini */}
          <Grid item lg={4} xs={12}>
            <SalesLineCard
              title="Total Seluruh Gadai"
              footerData={[{ value: `${dataCount.total_global}`, label: 'Total Semua Gadai' }]}
            />

            <Box sx={{ mt: 2 }}>
              <SalesLineCard title="HP Bulan Ini" footerData={[{ value: `${monthlyCount.hp}`, label: 'Total HP' }]} />
              <SalesLineCard title="Retro Bulan Ini" footerData={[{ value: `${monthlyCount.retro}`, label: 'Total Retro' }]} />
              <SalesLineCard
                title="Perhiasan Bulan Ini"
                footerData={[{ value: `${monthlyCount.perhiasan}`, label: 'Total Perhiasan' }]}
              />
              <SalesLineCard
                title="Logam Mulia Bulan Ini"
                footerData={[{ value: `${monthlyCount.logam_mulia}`, label: 'Total Logam Mulia' }]}
              />
            </Box>
          </Grid>

          {/* Tengah: Chart Pendapatan */}
          <Grid item lg={4} xs={12}>
            <RevenuChartCard />
          </Grid>

          {/* Kanan: Summary dari BE */}
          <Grid item lg={4} xs={12}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.08)', background: '#fff' }}>
              <CardHeader
                title={
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    📊 Ringkasan Data Gadai
                  </Typography>
                }
              />
              <Divider />
              <CardContent sx={{ pt: 2, pb: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                  {[
                    { label: '💰 Total Uang Pinjaman Semua Nasabah', value: safeRupiah(summary?.totalPinjaman) },
                    { label: '🕓 Jumlah Nasabah Selesai (Belum Lunas)', value: `${summary?.jumlahSelesai ?? 0} Orang` },
                    { label: '✅ Jumlah Nasabah Lunas', value: `${summary?.jumlahLunas ?? 0} Orang` },
                    { label: '💵 Total Uang Pinjaman Lunas', value: safeRupiah(summary?.totalLunas) }
                  ].map((item) => (
                    <Box
                      key={item.label}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1.2,
                        borderRadius: 1,
                        bgcolor: 'rgba(200,230,255,0.9)'
                      }}
                    >
                      <Typography variant="body2">{item.label}</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Default;
