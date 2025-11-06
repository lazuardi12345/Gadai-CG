import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Divider,
  CircularProgress,
  Typography,
  Box
} from '@mui/material';
import Chart from 'react-apexcharts';
import axiosInstance from 'api/axiosInstance';

const RevenueChartCard = () => {
  // Ambil role user login
  const user = JSON.parse(localStorage.getItem('auth_user'));
  const userRole = user?.role?.toLowerCase() || '';

  // Render hanya untuk HM dan Checker
  if (!['hm', 'checker'].includes(userRole)) return null;

  const [loading, setLoading] = useState(true);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [bulanList, setBulanList] = useState([]);
  const [pendapatanData, setPendapatanData] = useState([]);
  const [nasabahData, setNasabahData] = useState([]);

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const [pendapatanRes, nasabahRes] = await Promise.all([
          axiosInstance.get('/pendapatan-bulanan'),
          axiosInstance.get('/nasabah-bulanan')
        ]);

        setTahun(pendapatanRes?.data?.tahun || new Date().getFullYear());

        const pendapatan = pendapatanRes?.data?.data || [];
        const nasabah = nasabahRes?.data?.data || [];

        setBulanList(pendapatan.map(item => item.bulan || '-'));
        setPendapatanData(pendapatan.map(item => Number(item.total_pinjaman) || 0));
        setNasabahData(nasabah.map(item => Number(item.total_nasabah) || 0));
      } catch (err) {
        console.error('❌ Error fetching chart data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCharts();
  }, []);

  if (loading)
    return (
      <Box textAlign="center" sx={{ py: 6 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Memuat data grafik...
        </Typography>
      </Box>
    );

  const commonOptions = {
    chart: { toolbar: { show: false } },
    xaxis: {
      categories: bulanList,
      labels: { style: { fontSize: '13px' } }
    },
    dataLabels: { enabled: true },
    stroke: { curve: 'smooth' },
    grid: { borderColor: '#eee' }
  };

  return (
    <>
      {/* 🔸 Total Pendapatan Gadai per Bulan */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title={`Total Pendapatan Gadai per Bulan (${tahun})`} />
        <Divider />
        <CardContent>
          <Chart
            options={{
              ...commonOptions,
              colors: ['#FF9800'],
              yaxis: {
                labels: {
                  formatter: (val) => `Rp ${val.toLocaleString('id-ID')}`
                }
              },
              tooltip: {
                y: {
                  formatter: (val) => `Rp ${val.toLocaleString('id-ID')}`
                }
              }
            }}
            series={[{ name: 'Total Pendapatan', data: pendapatanData }]}
            type="line"
            height={320}
          />
        </CardContent>
      </Card>

      {/* 🔹 Jumlah Nasabah per Bulan */}
      <Card>
        <CardHeader title={`Jumlah Nasabah per Bulan (${tahun})`} />
        <Divider />
        <CardContent>
          <Chart
            options={{
              ...commonOptions,
              colors: ['#4CAF50'],
              yaxis: {
                labels: { formatter: (val) => `${val} org` }
              },
              tooltip: {
                y: { formatter: (val) => `${val} Nasabah` }
              }
            }}
            series={[{ name: 'Jumlah Nasabah', data: nasabahData }]}
            type="bar"
            height={320}
          />
        </CardContent>
      </Card>
    </>
  );
};

export default RevenueChartCard;
