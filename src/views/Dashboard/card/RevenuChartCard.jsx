import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Divider, CircularProgress, Typography } from '@mui/material';
import Chart from 'react-apexcharts';
import axiosInstance from 'api/axiosInstance';
import dayjs from 'dayjs';

const RevenueChartCard = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [nasabahData, setNasabahData] = useState([]);
  const [totalData, setTotalData] = useState([]);
  const [countData, setCountData] = useState([]);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const res = await axiosInstance.get('/detail-gadai'); 
        const data = res.data.data || [];

        // kelompokkan per bulan
        const monthlyMap = {};
        data.forEach(item => {
          const month = dayjs(item.tanggal_gadai).format('YYYY-MM');
          if (!monthlyMap[month]) monthlyMap[month] = { nasabah: 0, total: 0, count: 0 };
          // Sesuaikan field jika beda di API-mu
          monthlyMap[month].nasabah += Number(item.pendapatan_nasabah || 0);
          monthlyMap[month].total += Number(item.uang_pinjaman || 0);
          monthlyMap[month].count += 1;
        });

        const months = Object.keys(monthlyMap).sort();
        setCategories(months.map(m => dayjs(m).format('MMM YYYY')));
        setNasabahData(months.map(m => monthlyMap[m].nasabah));
        setTotalData(months.map(m => monthlyMap[m].total));
        setCountData(months.map(m => monthlyMap[m].count));

      } catch (err) {
        console.error('❌ Error fetching revenue chart:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenue();
  }, []);

  if (loading) return (
    <Typography align="center" sx={{ py: 6 }}><CircularProgress /> Memuat data chart...</Typography>
  );

  const chartOptions = (title, color) => ({
    chart: { id: title, toolbar: { show: false } },
    xaxis: { categories },
    dataLabels: { enabled: true },
    stroke: { curve: 'smooth' },
    colors: [color],
  });

  return (
    <>

      <Card sx={{ mb: 2 }}>
        <CardHeader title="Total Pendapatan Gadai per Bulan" />
        <Divider />
        <CardContent>
          <Chart options={chartOptions('Total Pendapatan Gadai', '#ff9800')} series={[{ name: 'Total Pendapatan Gadai', data: totalData }]} type="line" height={300} />
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardHeader title="Jumlah Nasabah per Bulan" />
        <Divider />
        <CardContent>
          <Chart options={chartOptions('Jumlah Nasabah', '#43a047')} series={[{ name: 'Jumlah Nasabah', data: countData }]} type="bar" height={300} />
        </CardContent>
      </Card>
    </>
  );
};

export default RevenueChartCard;
