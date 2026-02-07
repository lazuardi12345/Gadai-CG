import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Box, Button, Card, TextField, Stack, CircularProgress, Typography, Alert } from '@mui/material';
import { Print, Refresh } from '@mui/icons-material';
import axiosInstance from 'api/axiosInstance';
import logo from "assets/images/LogoBaru1.png";
import { AuthContext } from "AuthContex/AuthContext"; 

const RekapStrukMingguan = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  
  const userRole = (user?.role || localStorage.getItem('role') || "").toLowerCase();

  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalSelesai, setTanggalSelesai] = useState(new Date().toISOString().split('T')[0]);

  const getApiUrl = useCallback(() => {
    const path = '/laporan/struk-awal-mingguan';
    return userRole === "admin" ? `/admin${path}` : path;
  }, [userRole]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(getApiUrl(), { 
        params: { tanggal_mulai: tanggalMulai, tanggal_selesai: tanggalSelesai } 
      });
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError('Data tidak ditemukan');
      }
    } catch (err) { 
      setError(err.response?.data?.message || 'Terjadi kesalahan saat mengambil data');
    } finally { 
      setLoading(false); 
    }
  }, [tanggalMulai, tanggalSelesai, getApiUrl]);

  useEffect(() => { 
    if (userRole) fetchData(); 
  }, [fetchData, userRole]);

  const formatRupiah = (val) => `Rp. ${Number(val || 0).toLocaleString("id-ID")}`;

  return (
    <Box sx={{ p: 3, bgcolor: '#1e293b', minHeight: '100vh' }}>
      <Card sx={{ p: 2, mb: 3 }} className="no-print">
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField label="Mulai" type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} size="small" InputLabelProps={{ shrink: true }} sx={{ bgcolor: 'white' }} />
          <TextField label="Sampai" type="date" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} size="small" InputLabelProps={{ shrink: true }} sx={{ bgcolor: 'white' }} />
          <Button variant="contained" startIcon={<Refresh />} onClick={fetchData}>Ambil Data</Button>
          <Button variant="contained" color="success" startIcon={<Print />} onClick={() => window.print()}>Cetak Rekap A4</Button>
          <Typography sx={{ color: 'white', ml: 2, fontSize: '12px' }}>Role: <strong>{userRole?.toUpperCase()}</strong></Typography>
        </Stack>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }} className="no-print">{error}</Alert>}

      {loading ? (
        <Box sx={{ textAlign: 'center', mt: 10 }}><CircularProgress /></Box>
      ) : (
        <Box className="print-area">
          <div className="struk-grid">
            {data.map((item, idx) => {
              // LOGIKA DETEKSI BARANG (Sama dengan RekapPelunasan)
              const typeLower = (item.nama_type || item.type?.nama_type || "").toLowerCase();
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

              // LOGIKA KELENGKAPAN/KERUSAKAN
              const kerusakan = item.hp?.kerusakanList || [];
              const kelengkapan = item.hp?.kelengkapanList || item.perhiasan?.kelengkapan || item.logam_mulia?.kelengkapanEmas || item.retro?.kelengkapan || [];

              return (
                <div key={idx} className="struk-item">
                  <div className="center">
                    <img src={logo} alt="Logo" style={{ width: '80px', marginBottom: '4px' }} />
                    <div style={{ fontSize: '9px' }}>No Transaksi:</div>
                    <div className="bold" style={{ fontSize: '10px' }}>{item.no_gadai}</div>
                  </div>

                  <div className="row" style={{ marginTop: '6px' }}>
                    <span>Tanggal:</span>
                    <span className="bold">{item.tanggal_gadai || "-"}</span>
                  </div>
                  <div className="row">
                    <span>Petugas:</span>
                    <span className="bold">{(item.nama_petugas || item.petugas || "-").substring(0, 18)}</span>
                  </div>
                  
                  <div className="center bold" style={{ margin: '5px 0', borderTop: '1.2px solid #000', borderBottom: '1.2px solid #000', padding: '2px 0', fontSize: '11px' }}>
                    TRANSAKSI GADAI
                  </div>

                  <div className="row"><span>Barang:</span><span className="bold">{namaBarangFinal}</span></div>
                  <pre className="detail-text">{detailBarang}</pre>
                  
                  <div style={{ fontSize: '8.5px', marginTop: '4px' }}>
                    {kerusakan.length > 0 && (
                      <div><span className="bold">Kerusakan:</span> {kerusakan.map(k => k.nama_kerusakan || k.nama).join(", ")}</div>
                    )}
                    <div><span className="bold">Kelengkapan:</span> {kelengkapan.length > 0 ? kelengkapan.map(k => k.nama_kelengkapan || k.nama).join(", ") : "-"}</div>
                  </div>

                  <hr />
                  <div className="row"><span>Pinjaman:</span><span>{formatRupiah(item.uang_pinjaman)}</span></div>
                  <div className="row"><span>Jasa Sewa:</span><span>{formatRupiah(item.kalkulasi?.jasa_sewa)}</span></div>
                  <div className="row"><span>Admin:</span><span>{formatRupiah(item.kalkulasi?.admin)}</span></div>
                  <div className="row bold"><span>Total Terima:</span><span>{formatRupiah(item.kalkulasi?.total_diterima)}</span></div>
                  
                  <hr />
                  <div className="row"><span>Jatuh Tempo:</span><span className="bold">{item.jatuh_tempo || "-"}</span></div>
                  
                  <div className="thanks">
                    <div style={{ marginTop: '5px', fontSize: '7.5px' }}>Gadai cepat, aman, dan terpercaya.</div>
                    <div className="bold" style={{ fontSize: '10px' }}>SENTRA GADAI INDONESIA</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Box>
      )}

      {/* CSS sama dengan template yang Anda inginkan */}
      <style>{`
        @media screen {
          .struk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(75mm, 1fr)); gap: 20px; padding: 20px; }
          .struk-item { background: #fff; padding: 15px; border: 1px solid #000; font-family: "Courier New", monospace; color: #000; box-sizing: border-box; }
        }
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body { margin: 5mm; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; color: #000 !important; }
          .no-print { display: none !important; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .struk-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4mm; width: 100%; }
          .struk-item { 
            border: 1.5px solid #000 !important; padding: 4mm; font-size: 10px; 
            page-break-inside: avoid; min-height: 100mm; display: flex; 
            flex-direction: column; background: #fff !important; font-family: "Courier New", monospace;
          }
          .row { display: flex; justify-content: space-between; margin-bottom: 0.8mm; }
          .bold { font-weight: bold !important; }
          .center { text-align: center; }
          .detail-text { white-space: pre-wrap; font-size: 8.5px; margin: 1mm 0; font-family: inherit; line-height: 1.1; }
          hr { border: none; border-top: 1px dashed #000 !important; margin: 2mm 0 !important; }
          .thanks { margin-top: auto; text-align: center; font-size: 8px; }
        }
      `}</style>
    </Box>
  );
};

export default RekapStrukMingguan;