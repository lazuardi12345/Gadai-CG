import React, { useState, useEffect, useContext } from 'react';
import {
    Card, CardHeader, CardContent, TextField, Button,
    Grid, Stack, CircularProgress, Autocomplete,
    FormGroup, FormControlLabel, Checkbox, Box, Typography,
    Select, MenuItem, InputLabel, FormControl, Alert
} from '@mui/material';
import axiosInstance from 'api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from 'AuthContex/AuthContext';

const KELENGKAPAN_LIST = ['Box', 'Charger', 'Kabel Data'];
const KERUSAKAN_LIST = [
    'LCD Pecah', 'LCD Kuning/Pink', 'LCD Bercak', 'Baterai Bocor', 'Tombol Rusak',
    'Layar tidak fungsi', 'Kamera tidak berfungsi/blur', 'Tombol volume tidak berfungsi',
    'SIM tidak terbaca', 'Tombol power tidak berfungsi', 'Face Id/ finger print tidak berfungsi',
    'IMEI tidak terbaca', 'Display Phone'
];

const NAMA_BARANG_LIST = ['Android','Samsung','iPhone'];

const DOKUMEN_SOP = {
    Android: ['body','imei','about','akun','admin','cam_depan','cam_belakang','rusak'],
    Samsung: ['body','imei','about','samsung_account','admin','cam_depan','cam_belakang','galaxy_store'],
    iPhone: ['body','imei','about','icloud','battery','3utools','iunlocker','cek_pencurian'],
};

