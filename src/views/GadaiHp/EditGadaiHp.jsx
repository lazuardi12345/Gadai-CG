import React, { useEffect, useState, useContext } from 'react';
import {
    Card, CardHeader, CardContent, Grid, TextField, Button,
    Stack, CircularProgress, Autocomplete, Box, FormGroup,
    FormControlLabel, Checkbox, Typography
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from 'api/axiosInstance';
import { AuthContext } from "AuthContex/AuthContext";

const KELENGKAPAN_LIST = ['Box', 'Charger', 'Kabel Data'];
const KERUSAKAN_LIST = [
    'LCD Pecah', 'LCD Kuning/Pink', 'LCD Bercak', 'Baterai Bocor',
    'Tombol Rusak', 'Layar tidak fungsi', 'Kamera tidak berfungsi/blur',
    'Tombol volume tidak berfungsi', 'SIM tidak terbaca', 'Tombol power tidak berfungsi',
    'Face Id/ Finger Print tidak berfungsi', 'IMEI tidak terbaca', 'Display Phone'
];

const NAMA_BARANG_LIST = ['Android', 'Samsung', 'iPhone'];

const DOKUMEN_SOP = {
    Android: ['body', 'imei', 'about', 'akun', 'admin', 'cam_depan', 'cam_belakang', 'rusak'],
    Samsung: ['body', 'imei', 'about', 'samsung_account', 'admin', 'cam_depan', 'cam_belakang', 'galaxy_store'],
    iPhone: ['body', 'imei', 'about', 'icloud', 'battery', '3utools', 'iunlocker', 'cek_pencurian'],
};

const EditGadaiHpPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const userRole = (user?.role || '').toLowerCase();

    const canEdit = userRole === 'hm' || userRole === 'checker';
    const canView = true; // Semua role bisa lihat

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [detailGadai, setDetailGadai] = useState([]);
    const [uniqueNasabah, setUniqueNasabah] = useState([]);
    const [selectedNasabah, setSelectedNasabah] = useState(null);
    const [form, setForm] = useState({
        nama_barang: '',
        kelengkapan: [],
        kerusakan: [],
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
        dokumen_pendukung: {},
    });

    const getBaseUrl = (resource) => {
        switch (userRole) {
            case 'checker': return `/checker/${resource}`;
            case 'hm': return `/${resource}`;
            default: return null; // role lain tidak diizinkan
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [resGadai, resDetailGadai] = await Promise.all([
                    axiosInstance.get(`${getBaseUrl('gadai-hp')}/${id}`),
                    axiosInstance.get(getBaseUrl('detail-gadai')),
                ]);

                const data = resGadai.data.data;

                const dokumenPendukung = {};
                if (data.dokumen_pendukung) {
                    Object.entries(data.dokumen_pendukung).forEach(([key, val]) => {
                        if (typeof val === 'string' && val) dokumenPendukung[key] = { url: val.startsWith('http') ? val : `${window.location.origin}/${val}` };
                        else if (Array.isArray(val) && val.length > 0) dokumenPendukung[key] = { url: val[0].startsWith('http') ? val[0] : `${window.location.origin}/${val[0]}` };
                        else dokumenPendukung[key] = null;
                    });
                }

                setForm({
                    ...form,
                    nama_barang: data.nama_barang || '',
                    kelengkapan: Array.isArray(data.kelengkapan) ? data.kelengkapan : [],
                    kerusakan: Array.isArray(data.kerusakan) ? data.kerusakan : [],
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
                    dokumen_pendukung: dokumenPendukung,
                });

                const detailData = resDetailGadai.data.data || [];
                setDetailGadai(detailData);

                const nasabahMap = {};
                detailData.forEach(d => { if (d.nasabah && !nasabahMap[d.nasabah.id]) nasabahMap[d.nasabah.id] = d.nasabah; });
                setUniqueNasabah(Object.values(nasabahMap));

                const selectedDetail = detailData.find(d => d.id === data.detail_gadai_id);
                setSelectedNasabah(selectedDetail ? selectedDetail.nasabah : null);

            } catch (err) {
                console.error(err);
                alert('Gagal mengambil data gadai HP');
            } finally { setLoading(false); }
        };
        fetchData();
    }, [id, userRole]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (field, value) => {
        setForm(prev => {
            const newArray = prev[field].includes(value)
                ? prev[field].filter(item => item !== value)
                : [...prev[field], value];
            return { ...prev, [field]: newArray };
        });
    };

    const handleDokumenChange = (key, file) => {
        setForm(prev => ({
            ...prev,
            dokumen_pendukung: {
                ...prev.dokumen_pendukung,
                [key]: file ? { file, url: URL.createObjectURL(file) } : null
            }
        }));
    };

    const handleSubmit = async () => {
        if (!canEdit) return; // Petugas tidak bisa submit
        if (!form.detail_gadai_id) { alert('Silakan pilih Nasabah.'); return; }

        try {
            setSaving(true);
            const data = new FormData();
            data.append('_method', 'PUT');

            Object.keys(form).forEach(key => {
                if (key === 'dokumen_pendukung') {
                    Object.entries(form.dokumen_pendukung).forEach(([k, val]) => {
                        if (val?.file instanceof File) data.append(`dokumen_pendukung[${k}]`, val.file);
                    });
                } else if (key === 'kelengkapan' || key === 'kerusakan') {
                    form[key].forEach(value => data.append(`${key}[]`, value));
                } else {
                    data.append(key, form[key]);
                }
            });

            const res = await axiosInstance.post(`/gadai-hp/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });

            if (res.data.success) { alert('Data berhasil diperbarui!'); navigate('/gadai-hp'); }
            else alert(res.data.message || 'Gagal memperbarui data');

        } catch (err) {
            console.error(err.response?.data || err);
            if (err.response?.status === 422 && err.response.data.errors) {
                const messages = Object.values(err.response.data.errors).flat().join('\n');
                alert(`Validasi gagal:\n${messages}`);
            } else alert(err.response?.data?.message || 'Terjadi kesalahan server');
        } finally { setSaving(false); }
    };

    if (loading) return (
        <Stack alignItems="center" justifyContent="center" sx={{ height: '80vh' }}>
            <CircularProgress />
        </Stack>
    );

    const dokumenKeys = form.nama_barang ? DOKUMEN_SOP[form.nama_barang] : [];

    return (
        <Card sx={{ p: 2 }}>
            <CardHeader title="Edit Data Gadai HP" />
            <CardContent>
                <Grid container spacing={2}>

                    {/* Autocomplete Nasabah */}
                    <Grid item xs={12} sm={6}>
                        <Autocomplete
                            options={uniqueNasabah}
                            getOptionLabel={(option) => option.nama_lengkap || ''}
                            value={selectedNasabah}
                            onChange={(event, newValue) => {
                                setSelectedNasabah(newValue);
                                const detail = detailGadai.find(d => d.nasabah?.id === newValue?.id);
                                setForm(prev => ({ ...prev, detail_gadai_id: detail ? detail.id : '' }));
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Nama Nasabah"
                                    placeholder="Cari nama nasabah..."
                                    size="small"
                                    fullWidth
                                    disabled={!canEdit}
                                />
                            )}
                        />
                    </Grid>

                    {/* Input Text Fields */}
                    {['nama_barang', 'grade', 'imei', 'warna', 'kunci_password', 'kunci_pin', 'kunci_pola', 'ram', 'rom', 'type_hp', 'merk'].map(key => (
                        <Grid item xs={12} sm={6} key={key}>
                            <TextField
                                label={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                name={key}
                                value={form[key]}
                                onChange={handleInputChange}
                                fullWidth
                                size="small"
                                disabled={!canEdit}
                            />
                        </Grid>
                    ))}

                    {/* Checkbox Kelengkapan */}
                    <Grid item xs={12} sm={6}>
                        <Box sx={{ border: '1px dashed #ccc', borderRadius: 2, p: 2, bgcolor: '#fafafa' }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Kelengkapan</Typography>
                            <FormGroup>
                                {KELENGKAPAN_LIST.map(option => (
                                    <FormControlLabel
                                        key={option}
                                        control={
                                            <Checkbox
                                                checked={form.kelengkapan.includes(option)}
                                                onChange={() => handleCheckboxChange('kelengkapan', option)}
                                                disabled={!canEdit}
                                            />
                                        }
                                        label={option}
                                    />
                                ))}
                            </FormGroup>
                        </Box>
                    </Grid>

                    {/* Checkbox Kerusakan */}
                    <Grid item xs={12} sm={6}>
                        <Box sx={{ border: '1px dashed #ccc', borderRadius: 2, p: 2, bgcolor: '#fafafa' }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Kerusakan</Typography>
                            <FormGroup>
                                {KERUSAKAN_LIST.map(option => (
                                    <FormControlLabel
                                        key={option}
                                        control={
                                            <Checkbox
                                                checked={form.kerusakan.includes(option)}
                                                onChange={() => handleCheckboxChange('kerusakan', option)}
                                                disabled={!canEdit}
                                            />
                                        }
                                        label={option}
                                    />
                                ))}
                            </FormGroup>
                        </Box>
                    </Grid>

                    {/* Dokumen Pendukung */}
                    {dokumenKeys.length > 0 && (
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>LENGKAPI DOKUMEN PENDUKUNG:</Typography>
                        </Grid>
                    )}
                    {dokumenKeys.map(key => (
                        <Grid item xs={12} sm={6} key={key}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>{key.replace(/_/g, ' ').toUpperCase()}</Typography>
                            <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 2, bgcolor: '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {form.dokumen_pendukung[key]?.url ? (
                                    <Box component="img" src={form.dokumen_pendukung[key].url} alt={key}
                                        sx={{ maxWidth: '150px', maxHeight: '150px', mb: 1, borderRadius: 1, objectFit: 'contain' }}
                                    />
                                ) : <Typography variant="body2" sx={{ mb: 1, color: '#888' }}>Belum ada file dipilih</Typography>}

                                <Stack direction="row" spacing={1}>
                                    <Button variant="contained" component="label" size="small" disabled={!canEdit}>
                                        Upload
                                        <input type="file" hidden accept="image/*" onChange={(e) => handleDokumenChange(key, e.target.files[0])} />
                                    </Button>
                                    {form.dokumen_pendukung[key]?.url && canEdit && (
                                        <Button variant="outlined" color="error" size="small" onClick={() => handleDokumenChange(key, null)}>
                                            Hapus
                                        </Button>
                                    )}
                                </Stack>
                            </Box>
                        </Grid>
                    ))}

                </Grid>

                <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 4 }}>
                    <Button variant="outlined" onClick={() => navigate('/gadai-hp')}>Batal</Button>
                    {canEdit && (
                        <Button variant="contained" color="primary" onClick={handleSubmit} disabled={saving}>
                            {saving ? 'Menyimpan...' : 'Update'}
                        </Button>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
};

export default EditGadaiHpPage;
