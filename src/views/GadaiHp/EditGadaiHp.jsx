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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Autocomplete,
    Box,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from 'api/axiosInstance';

const EditGadaiHpPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [nasabahs, setNasabahs] = useState([]);
    const [types, setTypes] = useState([]);
    const [selectedNasabah, setSelectedNasabah] = useState(null);

    const [form, setForm] = useState({
        nama_barang: '',
        kelengkapan: '',
        kerusakan: '',
        grade: '',
        imei: '',
        warna: '',
        kunci_password: '',
        kunci_pin: '',
        kunci_pola: '',
        ram: '',
        rom: '',
        type_hp: '',
        merk: '',
        detail_gadai_id: '',
    });

    // Ambil data awal
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resGadai, resNasabah, resTypes] = await Promise.all([
                    axiosInstance.get(`/gadai-hp/${id}`),
                    axiosInstance.get('/data-nasabah'),
                    axiosInstance.get('/type'),
                ]);

                const data = resGadai.data.data;
                setForm({
                    nama_barang: data.nama_barang || '',
                    kelengkapan: data.kelengkapan || '',
                    kerusakan: data.kerusakan || '',
                    grade: data.grade || '',
                    imei: data.imei || '',
                    warna: data.warna || '',
                    kunci_password: data.kunci_password || '',
                    kunci_pin: data.kunci_pin || '',
                    kunci_pola: data.kunci_pola || '',
                    ram: data.ram || '',
                    rom: data.rom || '',
                    type_hp: data.type_hp || '',
                    merk: data.merk || '',
                    detail_gadai_id: data.detail_gadai_id || '',
                });

                setNasabahs(resNasabah.data.data || []);
                setTypes(resTypes.data.data || []);

                const nasabahFound = resNasabah.data.data.find(
                    (n) => n.id.toString() === data.detail_gadai_id.toString()
                );
                setSelectedNasabah(nasabahFound || null);

                setSelectedNasabah(nasabahFound || null);
            } catch (err) {
                console.error(err);
                alert('Gagal mengambil data gadai HP');
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
            const res = await axiosInstance.put(`/gadai-hp/${id}`, form);
            if (res.data.success) {
                alert('Data berhasil diperbarui!');
                navigate('/gadai-hp');
            } else {
                alert(res.data.message || 'Gagal memperbarui data');
            }
        } catch (err) {
            console.error(err);
            alert(err.message || 'Terjadi kesalahan server');
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
            <CardHeader title="Edit Gadai HP" />
            <CardContent>
                <Grid container spacing={3}>
                    {/* Kolom kiri */}
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
                                label="IMEI"
                                name="imei"
                                value={form.imei}
                                onChange={handleInputChange}
                                fullWidth
                            />
                            <TextField
                                label="Merk"
                                name="merk"
                                value={form.merk}
                                onChange={handleInputChange}
                                fullWidth
                            />
                            <FormControl fullWidth>
                                <InputLabel>Type HP</InputLabel>
                                <Select
                                    name="type_hp"
                                    value={form.type_hp}
                                    onChange={handleInputChange}
                                    label="Type HP"
                                >
                                    {types.map((t) => (
                                        <MenuItem key={t.id} value={t.nama_type}>
                                            {t.nama_type}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Grade"
                                name="grade"
                                value={form.grade}
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
                                label="Kerusakan"
                                name="kerusakan"
                                value={form.kerusakan}
                                onChange={handleInputChange}
                                fullWidth
                            />
                        </Stack>
                    </Grid>

                    {/* Kolom kanan */}
                    <Grid item xs={12} md={6}>
                        <Stack spacing={2}>
                            <TextField
                                label="Warna"
                                name="warna"
                                value={form.warna}
                                onChange={handleInputChange}
                                fullWidth
                            />
                            <TextField
                                label="Kunci Password"
                                name="kunci_password"
                                value={form.kunci_password}
                                onChange={handleInputChange}
                                fullWidth
                            />
                            <TextField
                                label="Kunci PIN"
                                name="kunci_pin"
                                value={form.kunci_pin}
                                onChange={handleInputChange}
                                fullWidth
                            />
                            <TextField
                                label="Kunci Pola"
                                name="kunci_pola"
                                value={form.kunci_pola}
                                onChange={handleInputChange}
                                fullWidth
                            />
                            <TextField
                                label="RAM"
                                name="ram"
                                value={form.ram}
                                onChange={handleInputChange}
                                fullWidth
                            />
                            <TextField
                                label="ROM"
                                name="rom"
                                value={form.rom}
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
                    <Button variant="outlined" color="secondary" onClick={() => navigate('/gadai-hp')}>
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

export default EditGadaiHpPage;
