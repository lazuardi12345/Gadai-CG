import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { CircularProgress, Button, Box } from "@mui/material";
import logo from "assets/images/CGadai.png";

const PrintStrukPelunasanPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosInstance.get(`/detail-gadai/${id}`);
        if (res.data?.success) setData(res.data.data);
        else setData(null);
      } catch (err) {
        console.error(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading)
    return <CircularProgress sx={{ display: "block", mx: "auto", mt: 10 }} />;
  if (!data) return <p>Tidak ada data.</p>;

  const detail = data;
  const nasabah = detail?.nasabah || {};
  const petugas = nasabah?.user?.name || "-";
  const typeNama = detail?.type?.nama_type?.toLowerCase() || "-";
  const pokok = Number(detail?.uang_pinjaman || 0);

  const perpanjanganTerbaru = detail?.perpanjangan_tempos?.length
    ? detail.perpanjangan_tempos[detail.perpanjangan_tempos.length - 1]
    : null;

  const jatuhTempoTerbaru =
    perpanjanganTerbaru?.jatuh_tempo_baru || detail?.jatuh_tempo;

  const today = new Date();
  const jatuhTempoDate = new Date(jatuhTempoTerbaru);
  let selisihHari = Math.ceil(
    (today - jatuhTempoDate) / (1000 * 60 * 60 * 24)
  );
  if (selisihHari < 0) selisihHari = 0;

  const hitungPersenJasa = (hari, jenis) => {
    const blokHari = [15, 30, 45, 60, 75, 90, 105, 120];
    for (let i = 0; i < blokHari.length; i++) {
      if (hari === blokHari[i] + 1) {
        hari = blokHari[i];
        break;
      }
    }
    let persen = 0;
    if (jenis === "hp") {
      if (hari <= 15) persen = 0.045;
      else if (hari <= 30) persen = 0.095;
      else if (hari <= 45) persen = 0.145;
      else if (hari <= 60) persen = 0.195;
      else {
        const extraBlocks = Math.ceil((hari - 60) / 15);
        persen = 0.195 + extraBlocks * 0.05;
      }
    } else {
      if (hari <= 15) persen = 0.015;
      else if (hari <= 30) persen = 0.025;
      else if (hari <= 45) persen = 0.04;
      else if (hari <= 60) persen = 0.05;
      else {
        const extraBlocks = Math.ceil((hari - 60) / 15);
        persen = 0.05 + extraBlocks * 0.01;
      }
    }
    return persen;
  };

  let jenisSkema = ["handphone", "elektronik"].includes(typeNama)
    ? "hp"
    : "non-hp";

  let jasa = 0,
    denda = 0,
    penalty = 0;

  if (selisihHari > 0) {
    const persenJasa = hitungPersenJasa(selisihHari, jenisSkema);
    jasa = pokok * persenJasa;

    if (selisihHari > 15) {
      denda = pokok * (jenisSkema === "hp" ? 0.045 : 0.015);
      penalty = 180000;
    }
  }

  const totalBayar = pokok + jasa + denda + penalty;

  const formatRupiah = (val) =>
    `Rp. ${Number(val || 0).toLocaleString("id-ID")}`;

  const formatHariTanggal = (date) => {
    const hari = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const bulan = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    const pad = (n) => n.toString().padStart(2, "0");
    const tanggalStr = `${hari[date.getDay()]}, ${date.getDate()} ${
      bulan[date.getMonth()]
    } ${date.getFullYear()}`;
    const jamStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    return { tanggalStr, jamStr };
  };

  const { tanggalStr, jamStr } = formatHariTanggal(today);

  let barangNama = "-",
    barangDetail = "-",
    labelBarangDetail = "-";

  switch (typeNama) {
    case "handphone":
    case "elektronik":
      if (detail.hp) {
        barangNama = detail.hp.nama_barang || "-";
        barangDetail = `${detail.hp.merk || "-"} / ${detail.hp.type_hp || "-"}`;
        labelBarangDetail = "Merk / Type";
      }
      break;
    case "perhiasan":
      if (detail.perhiasan) {
        barangNama = detail.perhiasan.nama_barang || "-";
        barangDetail = `${detail.perhiasan.karat || "-"} / ${detail.perhiasan.berat || "-"}`;
        labelBarangDetail = "Karat / Berat";
      }
      break;
    case "logam mulia":
      if (detail.logam_mulia) {
        barangNama = detail.logam_mulia.nama_barang || "-";
        barangDetail = `${detail.logam_mulia.karat || "-"} / ${detail.logam_mulia.berat || "-"}`;
        labelBarangDetail = "Karat / Berat";
      }
      break;
    case "retro":
      if (detail.retro) {
        barangNama = detail.retro.nama_barang || "-";
        barangDetail = `${detail.retro.karat || "-"} / ${detail.retro.berat || "-"}`;
        labelBarangDetail = "Karat / Berat";
      }
      break;
  }

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=400,height=600");
    printWindow.document.write(printHTML());
    printWindow.document.close();
  };

  const printHTML = () => `
    <html>
      <head>
        <title>Struk Pelunasan</title>
        <style>
          @page { size: 80mm auto; margin:0; }
          body { font-family: monospace; font-size:11px; margin:0; padding:0; }
          .print-box { width:80mm; margin:0 auto; padding:6px; }
          .center { text-align:center; }
          .bold { font-weight:bold; }
          img { display:block; margin:0 auto 6px auto; width:150px; }
          .row { display:flex; justify-content:space-between; margin-bottom:2px; }
          hr { border:none; border-top:1px dashed #000; margin:5px 0; }
        </style>
      </head>
      <body>
        <div class="print-box">
          <div class="center">
            <img src="${logo}" alt="Logo" />
            <div>No Transaksi</div>
            <div class="bold">${detail?.no_gadai || "-"}</div>
          </div>

          <div class="row"><span>Hari, Tanggal</span><span>${tanggalStr}</span></div>
          <div class="row"><span>Waktu</span><span>${jamStr}</span></div>
          <div class="row"><span>Petugas</span><span>${petugas}</span></div>

          <div class="center bold" style="margin:6px 0;">PEMBAYARAN LUNAS</div>

          <div class="row"><span>Nama Barang</span><span>${barangNama}</span></div>
          <div class="row"><span>${labelBarangDetail}</span><span>${barangDetail}</span></div>
          <hr />

          <div class="row"><span>Pokok Pinjaman</span><span>${formatRupiah(pokok)}</span></div>
          <div class="row"><span>Jasa</span><span>${formatRupiah(jasa)}</span></div>
          ${denda > 0 ? `<div class="row"><span>Denda</span><span>${formatRupiah(denda)}</span></div>` : ""}
          ${penalty > 0 ? `<div class="row"><span>Penalty</span><span>${formatRupiah(penalty)}</span></div>` : ""}
          <div class="row bold"><span>Total Bayar</span><span>${formatRupiah(totalBayar)}</span></div>
          <hr />

          <div class="row"><span>Tanggal Gadai</span><span>${detail?.tanggal_gadai || "-"}</span></div>
          <div class="row"><span>Jatuh Tempo</span><span>${jatuhTempoTerbaru}</span></div>
          <hr />

          <div class="center">
            <div>Terima kasih atas kepercayaan Anda!</div>
            <div>Gadai cepat, aman, dan terpercaya di</div>
            <div class="bold">CG GADAI.</div>
          </div>
        </div>
        <script>window.onload = function(){window.print(); window.close();}</script>
      </body>
    </html>
  `;

  return (
    <Box sx={{ maxWidth:400, mx:"auto", p:2, textAlign:"center", fontFamily:"monospace" }}>
      <div ref={printRef} style={{ border:"1px dashed #ccc", padding:"12px", marginBottom:"12px" }}>
        <img src={logo} alt="Logo" style={{ width:"120px", margin:"0 auto 8px auto" }} />
        <div>No Transaksi: <b>{detail?.no_gadai || "-"}</b></div>
        <div>Hari, Tanggal: {tanggalStr}</div>
        <div>Waktu: {jamStr}</div>
        <div>Petugas: {petugas}</div>

        <div style={{ marginTop:"6px", fontWeight:"bold" }}>PEMBAYARAN LUNAS</div>

        <div style={{ textAlign:"left", marginTop:"6px" }}>
          <div>Nama Barang: {barangNama}</div>
          <div>{labelBarangDetail}: {barangDetail}</div>
          <hr />
          <div>Pokok Pinjaman: {formatRupiah(pokok)}</div>
          <div>Jasa: {formatRupiah(jasa)}</div>
          {denda > 0 && <div>Denda: {formatRupiah(denda)}</div>}
          {penalty > 0 && <div>Penalty: {formatRupiah(penalty)}</div>}
          <div><b>Total Bayar: {formatRupiah(totalBayar)}</b></div>
          <div>Tanggal Gadai: {detail?.tanggal_gadai || "-"}</div>
          <div>Jatuh Tempo: {jatuhTempoTerbaru}</div>
        </div>

        <div style={{ marginTop:"8px", fontSize:"12px" }}>
          <p>Terima kasih atas kepercayaan Anda!</p>
          <p>Gadai cepat, aman, dan terpercaya di</p>
          <p><b>CG GADAI.</b></p>
        </div>
      </div>

      <Button variant="contained" color="primary" onClick={handlePrint}>
        Cetak Struk Pelunasan
      </Button>
    </Box>
  );
};

export default PrintStrukPelunasanPage;
