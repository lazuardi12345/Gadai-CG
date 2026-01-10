import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "api/axiosInstance";
import { CircularProgress, Button, Box, Typography } from "@mui/material";
import { AuthContext } from "AuthContex/AuthContext";
import logo from "assets/images/LogoBaru1.png";

const PrintStrukPelunasanLelangPage = () => {
  const { detailGadaiId } = useParams();
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const getApiUrl = () => {
    if (!detailGadaiId) return null;

    switch (userRole) {
      case "checker":
        return `/checker/pelelangan/${detailGadaiId}`;
      case "admin":
        return `/admin/pelelangan/${detailGadaiId}`;
      default:
        return `/pelelangan/${detailGadaiId}`; 
    }
  };


  useEffect(() => {
    const fetchData = async () => {
      const url = getApiUrl();
      if (!url) return;

      try {
        const res = await axiosInstance.get(url);
        if (res.data?.success) {
          setData(res.data.data);
        } else {
          setData(null);
        }
      } catch (err) {
        console.error("Gagal ambil data struk:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [detailGadaiId, userRole]);

  if (loading) {
    return <CircularProgress sx={{ display: "block", mx: "auto", mt: 10 }} />;
  }

  if (!data) {
    return <Typography align="center">Data tidak ditemukan</Typography>;
  }


  const pelelangan = data?.pelelangan || {};
  const detail = pelelangan?.detail_gadai || {};
  const kalkulasi = data?.kalkulasi || {};
  const nasabah = detail?.nasabah || {};

  const safe = (v) =>
    v === null || v === undefined || typeof v === "object"
      ? "-"
      : String(v);


let barangNama = detail?.type?.nama_type || "-"; 
let barangDetail = "-";

const formatLabel = (text) => {
  if (!text) return "-";
  return String(text).replace(/_/g, " ").toUpperCase();
};


if (detail?.hp) {
  const hp = detail.hp;
  
  const txtMerk = hp.merk?.nama_merk || "-";
  const txtType = hp.type_hp?.nama_type || "-";

  barangDetail = `
MERK      : ${safe(txtMerk)}
TYPE      : ${safe(txtType)}
GRADE     : ${formatLabel(hp.grade_type)}
ROM / RAM : ${safe(hp.rom)} / ${safe(hp.ram)}
IMEI      : ${safe(hp.imei)}
`.trim();
} 


else if (detail?.perhiasan) {
  const p = detail.perhiasan;
  barangDetail = `
NAMA BARANG : ${safe(p.nama_barang)}
BERAT       : ${safe(p.berat)} gram
KARAT       : ${safe(p.karat)}
`.trim();
}


else if (detail?.logam_mulia) {
  const p = detail.logam_mulia;
  barangDetail = `
NAMA BARANG : ${safe(p.nama_barang)}
BERAT       : ${safe(p.berat)} gram
KARAT       : ${safe(p.karat)}
`.trim();
}

else if (detail?.retro) {
  const p = detail.retro;
  barangDetail = `
NAMA BARANG : ${safe(p.nama_barang)}
BERAT       : ${safe(p.berat)} gram
KARAT       : ${safe(p.karat)}
`.trim();
}
  /* ================= TANGGAL ================= */
  const pelunasanDate = new Date(
  pelelangan?.waktu_bayar || new Date()
);

  const hari = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  const bulan = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"
  ];

  const tanggalStr = `${hari[pelunasanDate.getDay()]}, ${pelunasanDate.getDate()} ${
    bulan[pelunasanDate.getMonth()]
  } ${pelunasanDate.getFullYear()}`;

  const jamStr = `${pelunasanDate.getHours().toString().padStart(2, "0")}:${pelunasanDate
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  /* ================= NOMINAL ================= */
  const formatRupiah = (v) =>
    `Rp. ${Number(v || 0).toLocaleString("id-ID")}`;

  /* ================= PRINT ================= */
  const handlePrint = () => {
    const win = window.open("", "", "width=400,height=600");

    win.document.write(`
      <html>
        <head>
          <title>Struk Pelunasan</title>
          <style>
            @page { size: 80mm auto; margin: 0 }
            body {
              width: 80mm;
              font-family: "Courier New", monospace;
              font-size: 11px;
              font-weight: 600;
              padding: 6px;
            }
            .center { text-align: center }
            .bold { font-weight: 700 }
            img { width: 120px; margin: 0 auto 6px; display: block }
            .row { display: flex; justify-content: space-between }
            hr { border-top: 1px dashed #000; margin: 6px 0 }
            pre { margin: 0; white-space: pre-wrap }
          </style>
        </head>
        <body>

          <div class="center">
            <img src="${logo}" />
            <div>No Transaksi</div>
            <div class="bold">${safe(detail?.no_gadai)}</div>
          </div>

          <div class="row"><span>Tanggal</span><span>${tanggalStr}</span></div>
          <div class="row"><span>Waktu</span><span>${jamStr}</span></div>
          <div class="row"><span>Nasabah</span><span>${safe(nasabah?.nama_lengkap)}</span></div>

          <hr/>

          <div class="center bold">STRUK PELUNASAN</div>

          <div>Nama Barang:</div>
          <div class="bold">${barangNama}</div>
          <pre>${barangDetail}</pre>

          <hr/>

          <div class="row"><span>Pokok</span><span>${formatRupiah(detail?.uang_pinjaman)}</span></div>
          <div class="row"><span>Bunga</span><span>${formatRupiah(kalkulasi?.bunga)}</span></div>
          <div class="row"><span>Denda</span><span>${formatRupiah(kalkulasi?.denda)}</span></div>
          <div class="row"><span>Penalty</span><span>${formatRupiah(kalkulasi?.penalty)}</span></div>
          <div class="row"><span>Terlambat</span><span>${safe(kalkulasi?.hari_terlambat)} hari</span></div>

          <div class="row bold">
            <span>Total Bayar</span>
            <span>${formatRupiah(kalkulasi?.total_hutang)}</span>
          </div>

          <hr/>

          <div class="center">
            Terima kasih atas kepercayaan Anda<br/>
            <b>SENTRA GADAI INDONESIA</b>
          </div>

          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 300);
            }
          </script>

        </body>
      </html>
    `);

    win.document.close();
  };

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", p: 2 }}>
      <Button fullWidth variant="contained" onClick={handlePrint}>
        Cetak Struk Pelunasan
      </Button>
    </Box>
  );
};

export default PrintStrukPelunasanLelangPage;
