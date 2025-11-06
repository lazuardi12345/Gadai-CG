import React, { useState, useEffect, useContext } from "react";
import {
  Card, CardHeader, CardContent, TextField, Button,
  Grid, Stack, CircularProgress, Autocomplete,
  FormGroup, FormControlLabel, Checkbox, Box, Typography,
  Alert
} from "@mui/material";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "AuthContex/AuthContext";

const KELENGKAPAN_LIST = ["Sertifikat", "Nota", "Kartu Garansi", "Box"];
const DOKUMEN_PENDUKUNG_SOP = [
  { key: "emas_timbangan", label: "Emas + Timbangan" },
  { key: "gosokan_timer", label: "Gosokan + Timer 1 Menit" },
  { key: "gosokan_ktp", label: "Gosokan + KTP" },
  { key: "batu", label: "Batu (jika ada)" },
  { key: "cap_merek", label: "Cap / Merek (jika ada)" },
  { key: "karatase", label: "Karatase (jika ada)" },
  { key: "ukuran_batu", label: "Ukuran Batu (Metmess)" },
];

const TambahGadaiRetroPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();

  const [form, setForm] = useState({
    nama_barang: "",
    type_retro: "",
    kelengkapan: [],
    kode_cap: "",
    karat: "",
    potongan_batu: "",
    berat: "",
    detail_gadai_id: "",
    dokumen_pendukung: {},
  });

  const [detailGadai, setDetailGadai] = useState([]);
  const [uniqueNasabah, setUniqueNasabah] = useState([]);
  const [selectedNasabah, setSelectedNasabah] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  //  Fetch detail gadai & nasabah sesuai role
  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const urlDetailGadai = userRole === "checker" ? "/checker/detail-gadai" : "/detail-gadai";
        const res = await axiosInstance.get(urlDetailGadai);
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
        console.error(err);
        alert("Gagal memuat data nasabah.");
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

  const handleCheckboxChange = (value) => {
    setForm(prev => {
      const current = prev.kelengkapan;
      return current.includes(value)
        ? { ...prev, kelengkapan: current.filter(v => v !== value) }
        : { ...prev, kelengkapan: [...current, value] };
    });
  };

  const handleFileChange = (key, file) => {
    setForm(prev => ({
      ...prev,
      dokumen_pendukung: { ...prev.dokumen_pendukung, [key]: file || null },
    }));
  };

  const handleSubmit = async () => {
    if (!form.nama_barang || !form.type_retro || !form.detail_gadai_id) {
      alert("Nama barang, tipe retro, dan nasabah wajib diisi!");
      return;
    }

    try {
      setSaving(true);
      const data = new FormData();

      ["nama_barang","type_retro","kode_cap","karat","potongan_batu","berat","detail_gadai_id"]
        .forEach(key => { if(form[key]) data.append(key, form[key]) });

      form.kelengkapan.forEach((item, i) => data.append(`kelengkapan[${i}]`, item));
      Object.entries(form.dokumen_pendukung).forEach(([key, file]) => {
        if(file instanceof File) data.append(`dokumen_pendukung[${key}]`, file);
      });

      const urlSubmit = userRole === "checker" ? "/checker/gadai-retro" : "/gadai-retro";
      const res = await axiosInstance.post(urlSubmit, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if(res.data.success){
        alert("Data gadai retro berhasil disimpan!");
        navigate("/gadai-retro");
      } else {
        alert(res.data.message || "Gagal menambahkan data.");
      }
    } catch(err){
      console.error(err.response?.data || err);
      alert(err.response?.data?.message || "Terjadi kesalahan server.");
    } finally {
      setSaving(false);
    }
  };

  if(loading) return (
    <Stack alignItems="center" justifyContent="center" sx={{ height: "80vh" }}>
      <CircularProgress />
    </Stack>
  );

  return (
    <Card sx={{ p:2 }}>
      <CardHeader title="Tambah Data Gadai Retro" />
      <CardContent>
        <Grid container spacing={2}>
          {/* Nama Nasabah */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={uniqueNasabah}
              getOptionLabel={option => option.nama_lengkap || ""}
              value={selectedNasabah}
              onChange={(e,newValue)=>{
                setSelectedNasabah(newValue);
                const detail = detailGadai.find(d => d.nasabah?.id === newValue?.id);
                setForm(prev=>({...prev, detail_gadai_id: detail ? detail.id : ""}));
              }}
              renderInput={(params)=><TextField {...params} label="Nama Nasabah" size="small"/>}
            />
          </Grid>

          {/* Nama Barang */}
          <Grid item xs={12} sm={6}>
            <TextField label="Nama Barang" name="nama_barang" value={form.nama_barang} onChange={handleChange} fullWidth size="small"/>
          </Grid>

          {/* Tipe Retro */}
          <Grid item xs={12} sm={6}>
            <TextField label="Tipe Retro" name="type_retro" value={form.type_retro} onChange={handleChange} fullWidth size="small"/>
          </Grid>

          {/* Detail Barang */}
          {["kode_cap","karat","potongan_batu","berat"].map(key=>(
            <Grid item xs={12} sm={6} key={key}>
              <TextField
                label={key.replace(/_/g," ").toUpperCase()}
                name={key}
                type={["karat","berat"].includes(key)?"number":"text"}
                value={form[key]}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Grid>
          ))}

          {/* Kelengkapan */}
          <Grid item xs={12}>
            <Typography variant="subtitle2">Kelengkapan</Typography>
            <FormGroup row>
              {KELENGKAPAN_LIST.map(item=>(
                <FormControlLabel key={item} control={<Checkbox checked={form.kelengkapan.includes(item)} onChange={()=>handleCheckboxChange(item)}/>} label={item}/>
              ))}
            </FormGroup>
          </Grid>

          {/* Dokumen Pendukung */}
          <Grid item xs={12}>
            <Alert severity="info" sx={{mb:2}}>Upload file dokumen pendukung pemeriksaan barang.</Alert>
          </Grid>

          {DOKUMEN_PENDUKUNG_SOP.map(item=>(
            <Grid item xs={12} sm={6} key={item.key}>
              <Typography variant="subtitle2" sx={{mb:1}}>{item.label}</Typography>
              <Box sx={{display:"flex", alignItems:"center", justifyContent:"space-between", p:1.5, border:"1px dashed #ccc", borderRadius:2, bgcolor:"#fafafa"}}>
                <Typography variant="body2" sx={{flex:1, wordBreak:"break-all"}}>
                  {form.dokumen_pendukung[item.key]?.name || "Belum ada file"}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" component="label" size="small">
                    Upload
                    <input type="file" hidden onChange={e=>handleFileChange(item.key,e.target.files[0])}/>
                  </Button>
                  {form.dokumen_pendukung[item.key] && (
                    <Button variant="outlined" color="error" size="small" onClick={()=>handleFileChange(item.key,null)}>Hapus</Button>
                  )}
                </Stack>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{mt:4}}>
          <Button variant="outlined" onClick={()=>navigate("/gadai-retro")}>Batal</Button>
          <Button variant="contained" color="primary" onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TambahGadaiRetroPage;
