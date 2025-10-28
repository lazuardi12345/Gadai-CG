import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Grid,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from 'api/axiosInstance';

const EditPerpanjanganTempoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailGadai, setDetailGadai] = useState([]);
  const [uniqueNasabah, setUniqueNasabah] = useState([]);
  const [selectedNasabah, setSelectedNasabah] = useState(null);

  const [form, setForm] = useState({
    detail_gadai_id: '',
    tanggal_perpanjangan: '',
    jatuh_tempo_baru: ''
  });

  // Ambil data awal
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resPerpanjangan, resDetailGadai] = await Promise.all([
          axiosInstance.get(`/perpanjangan-tempo/${id}`),
          axiosInstance.get('/detail-gadai')
        ]);

        const perpanjangan = resPerpanjangan.data.data;
        setForm({
          detail_gadai_id: perpanjangan.detail_gadai_id || '',
          tanggal_perpanjangan: perpanjangan.tanggal_perpanjangan || '',
          jatuh_tempo_baru: perpanjangan.jatuh_tempo_baru || ''
        });

        const dataDetailGadai = resDetailGadai.data.data || [];
        setDetailGadai(dataDetailGadai);

        // Ambil nasabah unik
        const nasabahMap = {};
        dataDetailGadai.forEach(d => {
          if (d.nasabah && !nasabahMap[d.nasabah.id]) {
            nasabahMap[d.nasabah.id] = d.nasabah;
          }
        });
        const nasabahList = Object.values(nasabahMap);
        setUniqueNasabah(nasabahList);

        // Set selected nasabah sesuai detail_gadai_id
        const detail = dataDetailGadai.find(d => d.id === perpanjangan.detail_gadai_id);
        if (detail && detail.nasabah) {
          setSelectedNasabah(detail.nasabah);
        }

      } catch (err) {
        console.error(err);
        alert('Gagal memuat data perpanjangan tempo');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    // Validasi semua field wajib
    for (let key in form) {
      if (!form[key]) {
        alert('Semua field harus diisi!');
        return;
      }
    }

    try {
      setSaving(true);

      // Konversi detail_gadai_id ke number
      const payload = {
        detail_gadai_id: Number(form.detail_gadai_id),
        tanggal_perpanjangan: form.tanggal_perpanjangan,
        jatuh_tempo_baru: form.jatuh_tempo_baru
      };

      console.log('Payload dikirim:', payload);

      const res = await axiosInstance.put(`/perpanjangan-tempo/${id}`, payload);

      if (res.data.success) {
        alert('Perpanjangan berhasil diperbarui');
        navigate('/perpanjangan-tempo');
      } else {
        alert(res.data.message || 'Gagal memperbarui perpanjangan');
      }
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert(err.response?.data?.message || 'Terjadi kesalahan server');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 10 }} />;
  }

  return (
    <Card sx={{ p: 2 }}>
      <CardHeader title="Edit Perpanjangan Tempo" />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={uniqueNasabah}
              getOptionLabel={(option) => option.nama_lengkap || ''}
              value={selectedNasabah}
              onChange={(event, newValue) => {
                setSelectedNasabah(newValue);
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
          <Button variant="contained" color="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Update'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default EditPerpanjanganTempoPage;
