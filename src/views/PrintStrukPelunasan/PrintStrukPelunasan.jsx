import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { CircularProgress, Button, Box, Typography, Paper, Divider } from "@mui/material";
import { AuthContext } from "AuthContex/AuthContext";
import logo from "assets/images/LogoBaru1.png";

const PrintStrukPelunasanPage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- 1. Logic URL API ---
  const getApiUrl = () => {
    switch (userRole) {
      case "petugas": return `/petugas/detail-gadai/${id}`;
      case "checker": return `/checker/detail-gadai/${id}`;
      default: return `/detail-gadai/${id}`;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosInstance.get(getApiUrl());
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, userRole]);

  if (loading) return <CircularProgress sx={{ display: "block", mx: "auto", mt: 10 }} />;
  if (!data) return <Typography align="center" sx={{ mt: 5 }}>Data tidak ditemukan.</Typography>;

  // --- 2. Data Mapping ---
  const detail = data;
  const perhitungan = detail?.perhitungan_pelunasan || {}; 
  
  const pokok = Number(perhitungan?.pokok || detail?.uang_pinjaman || 0);
  const denda = Number(perhitungan?.denda || 0);
  const penalty = Number(perhitungan?.penalty || 0);
  const totalBayar = Number(perhitungan?.total_bayar || detail?.nominal_bayar || 0);
  const hariTerlambat = perhitungan?.hari_terlambat || 0;

  // Nama petugas tetap ditampilkan sebagai penanggung jawab
  const petugas = detail?.nasabah?.user?.name || "-";
  const formatRupiah = (val) => `Rp. ${Number(val).toLocaleString("id-ID")}`;

  // Formatting Waktu
  const dateObj = detail?.tanggal_bayar ? new Date(detail.tanggal_bayar) : new Date();
  const tglLunas = dateObj.toLocaleDateString("id-ID", { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  const jamLunas = dateObj.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });

  // Logic Barang
  let barangNama = "-", barangDetail = "";
  if (detail.hp) {
    barangNama = detail.hp.nama_barang;
    barangDetail = `${detail.hp.merk?.nama_merk} ${detail.hp.type_hp?.nama_type} / IMEI: ${detail.hp.imei}`;
  } else {
    const item = detail.perhiasan || detail.logam_mulia || detail.retro;
    barangNama = item?.nama_barang || "-";
    barangDetail = `${item?.karat || item?.karatase || '-'}K / ${item?.berat || item?.berat_bersih || '-'} gr`;
  }

  // --- 3. Fungsi Print Thermal ---
  const handlePrint = () => {
    const printWindow = window.open("", "", "width=400,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Struk Pelunasan - ${detail?.no_gadai}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { width: 72mm; margin: 0 auto; padding: 5px; font-family: 'Courier New', Courier, monospace; font-size: 11px; line-height: 1.2; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .header-img { width: 100px; margin-bottom: 5px; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; }
            hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="center">
            <img src="${logo}" class="header-img" />
            <div class="bold">STRUK PELUNASAN (LUNAS)</div>
            <div class="bold">${detail?.no_gadai}</div>
          </div>
          <hr />
          <div class="row"><span>Tanggal</span><span>${tglLunas}</span></div>
          <div class="row"><span>Jam</span><span>${jamLunas}</span></div>
          <div class="row"><span>Petugas</span><span>${petugas}</span></div>
          <hr />
          <div class="bold">DETAIL BARANG:</div>
          <div>${barangNama}</div>
          <div style="font-size: 10px;">${barangDetail}</div>
          <hr />
          <div class="row"><span>Pokok Pinjaman</span><span>${formatRupiah(pokok)}</span></div>
          
          ${hariTerlambat > 0 ? `<div class="row"><span>Keterlambatan</span><span>${hariTerlambat} Hari</span></div>` : ""}
          ${denda > 0 ? `<div class="row"><span>Denda</span><span>${formatRupiah(denda)}</span></div>` : ""}
          ${penalty > 0 ? `<div class="row"><span>Penalty</span><span>${formatRupiah(penalty)}</span></div>` : ""}
          
          <hr />
          <div class="row bold" style="font-size: 13px;"><span>TOTAL BAYAR</span><span>${formatRupiah(totalBayar)}</span></div>
          <div class="row"><span>Metode Bayar</span><span>${(detail?.metode_pembayaran || "CASH").toUpperCase()}</span></div>
          <hr />
          <div class="center">
            <div>Terima kasih atas kepercayaan Anda!</div>
            <div class="bold">Unit barang telah diserahkan kembali.</div>
            <div class="bold" style="margin-top: 5px;">SENTRA GADAI INDONESIA</div>
          </div>
          <script>
            window.onload = function() { 
              window.print(); 
              setTimeout(() => { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Box sx={{ maxWidth: 450, mx: "auto", p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, bgcolor: '#fff' }}>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
            <img src={logo} alt="SGI Logo" style={{ width: 120, marginBottom: 10 }} />
            <Typography variant="h6" fontWeight="bold">PREVIEW STRUK</Typography>
            <Typography variant="body2" color="text.secondary">{detail?.no_gadai}</Typography>
        </Box>

        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Status</Typography>
                <Typography variant="body2" color="success.main" fontWeight="bold">LUNAS</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Petugas</Typography>
                <Typography variant="body2">{petugas}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Pokok Pinjaman</Typography>
                <Typography variant="body2">{formatRupiah(pokok)}</Typography>
            </Box>
            
            {hariTerlambat > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Keterlambatan</Typography>
                    <Typography variant="body2">{hariTerlambat} hari</Typography>
                </Box>
            )}
            {denda > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Denda</Typography>
                    <Typography variant="body2" color="error">{formatRupiah(denda)}</Typography>
                </Box>
            )}
            {penalty > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Penalty</Typography>
                    <Typography variant="body2" color="error">{formatRupiah(penalty)}</Typography>
                </Box>
            )}

            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" fontWeight="bold">Total Bayar</Typography>
                <Typography variant="subtitle1" fontWeight="bold">{formatRupiah(totalBayar)}</Typography>
            </Box>
        </Box>

        <Button 
            variant="contained" 
            fullWidth 
            size="large" 
            onClick={handlePrint} 
            sx={{ mt: 4, borderRadius: 2, py: 1.5, fontWeight: 'bold' }}
        >
          CETAK STRUK SEKARANG
        </Button>
      </Paper>
    </Box>
  );
};

export default PrintStrukPelunasanPage;