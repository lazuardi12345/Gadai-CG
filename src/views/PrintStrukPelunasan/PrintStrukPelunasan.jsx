import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { CircularProgress, Button, Box, Typography } from "@mui/material";
import { AuthContext } from "AuthContex/AuthContext";
import logo from "assets/images/LogoBaru1.png";

const PrintStrukPelunasanPage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

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
        if (res.data?.success) setData(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, userRole]);

  if (loading) return <CircularProgress sx={{ display: "block", mx: "auto", mt: 10 }} />;
  if (!data) return <p>Tidak ada data.</p>;

  const detail = data;
  const nasabah = detail?.nasabah || {};
  const petugas = nasabah?.user?.name || "-";
  const typeNama = detail?.type?.nama_type?.toLowerCase() || "-";

  // Data Keuangan dari Backend
  const pokok = Number(detail?.uang_pinjaman || 0);
  const nominalBayarDB = Number(detail?.nominal_bayar || 0);
  
  // Ambil denda & penalty (Sudah bersih dari Backend)
  const denda = Number(detail?.perhitungan?.denda || 0);
  const penalty = Number(detail?.perhitungan?.penalty || 0);
  const totalBayar = Number(detail?.perhitungan?.total_bayar || nominalBayarDB);
  // Ambil hari keterlambatan yang sudah terkunci di Backend
  const hariTerlambat = detail?.hari_keterlambatan || detail?.perhitungan?.hari_terlambat || 0;

  const formatRupiah = (val) => `Rp. ${Number(val || 0).toLocaleString("id-ID")}`;

  const formatHariTanggal = (dateStr) => {
    const date = dateStr ? new Date(dateStr) : new Date();
    const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const pad = (n) => n.toString().padStart(2, "0");
    const tanggalStr = `${hari[date.getDay()]}, ${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
    const jamStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    return { tanggalStr, jamStr };
  };

  const { tanggalStr, jamStr } = formatHariTanggal(detail?.tanggal_bayar);

  // --- LOGIC TAMPILAN BARANG ---
  let barangNama = "-", barangDetail = "-", labelBarangDetail = "-";
  const cleanText = (val) => (val && typeof val !== 'object') ? String(val).replace(/,|\/+/g, "").trim() : "-";

  if (typeNama.includes("handphone") || typeNama.includes("elektronik")) {
    if (detail.hp) {
      barangNama = cleanText(detail.hp.nama_barang);
      barangDetail = `MERK/TYPE: ${cleanText(detail.hp.merk?.nama_merk)} ${cleanText(detail.hp.type_hp?.nama_type)}\nIMEI: ${cleanText(detail.hp.imei)}`;
      labelBarangDetail = "Detail Barang";
    }
  } else {
    const item = detail.perhiasan || detail.logam_mulia || detail.retro;
    if (item) {
      barangNama = cleanText(item.nama_barang);
      barangDetail = `${cleanText(item.karat || item.karatase)} / ${cleanText(item.berat || item.berat_bersih)} gr`;
      labelBarangDetail = "Karat / Berat";
    }
  }

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=400,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Struk Pelunasan</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { width: 75mm; margin: 0; padding: 5px; font-family: "Courier New", monospace; font-size: 11px; font-weight: 600; }
            .center { text-align: center; }
            .bold { font-weight: 700; }
            img { display: block; margin: 0 auto 6px auto; width: 120px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
            pre { white-space: pre-wrap; margin: 0; font-family: inherit; }
          </style>
        </head>
        <body>
          <div class="center">
            <img src="${logo}" />
            <div>No Transaksi</div>
            <div class="bold">${detail?.no_gadai || "-"}</div>
          </div>
          <div class="row"><span>Tanggal Lunas</span><span>${tanggalStr}</span></div>
          <div class="row"><span>Jam</span><span>${jamStr}</span></div>
          <div class="row"><span>Petugas</span><span>${petugas}</span></div>
          <hr />
          <div class="center bold">PELUNASAN SELESAI</div>
          <div class="row"><span>Barang</span><span>${barangNama}</span></div>
          <div class="row"><span>${labelBarangDetail}</span><span><pre>${barangDetail}</pre></span></div>
          <hr />
          <div class="row"><span>Pokok Pinjaman</span><span>${formatRupiah(pokok)}</span></div>
          ${denda > 0 ? `<div class="row"><span>Denda</span><span>${formatRupiah(denda)}</span></div>` : ""}
          ${penalty > 0 ? `<div class="row"><span>Penalty</span><span>${formatRupiah(penalty)}</span></div>` : ""}
          <div class="row"><span>Keterlambatan</span><span>${hariTerlambat} hari</span></div>
          <hr />
          <div class="row bold" style="font-size: 13px;"><span>TOTAL BAYAR</span><span>${formatRupiah(totalBayar)}</span></div>
          <div class="row"><span>Metode</span><span>${(detail?.metode_pembayaran || "cash").toUpperCase()}</span></div>
          <hr />
          <div class="center">
            <div>Terima kasih atas kepercayaan Anda!</div>
            <div>Unit barang telah diserahkan kembali.</div>
            <div class="bold">SENTRA GADAI INDONESIA</div>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", p: 2, textAlign: "center" }}>
      <Box ref={printRef} sx={{ border: "1px dashed #ccc", p: 2, mb: 2, textAlign: "left", fontFamily: "monospace" }}>
        <Box sx={{ textAlign: "center", mb: 2 }}>
            <img src={logo} alt="Logo" style={{ width: "120px" }} />
            <Typography variant="body2" fontWeight="bold">No: {detail?.no_gadai}</Typography>
        </Box>
        
        <Typography variant="caption" display="block">Tanggal: {tanggalStr} {jamStr}</Typography>
        <Typography variant="caption" display="block">Petugas: {petugas}</Typography>
        <hr />
        <Typography variant="body2" fontWeight="bold" align="center">STRUK PELUNASAN</Typography>
        <hr />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption">Pokok Pinjaman:</Typography>
            <Typography variant="caption">{formatRupiah(pokok)}</Typography>
        </Box>
        {denda > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption">Denda:</Typography>
                <Typography variant="caption">{formatRupiah(denda)}</Typography>
            </Box>
        )}
        {penalty > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption">Penalty:</Typography>
                <Typography variant="caption">{formatRupiah(penalty)}</Typography>
            </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption">Telat:</Typography>
            <Typography variant="caption">{hariTerlambat} hari</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2" fontWeight="bold">TOTAL BAYAR:</Typography>
            <Typography variant="body2" fontWeight="bold">{formatRupiah(totalBayar)}</Typography>
        </Box>
        <hr />
        <Typography variant="caption" align="center" display="block">Unit barang telah diserahkan kembali.</Typography>
        <Typography variant="caption" align="center" display="block" fontWeight="bold">SENTRA GADAI INDONESIA</Typography>
      </Box>

      <Button variant="contained" fullWidth onClick={handlePrint} size="large">
        Cetak Struk Pelunasan
      </Button>
    </Box>
  );
};

export default PrintStrukPelunasanPage;