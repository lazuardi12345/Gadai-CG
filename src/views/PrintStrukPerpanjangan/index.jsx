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

  const perpanjanganTerbaru = detail?.perpanjangan_tempos?.length
    ? detail.perpanjangan_tempos[detail.perpanjangan_tempos.length - 1]
    : null;

  const tanggalPerpanjangan =
    perpanjanganTerbaru?.tanggal_perpanjangan || new Date().toISOString();
  const jatuhTempoBaru = perpanjanganTerbaru?.jatuh_tempo_baru || null;
  const periodeBaru = perpanjanganTerbaru?.periode_baru || 0;
  const jatuhTempoLama = detail.jatuh_tempo;

  // ===== FORMAT HARI, TANGGAL DAN WAKTU CETAK =====
  const formatHariTanggal = () => {
    const date = new Date();
    const hari = date.toLocaleDateString("id-ID", { weekday: "long" });
    const tanggal = date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const jam = date.getHours().toString().padStart(2, "0");
    const menit = date.getMinutes().toString().padStart(2, "0");
    return { tanggalStr: `${hari}, ${tanggal}`, waktuStr: `${jam}:${menit}` };
  };

  const { tanggalStr, waktuStr } = formatHariTanggal();

  const hitungJasaDanDenda = (
    pokok,
    jatuhTempoLama,
    typeNama,
    tanggalPerpanjangan,
    jatuhTempoBaru,
    periodeBaru
  ) => {
    const msPerDay = 1000 * 60 * 60 * 24;
    const tglTempoLama = new Date(jatuhTempoLama);
    const tglPerpanjangan = new Date(tanggalPerpanjangan);
    const tglJatuhTempoBaru = jatuhTempoBaru ? new Date(jatuhTempoBaru) : null;
    const type = (typeNama || "").toLowerCase();

    const totalTelat = Math.max(0, Math.ceil((tglPerpanjangan - tglTempoLama) / msPerDay));
    const periodeBaruDays = tglJatuhTempoBaru
      ? Math.ceil((tglJatuhTempoBaru - tglPerpanjangan) / msPerDay)
      : periodeBaru || 0;

    const blok = ["emas", "perhiasan", "logam mulia", "retro"].includes(type)
      ? [
          { start: 1, end: 15, rate: 0.015 },
          { start: 16, end: 30, rate: 0.025 },
          { start: 31, end: 45, rate: 0.015 },
          { start: 46, end: 60, rate: 0.025 },
        ]
      : [
          { start: 1, end: 15, rate: 0.045 },
          { start: 16, end: 30, rate: 0.095 },
          { start: 31, end: 45, rate: 0.045 },
          { start: 46, end: 60, rate: 0.095 },
        ];

    let jasaLama = 0;
    if (totalTelat > 0) {
      const blokTempoLama = blok.filter((b) => b.end <= 30).pop();
      if (blokTempoLama) jasaLama = pokok * blokTempoLama.rate;
    }

    const sisaHari = totalTelat > 30 ? totalTelat - 30 : 0;
    const totalHariBaru = periodeBaruDays + sisaHari;
    let jasaBaru = 0;
    if (totalHariBaru > 0) {
      const blokBaru =
        blok.find((b) => totalHariBaru >= b.start && totalHariBaru <= b.end) || blok[blok.length - 1];
      jasaBaru = pokok * blokBaru.rate;
    }

    const isEmas = ["emas", "perhiasan", "logam mulia", "retro"].includes(type);
    const denda = totalTelat > 0 ? pokok * (isEmas ? 0.015 : 0.045) : 0;
    const penalty = totalTelat > 15 ? 180000 : 0;
    const admin = isEmas ? 10000 : 0;

    return {
      jasaLama,
      jasaBaru,
      denda,
      admin,
      penalty,
      overdueDays: totalTelat,
      newPeriodDays: totalHariBaru,
    };
  };

  const { jasaLama, jasaBaru, denda, admin, penalty, overdueDays, newPeriodDays } =
    hitungJasaDanDenda(pokok, jatuhTempoLama, typeNama, tanggalPerpanjangan, jatuhTempoBaru, periodeBaru);

  const totalBayar = jasaLama + jasaBaru + denda + admin + penalty;

  const formatRupiah = (val) => `Rp. ${Number(val || 0).toLocaleString("id-ID")}`;
  const formatTanggal = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
  };

  // info barang
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
            <div style="margin-top:2px;">Hari, Tanggal: ${tanggalStr}</div>
            <div style="margin-top:2px;">Waktu: ${waktuStr}</div>
          </div>
          <div class="row"><span>Petugas</span><span>${petugas}</span></div>
          <div class="center bold" style="margin:6px 0;">PERPANJANGAN GADAI</div>
          <div class="row"><span>Nama Barang</span><span>${barangNama}</span></div>
          <div class="row"><span>${labelBarangDetail}</span><span>${barangDetail}</span></div>
          <hr />
          <div class="row"><span>Pokok Pinjaman</span><span>${formatRupiah(pokok)}</span></div>
          <div class="row"><span>Jasa Lama</span><span>${formatRupiah(jasaLama)}</span></div>
          <div class="row"><span>Jasa Baru</span><span>${formatRupiah(jasaBaru)}</span></div>
          ${denda > 0 ? `<div class="row"><span>Denda</span><span>${formatRupiah(denda)}</span></div>` : ""}
          ${admin > 0 ? `<div class="row"><span>Admin</span><span>${formatRupiah(admin)}</span></div>` : ""}
          ${penalty > 0 ? `<div class="row"><span>Penalty</span><span>${formatRupiah(penalty)}</span></div>` : ""}
          <hr />
          <div class="row bold"><span>Total Bayar</span><span>${formatRupiah(totalBayar)}</span></div>
          <hr />
          <div class="row"><span>Telat</span><span>${overdueDays} hari</span></div>
          <div class="row"><span>Periode Baru</span><span>${newPeriodDays} hari</span></div>
          <div class="row"><span>Tanggal Gadai</span><span>${formatTanggal(detail?.tanggal_gadai)}</span></div>
          <div class="row"><span>Jatuh Tempo Lama</span><span>${formatTanggal(jatuhTempoLama)}</span></div>
          <div class="row"><span>Tanggal Perpanjangan</span><span>${formatTanggal(tanggalPerpanjangan)}</span></div>
          <div class="row"><span>Jatuh Tempo Baru</span><span>${formatTanggal(jatuhTempoBaru)}</span></div>
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
        <div>Hari, Tanggal: {tanggalStr}</div>
        <div>Waktu: {waktuStr}</div>
        <div>Petugas: {petugas}</div>
        <div style={{ marginTop: "6px", fontWeight: "bold" }}>PERPANJANGAN GADAI</div>
        <div style={{ textAlign: "left", marginTop: "6px" }}>
          <div>Nama Barang: {barangNama}</div>
          <div>{labelBarangDetail}: {barangDetail}</div>
          <hr />
          <div>Pokok Pinjaman: {formatRupiah(pokok)}</div>
          <div>Jasa Lama: {formatRupiah(jasaLama)}</div>
          <div>Jasa Baru: {formatRupiah(jasaBaru)}</div>
          {denda > 0 && <div>Denda: {formatRupiah(denda)}</div>}
          {admin > 0 && <div>Admin: {formatRupiah(admin)}</div>}
          {penalty > 0 && <div>Penalty: {formatRupiah(penalty)}</div>}
          <hr />
          <div><b>Total Bayar: {formatRupiah(totalBayar)}</b></div>
          <div>Telat: {overdueDays} hari</div>
          <div>Periode Baru: {newPeriodDays} hari</div>
          <div>Tanggal Gadai: {formatTanggal(detail?.tanggal_gadai)}</div>
          <div>Jatuh Tempo Lama: {formatTanggal(jatuhTempoLama)}</div>
          <div>Tanggal Perpanjangan: {formatTanggal(tanggalPerpanjangan)}</div>
          <div>Jatuh Tempo Baru: {formatTanggal(jatuhTempoBaru)}</div>
          <hr />
        </div>
      </div>
      <Button variant="contained" color="primary" onClick={handlePrint}>
        Cetak Struk Perpanjangan
      </Button>
    </Box>
  );
};

export default PrintStrukPerpanjanganPage;