const TambahGadaiHpPage = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const userRole = (user?.role || '').toLowerCase();
    const canEdit = ['hm','checker'].includes(userRole);

    const getBaseUrl = (resource) => {
        return userRole === 'checker' ? `/checker/${resource}` : `/${resource}`;
    };

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

    const [detailGadai, setDetailGadai] = useState([]);
    const [uniqueNasabah, setUniqueNasabah] = useState([]);
    const [selectedNasabah, setSelectedNasabah] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await axiosInstance.get(getBaseUrl('detail-gadai'));
                const data = res.data.data || [];
                setDetailGadai(data);

                const nasabahMap = {};
                data.forEach(d => {
                    if(d.nasabah && !nasabahMap[d.nasabah.id]) {
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
    }, [userRole]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (field, value) => {
        if (!canEdit) return;
        setForm(prev => {
            const current = prev[field];
            return {
                ...prev,
                [field]: current.includes(value)
                    ? current.filter(v => v !== value)
                    : [...current, value]
            };
        });
    };

    const handleDokumenChange = (key, file) => {
        if (!canEdit) return;
        setForm(prev => ({
            ...prev,
            dokumen_pendukung: {
                ...prev.dokumen_pendukung,
                [key]: file ? { file, url: URL.createObjectURL(file) } : null
            }
        }));
    };

    const handleSubmit = async () => {
        if (!canEdit) return;
        if (!form.nama_barang || !form.detail_gadai_id) {
            alert('Nama Barang dan Nasabah harus diisi!');
            return;
        }

        try {
            setSaving(true);
            const data = new FormData();
            data.append('_method', 'POST'); // jika perlu PUT, ubah sesuai
            ['nama_barang','grade','imei','warna','kunci_password','kunci_pin','kunci_pola','ram','rom','type_hp','merk','detail_gadai_id'].forEach(key => {
                if(form[key]) data.append(key, form[key]);
            });

            form.kelengkapan.forEach(item => data.append('kelengkapan[]', item));
            form.kerusakan.forEach(item => data.append('kerusakan[]', item));

            Object.entries(form.dokumen_pendukung).forEach(([k,v]) => {
                if(v?.file) data.append(`dokumen_pendukung[${k}]`, v.file);
            });

            const res = await axiosInstance.post(getBaseUrl('gadai-hp'), data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if(res.data.success){
                alert('Data berhasil ditambahkan');
                navigate('/gadai-hp');
            } else {
                alert(res.data.message || 'Gagal menambahkan data');
            }

        } catch (err) {
            console.error(err.response?.data || err);
            if(err.response?.data?.errors){
                const messages = Object.values(err.response.data.errors).flat().join('\n');
                alert(`Validasi gagal:\n${messages}`);
            } else {
                alert(err.response?.data?.message || 'Terjadi kesalahan server');
            }
        } finally {
            setSaving(false);
        }
    };

    if(loading){
        return (
            <Stack alignItems="center" justifyContent="center" sx={{ height: '80vh' }}>
                <CircularProgress />
            </Stack>
        );
    }

    const dokumenKeys = form.nama_barang ? DOKUMEN_SOP[form.nama_barang] : [];

    return (
        <Card sx={{ p: 2 }}>
            <CardHeader title="Tambah Data Gadai HP" />
            <CardContent>
                <Grid container spacing={2}>
                    {/* Nama Barang */}
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Nama Barang</InputLabel>
                            <Select
                                value={form.nama_barang}
                                name="nama_barang"
                                label="Nama Barang"
                                onChange={(e) => {
                                    if(!canEdit) return;
                                    const nama = e.target.value;
                                    setForm(prev => ({
                                        ...prev,
                                        nama_barang: nama,
                                        dokumen_pendukung: DOKUMEN_SOP[nama].reduce((acc,k)=> ({...acc,[k]: null}),{})
                                    }));
                                }}
                                disabled={!canEdit}
                            >
                                {NAMA_BARANG_LIST.map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Pilih Nasabah */}
                    <Grid item xs={12} sm={6}>
                        <Autocomplete
                            options={uniqueNasabah}
                            getOptionLabel={(option) => option.nama_lengkap || ''}
                            value={selectedNasabah}
                            onChange={(e,newValue)=>{
                                if(!canEdit) return;
                                setSelectedNasabah(newValue);
                                const detail = detailGadai.find(d=>d.nasabah?.id===newValue?.id);
                                setForm(prev => ({ ...prev, detail_gadai_id: detail?.id || '' }));
                            }}
                            renderInput={(params)=>(
                                <TextField {...params} label="Nama Nasabah" placeholder="Cari nama nasabah..." size="small" fullWidth disabled={!canEdit} />
                            )}
                        />
                    </Grid>

                    {/* Field Lain */}
                    {['grade','imei','warna','kunci_password','kunci_pin','kunci_pola','ram','rom','type_hp','merk'].map(key => (
                        <Grid item xs={12} sm={6} key={key}>
                            <TextField
                                label={key.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                                name={key}
                                value={form[key]}
                                onChange={handleChange}
                                fullWidth size="small" disabled={!canEdit}
                            />
                        </Grid>
                    ))}

                    {/* Kelengkapan */}
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Kelengkapan</Typography>
                        <FormGroup>
                            {KELENGKAPAN_LIST.map(item => (
                                <FormControlLabel
                                    key={item}
                                    control={<Checkbox checked={form.kelengkapan.includes(item)} onChange={()=>handleCheckboxChange('kelengkapan',item)} disabled={!canEdit}/>}
                                    label={item}
                                />
                            ))}
                        </FormGroup>
                    </Grid>

                    {/* Kerusakan */}
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Kerusakan</Typography>
                        <FormGroup>
                            {KERUSAKAN_LIST.map(item => (
                                <FormControlLabel
                                    key={item}
                                    control={<Checkbox checked={form.kerusakan.includes(item)} onChange={()=>handleCheckboxChange('kerusakan',item)} disabled={!canEdit}/>}
                                    label={item}
                                />
                            ))}
                        </FormGroup>
                    </Grid>

                    {/* Dokumen Pendukung */}
                    {form.nama_barang && dokumenKeys.length > 0 && (
                        <Grid item xs={12}>
                            <Alert severity="info">
                                Silakan upload dokumen pendukung sesuai jenis: <strong>{form.nama_barang}</strong>. 
                                Dokumen wajib diupload: {dokumenKeys.map(k=>k.replace(/_/g,' ').toUpperCase()).join(', ')}.
                            </Alert>
                        </Grid>
                    )}

                    {dokumenKeys.map(key=>(
                        <Grid item xs={12} sm={6} key={key}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>{key.replace(/_/g,' ').toUpperCase()}</Typography>
                            <Box sx={{display:'flex',alignItems:'center',justifyContent:'space-between',p:1.5,border:'1px dashed #ccc',borderRadius:2,bgcolor:'#fafafa'}}>
                                <Typography variant="body2" sx={{ flex:1, wordBreak:'break-all' }}>
                                    {form.dokumen_pendukung[key]?.file?.name || 'Belum ada file dipilih'}
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                    <Button variant="contained" component="label" size="small" disabled={!canEdit}>
                                        Upload
                                        <input type="file" hidden onChange={(e)=>handleDokumenChange(key,e.target.files[0])}/>
                                    </Button>
                                    {form.dokumen_pendukung[key]?.file && (
                                        <Button variant="outlined" color="error" size="small" onClick={()=>handleDokumenChange(key,null)} disabled={!canEdit}>
                                            Hapus
                                        </Button>
                                    )}
                                </Stack>
                            </Box>
                        </Grid>
                    ))}

                </Grid>

                {/* Buttons */}
                {canEdit && (
                    <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt:4 }}>
                        <Button variant="outlined" onClick={()=>navigate('/gadai-hp')}>Batal</Button>
                        <Button variant="contained" color="primary" onClick={handleSubmit} disabled={saving}>
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
};

export default TambahGadaiHpPage;
