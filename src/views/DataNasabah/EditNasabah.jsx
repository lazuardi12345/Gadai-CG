import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Stack,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
} from '@mui/material';
import PhotoIcon from '@mui/icons-material/Photo';
import axiosInstance from 'api/axiosInstance';
import { AuthContext } from 'AuthContex/AuthContext';

const EditNasabahPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const role = (user?.role || '').toLowerCase();

  const [nasabah, setNasabah] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // 🔹 Fungsi untuk menyesuaikan API sesuai role
  const getApiUrl = (resource) => {
    switch (role) {
      case 'checker':
        return `/checker/${resource}`;
      case 'hm':
        return `/${resource}`;
      default:
        return null; // role lain tidak boleh
    }
  };

  // 🔹 Fetch data nasabah
  useEffect(() => {
    if (!['checker', 'hm'].includes(role)) {
      alert('Role tidak diizinkan mengedit data!');
      navigate('/');
      return;
    }

    const fetchNasabah = async () => {
      try {
        const apiUrl = `${getApiUrl('data-nasabah')}/${id}`;
        if (!apiUrl) return;

        const response = await axiosInstance.get(apiUrl);
        if (response.data.success) {
          const data = response.data.data;
          setNasabah({
            ...data,
            foto_ktp_file: null,
            foto_ktp_preview: data.foto_ktp || null,
          });
        } else {
          setError('Data nasabah tidak ditemukan.');
        }
      } catch (err) {
        setError('Gagal mengambil data nasabah.');
      } finally {
        setLoading(false);
      }
    };

    fetchNasabah();
  }, [id, role, navigate]);

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
      alert('Nama dan NIK wajib diisi!');
      return;
    }

    setSaving(true);
    try {
      const apiUrl = `${getApiUrl('data-nasabah')}/${id}`;
      if (!apiUrl) {
        alert('Role tidak diizinkan menyimpan data!');
        return;
      }

      const formData = new FormData();
      formData.append('_method', 'PUT');
      formData.append('nama_lengkap', nasabah.nama_lengkap);
      formData.append('nik', nasabah.nik);
      formData.append('alamat', nasabah.alamat || '');
      formData.append('no_hp', nasabah.no_hp || '');
      if (nasabah.foto_ktp_file instanceof File) {
        formData.append('foto_ktp', nasabah.foto_ktp_file);
      }

      const response = await axiosInstance.post(apiUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        alert('Data berhasil diperbarui!');
        navigate(role === 'checker' ? '/checker/data-nasabah' : '/data-nasabah');
      } else {
        alert(response.data.message || 'Gagal menyimpan data.');
      }
    } catch (err) {
      console.log(err.response?.data);
      alert(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan.');
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

  if (error) {
    return (
      <Grid container justifyContent="center" alignItems="center" style={{ height: '80vh' }}>
        <Typography color="error">{error}</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() =>
            navigate(role === 'checker' ? '/checker/data-nasabah' : '/data-nasabah')
          }
          sx={{ mt: 2 }}
        >
          Kembali
        </Button>
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
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() =>
                    navigate(role === 'checker' ? '/checker/data-nasabah' : '/data-nasabah')
                  }
                  disabled={saving}
                >
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
