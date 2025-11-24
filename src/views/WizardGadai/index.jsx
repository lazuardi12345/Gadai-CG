import React, { useState, useEffect } from "react";
import {
  Card, CardHeader, CardContent, TextField, Button,
  Grid, Stack, CircularProgress, FormGroup, FormControlLabel,
  Checkbox, Box, Typography, FormControl, InputLabel, Select, MenuItem, Paper, Radio, RadioGroup
} from "@mui/material";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

const NAMA_BARANG_LIST = ['Android', 'Samsung', 'iPhone'];
const KELENGKAPAN_LIST = ['Box', 'Charger', 'Kabel Data', 'Buku Garansi', 'Kartu Garansi', 'Tusuk SIM'];
const KELENGKAPAN_COMMON = ['Sertifikat', 'Nota', 'Kartu Garansi'];
const DOKUMEN_SOP_HP = {
  Android: ['body', 'imei', 'about', 'akun', 'admin', 'cam_depan', 'cam_belakang', 'rusak'],
  Samsung: ['body', 'imei', 'about', 'samsung_account', 'admin', 'cam_depan', 'cam_belakang', 'galaxy_store'],
  iPhone: ['body', 'imei', 'about', 'icloud', 'battery', '3utools', 'iunlocker', 'cek_pencurian']
};
const DOKUMEN_SOP_COMMON = ['emas_timbangan', 'gosokan_timer', 'gosokan_ktp', 'batu', 'cap_merek', 'karatase', 'ukuran_batu'];

const GadaiWizardPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [nasabah, setNasabah] = useState({ nama_lengkap: "", nik: "", alamat: "", no_hp: "", no_rek: "", id: null });
  const [fotoKtp, setFotoKtp] = useState(null);

  const [detail, setDetail] = useState({ tanggal_gadai: "", jatuh_tempo: "", taksiran: "", uang_pinjaman: "", type_id: "", type_name: "", id: null });
  const [types, setTypes] = useState([]);

  const [barang, setBarang] = useState({
    nama_barang: "", kelengkapan: [], kerusakan: [], grade_hp_id: 0, grade_type: "",
    imei: "", warna: "", kunci_password: "", kunci_pin: "", kunci_pola: "",
    ram: "", rom: "", type_hp_id: "", merk_hp_id: "", kode_cap: "",
    karat: "", potongan_batu: "", berat: "", dokumen_pendukung: {}
  });

  const [merkHp, setMerkHp] = useState([]);
  const [typeHpByMerk, setTypeHpByMerk] = useState([]);
  const [gradeHp, setGradeHp] = useState(null);
  const [kerusakanList, setKerusakanList] = useState([]);

  const normalizeDataArray = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res.data && Array.isArray(res.data)) return res.data;
    if (res.items && Array.isArray(res.items)) return res.items;
    return [];
  };

  const handleNasabahChange = (e) => {
    const { name, value } = e.target;
    setNasabah(prev => ({ ...prev, [name]: value }));
  };

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setDetail(prev => ({ ...prev, [name]: value }));

    if (name === "type_id") {
      const t = types.find(x => x.id?.toString() === value?.toString());
      setDetail(prev => ({ ...prev, type_name: t?.nama_type || "" }));
    }
  };

  const handleBarangChange = (e) => {
    const { name, value } = e.target;
    setBarang(prev => ({ ...prev, [name]: value }));
  };

  const handleKelengkapanChange = (val) => {
    setBarang(prev => {
      const exists = prev.kelengkapan.includes(val);
      return { ...prev, kelengkapan: exists ? prev.kelengkapan.filter(v => v !== val) : [...prev.kelengkapan, val] };
    });
  };

  const handleKerusakanToggle = (id) => {
    setBarang(prev => {
      const exists = prev.kerusakan.includes(id);
      return { ...prev, kerusakan: exists ? prev.kerusakan.filter(v => v !== id) : [...prev.kerusakan, id] };
    });
  };

  const handleDokumenChange = (key, file) => {
    setBarang(prev => ({ ...prev, dokumen_pendukung: { ...prev.dokumen_pendukung, [key]: file } }));
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [typesRes, merkRes, kerusRes] = await Promise.all([
          axiosInstance.get("/petugas/type").catch(e => e),
          axiosInstance.get("/petugas/merk-hp").catch(e => e),
          axiosInstance.get("/petugas/kerusakan").catch(e => e)
        ]);

        setTypes(normalizeDataArray(typesRes?.data?.data ?? typesRes));
        setMerkHp(normalizeDataArray(merkRes?.data?.data ?? merkRes));
        setKerusakanList(normalizeDataArray(kerusRes?.data?.data ?? kerusRes));
      } catch (err) {
        console.error(err);
        alert("Gagal mengambil data awal.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const fetchTypeHpByMerk = async (merkId) => {
    if (!merkId) return setTypeHpByMerk([]);
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/petugas/type-hp/by-merk/${merkId}`);
      setTypeHpByMerk(normalizeDataArray(res?.data?.data ?? res));
    } catch (err) {
      console.error(err);
      setTypeHpByMerk([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (barang.merk_hp_id) {
      fetchTypeHpByMerk(barang.merk_hp_id);
    } else {
      setTypeHpByMerk([]);
    }
  }, [barang.merk_hp_id]);


  useEffect(() => {
    if (!barang.type_hp_id) return setGradeHp(null);
    const fetchGradesByType = async () => {
      try {
        const res = await axiosInstance.get(`/petugas/grade-hp/by-type/${barang.type_hp_id}`);
        setGradeHp(Array.isArray(res.data.data) ? res.data.data[0] : null);
      } catch (err) {
        console.error(err);
        setGradeHp(null);
      }
    };
    fetchGradesByType();
  }, [barang.type_hp_id]);

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmitFinal = async () => {
  // --- VALIDASI STEP ---
  if (!nasabah.nama_lengkap || !nasabah.nik || !nasabah.no_hp || !fotoKtp) {
    setStep(1);
    return alert("Lengkapi data nasabah dan upload foto KTP.");
  }
  if (!detail.tanggal_gadai || !detail.jatuh_tempo || !detail.type_id) {
    setStep(2);
    return alert("Lengkapi tanggal gadai, jatuh tempo, dan tipe gadai.");
  }
  if (!barang.nama_barang) {
    setStep(3);
    return alert("Nama barang wajib diisi.");
  }

  try {
    setLoading(true);
    const formData = new FormData();

    // --- Nasabah ---
    Object.entries(nasabah).forEach(([k, v]) => {
      if (v) formData.append(`nasabah[${k}]`, v);
    });
    if (fotoKtp) formData.append("nasabah[foto_ktp]", fotoKtp);

    // --- Detail ---
    Object.entries(detail).forEach(([k, v]) => {
      if (v) formData.append(`detail[${k}]`, v);
    });

    // --- Barang (kecuali dokumen_pendukung & kerusakan) ---
    Object.entries(barang).forEach(([k, v]) => {
      if (k === "dokumen_pendukung" || k === "kerusakan") return;
      if (Array.isArray(v)) v.forEach(i => i && formData.append(`barang[${k}][]`, i));
      else if (v) formData.append(`barang[${k}]`, v);
    });

    // --- Dokumen pendukung ---
    Object.entries(barang.dokumen_pendukung || {}).forEach(([key, file]) => {
      if (file) formData.append(`barang[dokumen_pendukung][${key}]`, file);
    });

    // --- Kerusakan (HP) ---
    if (detail.type_name === "Handphone" && barang.kerusakan?.length > 0) {
      const kerusakanPayload = barang.kerusakan.map(id => ({ id, nominal_override: null }));
      formData.append("barang[kerusakan]", JSON.stringify(kerusakanPayload));
    }

    // --- Grade HP ---
    if (barang.grade_hp_id) formData.append("barang[grade_hp_id]", barang.grade_hp_id);
    if (barang.grade_type) formData.append("barang[grade_type]", barang.grade_type);

    // --- SUBMIT KE BACKEND ---
    const res = await axiosInstance.post("/petugas/gadai-wizard", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    if (!res?.data?.success) return alert(res?.data?.message || "Gagal menyimpan data.");

    alert("Data gadai berhasil disimpan.");
    navigate("/data-nasabah");

  } catch (err) {
    console.error(err);
    alert(err?.response?.data?.message || "Terjadi kesalahan saat menyimpan data.");
  } finally {
    setLoading(false);
  }
};




  if (loading) return (
    <Stack alignItems="center" justifyContent="center" sx={{ height: '80vh' }}>
      <CircularProgress />
    </Stack>
  );


  /* ------------------ Render UI ------------------ */
  return (
    <Card sx={{ p: 2 }}>
      <CardHeader title="Tambah Gadai " />
      <CardContent>
        {/* STEP 1 - Nasabah */}
        {step === 1 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Nama Lengkap" name="nama_lengkap" value={nasabah.nama_lengkap} onChange={handleNasabahChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="NIK" name="nik" value={nasabah.nik} onChange={handleNasabahChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Alamat" name="alamat" value={nasabah.alamat} onChange={handleNasabahChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="No HP" name="no_hp" value={nasabah.no_hp} onChange={handleNasabahChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="No Rekening" name="no_rek" value={nasabah.no_rek} onChange={handleNasabahChange} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Stack spacing={1}>
                <Typography variant="subtitle2">Upload Foto KTP</Typography>
                <Button variant="contained" component="label">
                  Pilih File
                  <input type="file" hidden accept="image/*" onChange={e => setFotoKtp(e.target.files?.[0])} />
                </Button>
                {fotoKtp && <Box sx={{ mt: 2, width: 300 }}><img src={URL.createObjectURL(fotoKtp)} alt="KTP preview" style={{ width: '100%', borderRadius: 8 }} /></Box>}
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" justifyContent="flex-end">
                <Button variant="contained" onClick={nextStep}>Lanjut</Button>
              </Stack>
            </Grid>
          </Grid>
        )}

        {/* STEP 2 - Detail */}
        {step === 2 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Tanggal Gadai" name="tanggal_gadai" type="date" value={detail.tanggal_gadai} onChange={handleDetailChange} InputLabelProps={{ shrink: true }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" disabled={!detail.tanggal_gadai}>
                <InputLabel>Jatuh Tempo</InputLabel>
                <Select name="jatuh_tempo" value={detail.jatuh_tempo || ""} onChange={handleDetailChange} label="Jatuh Tempo">
                  {[15, 30].map(d => {
                    const dt = new Date(detail.tanggal_gadai);
                    dt.setDate(dt.getDate() + d);
                    const value = isNaN(dt.getTime()) ? "" : dt.toISOString().split('T')[0];
                    return <MenuItem key={d} value={value}>{d} Hari — {isNaN(dt.getTime()) ? '-' : dt.toLocaleDateString('id-ID')}</MenuItem>;
                  })}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Taksiran" name="taksiran" type="number" value={detail.taksiran} onChange={handleDetailChange} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Uang Pinjaman" name="uang_pinjaman" type="number" value={detail.uang_pinjaman} onChange={handleDetailChange} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Jenis Gadai</InputLabel>
                <Select name="type_id" value={detail.type_id || ""} onChange={handleDetailChange} label="Jenis Gadai">
                  {types.map(t => <MenuItem key={t.id} value={t.id}>{t.nama_type}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" justifyContent="space-between">
                <Button variant="outlined" onClick={prevStep}>Kembali</Button>
                <Button variant="contained" onClick={nextStep}>Lanjut ke Barang</Button>
              </Stack>
            </Grid>
          </Grid>
        )}

        {/* STEP 3 - Barang (HP / Perhiasan / Logam Mulia / Retro) */}
        {step === 3 && (
          <Grid container spacing={2}>
            {/* Nama Barang */}
            <Grid item xs={12} sm={6}>
              {detail.type_name === "Handphone" ? (
                <FormControl fullWidth size="small">
                  <InputLabel>Nama Barang</InputLabel>
                  <Select name="nama_barang" value={barang.nama_barang} onChange={handleBarangChange} label="Nama Barang">
                    {NAMA_BARANG_LIST.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                  </Select>
                </FormControl>
              ) : (
                <TextField fullWidth size="small" label="Nama Barang" name="nama_barang" value={barang.nama_barang} onChange={handleBarangChange} />
              )}
            </Grid>

            {/* Jika Handphone, tampilkan Merk & Type HP */}
            {detail.type_name === "Handphone" && (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Merk HP</InputLabel>
                    <Select
                      name="merk_hp_id"
                      value={barang.merk_hp_id || ""}
                      onChange={(e) => {
                        handleBarangChange(e);
                        const merkId = e.target.value;
                        setBarang(prev => ({ ...prev, type_hp_id: "", grade_hp_id: 0, grade_type: "" }));
                        fetchTypeHpByMerk(merkId);
                      }}

                    >
                      {merkHp.map(m => <MenuItem key={m.id} value={m.id}>{m.nama_merk}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type HP</InputLabel>
                    <Select name="type_hp_id" value={barang.type_hp_id || ""} onChange={(e) => {
                      handleBarangChange(e);

                    }}>
                      {typeHpByMerk.map(t => <MenuItem key={t.id} value={t.id}>{t.nama_type}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            {/* Fields common for HP */}
            {detail.type_name === "Handphone" && (
              <>
                {["imei", "warna", "kunci_password", "kunci_pin", "kunci_pola", "ram", "rom"].map(k => (
                  <Grid key={k} item xs={12} sm={6}>
                    <TextField fullWidth size="small" label={k.replace('_', ' ').toUpperCase()} name={k} value={barang[k] || ""} onChange={handleBarangChange} />
                  </Grid>
                ))}

                {/* Grade choices from gradesByType */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Pilih Grade HP</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      {!gradeHp ? (
                        <Typography variant="body2">Pilih Type HP terlebih dahulu untuk melihat grade.</Typography>
                      ) : (
                        <>
                          {/* Grade A */}
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={barang.grade_type === "A"}
                                onChange={() =>
                                  setBarang(prev => ({
                                    ...prev,
                                    grade_type: "A",
                                    grade_hp_id: gradeHp.id,
                                    grade_nominal: gradeHp.harga_grade_a
                                  }))
                                }
                              />
                            }
                            label={`Grade A — Rp ${gradeHp.harga_grade_a}`}
                          />

                          {/* Grade B */}
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={barang.grade_type === "B"}
                                onChange={() =>
                                  setBarang(prev => ({
                                    ...prev,
                                    grade_type: "B",
                                    grade_hp_id: gradeHp.id,
                                    grade_nominal: gradeHp.harga_grade_b
                                  }))
                                }
                              />
                            }
                            label={`Grade B — Rp ${gradeHp.harga_grade_b}`}
                          />

                          {/* Grade C */}
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={barang.grade_type === "C"}
                                onChange={() =>
                                  setBarang(prev => ({
                                    ...prev,
                                    grade_type: "C",
                                    grade_hp_id: gradeHp.id,
                                    grade_nominal: gradeHp.harga_grade_c
                                  }))
                                }
                              />
                            }
                            label={`Grade C — Rp ${gradeHp.harga_grade_c}`}
                          />
                        </>
                      )}
                    </Stack>
                  </Paper>
                </Grid>


              </>
            )}

            {/* Fields for non-HP (Perhiasan / Logam Mulia / Retro) */}
            {detail.type_name !== "Handphone" && (
              <>
                {/* example specific fields */}
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Kode Cap" name="kode_cap" value={barang.kode_cap || ""} onChange={handleBarangChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Karat" name="karat" value={barang.karat || ""} onChange={handleBarangChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Potongan Batu" name="potongan_batu" value={barang.potongan_batu || ""} onChange={handleBarangChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Berat" name="berat" value={barang.berat || ""} onChange={handleBarangChange} />
                </Grid>
              </>
            )}

            {/* Kerusakan (HP) fetched from API */}
            {detail.type_name === "Handphone" && (
              <Grid item xs={12}>
                <Typography variant="subtitle2">Kerusakan</Typography>
                <Paper variant="outlined" sx={{ p: 1, maxHeight: 260, overflow: 'auto' }}>
                  <FormGroup>
                    {kerusakanList.length ? kerusakanList.map(k => {
                      const label = k.nama_kerusakan ?? k.name ?? '-';
                      const id = k.id ?? k.key ?? label;
                      return (
                        <FormControlLabel
                          key={id}
                          control={<Checkbox checked={barang.kerusakan.includes(id)} onChange={() => handleKerusakanToggle(id)} />}
                          label={`${label}${k.nominal ? ` — Rp ${k.nominal}` : ''}`}
                        />
                      );
                    }) : <Typography variant="body2">Tidak ada data kerusakan.</Typography>}
                  </FormGroup>
                </Paper>
              </Grid>
            )}

            {/* Kelengkapan */}
            <Grid item xs={12}>
              <Typography variant="subtitle2">Kelengkapan</Typography>
              <Paper variant="outlined" sx={{ p: 1 }}>
                <FormGroup row>
                  {(detail.type_name === "Handphone" ? KELENGKAPAN_LIST : KELENGKAPAN_COMMON).map(k => (
                    <FormControlLabel key={k} control={<Checkbox checked={barang.kelengkapan.includes(k)} onChange={() => handleKelengkapanChange(k)} />} label={k} />
                  ))}
                </FormGroup>
              </Paper>
            </Grid>

            {/* Dokumen pendukung dynamic */}
            <Grid item xs={12}>
              <Typography variant="subtitle2">Dokumen Pendukung</Typography>
            </Grid>
            {(detail.type_name === "Handphone" ? (DOKUMEN_SOP_HP[barang.nama_barang] || []) : DOKUMEN_SOP_COMMON).map(key => (
              <Grid key={key} item xs={12} sm={6}>
                <Typography sx={{ mb: 1 }}>{key.replace(/_/g, ' ').toUpperCase()}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, border: '1px dashed #ccc', borderRadius: 2 }}>
                  <Typography sx={{ flex: 1, wordBreak: 'break-all' }}>{barang.dokumen_pendukung?.[key]?.name ?? 'Belum ada file'}</Typography>
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" component="label" size="small">
                      Pilih File
                      <input type="file" hidden onChange={(e) => handleDokumenChange(key, e.target.files?.[0])} />
                    </Button>
                    {barang.dokumen_pendukung?.[key] && <Button variant="outlined" color="error" size="small" onClick={() => handleDokumenChange(key, null)}>Hapus</Button>}
                  </Stack>
                </Box>
              </Grid>
            ))}

            {/* Buttons */}
            <Grid item xs={12}>
              <Stack direction="row" justifyContent="space-between">
                <Button variant="outlined" onClick={prevStep}>Kembali</Button>
                <Button variant="contained" onClick={handleSubmitFinal}>Submit Barang</Button>
              </Stack>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default GadaiWizardPage;
