import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Box, Button, Card, TextField, Stack, CircularProgress, Typography } from '@mui/material';
import { Print, Refresh } from '@mui/icons-material';
import axiosInstance from 'api/axiosInstance';
import logo from "assets/images/LogoBaru1.png";
import { AuthContext } from "AuthContex/AuthContext";

const RekapPerpanjanganMingguan = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  
  const { user } = useContext(AuthContext);
  const userRole = (user?.role || "").toLowerCase();

  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalSelesai, setTanggalSelesai] = useState(new Date().toISOString().split('T')[0]);

  const getApiUrl = () => {
    const path = '/laporan/rekap-perpanjangan-mingguan';
    return userRole === "admin" ? `/admin${path}` : path;
  };

  const fetchData = useCallback(async () => {
    if (!userRole) return; 
    setLoading(true);
    try {
      const res = await axiosInstance.get(getApiUrl(), { 
        params: { tanggal_mulai: tanggalMulai, tanggal_selesai: tanggalSelesai } 
      });
      if (res.data.success) setData(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tanggalMulai, tanggalSelesai, userRole]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatRupiah = (val) => `Rp. ${Number(val || 0).toLocaleString("id-ID")}`;

  const renderDetailBarang = (gadai) => {
    if (!gadai) return "-";
    const type = (gadai.type?.nama_type || "").toLowerCase();
    if (["handphone", "hp", "elektronik"].includes(type)) {
      const hp = gadai.hp || {};
      const merk = (hp.merk?.nama_merk || "").toUpperCase();
      const typeHp = (hp.type_hp?.nama_type || "").toUpperCase();
      return `MERK/TYPE: ${merk}/${typeHp}\nROM/RAM  : ${hp.rom || '-'} / ${hp.ram || '-'}\nGRADE    : ${hp.grade_type || '-'}`;
    }
    const emas = gadai.perhiasan || gadai.logam_mulia || gadai.retro || {};
    return `Karat/Berat: ${emas.karat || "-"} / ${emas.berat || "-"}`;
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#1e293b', minHeight: '100vh' }}>
      <Card sx={{ p: 2, mb: 3 }} className="no-print">
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField label="Mulai" type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} size="small" InputLabelProps={{ shrink: true }} sx={{ bgcolor: 'white', borderRadius: 1 }} />
          <TextField label="Sampai" type="date" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} size="small" InputLabelProps={{ shrink: true }} sx={{ bgcolor: 'white', borderRadius: 1 }} />
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
              const gadai = item.detail_gadai || {};
              const typeNama = gadai.type?.nama_type?.toLowerCase() || "-";
              const pokok = Number(gadai.uang_pinjaman || 0);
              const isHP = ["handphone", "hp", "elektronik"].includes(typeNama);
              
              const tglExtend = new Date(item.tanggal_perpanjangan);
              const jtLama = new Date(gadai.tanggal_gadai); 
              const jtBaru = new Date(item.jatuh_tempo_baru);
              const totalTelat = Math.max(0, Math.ceil((tglExtend - jtLama) / (1000 * 60 * 60 * 24)));
              const periodeBaruHari = Math.max(0, Math.ceil((jtBaru - tglExtend) / (1000 * 60 * 60 * 24)));

              const rateJasa = isHP ? (periodeBaruHari <= 15 ? 0.045 : 0.095) : (periodeBaruHari <= 15 ? 0.015 : 0.025);
              const jasaBaru = pokok * rateJasa;
              const denda = pokok * (isHP ? 0.003 : 0.001) * totalTelat;
              const penalty = totalTelat > 15 ? 180000 : 0;
              const admin = !isHP ? Math.max(pokok * 0.01, 10000) : 0;
              const totalBayar = Math.ceil((jasaBaru + denda + penalty + admin) / 1000) * 1000;

              return (
                <div key={idx} className="struk-item">
                  <div className="center">
                    <img src={logo} alt="Logo" style={{ width: '55px' }} />
                    <div style={{ fontSize: '9px', fontWeight: '900' }}>No: {gadai.no_gadai}</div>
                  </div>

                  <div className="row"><span>Tgl:</span><span>{item.tanggal_perpanjangan}</span></div>
                  <div className="row"><span>Petugas:</span><span>{gadai.nasabah?.user?.name || "Admin"}</span></div>
                  
                  <div className="center bold" style={{ margin: '4px 0', borderTop: '1.5px solid #000', borderBottom: '1.5px solid #000', padding: '2px 0', fontSize: '10px' }}>
                    PERPANJANGAN GADAI
                  </div>

                  <div className="row"><span>Barang:</span><span>{(gadai.hp?.nama_barang || gadai.perhiasan?.nama_barang || "-").substring(0, 12)}</span></div>
                  <div className="detail-text"><pre>{renderDetailBarang(gadai)}</pre></div>
                  
                  <hr />
                  <div className="row"><span>Pokok:</span><span>{formatRupiah(pokok)}</span></div>
                  <div className="row"><span>Jasa:</span><span>{formatRupiah(jasaBaru)}</span></div>
                  <div className="row"><span>Denda:</span><span>{formatRupiah(denda)}</span></div>
                  {penalty > 0 && <div className="row"><span>Penalty:</span><span>{formatRupiah(penalty)}</span></div>}
                  <div className="row"><span>Admin:</span><span>{formatRupiah(admin)}</span></div>
                  
                  <hr />
                  <div className="row bold" style={{ fontSize: '11px' }}><span>TOTAL:</span><span>{formatRupiah(totalBayar)}</span></div>
                  <hr />

                  <div className="row"><span>Telat:</span><span>{totalTelat} hari</span></div>
                  <div className="row" style={{ fontSize: '8px' }}><span>J.T Baru:</span><span>{item.jatuh_tempo_baru}</span></div>

                  <div className="thanks">
                    <div className="bold">SENTRA GADAI INDONESIA</div>
                    <div className="bold">LUNAS</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Box>
      )}

     <style>{`
        @media screen {
          .struk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(65mm, 1fr)); gap: 15px; padding: 20px; }
          .struk-item { background: #fff; padding: 10px; border: 1px solid #000; font-family: monospace; color: #000; }
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
            gap: 1.5mm; 
            width: 100%; 
          }
          
          .struk-item { 
            border: 1.5px solid #000 !important; 
            padding: 3mm; 
            font-size: 8.5px; 
            font-weight: 700;
            page-break-inside: avoid; 
            height: 98mm; 
            display: flex; 
            flex-direction: column; 
            background: #fff !important;
            font-family: "Consolas", "Courier New", monospace;
            box-sizing: border-box;
          }

          .row { display: flex; justify-content: space-between; margin-bottom: 0.8mm; line-height: 1.2; }
          .bold { font-weight: 900 !important; }
          .center { text-align: center; }
          hr { border: none; border-top: 1.5px dashed #000 !important; margin: 2mm 0 !important; }
          pre { font-size: 8px; font-weight: 700; margin: 0; font-family: inherit; white-space: pre-wrap; line-height: 1.2; }
          img { filter: grayscale(1) contrast(200%); max-width: 50px; display: block; margin: 0 auto 1mm auto; }
          .thanks { margin-top: auto; text-align: center; font-size: 8px; padding-top: 1.5mm; border-top: 1px solid #000; }
        }
      `}</style>
    </Box>
  );
};

export default RekapPerpanjanganMingguan;