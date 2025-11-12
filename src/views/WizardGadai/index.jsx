import React, { useState, useEffect } from "react";
import {
  Card, CardHeader, CardContent, TextField, Button,
  Grid, Stack, CircularProgress, FormGroup, FormControlLabel,
  Checkbox, Box, Typography, FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

// HP
const NAMA_BARANG_LIST = ['Android', 'Samsung', 'iPhone'];
const KELENGKAPAN_LIST = ['Box', 'Charger', 'Kabel Data', 'buku garansi', 'kartu garansi', 'tusuk sim'];
const KERUSAKAN_LIST = [
  'LCD Pecah', 'LCD Kuning/Pink', 'LCD Bercak', 'Baterai Bocor', 'Tombol Rusak',
  'Layar Tidak Fungsi', 'Kamera Tidak Berfungsi/Blur', 'Tombol Volume Tidak Berfungsi',
  'SIM Tidak Terbaca', 'Tombol Power Tidak Berfungsi', 'Face Id/Finger Print Tidak Berfungsi',
  'IME Tidak Terbaca', 'Display Phone'
];
const DOKUMEN_SOP_HP = {
  'Android': ['body', 'imei', 'about', 'akun', 'admin', 'cam_depan', 'cam_belakang', 'rusak'],
  'Samsung': ['body', 'imei', 'about', 'samsung_account', 'admin', 'cam_depan', 'cam_belakang', 'galaxy_store'],
  'iPhone': ['body', 'imei', 'about', 'icloud', 'battery', '3utools', 'iunlocker', 'cek_pencurian'],
};

// Emas / Perhiasan / Retro
const KELENGKAPAN_COMMON = ['Sertifikat', 'Nota', 'Kartu Garansi'];
const DOKUMEN_SOP_COMMON = ['emas_timbangan', 'gosokan_timer', 'gosokan_ktp', 'batu', 'cap_merek', 'karatase', 'ukuran_batu'];

const GadaiWizardPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 - Nasabah
  const [nasabah, setNasabah] = useState({ nama_lengkap: "", nik: "", alamat: "", no_hp: "", id: null });
  const [fotoKtp, setFotoKtp] = useState(null);

  // Step 2 - Detail Gadai
  const [detail, setDetail] = useState({ no_gadai: "", tanggal_gadai: "", jatuh_tempo: "", taksiran: "", uang_pinjaman: "", type_id: "", type_name: "", id: null });
  const [types, setTypes] = useState([]);

  // Step 3 - Barang
  const [barang, setBarang] = useState({
    nama_barang: "", kelengkapan: [], kerusakan: [], grade: "", imei: "", warna: "", kunci_password: "",
    kunci_pin: "", kunci_pola: "", ram: "", rom: "", type_hp: "", merk: "",
    kode_cap: "", karat: "", potongan_batu: "", berat: "", dokumen_pendukung: {}
  });

  // ---------- HANDLE CHANGE ----------
  const handleNasabahChange = e => setNasabah(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleDetailChange = e => {
    const { name, value } = e.target;
    setDetail(prev => ({ ...prev, [name]: value }));

    if (name === "type_id") {
      // Pastikan string dibanding string, atau number dibanding number
      const type = types.find(t => t.id.toString() === value.toString());
      setDetail(prev => ({
        ...prev,
        type_name: type?.nama_type || ""
      }));
    }
  };


  const handleBarangChange = e => setBarang(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleKelengkapanChange = value => {
    setBarang(prev => {
      const exists = prev.kelengkapan.includes(value);
      return { ...prev, kelengkapan: exists ? prev.kelengkapan.filter(v => v !== value) : [...prev.kelengkapan, value] };
    });
  };
  const handleKerusakanChange = value => {
    setBarang(prev => {
      const exists = prev.kerusakan.includes(value);
      return { ...prev, kerusakan: exists ? prev.kerusakan.filter(v => v !== value) : [...prev.kerusakan, value] };
    });
  };
  const handleDokumenChange = (key, file) => {
    setBarang(prev => ({ ...prev, dokumen_pendukung: { ...prev.dokumen_pendukung, [key]: file } }));
  };

  // ---------- FETCH TYPES ----------
  const fetchTypes = async () => {
    try {
      const res = await axiosInstance.get("/petugas/type");
      if (res.data.success) setTypes(res.data.data);
      else alert(res.data.message || "Gagal mengambil data types.");
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan server.");
    }
  };
  useEffect(() => { fetchTypes(); }, []);

  // ---------- STEP CONTROL ----------
  const nextStep = () => {
    if (step === 2 && detail.type_id) {
      const type = types.find(t => t.id.toString() === detail.type_id.toString());
      setDetail(prev => ({ ...prev, type_name: type?.nama_type || "" }));
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);


  const handleSubmitFinal = async () => {

    if (!nasabah.nama_lengkap || !nasabah.nik || !nasabah.no_hp || !fotoKtp) {
      alert("Nama, NIK, No HP, dan Foto KTP wajib diisi!");
      setStep(1);
      return;
    }


    if (!detail.tanggal_gadai || !detail.jatuh_tempo || !detail.type_id) {
      alert("Tanggal, Jatuh Tempo, dan Type wajib diisi!");
      setStep(2);
      return;
    }


    if (!barang.nama_barang) {
      alert("Nama barang wajib diisi!");
      setStep(3);
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();

      Object.entries(nasabah).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          formData.append(`nasabah[${key}]`, value);
        }
      });
      if (fotoKtp) {
        formData.append("nasabah[foto_ktp]", fotoKtp);
      }

      Object.entries(detail).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          formData.append(`detail[${key}]`, value);
        }
      });


      Object.entries(barang).forEach(([key, value]) => {

        if (key === "dokumen_pendukung") return;


        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (item !== null && item !== "")
              formData.append(`barang[${key}][]`, item);
          });
        }

        else if (value !== null && value !== "") {
          formData.append(`barang[${key}]`, value);
        }
      });

      if (barang.dokumen_pendukung && typeof barang.dokumen_pendukung === "object") {
        Object.entries(barang.dokumen_pendukung).forEach(([key, file]) => {
          if (file instanceof File) {
            formData.append(`barang[dokumen_pendukung][${key}]`, file);
          } else if (typeof file === "string") {
            formData.append(`barang[dokumen_pendukung_existing][${key}]`, file);
          }
        });
      }


      const res = await axiosInstance.post("/petugas/gadai-wizard", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        alert("Data gadai berhasil disimpan!");
        navigate("/data-nasabah");
      } else {
        alert(res.data.message || "Gagal menyimpan data.");
      }
    } catch (err) {
      console.error("Error:", err.response?.data || err);
      alert(err.response?.data?.message || "Terjadi kesalahan server.");
    } finally {
      setLoading(false);
    }
  };


  if (loading)
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: "80vh" }}>
        <CircularProgress />
      </Stack>
    );

  // ================================
  //  UI tetap persis seperti sebelumnya
  // ================================
  return (
    <Card sx={{ p: 2 }}>
      <CardHeader title="Tambah Gadai" />
      <CardContent>

        {/* STEP 1 */}
        {step === 1 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Nama Lengkap" name="nama_lengkap" value={nasabah.nama_lengkap} onChange={handleNasabahChange} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="NIK" name="nik" value={nasabah.nik} onChange={handleNasabahChange} fullWidth size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Alamat" name="alamat" value={nasabah.alamat} onChange={handleNasabahChange} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="No HP" name="no_hp" value={nasabah.no_hp} onChange={handleNasabahChange} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Stack spacing={1}>
                <Typography variant="subtitle2">Upload Foto KTP</Typography>
                <Button variant="contained" component="label" sx={{ width: "fit-content" }}>
                  Pilih File
                  <input type="file" hidden accept="image/*" onChange={(e) => setFotoKtp(e.target.files?.[0])} />
                </Button>
                {fotoKtp && (
                  <Box sx={{ mt: 2, width: 300 }}>
                    <img src={URL.createObjectURL(fotoKtp)} alt="Preview" style={{ width: "100%", borderRadius: 8 }} />
                  </Box>
                )}
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" justifyContent="flex-end">
                <Button variant="contained" onClick={nextStep}>Lanjut</Button>
              </Stack>
            </Grid>
          </Grid>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Tanggal Gadai" name="tanggal_gadai" type="date" value={detail.tanggal_gadai} onChange={handleDetailChange} fullWidth size="small" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" disabled={!detail.tanggal_gadai}>
                <InputLabel>Jatuh Tempo</InputLabel>
                <Select name="jatuh_tempo" value={detail.jatuh_tempo || ""} label="Jatuh Tempo" onChange={handleDetailChange}>
                  {[15, 30].map((d) => {
                    const date = new Date(detail.tanggal_gadai);
                    date.setDate(date.getDate() + d);
                    return (
                      <MenuItem
                        key={d}
                        value={
                          date instanceof Date && !isNaN(date)
                            ? date.toISOString().split("T")[0]
                            : ""
                        }
                      >
                        {d} Hari —{" "}
                        {date instanceof Date && !isNaN(date)
                          ? date.toLocaleDateString("id-ID")
                          : "-"}
                      </MenuItem>

                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}><TextField label="Taksiran" name="taksiran" type="number" value={detail.taksiran} onChange={handleDetailChange} fullWidth size="small" /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Uang Pinjaman" name="uang_pinjaman" type="number" value={detail.uang_pinjaman} onChange={handleDetailChange} fullWidth size="small" /></Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" disabled={!types.length}>
                <InputLabel>Nama Type</InputLabel>
                <Select
                  name="type_id"
                  value={detail.type_id || ""}
                  onChange={handleDetailChange}
                  label="Nama Type"
                >
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

        {/* STEP 3 */}
        {step === 3 && (
          <>
            {/* (UI barang tetap sama seperti sebelumnya) */}
            {/* ... (UI kode barang Anda tidak berubah sama sekali) ... */}

            {/* STEP 3 */}
            {step === 3 && (
              <Grid container spacing={2}>
                {/* Nama Barang */}
                <Grid item xs={12} sm={6}>
                  {detail.type_name === "Handphone" ? (
                    <FormControl fullWidth size="small">
                      <InputLabel>Nama Barang</InputLabel>
                      <Select
                        name="nama_barang"
                        value={barang.nama_barang}
                        onChange={handleBarangChange}
                      >
                        {NAMA_BARANG_LIST.map((b) => (
                          <MenuItem key={b} value={b}>
                            {b}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField
                      label="Nama Barang"
                      name="nama_barang"
                      value={barang.nama_barang}
                      onChange={handleBarangChange}
                      fullWidth
                      size="small"
                    />
                  )}
                </Grid>

                {/* FIELD TYPE KHUSUS */}
                {detail.type_name === "Perhiasan" && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Type Perhiasan"
                      name="type_perhiasan"
                      value={barang.type_perhiasan || ""}
                      onChange={handleBarangChange}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                )}
                {detail.type_name === "Retro" && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Type Retro"
                      name="type_retro"
                      value={barang.type_retro || ""}
                      onChange={handleBarangChange}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                )}
                {detail.type_name === "Logam Mulia" && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Type Logam Mulia"
                      name="type_logam_mulia"
                      value={barang.type_logam_mulia || ""}
                      onChange={handleBarangChange}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                )}

                {/* KHUSUS EMAS / PERHIASAN / RETRO */}
                {["kode_cap", "karat", "potongan_batu", "berat"].map(
                  (k) =>
                    detail.type_name !== "Handphone" && (
                      <Grid key={k} item xs={12} sm={6}>
                        <TextField
                          label={k.toUpperCase()}
                          name={k}
                          value={barang[k] || ""}
                          onChange={handleBarangChange}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                    )
                )}

                {/* KHUSUS HANDPHONE */}
                {detail.type_name === "Handphone" && (
                  <>
                    {[
                      "grade",
                      "imei",
                      "warna",
                      "kunci_password",
                      "kunci_pin",
                      "kunci_pola",
                      "ram",
                      "rom",
                      "type_hp",
                      "merk",
                    ].map((k) => (
                      <Grid key={k} item xs={12} sm={6}>
                        <TextField
                          label={k.replace("_", " ").toUpperCase()}
                          name={k}
                          value={barang[k] || ""}
                          onChange={handleBarangChange}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                    ))}
                  </>
                )}

                {/* KELENGKAPAN */}
                <Grid item xs={12}>
                  <Typography>Kelengkapan</Typography>
                  <FormGroup row>
                    {(detail.type_name === "Handphone"
                      ? KELENGKAPAN_LIST
                      : KELENGKAPAN_COMMON
                    ).map((k) => (
                      <FormControlLabel
                        key={k}
                        control={
                          <Checkbox
                            checked={barang.kelengkapan.includes(k)}
                            onChange={() => handleKelengkapanChange(k)}
                          />
                        }
                        label={k}
                      />
                    ))}
                  </FormGroup>
                </Grid>

                {/* KERUSAKAN HP */}
                {detail.type_name === "Handphone" && (
                  <Grid item xs={12}>
                    <Typography>Kerusakan</Typography>
                    <FormGroup row>
                      {KERUSAKAN_LIST.map((k) => (
                        <FormControlLabel
                          key={k}
                          control={
                            <Checkbox
                              checked={barang.kerusakan.includes(k)}
                              onChange={() => handleKerusakanChange(k)}
                            />
                          }
                          label={k}
                        />
                      ))}
                    </FormGroup>
                  </Grid>
                )}

                {/* DOKUMEN */}
                {(detail.type_name === "Handphone"
                  ? DOKUMEN_SOP_HP[barang.nama_barang] || []
                  : DOKUMEN_SOP_COMMON
                ).map((key) => (
                  <Grid key={key} item xs={12} sm={6}>
                    <Typography>{key}</Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 1.5,
                        border: "1px dashed #ccc",
                        borderRadius: 2,
                        bgcolor: "#fafafa",
                      }}
                    >
                      <Typography sx={{ flex: 1, wordBreak: "break-all" }}>
                        {barang.dokumen_pendukung[key]?.name || "Belum ada file"}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button variant="contained" component="label" size="small">
                          Upload
                          <input
                            type="file"
                            hidden
                            onChange={(e) =>
                              handleDokumenChange(key, e.target.files[0])
                            }
                          />
                        </Button>
                        {barang.dokumen_pendukung[key] && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleDokumenChange(key, null)}
                          >
                            Hapus
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  </Grid>
                ))}

                {/* BUTTONS */}
                <Grid item xs={12}>
                  <Stack direction="row" justifyContent="space-between">
                    <Button variant="outlined" onClick={prevStep}>
                      Kembali
                    </Button>
                    <Button variant="contained" onClick={handleSubmitFinal}>
                      Submit Barang
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            )}

          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GadaiWizardPage;