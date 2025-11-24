// TambahGadaiHpPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
    Card, CardHeader, CardContent, Button,
    Grid, Stack, CircularProgress, FormGroup, FormControlLabel, Checkbox,
    Box, Typography, Select, MenuItem, InputLabel, FormControl, Alert, Paper, TextField,
    Radio, RadioGroup
} from '@mui/material';
import axiosInstance from 'api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from 'AuthContex/AuthContext';

const KELENGKAPAN_LIST = ['Box', 'Charger', 'Kabel Data', 'Buku Garansi', 'Kartu Garansi', 'Tusuk SIM'];
const NAMA_BARANG_LIST = ['Android', 'Samsung', 'iPhone'];
const DOKUMEN_SOP = {
    Android: ['body', 'imei', 'about', 'akun', 'admin', 'cam_depan', 'cam_belakang', 'rusak'],
    Samsung: ['body', 'imei', 'about', 'samsung_account', 'admin', 'cam_depan', 'cam_belakang', 'galaxy_store'],
    iPhone: ['body', 'imei', 'about', 'icloud', 'battery', '3utools', 'iunlocker', 'cek_pencurian'],
};

const TambahGadaiHpPage = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const userRole = (user?.role || '').toLowerCase();
    const canEdit = ['hm', 'checker'].includes(userRole);

    const getBaseUrl = (resource) => {
        switch (userRole) {
            case 'checker': return `/checker/${resource}`;
            case 'petugas': return `/petugas/${resource}`;
            default: return `/${resource}`;
        }
    };

    const [form, setForm] = useState({
        nama_barang: '',
        detail_gadai_id: '',
        imei: '',
        warna: '',
        ram: '',
        rom: '',
        kunci_password: '',
        kunci_pin: '',
        kunci_pola: '',
        merk_hp_id: '',
        type_hp_id: '',
        grade_nominal: {},
        selected_grade: '',
        kelengkapan: [],
        kerusakan: {},
        dokumen_pendukung: {}
    });

    const [merkList, setMerkList] = useState([]);
    const [typeList, setTypeList] = useState([]);
    const [gradeList, setGradeList] = useState([]);
    const [kerusakanList, setKerusakanList] = useState([]);
    const [detailGadai, setDetailGadai] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const normalizeListFromResponse = (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (res.items && Array.isArray(res.items)) return res.items;
        if (res.data && Array.isArray(res.data)) return res.data;
        return [];
    };

    // ==============================
    // Fetch Data
    // ==============================
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [merkRes, kerusakanRes, detailRes] = await Promise.all([
                    axiosInstance.get(getBaseUrl('merk-hp')),
                    axiosInstance.get(getBaseUrl('kerusakan')),
                    axiosInstance.get(getBaseUrl('detail-gadai'))
                ]);

                setMerkList(normalizeListFromResponse(merkRes?.data?.data ?? merkRes?.data));
                setKerusakanList(normalizeListFromResponse(kerusakanRes?.data?.data ?? kerusakanRes?.data));

                const detailArr = normalizeListFromResponse(detailRes?.data?.data ?? detailRes?.data);
                const normalizedDetail = detailArr.map(d => {
                    const nama_nasabah = d.nama_nasabah ?? d.nasabah?.nama_lengkap ?? '-';
                    return { id: d.id, raw: d, nama_nasabah };
                });
                setDetailGadai(normalizedDetail);

            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    // ==============================
    // Fetch type by merk
    // ==============================
    useEffect(() => {
        if (!form.merk_hp_id) return setTypeList([]);
        const fetchType = async () => {
            try {
                const res = await axiosInstance.get(getBaseUrl(`type-hp/by-merk/${form.merk_hp_id}`));
                setTypeList(normalizeListFromResponse(res?.data?.data ?? res?.data));
                setForm(prev => ({ ...prev, type_hp_id: '', grade_nominal: {}, selected_grade: '' }));
                setGradeList([]);
            } catch (err) { console.error(err); }
        };
        fetchType();
    }, [form.merk_hp_id, userRole]);

    // ==============================
    // Fetch grade by type
    // ==============================
    useEffect(() => {
        if (!form.type_hp_id) return setGradeList([]);
        const fetchGrade = async () => {
            try {
                const res = await axiosInstance.get(getBaseUrl(`grade-hp/by-type/${form.type_hp_id}`));
                const grades = normalizeListFromResponse(res?.data?.data ?? res?.data);
                setGradeList(grades);

                if (grades.length > 0) {
                    const first = grades[0];
                    const gradeNom = {};
                    ['a', 'b', 'c'].forEach(g => {
                        if (first[`harga_grade_${g}`] !== undefined) gradeNom[g.toUpperCase()] = first[`harga_grade_${g}`];
                    });
                    setForm(prev => ({ ...prev, grade_nominal: gradeNom, selected_grade: '' }));
                }
            } catch (err) { console.error(err); }
        };
        fetchGrade();
    }, [form.type_hp_id, userRole]);

    // ==============================
    // Handlers
    // ==============================
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (field, value, nominal = 0) => {
        if (!canEdit) return;
        if (field === 'kerusakan') {
            setForm(prev => {
                const kerus = { ...prev.kerusakan };
                if (kerus[value]) delete kerus[value];
                else kerus[value] = { nominal_override: nominal };
                return { ...prev, kerusakan: kerus };
            });
        } else {
            setForm(prev => {
                const current = prev[field] || [];
                return { ...prev, [field]: current.includes(value) ? current.filter(v => v !== value) : [...current, value] };
            });
        }
    };

    const handleSelectGrade = (gradeLetter) => {
        if (!canEdit) return;
        setForm(prev => ({ ...prev, selected_grade: gradeLetter }));
    };

    // ==============================
    // Submit
    // ==============================
    const handleSubmit = async () => {
        if (!canEdit) return;
        if (!form.nama_barang || !form.detail_gadai_id) {
            alert('Nama Barang dan Nasabah harus diisi!');
            return;
        }
        try {
            setSaving(true);
            const data = new FormData();
            Object.entries(form).forEach(([k, v]) => {
                if (!['kerusakan', 'grade_nominal', 'selected_grade', 'dokumen_pendukung', 'kelengkapan'].includes(k)) {
                    data.append(k, v ?? '');
                }
            });

            // grade
            if (form.selected_grade) {
                const selectedGradeRecord = gradeList[0]; 
                data.append('grade_hp_id', selectedGradeRecord.id);
                data.append('grade_type', form.selected_grade);
            }

            // kelengkapan
            (form.kelengkapan || []).forEach(k => data.append('kelengkapan[]', k));

            // kerusakan
            const kerusArr = Object.entries(form.kerusakan || {}).map(([id, v]) => ({ id, nominal_override: v?.nominal_override }));
            if (kerusArr.length) data.append('kerusakan', JSON.stringify(kerusArr));

            // dokumen pendukung
            Object.entries(form.dokumen_pendukung || {}).forEach(([k, v]) => {
                if (v?.file) data.append(`dokumen_pendukung[${k}]`, v.file);
            });

            const res = await axiosInstance.post(getBaseUrl('gadai-hp'), data, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res.data?.success) { alert('Data berhasil ditambahkan'); navigate('/gadai-hp'); }
            else alert(res.data?.message || 'Gagal menambahkan data');

        } catch (err) {
            console.error(err.response?.data || err);
            alert(err.response?.data?.message || err.message || 'Terjadi kesalahan server');
        } finally { setSaving(false); }
    };

    if (loading) return <Stack alignItems="center" justifyContent="center" sx={{ height: '80vh' }}><CircularProgress /></Stack>;

    const dokumenKeys = form.nama_barang ? (DOKUMEN_SOP[form.nama_barang] || []) : [];

    return (
        <Card sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
            <CardHeader title="Tambah Data Gadai HP" sx={{ mb: 2 }} />
            <CardContent>
                <Grid container spacing={2}>
                    {/* Nama Barang */}
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Nama Barang</InputLabel>
                            <Select value={form.nama_barang} label="Nama Barang" onChange={e => {
                                const nama = e.target.value;
                                setForm(prev => ({
                                    ...prev,
                                    nama_barang: nama,
                                    dokumen_pendukung: (DOKUMEN_SOP[nama] || []).reduce((acc, k) => ({ ...acc, [k]: prev.dokumen_pendukung[k] || null }), {})
                                }));
                            }}>
                                {NAMA_BARANG_LIST.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Nasabah */}
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Nasabah</InputLabel>
                            <Select value={form.detail_gadai_id} name="detail_gadai_id" onChange={handleChange}>
                                {detailGadai.map(d => <MenuItem key={d.id} value={d.id}>{d.nama_nasabah}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* IMEI, Warna, Ram, Rom, Kunci */}
                    <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="IMEI" name="imei" value={form.imei} onChange={handleChange} /></Grid>
                    <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Warna" name="warna" value={form.warna} onChange={handleChange} /></Grid>
                    <Grid item xs={12} sm={3}><TextField fullWidth size="small" label="RAM" name="ram" value={form.ram} onChange={handleChange} /></Grid>
                    <Grid item xs={12} sm={3}><TextField fullWidth size="small" label="ROM" name="rom" value={form.rom} onChange={handleChange} /></Grid>
                    <Grid item xs={12} sm={2}><TextField fullWidth size="small" label="Kunci Password" name="kunci_password" value={form.kunci_password} onChange={handleChange} /></Grid>
                    <Grid item xs={12} sm={2}><TextField fullWidth size="small" label="Kunci PIN" name="kunci_pin" value={form.kunci_pin} onChange={handleChange} /></Grid>
                    <Grid item xs={12} sm={2}><TextField fullWidth size="small" label="Kunci Pola" name="kunci_pola" value={form.kunci_pola} onChange={handleChange} /></Grid>

                    {/* Merk & Type */}
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Merk HP</InputLabel>
                            <Select value={form.merk_hp_id} name="merk_hp_id" onChange={handleChange}>
                                {merkList.map(m => <MenuItem key={m.id} value={m.id}>{m.nama_merk}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Type HP</InputLabel>
                            <Select value={form.type_hp_id} name="type_hp_id" onChange={handleChange}>
                                {typeList.map(t => <MenuItem key={t.id} value={t.id}>{t.nama_type}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Grade */}
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Pilih Grade HP</Typography>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <RadioGroup value={form.selected_grade} onChange={e => handleSelectGrade(e.target.value)}>
                                {['A', 'B', 'C'].map(g => {
                                    if (!form.grade_nominal[g]) return null;
                                    const isSelected = form.selected_grade === g;
                                    const nominalVal = form.grade_nominal[g];
                                    return (
                                        <Box key={g} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <FormControlLabel value={g} control={<Radio />} label={g} sx={{ flex: 1 }} />
                                            {isSelected && (
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={nominalVal}
                                                    onChange={e => setForm(prev => ({ ...prev, grade_nominal: { ...prev.grade_nominal, [g]: parseInt(e.target.value || 0, 10) } }))}
                                                    sx={{ width: 140 }}
                                                    InputProps={{ startAdornment: <Typography sx={{ mr: 0.5 }}>Rp</Typography> }}
                                                />
                                            )}
                                        </Box>
                                    )
                                })}
                            </RadioGroup>
                        </Paper>
                    </Grid>

                    {/* Kerusakan */}
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Kerusakan</Typography>
                        <Paper variant="outlined" sx={{ p: 1, maxHeight: 220, overflow: 'auto' }}>
                            <FormGroup>
                                {kerusakanList.map(k => {
                                    const isChecked = !!form.kerusakan[k.id];
                                    const nominalValue = form.kerusakan[k.id]?.nominal_override ?? k.nominal;
                                    return (
                                        <Box key={k.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <FormControlLabel
                                                control={<Checkbox checked={isChecked} onChange={() => handleCheckboxChange('kerusakan', k.id, k.nominal)} />}
                                                label={k.nama_kerusakan} sx={{ flex: 1 }}
                                            />
                                            {isChecked && (
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={nominalValue}
                                                    onChange={e => {
                                                        const val = parseInt(e.target.value || 0, 10);
                                                        setForm(prev => ({ ...prev, kerusakan: { ...prev.kerusakan, [k.id]: { nominal_override: val } } }));
                                                    }}
                                                    sx={{ width: 140 }}
                                                    InputProps={{ startAdornment: <Typography sx={{ mr: 0.5 }}>Rp</Typography> }}
                                                />
                                            )}
                                        </Box>
                                    )
                                })}
                            </FormGroup>
                        </Paper>
                    </Grid>

                    {/* Kelengkapan */}
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Kelengkapan</Typography>
                        <Paper variant="outlined" sx={{ p: 1 }}>
                            <FormGroup>
                                {KELENGKAPAN_LIST.map(item => (
                                    <FormControlLabel
                                        key={item}
                                        control={<Checkbox checked={form.kelengkapan.includes(item)} onChange={() => handleCheckboxChange('kelengkapan', item)} />}
                                        label={item}
                                    />
                                ))}
                            </FormGroup>
                        </Paper>
                    </Grid>

                    {/* Dokumen */}
                    {form.nama_barang && dokumenKeys.length > 0 && (
                        <Grid item xs={12}>
                            <Alert severity="info" sx={{ mb: 1 }}>
                                Upload dokumen pendukung untuk <strong>{form.nama_barang}</strong>: {dokumenKeys.map(k => k.replace(/_/g, ' ').toUpperCase()).join(', ')}.
                            </Alert>
                            <Grid container spacing={2}>
                                {dokumenKeys.map(k => (
                                    <Grid item xs={12} sm={6} key={k}>
                                        <Typography variant="subtitle2">{k.replace(/_/g, ' ').toUpperCase()}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, border: '1px dashed #ccc', borderRadius: 2, bgcolor: '#fafafa' }}>
                                            <Typography sx={{ flex: 1, wordBreak: 'break-all' }}>{form.dokumen_pendukung[k]?.file?.name || 'Belum ada file dipilih'}</Typography>
                                            <Stack direction="row" spacing={1}>
                                                <Button variant="contained" component="label" size="small">
                                                    Pilih File
                                                    <input type="file" hidden onChange={e => {
                                                        const file = e.target.files[0];
                                                        setForm(prev => ({ ...prev, dokumen_pendukung: { ...prev.dokumen_pendukung, [k]: { file } } }));
                                                    }} />
                                                </Button>
                                                {form.dokumen_pendukung[k]?.file && (
                                                    <Button variant="outlined" color="error" size="small" onClick={() => setForm(prev => ({ ...prev, dokumen_pendukung: { ...prev.dokumen_pendukung, [k]: null } }))}>Hapus</Button>
                                                )}
                                            </Stack>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Grid>
                    )}

                    {/* Tombol Simpan */}
                    {canEdit && (
                        <Grid item xs={12}>
                            <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 2 }}>
                                <Button variant="outlined" onClick={() => navigate('/gadai-hp')}>Batal</Button>
                                <Button variant="contained" color="primary" onClick={handleSubmit} disabled={saving}>
                                    {saving ? 'Menyimpan...' : 'Simpan'}
                                </Button>
                            </Stack>
                        </Grid>
                    )}
                </Grid>
            </CardContent>
        </Card>
    );
};

export default TambahGadaiHpPage;
