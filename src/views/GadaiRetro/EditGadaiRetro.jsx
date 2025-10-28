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
    Box,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from 'api/axiosInstance';

const EditGadaiRetroPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [nasabahs, setNasabahs] = useState([]);
    const [selectedNasabah, setSelectedNasabah] = useState(null);

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

    // Ambil data awal
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resRetro, resNasabah] = await Promise.all([
                    axiosInstance.get(`/gadai-retro/${id}`),
                    axiosInstance.get('/data-nasabah'),
                ]);

                const data = resRetro.data.data;
                setForm({
                    nama_barang: data.nama_barang || '',
                    type_retro: data.type_retro || '',
                    kelengkapan: data.kelengkapan || '',
                    kode_cap: data.kode_cap || '',
                    karat: data.karat || '',
                    potongan_batu: data.potongan_batu || '',
                    berat: data.berat || '', // Set nilai berat
                    detail_gadai_id: data.detail_gadai_id || '',
                });

                setNasabahs(resNasabah.data.data || []);
                const nasabahFound = resNasabah.data.data.find(
                    (n) => n.id.toString() === data.detail_gadai?.nasabah?.id.toString()
                );
                setSelectedNasabah(nasabahFound || null);
            } catch (err) {
                console.error(err);
                alert('Gagal mengambil data gadai retro');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        for (let key of Object.keys(form)) {
            if (!form[key]) {
                alert('Semua field harus diisi!');
                return;
            }
        }

        try {
            setSaving(true);
            const res = await axiosInstance.put(`/gadai-retro/${id}`, form);
            if (res.data.success) {
                alert('Data berhasil diperbarui!');
                navigate('/gadai-retro');
            } else {
                alert(res.data.message || 'Gagal memperbarui data');
            }
        } catch (err) {
            console.error(err);
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
        return (
            <Stack alignItems="center" justifyContent="center" sx={{ height: '80vh' }}>
                <CircularProgress />
            </Stack>
        );
    }

    return (
        <Card sx={{ p: 2 }}>
            <CardHeader title="Edit Gadai Retro" />
            <CardContent>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Stack spacing={2}>
                            <TextField
                                label="Nama Barang"
                                name="nama_barang"
                                value={form.nama_barang}
                                onChange={handleInputChange}
                                fullWidth
                            />
                            <TextField
                                label="Type Retro"
                                name="type_retro"
                                value={form.type_retro}
                                onChange={handleInputChange}
                                fullWidth
                            />
                            <TextField
                                label="Kelengkapan"
                                name="kelengkapan"
                                value={form.kelengkapan}
                                onChange={handleInputChange}
                                fullWidth
                            />
                            <TextField
                                label="Kode Cap"
                                name="kode_cap"
                                value={form.kode_cap}
                                onChange={handleInputChange}
                                fullWidth
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Stack spacing={2}>
                            <TextField
                                label="Karat"
                                name="karat"
                                value={form.karat}
                                onChange={handleInputChange}
                                fullWidth
                            />
                            <TextField
                                label="Potongan Batu"
                                name="potongan_batu"
                                value={form.potongan_batu}
                                onChange={handleInputChange}
                                fullWidth
                            />
                            <TextField
                                label="Berat (gram)"
                                name="berat"
                                value={form.berat}
                                onChange={handleInputChange}
                                fullWidth
                            />

                            {/* Autocomplete Nasabah */}
                            <Autocomplete
                                options={nasabahs}
                                getOptionLabel={(option) => option.nama_lengkap || ''}
                                value={selectedNasabah}
                                onChange={(e, newValue) => {
                                    setSelectedNasabah(newValue);
                                    setForm((prev) => ({
                                        ...prev,
                                        detail_gadai_id: newValue ? newValue.id : '',
                                    }));
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Cari Nasabah"
                                        placeholder="Ketik nama nasabah..."
                                        fullWidth
                                    />
                                )}
                            />
                            {selectedNasabah && (
                                <Box
                                    sx={{
                                        mt: 1,
                                        p: 1.5,
                                        border: '1px solid #ddd',
                                        borderRadius: 1,
                                        bgcolor: '#fafafa',
                                    }}
                                >
                                    <strong>Detail Nasabah:</strong>
                                    <div>Nama: {selectedNasabah.nama_lengkap}</div>
                                    <div>No HP: {selectedNasabah.no_hp}</div>
                                    <div>Alamat: {selectedNasabah.alamat}</div>
                                </Box>
                            )}
                        </Stack>
                    </Grid>
                </Grid>

                <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 4 }}>
                    <Button variant="outlined" color="secondary" onClick={() => navigate('/gadai-retro')}>
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

export default EditGadaiRetroPage;
