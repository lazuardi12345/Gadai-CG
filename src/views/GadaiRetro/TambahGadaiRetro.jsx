import React, { useState, useEffect } from 'react';
import {
    Card, CardHeader, CardContent, TextField, Button,
    Grid, Stack, CircularProgress, Autocomplete
} from '@mui/material';
import axiosInstance from 'api/axiosInstance';
import { useNavigate } from 'react-router-dom';

const TambahGadaiRetroPage = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        nama_barang: '',
        type_retro: '',
        kelengkapan: '',
        kode_cap: '',
        karat: '',
        potongan_batu: '',
        berat: '', // Field baru
        detail_gadai_id: '',
    });

    const [detailGadai, setDetailGadai] = useState([]);
    const [uniqueNasabah, setUniqueNasabah] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch detail gadai untuk autocomplete nasabah
    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await axiosInstance.get('/detail-gadai');
                const data = res.data.data || [];
                setDetailGadai(data);

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
        fetchDetail();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        for (let key in form) {
            if (!form[key]) {
                alert('Semua field harus diisi!');
                return;
            }
        }

        try {
            setSaving(true);
            const res = await axiosInstance.post('/gadai-retro', form);
            if (res.data.success) {
                alert('Data berhasil ditambahkan');
                navigate('/gadai-retro');
            } else {
                alert(res.data.message || 'Gagal menambahkan data');
            }
        } catch (err) {
            if (err.response?.status === 422) {
                const messages = Object.values(err.response.data.errors).flat();
                alert('Validasi gagal:\n' + messages.join('\n'));
            } else {
                alert(err.message || 'Terjadi kesalahan server');
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 10 }} />;
    }

    return (
        <Card sx={{ p: 2 }}>
            <CardHeader title="Tambah Data Gadai Retro" />
            <CardContent>
                <Grid container spacing={2}>
                    {Object.keys(form).map((key) => {
                        if (key === 'detail_gadai_id') {
                            return (
                                <Grid item xs={12} sm={6} key={key}>
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
                            );
                        }

                        return (
                            <Grid item xs={12} sm={6} key={key}>
                                <TextField
                                    label={key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                    name={key}
                                    value={form[key]}
                                    onChange={handleChange}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                        );
                    })}
                </Grid>

                <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 4 }}>
                    <Button variant="outlined" onClick={() => navigate('/gadai-retro')}>
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

export default TambahGadaiRetroPage;
