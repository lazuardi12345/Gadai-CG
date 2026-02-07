import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Box, Button, Card, TextField, Stack, CircularProgress } from '@mui/material';
import { Print, Refresh } from '@mui/icons-material';
import axiosInstance from 'api/axiosInstance';
import logo from "assets/images/LogoBaru1.png";
import { AuthContext } from "AuthContex/AuthContext";

const RekapPelunasanMingguan = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();

  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalSelesai, setTanggalSelesai] = useState(new Date().toISOString().split('T')[0]);

  const getApiUrl = useCallback(() => {
    const path = '/laporan/rekap-pelunasan-mingguan';
    return userRole === "admin" ? `/admin${path}` : path;
  }, [userRole]);

  const fetchData = useCallback(async () => {
    if (!userRole) return; 
    setLoading(true);
    try {
      const res = await axiosInstance.get(getApiUrl(), { 
        params: { tanggal_mulai: tanggalMulai, tanggal_selesai: tanggalSelesai } 
      });
      if (res.data.success) setData(res.data.data);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  }, [tanggalMulai, tanggalSelesai, getApiUrl, userRole]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatRupiah = (val) => `Rp. ${Number(val || 0).toLocaleString("id-ID")}`;

  return (
    <Box sx={{ p: 3, bgcolor: '#1e293b', minHeight: '100vh' }}>
      <Card sx={{ p: 2, mb: 3 }} className="no-print">
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField label="Mulai" type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} size="small" InputLabelProps={{ shrink: true }} sx={{ bgcolor: 'white' }} />
          <TextField label="Sampai" type="date" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} size="small" InputLabelProps={{ shrink: true }} sx={{ bgcolor: 'white' }} />
          <Button variant="contained" startIcon={<Refresh />} onClick={fetchData}>Ambil Data</Button>
          <Button variant="contained" color="success" startIcon={<Print />} onClick={() => window.print()}>Cetak Rekap A4</Button>
        </Stack>
      </Card>

      {loading ? (
        <Box sx={{ textAlign: 'center', mt: 10 }}><CircularProgress /></Box>
      ) : (
        <Box className="print-area">
          <div className="struk-grid">
            {data.map((item, idx) => {
              const kalkulasi = item.kalkulasi_rekap || {};
              const typeLower = (item.nama_type || item.type?.nama_type || "").toLowerCase();
              const tglLunas = item.waktu_formatted || kalkulasi.tanggal_lunas || "-";
              const jamLunas = item.jam_formatted ? `Pukul: ${item.jam_formatted}` : "";

              let detailBarang = "";
              let namaBarangFinal = item.nama_barang || "-";
              if (typeLower.includes("hp") || typeLower.includes("handphone") || typeLower.includes("elektronik")) {
                const hp = item.hp || {};
                namaBarangFinal = hp.nama_barang || namaBarangFinal;
                detailBarang = `MERK/TYPE : ${(hp.merk?.nama_merk || "-")} / ${(hp.type_hp?.nama_type || "-")}\nRAM/ROM   : ${(hp.ram || "-")}/${(hp.rom || "-")}\nIMEI      : ${(hp.imei || "-")}`;
              } else {
                const emas = item.perhiasan || item.logamMulia || item.logam_mulia || item.retro || {};
                detailBarang = `Karat: ${(emas.karat || emas.karatase || "-")} / Berat: ${(emas.berat || emas.berat_bersih || "-")} gr`;
              }

              return (
                <div key={idx} className="struk-item">
                  <div className="center">
                    <img src={logo} alt="Logo" style={{ width: '100px', marginBottom: '4px' }} />
                    <div style={{ fontSize: '9px' }}>No Transaksi:</div>
                    <div className="bold" style={{ fontSize: '10px' }}>{item.no_gadai}</div>
                  </div>

                  <div className="row" style={{ marginTop: '6px' }}>
                    <span>Tgl Lunas:</span>
                    <span className="bold">{tglLunas}</span>
                  </div>
                  <div className="row">
                    <span>Waktu:</span>
                    <span className="bold">{jamLunas}</span>
                  </div>
                  <div className="row">
  <span>Petugas:</span>
  <span className="bold">
    {(
      item.nama_petugas || 
      item.petugas || 
      item.user?.name || 
      item.detail_gadai?.nasabah?.user?.name || 
      "-"
    ).substring(0, 18)}
  </span>
</div>
                  
                  <div className="center bold" style={{ margin: '6px 0', borderTop: '1.2px solid #000', borderBottom: '1.2px solid #000', padding: '2px 0', fontSize: '11px' }}>
                    STRUK PELUNASAN
                  </div>

                  <div className="row"><span>Barang:</span><span className="bold">{namaBarangFinal}</span></div>
                  <pre className="detail-text">{detailBarang}</pre>
                  
                  <hr />
                  <div className="row"><span>Pokok:</span><span>{formatRupiah(kalkulasi.pokok)}</span></div>
                  {Number(kalkulasi.denda) > 0 && <div className="row"><span>Denda:</span><span>{formatRupiah(kalkulasi.denda)}</span></div>}
                  {Number(kalkulasi.penalty) > 0 && <div className="row"><span>Penalty:</span><span>{formatRupiah(kalkulasi.penalty)}</span></div>}
                  <div className="row"><span>Telat:</span><span>{kalkulasi.hari_telat} hari</span></div>
                  <hr />
                  <div className="row bold" style={{ fontSize: '11px' }}><span>TOTAL BAYAR:</span><span>{formatRupiah(kalkulasi.total_bayar)}</span></div>
                  <div className="row"><span>Metode:</span><span className="bold">{kalkulasi.metode || "CASH"}</span></div>
                  
                  <div className="thanks">
                    <div style={{ marginTop: '8px', fontSize: '7.5px' }}>Unit barang telah diserahkan kembali dalam kondisi baik.</div>
                    <div className="bold" style={{ fontSize: '10px' }}>SENTRA GADAI INDONESIA</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Box>
      )}

     <style>{`
        @media screen {
          .struk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(75mm, 1fr)); gap: 20px; padding: 20px; }
          .struk-item { background: #fff; padding: 15px; border: 1px solid #000; font-family: "Courier New", monospace; color: #000; box-sizing: border-box; }
        }
        @media print {
          @page { 
            size: A4 landscape; 
            margin: 0; 
          }
          body { 
            margin: 5mm; 
          }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; color: #000 !important; }
          .no-print { display: none !important; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          
          .struk-grid { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 4mm; 
            width: 100%; 
          }
          .struk-item { 
            border: 1.5px solid #000 !important; 
            padding: 4mm; 
            font-size: 10px; 
            page-break-inside: avoid; 
            min-height: 100mm; 
            display: flex; 
            flex-direction: column; 
            background: #fff !important;
            font-family: "Courier New", monospace;
            box-sizing: border-box;
          }
          .row { display: flex; justify-content: space-between; margin-bottom: 0.8mm; }
          .bold { font-weight: bold !important; }
          .center { text-align: center; }
          .detail-text { 
            white-space: pre-wrap; 
            font-size: 8.5px; 
            margin: 1mm 0; 
            font-family: inherit; 
            line-height: 1.1;
            background: none;
            border: none;
            padding: 0;
          }
          hr { border: none; border-top: 1px dashed #000 !important; margin: 2mm 0 !important; }
          .thanks { 
            margin-top: auto; 
            text-align: center; 
            font-size: 8px; 
            padding-bottom: 1mm;
          }
        }
      `}</style>
    </Box>
  );
};

export default RekapPelunasanMingguan;