import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { CircularProgress, Button, Box } from "@mui/material";
import logo from "assets/images/CGadai.png";

const PrintStrukPerpanjanganPage = () => {
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
  const typeNama = detail?.type?.nama_type || "-";
  const pokok = Number(detail?.uang_pinjaman || 0);

  const today = new Date();
  const jatuhTempo = new Date(detail?.jatuh_tempo);

  const perpanjanganTerbaru = detail?.perpanjangan_tempos?.length
    ? detail.perpanjangan_tempos[detail.perpanjangan_tempos.length - 1]
    : null;
  const jatuhTempoBaru = perpanjanganTerbaru?.jatuh_tempo_baru || "-";

  // ✅ Fungsi Hitung Jasa dan Penalty
  const hitungJasaDanDenda = (pokok, tanggalGadai, tanggalJatuhTempo, typeNama) => {
    const tglGadai = new Date(tanggalGadai);
    const tglTempo = new Date(tanggalJatuhTempo);
    const tglSekarang = new Date();

    // Hitung lama hari
    let selisihHari = Math.ceil((tglTempo - tglGadai) / (1000 * 60 * 60 * 24));

    const type = typeNama?.toLowerCase() || "";
    let bungaPersen = 0;

    // 📱 Handphone / Elektronik
    if (["handphone", "elektronik"].includes(type)) {
      if (selisihHari <= 16) bungaPersen = 4.5;
      else if (selisihHari <= 31) bungaPersen = 9.5;
      else if (selisihHari <= 46) bungaPersen = 14;
      else if (selisihHari <= 61) bungaPersen = 19;
      else bungaPersen = 19 + Math.ceil((selisihHari - 60) / 15) * 5;
    }

    // 🪙 Emas / Perhiasan / Logam Mulia / Retro
    else if (["perhiasan", "logam mulia", "retro", "emas"].includes(type)) {
      if (selisihHari <= 16) bungaPersen = 1.5;
      else if (selisihHari <= 31) bungaPersen = 2.5;
      else if (selisihHari <= 46) bungaPersen = 4;
      else if (selisihHari <= 61) bungaPersen = 5;
      else bungaPersen = 5 + Math.ceil((selisihHari - 60) / 15) * 1;
    }

    // 💰 Hitung jasa
    const jasaPeriode = pokok * (bungaPersen / 100);

    // 💰 Jika lewat jatuh tempo → jasa lama ikut
    const jasaLama = tglSekarang > tglTempo ? jasaPeriode : 0;

    // 💰 Admin hanya untuk perhiasan/logam mulia/retro
    const admin = ["perhiasan", "logam mulia", "retro", "emas"].includes(type)
      ? 10000
      : 0;

    // 💰 Denda dihapus (tidak digunakan)
    const denda = 0;

    // 💰 Penalty: hanya jika telat
    let penalty = 0;
    if (tglSekarang > tglTempo) {
      const selisihBulan =
        (tglSekarang.getFullYear() - tglTempo.getFullYear()) * 12 +
        (tglSekarang.getMonth() - tglTempo.getMonth());
      const bulanTerlambat = Math.max(1, selisihBulan);
      penalty = bulanTerlambat * 180000;
    }

    const jasa = jasaPeriode + jasaLama;
    return { jasa, denda, admin, penalty };
  };

  // Hitung total bayar
  const { jasa, denda, admin, penalty } = hitungJasaDanDenda(
    pokok,
    detail?.tanggal_gadai,
    detail?.jatuh_tempo,
    typeNama
  );
  const totalBayar = jasa + denda + admin + penalty;

  // Helper Format
  const formatRupiah = (val) => `Rp. ${Number(val || 0).toLocaleString("id-ID")}`;
  const formatHariTanggal = (date) => {
    const hari = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
    const bulan = ["Januari","Februari","Maret","April","Mei","Juni","Juli",
                   "Agustus","September","Oktober","November","Desember"];
    return `${hari[date.getDay()]}, ${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
  };
  const tanggalCetakStruk = formatHariTanggal(today);

  // Barang Info
  let barangNama = "-", barangDetail = "-", labelBarangDetail = "-";
  switch ((typeNama || "").toLowerCase()) {
    case "handphone":
    case "elektronik":
      if (detail.hp) {
        barangNama = detail.hp.nama_barang || "-";
        barangDetail = `${detail.hp.merk || "-"} / ${detail.hp.type_hp || "-"}`;
        labelBarangDetail = "Merk / Type";
      }
      break;
    case "perhiasan":
    case "logam mulia":
    case "retro":
    case "emas":
      const obj = detail.perhiasan || detail.logam_mulia || detail.retro;
      if (obj) {
        barangNama = obj.nama_barang || "-";
        barangDetail = `${obj.karat || "-"} / ${obj.berat || "-"}`;
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
        <title>Struk Perpanjangan</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { font-family: monospace; font-size: 11px; margin:0; padding:0; }
          .print-box { width: 80mm; margin:0 auto; padding:6px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          img { display: block; margin: 0 auto 6px auto; width: 150px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="print-box">
          <div class="center">
            <img src="${logo}" alt="Logo" />
            <div>No Transaksi</div>
            <div class="bold">${detail?.no_gadai || "-"}</div>
          </div>

          <div class="row"><span>Hari, Tanggal</span><span>${tanggalCetakStruk}</span></div>
          <div class="row"><span>Petugas</span><span>${petugas}</span></div>

          <div class="center bold" style="margin:6px 0;">PERPANJANGAN GADAI</div>

          <div class="row"><span>Nama Barang</span><span>${barangNama}</span></div>
          <div class="row"><span>${labelBarangDetail}</span><span>${barangDetail}</span></div>
          <hr />

          <div class="row"><span>Pokok Pinjaman</span><span>${formatRupiah(pokok)}</span></div>
          <div class="row"><span>Jasa (Lama + Baru)</span><span>${formatRupiah(jasa)}</span></div>
          ${denda > 0 ? `<div class="row"><span>Denda</span><span>${formatRupiah(denda)}</span></div>` : ""}
          ${admin > 0 ? `<div class="row"><span>Admin</span><span>${formatRupiah(admin)}</span></div>` : ""}
          ${penalty > 0 ? `<div class="row"><span>Penalty</span><span>${formatRupiah(penalty)}</span></div>` : ""}
          <hr />
          <div class="row bold"><span>Total Bayar (Perpanjangan)</span><span>${formatRupiah(totalBayar)}</span></div>
          <hr />

          <div class="row"><span>Tanggal Gadai</span><span>${detail?.tanggal_gadai || "-"}</span></div>
          <div class="row"><span>Jatuh Tempo Lama</span><span>${detail?.jatuh_tempo || "-"}</span></div>
          ${perpanjanganTerbaru ? `<div class="row"><span>Jatuh Tempo Baru</span><span>${jatuhTempoBaru}</span></div>` : ""}
          <hr />

          <div class="center">
            <div>Terima kasih atas kepercayaan Anda!</div>
            <div>Gadai cepat, aman, dan terpercaya di</div>
            <div class="bold">CG GADAI.</div>
          </div>
        </div>
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </body>
    </html>
  `;

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", p: 2, textAlign: "center", fontFamily: "monospace" }}>
      <div ref={printRef} style={{ border: "1px dashed #ccc", padding: "12px", marginBottom: "12px" }}>
        <img src={logo} alt="Logo" style={{ width: "120px", margin: "0 auto 8px auto" }} />
        <div>No Transaksi: <b>{detail?.no_gadai || "-"}</b></div>
        <div>Hari, Tanggal: {tanggalCetakStruk}</div>
        <div>Petugas: {petugas}</div>
        <div style={{ marginTop: "6px", fontWeight: "bold" }}>PERPANJANGAN GADAI</div>
        <div style={{ textAlign: "left", marginTop: "6px" }}>
          <div>Nama Barang: {barangNama}</div>
          <div>{labelBarangDetail}: {barangDetail}</div>
          <hr />
          <div>Pokok Pinjaman: {formatRupiah(pokok)}</div>
          <div>Jasa (Lama + Baru): {formatRupiah(jasa)}</div>
          {denda > 0 && <div>Denda: {formatRupiah(denda)}</div>}
          {admin > 0 && <div>Admin: {formatRupiah(admin)}</div>}
          {penalty > 0 && <div>Penalty: {formatRupiah(penalty)}</div>}
          <hr />
          <div><b>Total Bayar (Perpanjangan): {formatRupiah(totalBayar)}</b></div>
          <div>Tanggal Gadai: {detail?.tanggal_gadai || "-"}</div>
          <div>Jatuh Tempo Lama: {detail?.jatuh_tempo || "-"}</div>
          {perpanjanganTerbaru && <div>Jatuh Tempo Baru: {jatuhTempoBaru}</div>}
        </div>
        <div style={{ marginTop: "8px", fontSize: "12px" }}>
          <p>Terima kasih atas kepercayaan Anda!</p>
          <p>Gadai cepat, aman, dan terpercaya di</p>
          <p><b>CG GADAI.</b></p>
        </div>
      </div>

      <Button variant="contained" color="primary" onClick={handlePrint}>
        Cetak Struk Perpanjangan
      </Button>
    </Box>
  );
};

export default PrintStrukPerpanjanganPage;
