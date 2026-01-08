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

  const fetchData = useCallback(async () => {
    if (!userRole) return; 
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/laporan/rekap-pelunasan-mingguan', { 
        params: { tanggal_mulai: tanggalMulai, tanggal_selesai: tanggalSelesai } 
      });
      if (res.data.success) setData(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tanggalMulai, tanggalSelesai, userRole]);

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
              const kalkulasi = item.kalkulasi_pelunasan || {};
              const typeLower = (item.type?.nama_type || "").toLowerCase();
              
              // Logic Detail Barang Sama dengan Struk Satuan
              let detailBarang = "";
              if (typeLower === "handphone" || typeLower === "hp" || typeLower === "elektronik") {
                const hp = item.hp || {};
                detailBarang = 
                  `MERK/TYPE: ${(hp.merk?.nama_merk || "")} / ${(hp.type_hp?.nama_type || "")}\n` +
                  `ROM/RAM  : ${(hp.rom || "-")} / ${(hp.ram || "-")}\n` + 
                  `GRADE    : ${(hp.grade_type || "").replace(/_/g, " ").toUpperCase()}`;
              } else {
                const emas = item.perhiasan || item.logam_mulia || item.retro || {};
                detailBarang = `Karat/Berat: ${(emas.karat || "-")} / ${(emas.berat || "-")}`;
              }

              return (
                <div key={idx} className="struk-item">
                  <div className="center">
                    <img src={logo} alt="Logo" style={{ width: '100px', marginBottom: '4px' }} />
                    <div style={{ fontSize: '9px' }}>No Transaksi:</div>
                    <div className="bold" style={{ fontSize: '10px' }}>{item.no_gadai}</div>
                  </div>

                  <div className="row" style={{ marginTop: '4px' }}><span>Petugas:</span><span>{item.nasabah?.user?.name || "-"}</span></div>
                  <div className="row"><span>Nasabah:</span><span className="bold">{(item.nasabah?.nama_lengkap || "-").substring(0, 15)}</span></div>
                  
                  <div className="center bold" style={{ margin: '4px 0', borderTop: '1.2px solid #000', borderBottom: '1.2px solid #000', padding: '2px 0', fontSize: '11px' }}>
                    PEMBAYARAN LUNAS
                  </div>

                  <div className="row"><span>Nama Barang:</span><span className="bold">{item.hp?.nama_barang || item.perhiasan?.nama_barang || "-"}</span></div>
                  <pre className="detail-text">{detailBarang}</pre>
                  
                  <hr />
                  <div className="row"><span>Pokok Pinjaman:</span><span>{formatRupiah(item.uang_pinjaman)}</span></div>
                  {kalkulasi.denda > 0 && <div className="row"><span>Denda:</span><span>{formatRupiah(kalkulasi.denda)}</span></div>}
                  {kalkulasi.penalty > 0 && <div className="row"><span>Penalty:</span><span>{formatRupiah(kalkulasi.penalty)}</span></div>}
                  {kalkulasi.pembulatan > 0 && <div className="row"><span>Pembulatan:</span><span>{formatRupiah(kalkulasi.pembulatan)}</span></div>}
                  <div className="row"><span>Telat:</span><span>{kalkulasi.hari_telat} hari</span></div>
                  <div className="row bold" style={{ fontSize: '11px' }}><span>Total Bayar:</span><span>{formatRupiah(kalkulasi.total_bayar)}</span></div>
                  
                  <hr />
                  <div className="row"><span>Tgl Gadai:</span><span>{item.tanggal_gadai}</span></div>
                  <div className="row"><span>Jatuh Tempo:</span><span>{kalkulasi.jatuh_tempo_terakhir || item.jatuh_tempo}</span></div>

                  <div className="thanks">
                    <div>Terima kasih atas kepercayaan Anda!</div>
                    <div className="bold">SENTRA GADAI INDONESIA</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Box>
      )}

     <style>{`
        @media screen {
          .struk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70mm, 1fr)); gap: 20px; padding: 20px; }
          .struk-item { background: #fff; padding: 15px; border: 1.5px solid #000; font-family: "Courier New", monospace; color: #000; }
        }
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; color: #000 !important; }
          .no-print { display: none !important; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          @page { size: A4 landscape; margin: 4mm; }
          .struk-grid { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            grid-template-rows: repeat(2, 1fr);
            gap: 2mm; 
            width: 100%; 
          }
          .struk-item { 
            border: 1.8px solid #000 !important; 
            padding: 4mm; 
            font-size: 10px; 
            font-weight: 600;
            page-break-inside: avoid; 
            height: 98mm; 
            display: flex; 
            flex-direction: column; 
            background: #fff !important;
            font-family: "Courier New", monospace;
            line-height: 1.2;
          }
          .row { display: flex; justify-content: space-between; margin-bottom: 0.5mm; }
          .bold { font-weight: 900 !important; }
          .center { text-align: center; }
          .detail-text { 
            white-space: pre-wrap; 
            font-size: 8.5px; 
            margin: 1mm 0; 
            font-family: inherit; 
            line-height: 1.1;
            font-weight: 700;
          }
          hr { border: none; border-top: 1.5px dashed #000 !important; margin: 2mm 0 !important; }
          img { filter: grayscale(1) contrast(200%); max-width: 110px; display: block; margin: 0 auto; }
          .thanks { margin-top: auto; text-align: center; font-size: 8px; line-height: 1.1; }
        }
      `}</style>
    </Box>
  );
};

export default RekapPelunasanMingguan;