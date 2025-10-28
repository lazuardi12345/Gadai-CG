import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Grid,
} from '@mui/material';
import PhotoIcon from '@mui/icons-material/Photo';
import axiosInstance from 'api/axiosInstance';

const EditNasabahPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nasabah, setNasabah] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNasabah();
  }, [id]);

  // Fetch data nasabah
  const fetchNasabah = async () => {
    try {
      const response = await axiosInstance.get(`/data-nasabah/${id}`);
      if (response.data.success) {
        setNasabah({
          ...response.data.data,
          foto_ktp_preview: response.data.data.foto_ktp || null,
          foto_ktp_file: null,
        });
      } else {
        alert(response.data.message || 'Gagal mengambil data nasabah');
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNasabah((prev) => ({ ...prev, [name]: value }));
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNasabah((prev) => ({
        ...prev,
        foto_ktp_file: file,
        foto_ktp_preview: URL.createObjectURL(file),
      }));
    }
  };

const handleSave = async () => {
  if (!nasabah.nama_lengkap || !nasabah.nik) {
    alert('Nama lengkap dan NIK wajib diisi!');
    return;
  }

  setSaving(true);
  try {
    const formData = new FormData();
    formData.append('_method', 'PUT'); // <- ini tambahan supaya Laravel menganggap PUT
    formData.append('nama_lengkap', nasabah.nama_lengkap);
    formData.append('nik', nasabah.nik);
    formData.append('alamat', nasabah.alamat);
    formData.append('no_hp', nasabah.no_hp);
    if (nasabah.foto_ktp_file instanceof File) {
      formData.append('foto_ktp', nasabah.foto_ktp_file);
    }

    // gunakan POST tapi Laravel akan menganggap PUT
    const response = await axiosInstance.post(`/data-nasabah/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (response.data.success) {
      alert('Data nasabah berhasil diperbarui.');
      navigate('/data-nasabah');
    } else {
      alert(response.data.message || 'Gagal menyimpan data');
    }
  } catch (error) {
    console.error(error);
    alert('Terjadi kesalahan saat menyimpan data nasabah');
  } finally {
    setSaving(false);
  }
};


  if (loading) {
    return (
      <Grid container justifyContent="center" alignItems="center" style={{ height: '80vh' }}>
        <CircularProgress />
      </Grid>
    );
  }

  return (
    <Grid container justifyContent="center" style={{ marginTop: 20 }}>
      <Grid item xs={12} md={8} lg={6}>
        <Card>
          <CardHeader title="Edit Nasabah" />
          <CardContent>
            <Stack spacing={3}>
              <TextField
                label="Nama Lengkap"
                name="nama_lengkap"
                value={nasabah.nama_lengkap}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                label="NIK"
                name="nik"
                value={nasabah.nik}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                label="Alamat"
                name="alamat"
                value={nasabah.alamat}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
              />
              <TextField
                label="No HP"
                name="no_hp"
                value={nasabah.no_hp}
                onChange={handleChange}
                fullWidth
              />

              <Stack spacing={1}>
                <Button variant="contained" component="label" startIcon={<PhotoIcon />}>
                  Upload Foto KTP
                  <input type="file" accept="image/*" hidden onChange={handleFotoChange} />
                </Button>
                {nasabah.foto_ktp_preview && (
                  <img
                    src={nasabah.foto_ktp_preview}
                    alt="Preview Foto KTP"
                    style={{ width: 300, height: 200, objectFit: 'cover', borderRadius: 8 }}
                  />
                )}
              </Stack>

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="outlined" color="secondary" onClick={() => navigate('/data-nasabah')} disabled={saving}>
                  Batal
                </Button>
                <Button variant="contained" color="primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default EditNasabahPage;
