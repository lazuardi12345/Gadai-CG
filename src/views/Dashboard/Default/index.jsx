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
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const Default = () => {
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [dataCount, setDataCount] = useState({ hp: 0, perhiasan: 0, logam_mulia: 0, retro: 0 });
  const [summary, setSummary] = useState({ totalPinjaman: 0, jumlahSelesai: 0, jumlahLunas: 0, totalLunas: 0 });
  const [monthlyCount, setMonthlyCount] = useState({ hp: 0, perhiasan: 0, logam_mulia: 0, retro: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ✅ Ambil semua endpoint langsung
        const [hpRes, perhiasanRes, logamRes, retroRes, detailRes] = await Promise.all([
          axiosInstance.get('/gadai-hp'),
          axiosInstance.get('/gadai-perhiasan'),
          axiosInstance.get('/gadai-logam-mulia'),
          axiosInstance.get('/gadai-retro'),
          axiosInstance.get('/detail-gadai')
        ]);

        // ✅ Hitung total semua gadai (dari pagination total)
        setDataCount({
          hp: hpRes?.data?.pagination?.total || 0,
          perhiasan: perhiasanRes?.data?.pagination?.total || 0,
          logam_mulia: logamRes?.data?.pagination?.total || 0,
          retro: retroRes?.data?.pagination?.total || 0
        });

        // ✅ Hitung bulanan dari created_at di masing-masing endpoint
        const currentMonth = dayjs().format('YYYY-MM');

        const hpMonth = (hpRes?.data?.data || []).filter(
          item => item.created_at && dayjs(item.created_at).format('YYYY-MM') === currentMonth
        ).length;

        const perhiasanMonth = (perhiasanRes?.data?.data || []).filter(
          item => item.created_at && dayjs(item.created_at).format('YYYY-MM') === currentMonth
        ).length;

        const logamMonth = (logamRes?.data?.data || []).filter(
          item => item.created_at && dayjs(item.created_at).format('YYYY-MM') === currentMonth
        ).length;

        const retroMonth = (retroRes?.data?.data || []).filter(
          item => item.created_at && dayjs(item.created_at).format('YYYY-MM') === currentMonth
        ).length;

        setMonthlyCount({
          hp: hpMonth,
          perhiasan: perhiasanMonth,
          logam_mulia: logamMonth,
          retro: retroMonth
        });

        // ✅ Data summary dari detail gadai
        if (detailRes?.data?.success && Array.isArray(detailRes.data.data)) {
          const allDetail = detailRes.data.data;
          const totalPinjaman = allDetail.reduce(
            (sum, item) => sum + (Number(item.uang_pinjaman) || 0),
            0
          );

          const dataSelesai = allDetail.filter((item) => (item.status || '').toLowerCase() === 'selesai');
          const dataLunas = allDetail.filter((item) => (item.status || '').toLowerCase() === 'lunas');

          setSummary({
            totalPinjaman,
            jumlahSelesai: dataSelesai.length,
            jumlahLunas: dataLunas.length,
            totalLunas: dataLunas.reduce((sum, item) => sum + (Number(item.uang_pinjaman) || 0), 0)
          });
        }
      } catch (error) {
        console.error('❌ Error fetching data:', error);
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

  const totalSemua = dataCount.hp + dataCount.perhiasan + dataCount.logam_mulia + dataCount.retro;

  return (
    <Grid container spacing={gridSpacing}>
      {/* Summary Cards */}
      <Grid item xs={12}>
        <Grid container spacing={gridSpacing}>
          <Grid item lg={3} sm={6} xs={12}>
            <ReportCard primary={dataCount.hp.toString()} secondary="Total Gadai HP" color="#0b06fa" iconPrimary={SmartphoneIcon} />
          </Grid>
          <Grid item lg={3} sm={6} xs={12}>
            <ReportCard primary={dataCount.perhiasan.toString()} secondary="Total Gadai Perhiasan" color="#095dcc" iconPrimary={DiamondIcon} />
          </Grid>
          <Grid item lg={3} sm={6} xs={12}>
            <ReportCard primary={dataCount.logam_mulia.toString()} secondary="Total Gadai Logam Mulia" color="#FFC107" iconPrimary={WorkspacePremiumIcon} />
          </Grid>
          <Grid item lg={3} sm={6} xs={12}>
            <ReportCard primary={dataCount.retro.toString()} secondary="Total Gadai Retro" color="#2E7D32" iconPrimary={AccountBalanceIcon} />
          </Grid>
        </Grid>
      </Grid>

      {/* Charts + Monthly Summary */}
      <Grid item xs={12}>
        <Grid container spacing={gridSpacing} justifyContent="center">
          {/* Left Section */}
          <Grid item lg={4} xs={12}>
            <SalesLineCard
              title="Aktivitas Gadai Harian"
              percentage="3%"
              icon={<TrendingDownIcon />}
              footerData={[{ value: `${totalSemua}`, label: 'Total Semua Gadai' }]}
            />

            <Box sx={{ mt: 2 }}>
              <SalesLineCard title="HP Bulan Ini" footerData={[{ value: `${monthlyCount.hp}`, label: 'Total HP' }]} />
              <SalesLineCard title="Logam Mulia Bulan Ini" footerData={[{ value: `${monthlyCount.logam_mulia}`, label: 'Total Logam Mulia' }]} />
              <SalesLineCard title="Perhiasan Bulan Ini" footerData={[{ value: `${monthlyCount.perhiasan}`, label: 'Total Perhiasan' }]} />
              <SalesLineCard title="Retro Bulan Ini" footerData={[{ value: `${monthlyCount.retro}`, label: 'Total Retro' }]} />
            </Box>
          </Grid>

          {/* Middle Section - Chart */}
          <Grid item lg={4} xs={12}>
            <RevenuChartCard />
          </Grid>

          {/* Right Section - Summary */}
          <Grid item lg={4} xs={12}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.08)', background: '#fff' }}>
              <CardHeader title={<Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>📊 Ringkasan Data Gadai</Typography>} />
              <Divider />
              <CardContent sx={{ pt: 2, pb: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                  {[
                    { label: '💰 Total Uang Pinjaman Semua Nasabah', value: `Rp ${summary.totalPinjaman.toLocaleString('id-ID')}` },
                    { label: '🕓 Jumlah Nasabah Selesai (Belum Lunas)', value: `${summary.jumlahSelesai} Orang` },
                    { label: '✅ Jumlah Nasabah Lunas', value: `${summary.jumlahLunas} Orang` },
                    { label: '💵 Total Uang Pinjaman Lunas', value: `Rp ${summary.totalLunas.toLocaleString('id-ID')}` }
                  ].map(item => (
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
