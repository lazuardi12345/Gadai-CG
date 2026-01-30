import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Box, Button, Card, TextField, Stack, CircularProgress } from '@mui/material';
import { Print, Refresh } from '@mui/icons-material';
import axiosInstance from 'api/axiosInstance';
import logo from "assets/images/LogoBaru1.png";
import { AuthContext } from "AuthContex/AuthContext"; 

const RekapPelelanganBulanan = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const { user } = useContext(AuthContext);
  
  const userRole = (user?.role || localStorage.getItem('role') || "").toLowerCase();
  const [bulan, setBulan] = useState(new Date().toISOString().slice(0, 7)); 

  const getApiUrl = useCallback(() => {
    const path = `/rekap-bulanan-lelang`;
    return userRole === "admin" ? `/admin${path}` : path;
  }, [userRole]);

  const fetchData = useCallback(async () => {
    if (!userRole) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(getApiUrl(), { 
        params: { bulan: bulan } 
      });
      if (res.data.success) {
        setData(res.data.data_tabel || []);
      }
    } catch (err) { 
      console.error("Error fetching data:", err); 
    } finally { 
      setLoading(false); 
    }
  }, [bulan, getApiUrl, userRole]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const formatRupiah = (val) => `Rp. ${Number(val || 0).toLocaleString("id-ID")}`;

  return (
    <Box sx={{ p: 3, bgcolor: '#1e293b', minHeight: '100vh' }}>
      <Card sx={{ p: 2, mb: 3 }} className="no-print">
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField 
            label="Pilih Bulan" 
            type="month" 
            value={bulan} 
            onChange={(e) => setBulan(e.target.value)} 
            size="small" 
            InputLabelProps={{ shrink: true }} 
            sx={{ bgcolor: 'white' }} 
          />
          <Button variant="contained" startIcon={<Refresh />} onClick={fetchData}>Ambil Data</Button>
          <Button variant="contained" color="success" startIcon={<Print />} onClick={() => window.print()}>Cetak Laporan</Button>
        </Stack>
      </Card>

      {loading ? (
        <Box sx={{ textAlign: 'center', mt: 10 }}><CircularProgress /></Box>
      ) : (
        <Box className="print-area">
          <div className="struk-grid">
            {data.map((item, idx) => {
              const detail = item.detail_full || {};
              const kalkulasi = item.kalkulasi_full || {};
              const typeLower = (detail.type?.nama_type || "").toLowerCase();
              const isLunas = item.status === "LUNAS";

              // Logic Deteksi Barang
              let detailBarang = "";
              let namaBarangFinal = detail.hp?.nama_barang || detail.perhiasan?.nama_barang || detail.logam_mulia?.nama_barang || "Barang";

              if (typeLower.includes("hp") || typeLower.includes("handphone") || typeLower.includes("elektronik")) {
                const hp = detail.hp || {};
                detailBarang = `IMEI: ${hp.imei || "-"}\n${hp.merk?.nama_merk || ""} ${hp.type_hp?.nama_type || ""}`;
              } else {
                const emas = detail.perhiasan || detail.logam_mulia || detail.logamMulia || detail.retro || {};
                detailBarang = `Karat: ${emas.karat || emas.karatase || "-"} / Berat: ${emas.berat || emas.berat_bersih || "-"} gr`;
              }

              return (
                <div key={idx} className="struk-item">
                  <div className="center">
                    <img src={logo} alt="Logo" style={{ width: '90px' }} />
                    <div className="bold" style={{ fontSize: '10px', marginTop: '4px', textTransform: 'uppercase' }}>
                      {isLunas ? "Struk Penebusan" : "Struk Barang Terlelang"}
                    </div>
                  </div>
                  <div className="row" style={{ marginTop: '8px', borderBottom: '1.2px solid #000', paddingBottom: '2px' }}>
                    <span style={{ fontSize: '8px' }}>{item.label_waktu}:</span>
                    <span className="bold" style={{ fontSize: '8px' }}>{item.tanggal} | {item.waktu} </span>
                  </div>

                  <div className="row" style={{ marginTop: '5px' }}><span>No Transaksi:</span><span className="bold">{item.no_gadai}</span></div>
                  <div className="row"><span>Nasabah:</span><span className="bold">{(item.nama_nasabah || "").substring(0, 20)}</span></div>
                  <div className="row"><span>Barang:</span><span>{namaBarangFinal}</span></div>
                  <pre className="detail-text">{detailBarang}</pre>
                  
                  <hr />
                  <div className="row"><span>Pokok Pinjaman:</span><span>{formatRupiah(detail.uang_pinjaman)}</span></div>
                  <div className="row"><span>Bunga/Sewa:</span><span>{formatRupiah(kalkulasi.bunga)}</span></div>
                  <div className="row"><span>Denda:</span><span>{formatRupiah(kalkulasi.denda)}</span></div>
                  {Number(kalkulasi.penalty) > 0 && <div className="row"><span>Penalty:</span><span>{formatRupiah(kalkulasi.penalty)}</span></div>}
                  
                  <div className="row bold" style={{ borderTop: '1px solid #000', marginTop: '2px', paddingTop: '2px' }}>
                    <span>TOTAL HUTANG:</span>
                    <span>{formatRupiah(item.hutang_sistem)}</span>
                  </div>

                  <hr />
                  <div className="row bold" style={{ fontSize: '10px' }}>
                    <span>{isLunas ? "NOMINAL DIBAYAR:" : "HARGA TERLELANG:"}</span>
                    <span>{formatRupiah(item.nominal_masuk)}</span>
                  </div>

                  {!isLunas && (
                    <div className="row bold" style={{ color: 'green', fontSize: '9px' }}>
                      <span>PROFIT LELANG:</span>
                      <span>{formatRupiah(item.profit_lelang)}</span>
                    </div>
                  )}

                  <div className="thanks">
                    <div style={{ fontSize: '7px', marginBottom: '4px' }}>Unit barang telah {isLunas ? 'diserahkan kembali' : 'dipindah tangankan'}.</div>
                    <div className="bold">SENTRA GADAI INDONESIA</div>
                    <div style={{ fontSize: '7px' }}>Gadai cepat, aman, & terpercaya</div>
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
            margin: 10mm 5mm; 
            -webkit-print-color-adjust: exact; 
          }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; color: #000 !important; }
          .no-print { display: none !important; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }

          .struk-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4mm; width: 100%; }
          .struk-item { 
            border: 1.5px solid #000 !important; 
            padding: 4mm; 
            font-size: 9px; 
            min-height: 98mm; 
            display: flex; 
            flex-direction: column; 
            background: #fff !important; 
            font-family: "Courier New", monospace;
            box-sizing: border-box; 
            page-break-inside: avoid;
          }
          .row { display: flex; justify-content: space-between; margin-bottom: 0.8mm; }
          .bold { font-weight: bold !important; }
          .center { text-align: center; }
          .detail-text { white-space: pre-wrap; font-size: 8px; margin: 1mm 0; font-family: inherit; line-height: 1.2; border-left: 2px solid #eee; padding-left: 4px; }
          hr { border: none; border-top: 1px dashed #000 !important; margin: 2mm 0 !important; }
          .thanks { margin-top: auto; text-align: center; font-size: 8px; border-top: 1px solid #eee; padding-top: 4px; }
        }
      `}</style>
    </Box>
  );
};

export default RekapPelelanganBulanan;