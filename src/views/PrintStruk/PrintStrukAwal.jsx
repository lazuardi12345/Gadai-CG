import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { CircularProgress, Button, Box } from "@mui/material";
import { AuthContext } from "AuthContex/AuthContext";
import logo from "assets/images/LogoBaru1.png";

const PrintStrukPage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, userRole]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
  if (!data) return <p>Tidak ada data.</p>;

  // --- DATA MAPPING DARI BACKEND ---
  const detail = data || {};
  const struk = detail.perhitungan_struk || {}; // Data hasil hitungan Service Laravel
  const nasabah = detail?.nasabah || {};
  const petugas = nasabah?.user?.name || "-";
  const typeNama = detail?.type?.nama_type || "-";
  const type = (typeNama || "").toLowerCase();

  // --- FORMATTING ---
  const formatRupiah = (val) => `Rp. ${Number(val || 0).toLocaleString("id-ID")}`;
  
  const formatHariTanggal = (date) => {
    const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const tgl = new Date(date);
    return {
      tanggalStr: `${hari[tgl.getDay()]}, ${tgl.getDate()} ${bulan[tgl.getMonth()]} ${tgl.getFullYear()}`,
      jamStr: `Waktu: ${tgl.getHours().toString().padStart(2, '0')}:${tgl.getMinutes().toString().padStart(2, '0')}`
    };
  };

  const { tanggalStr, jamStr } = formatHariTanggal(new Date());

  // --- PREPARING BARANG DETAIL (UI ONLY) ---
  let barangNama = "-";
  let barangDetail = "-";
  let labelBarangDetail = "Detail Barang";
  let kerusakanList = [];
  let kelengkapanList = [];

  const formatLabel = (text) => String(text || "-").replace(/_/g, " ").toUpperCase();

  if (type.includes("hp") || type.includes("handphone")) {
    const hp = detail.hp || {};
    barangNama = hp.nama_barang || "Handphone";
    labelBarangDetail = "Detail Handphone";
    barangDetail = `MERK/TYPE : ${formatLabel(hp.merk?.nama_merk)} / ${formatLabel(hp.type_hp?.nama_type)}\nRAM       : ${hp.ram || "-"}\nROM       : ${hp.rom || "-"}\nGRADE     : ${formatLabel(hp.grade_type)}`;
    kerusakanList = hp.kerusakan_list || [];
    kelengkapanList = hp.kelengkapan_list || [];
  } else {
    const item = detail.perhiasan || detail.logam_mulia || detail.retro || {};
    barangNama = item.nama_barang || "-";
    labelBarangDetail = `Detail ${typeNama}`;
    barangDetail = `Karat: ${item.karat || "-"} / Berat: ${item.berat || "-"}`;
    kelengkapanList = item.kelengkapan || item.kelengkapan_emas || [];
  }

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=400,height=600");
    const style = `
      <style>
        @media print { @page { size: 80mm auto; margin: 0; } }
        body { font-family: "Courier New", monospace; font-size: 11px; width: 80mm; padding: 5px; font-weight: 600; }
        .row { display: flex; justify-content: space-between; margin: 2px 0; }
        .center { text-align: center; }
        .bold { font-weight: 700; }
        hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
        pre { white-space: pre-wrap; font-family: inherit; margin: 0; }
      </style>
    `;

    printWindow.document.write(`
      <html>
        <head>${style}</head>
        <body>
          <div class="center">
            <img src="${logo}" width="120" />
            <div class="bold">${detail.no_gadai}</div>
          </div>
          <hr />
          <div class="row"><span>Tanggal</span><span>${tanggalStr}</span></div>
          <div class="row"><span>Petugas</span><span>${petugas}</span></div>
          <div class="center bold" style="margin: 5px 0;">TRANSAKSI GADAI</div>
          <div class="row"><span>Taksiran</span><span>${formatRupiah(detail.taksiran)}</span></div>
          <div class="row"><span>Pinjaman</span><span>${formatRupiah(detail.uang_pinjaman)}</span></div>
          <hr />
          <div class="bold">${labelBarangDetail}:</div>
          <pre>${barangDetail}</pre>
          <div class="row"><span>Kerusakan</span><span>${kerusakanList.map(k => k.nama_kerusakan).join(", ") || "-"}</span></div>
          <div class="row"><span>Kelengkapan</span><span>${kelengkapanList.map(k => k.nama_kelengkapan).join(", ") || "-"}</span></div>
          <hr />
          <div class="row"><span>Pokok</span><span>${formatRupiah(struk.pokok)}</span></div>
          <div class="row"><span>Jasa Sewa</span><span>${formatRupiah(struk.jasa_sewa)}</span></div>
          <div class="row"><span>Admin</span><span>${formatRupiah(struk.administrasi)}</span></div>
          <div class="row"><span>Asuransi</span><span>${formatRupiah(struk.asuransi)}</span></div>
          <div class="row bold"><span>TOTAL DITERIMA</span><span>${formatRupiah(struk.total_diterima)}</span></div>
          <hr />
          <div class="row"><span>Tgl Gadai</span><span>${detail.tanggal_gadai}</span></div>
          <div class="row"><span>Jatuh Tempo</span><span>${detail.jatuh_tempo}</span></div>
          <div class="center" style="margin-top:10px;">
            Terima kasih atas kepercayaan Anda!<br>
            <b>SENTRA GADAI INDONESIA</b>
          </div>
          <script>window.onload = () => { window.print(); window.close(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Box sx={{ maxWidth: 400, margin: "20px auto", textAlign: "center", border: '1px solid #ddd', p: 3, borderRadius: 2 }}>
      <img src={logo} alt="Logo" style={{ height: "80px" }} />
      <h3>{detail.no_gadai}</h3>
      <Box sx={{ textAlign: "left", my: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Pokok:</span> <b>{formatRupiah(struk.pokok)}</b></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Jasa Sewa:</span> <b>{formatRupiah(struk.jasa_sewa)}</b></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Admin:</span> <b>{formatRupiah(struk.administrasi)}</b></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'blue', fontWeight: 'bold', mt: 1 }}>
          <span>Total Diterima:</span> <span>{formatRupiah(struk.total_diterima)}</span>
        </div>
      </Box>
      <Button variant="contained" fullWidth onClick={handlePrint}>Cetak Struk Thermal</Button>
    </Box>
  );
};

export default PrintStrukPage;