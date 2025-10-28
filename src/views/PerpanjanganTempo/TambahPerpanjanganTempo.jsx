import React, { useState, useEffect } from 'react';
import {
  Card, CardHeader, CardContent, TextField, Button,
  Grid, Stack, CircularProgress, Autocomplete
} from '@mui/material';
import axiosInstance from 'api/axiosInstance';
import { useNavigate } from 'react-router-dom';

const TambahPerpanjanganTempoPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    detail_gadai_id: '',
    tanggal_perpanjangan: '',
    jatuh_tempo_baru: ''
  });

  const [detailGadai, setDetailGadai] = useState([]);
  const [uniqueNasabah, setUniqueNasabah] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch detail gadai
  useEffect(() => {
    const fetchDetailGadai = async () => {
      try {
        const res = await axiosInstance.get('/detail-gadai');
        const data = res.data.data || [];
        setDetailGadai(data);

        // Ambil nasabah unik
        const nasabahMap = {};
        data.forEach(d => {
          if (d.nasabah && !nasabahMap[d.nasabah.id]) {
            nasabahMap[d.nasabah.id] = d.nasabah;
          }
        });
        setUniqueNasabah(Object.values(nasabahMap));
      } catch (err) {
        alert('Gagal memuat data detail gadai');
      } finally {
        setLoading(false);
      }
    };

    fetchDetailGadai();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    // Validasi semua field wajib diisi
    for (let key in form) {
      if (!form[key]) {
        alert('Semua field harus diisi!');
        return;
      }
    }

    try {
      setSaving(true);
      const res = await axiosInstance.post('/perpanjangan-tempo', form);
      if (res.data.success) {
        alert('Perpanjangan berhasil ditambahkan');
        navigate('/perpanjangan-tempo');
      } else {
        alert(res.data.message || 'Gagal menambahkan perpanjangan');
      }
    } catch (err) {
      alert(err.message || 'Terjadi kesalahan server');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 10 }} />;
  }

  return (
    <Card sx={{ p: 2 }}>
      <CardHeader title="Tambah Perpanjangan Tempo" />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={uniqueNasabah}
              getOptionLabel={(option) => option.nama_lengkap || ''}
              value={
                uniqueNasabah.find(n =>
                  detailGadai.find(d => d.id === form.detail_gadai_id)?.nasabah?.id === n.id
                ) || null
              }
              onChange={(event, newValue) => {
                const detail = detailGadai.find(d => d.nasabah?.id === newValue?.id);
                setForm(prev => ({
                  ...prev,
                  detail_gadai_id: detail ? detail.id : ''
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Nama Nasabah"
                  placeholder="Cari nama nasabah..."
                  size="small"
                  fullWidth
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Tanggal Perpanjangan"
              name="tanggal_perpanjangan"
              type="date"
              value={form.tanggal_perpanjangan}
              onChange={handleChange}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Jatuh Tempo Baru"
              name="jatuh_tempo_baru"
              type="date"
              value={form.jatuh_tempo_baru}
              onChange={handleChange}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 4 }}>
          <Button variant="outlined" onClick={() => navigate('/perpanjangan-tempo')}>
            Batal
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TambahPerpanjanganTempoPage;
