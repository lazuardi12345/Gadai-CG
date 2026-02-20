import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Divider,
  Typography,
  Box
} from '@mui/material';
import Chart from 'react-apexcharts';

const RevenueChartCard = ({ data, tahun }) => {
  // Ambil role user login
  const user = JSON.parse(localStorage.getItem('auth_user'));
  const userRole = user?.role?.toLowerCase() || '';

  // Render hanya untuk HM dan Checker
  if (!['hm', 'checker'].includes(userRole)) return null;

  // Jika data belum siap
  if (!data || data.length === 0) {
    return (
      <Box textAlign="center" sx={{ py: 6 }}>
        <Typography variant="body2">Data grafik tidak tersedia.</Typography>
      </Box>
    );
  }

  // Mapping data dari props gadai_chart
  const bulanList = data.map(item => item.bulan);
  const pendapatanData = data.map(item => Number(item.total_pinjaman) || 0);
  const nasabahData = data.map(item => Number(item.total_nasabah) || 0);

  const commonOptions = {
    chart: { toolbar: { show: false } },
    xaxis: {
      categories: bulanList,
      labels: { style: { fontSize: '11px' } }
    },
    dataLabels: { enabled: false }, // Dimatikan agar tidak terlalu ramai
    stroke: { curve: 'smooth', width: 3 },
    grid: { borderColor: '#eee' }
  };

  return (
    <>
      {/* 🔸 Total Pinjaman (Pendapatan) Gadai per Bulan */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardHeader title={<Typography variant="subtitle1" fontWeight="bold">Trend Pinjaman ({tahun})</Typography>} />
        <Divider />
        <CardContent>
          <Chart
            options={{
              ...commonOptions,
              colors: ['#FF9800'],
              yaxis: {
                labels: {
                  formatter: (val) => val > 0 ? `${(val / 1000000).toFixed(1)}jt` : 0
                }
              },
              tooltip: {
                y: { formatter: (val) => `Rp ${val.toLocaleString('id-ID')}` }
              }
            }}
            series={[{ name: 'Total Pinjaman', data: pendapatanData }]}
            type="line"
            height={250}
          />
        </CardContent>
      </Card>

      {/* 🔹 Jumlah Nasabah per Bulan */}
      <Card sx={{ borderRadius: 2 }}>
        <CardHeader title={<Typography variant="subtitle1" fontWeight="bold">Jumlah Nasabah ({tahun})</Typography>} />
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
            height={250}
          />
        </CardContent>
      </Card>
    </>
  );
};

export default RevenueChartCard;