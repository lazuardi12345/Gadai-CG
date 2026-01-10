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
  
  // Fallback ke localStorage jika context belum ready
  const userRole = (user?.role || localStorage.getItem('role') || "").toLowerCase();
  
  // Debug: Log role saat component mount
  useEffect(() => {
    console.log('=== DEBUG INFO ===');
    console.log('user dari AuthContext:', user);
    console.log('user.role:', user?.role);
    console.log('localStorage role:', localStorage.getItem('role'));
    console.log('Token:', localStorage.getItem('token') ? 'EXISTS' : 'NOT FOUND');
    console.log('userRole (final):', userRole);
  }, [user, userRole]);

  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalSelesai, setTanggalSelesai] = useState(new Date().toISOString().split('T')[0]);

  // Fungsi penentu URL sesuai role
  const getApiUrl = useCallback(() => {
    const path = '/laporan/struk-awal-mingguan';
    return userRole === "admin" ? `/admin${path}` : path;
  }, [userRole]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = getApiUrl();
      console.log('=== FETCHING DATA ===');
      console.log('URL:', url);
      console.log('Role:', userRole);
      console.log('Params:', { tanggal_mulai: tanggalMulai, tanggal_selesai: tanggalSelesai });
      
      const res = await axiosInstance.get(url, { 
        params: { 
          tanggal_mulai: tanggalMulai, 
          tanggal_selesai: tanggalSelesai 
        } 
      });
      
      console.log('Response:', res.data);
      
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError('Data tidak ditemukan');
      }
    } catch (err) { 
      console.error('=== ERROR ===');
      console.error('Error:', err);
      console.error('Status:', err.response?.status);
      console.error('Response Data:', err.response?.data);
      console.error('Headers:', err.response?.headers);
      
      // Set error message berdasarkan status
      if (err.response?.status === 403) {
        setError(`Forbidden (403): Role "${userRole}" tidak memiliki akses. Pastikan Anda login sebagai role yang sesuai.`);
      } else if (err.response?.status === 401) {
        setError('Unauthorized (401): Token tidak valid atau sudah expired. Silakan login ulang.');
      } else {
        setError(err.response?.data?.message || 'Terjadi kesalahan saat mengambil data');
      }
    } finally { 
      setLoading(false); 
    }
  }, [tanggalMulai, tanggalSelesai, getApiUrl, userRole]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const formatRupiah = (val) => `Rp. ${Number(val || 0).toLocaleString("id-ID")}`;

  const formatHariTanggal = (date) => {
    const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const bulan = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const tanggalStr = `${hari[date.getDay()]}, ${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
    const pad = (n) => n.toString().padStart(2, "0");
    const jamStr = `Waktu: ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    return { tanggalStr, jamStr };
  };

  const { tanggalStr, jamStr } = formatHariTanggal(new Date());

  const renderDetailBarang = (item) => {
    const type = (item.nama_type || "").toLowerCase();
    const formatLabel = (text) => String(text || "-").replace(/_/g, " ").toUpperCase();

    if (type === "handphone" || type === "hp") {
      const hp = item.hp || {};
      const merk = formatLabel(hp.merk?.nama_merk);
      const typehp = formatLabel(hp.type_hp?.nama_type);
      return `Merk/Type : ${merk} / ${typehp}\nRAM       : ${hp.ram || "-"}\nROM       : ${hp.rom || "-"}\nGrade     : ${formatLabel(hp.grade_type)}`;
    } else if (["perhiasan", "logam mulia", "retro"].includes(type)) {
      const emas = item.perhiasan || item.logam_mulia || item.retro || {};
      return `Karat: ${emas.karat || "-"} / Berat: ${emas.berat || "-"}`;
    }
    return "-";
  };

  const renderListGadai = (item) => {
    const type = (item.nama_type || "").toLowerCase();
    let kerusakan = [];
    let kelengkapan = [];

    if (type === "handphone" || type === "hp") {
      kerusakan = item.hp?.kerusakanList || [];
      kelengkapan = item.hp?.kelengkapanList || [];
    } else if (type === "perhiasan") {
      kelengkapan = item.perhiasan?.kelengkapan || [];
    } else if (type === "logam mulia") {
      kelengkapan = item.logam_mulia?.kelengkapanEmas || [];
    } else if (type === "retro") {
      kelengkapan = item.retro?.kelengkapan || [];
    }

    return (
      <Box sx={{ fontSize: '8.5px', mt: 0.5 }}>
        {kerusakan.length > 0 && (
          <div>
            <div className="bold">Kerusakan:</div>
            {kerusakan.map((k, i) => <div key={i}>- {k.nama_kerusakan || k.nama}</div>)}
          </div>
        )}
        <div className="bold" style={{ marginTop: '2px' }}>Kelengkapan:</div>
        {kelengkapan.length > 0 ? (
          kelengkapan.map((k, i) => <div key={i}>- {k.nama_kelengkapan || k.nama}</div>)
        ) : "-"}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#1e293b', minHeight: '100vh' }}>
      <Card sx={{ p: 2, mb: 3 }} className="no-print">
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField 
            label="Mulai"
            type="date" 
            value={tanggalMulai} 
            onChange={(e) => setTanggalMulai(e.target.value)} 
            size="small" 
            InputLabelProps={{ shrink: true }}
            sx={{ bgcolor: 'white', borderRadius: 1 }} 
          />
          <TextField 
            label="Sampai"
            type="date" 
            value={tanggalSelesai} 
            onChange={(e) => setTanggalSelesai(e.target.value)} 
            size="small" 
            InputLabelProps={{ shrink: true }}
            sx={{ bgcolor: 'white', borderRadius: 1 }} 
          />
          <Button variant="contained" startIcon={<Refresh />} onClick={fetchData}>Ambil Data</Button>
          <Button variant="contained" color="success" startIcon={<Print />} onClick={() => window.print()}>
            Print PDF (A4 Landscape)
          </Button>
          <Typography sx={{ color: 'white', ml: 2, fontSize: '12px' }}>
            Role: <strong>{userRole?.toUpperCase() || 'NOT SET'}</strong> | 4 Kolom per Baris.
          </Typography>
        </Stack>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} className="no-print">
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ textAlign: 'center', mt: 10 }}><CircularProgress /></Box>
      ) : data.length === 0 ? (
        <Alert severity="info" className="no-print">
          Tidak ada data untuk ditampilkan. Silakan pilih tanggal dan klik "Ambil Data".
        </Alert>
      ) : (
        <Box className="print-area">
          <div className="struk-grid">
            {data.map((item, idx) => (
              <div key={idx} className="struk-item">
                <div className="center">
                  <img src={logo} alt="Logo" style={{ width: '70px' }} />
                  <div style={{ fontSize: '9px' }}>No Transaksi</div>
                  <div className="bold" style={{ fontSize: '10px' }}>{item.no_gadai}</div>
                  <div style={{ fontSize: '8px', marginTop: '2px' }}>{tanggalStr}</div>
                  <div className="bold" style={{ fontSize: '8px' }}>{jamStr}</div>
                </div>

                <div className="row" style={{ marginTop: '4px' }}><span>Petugas</span><span>{item.petugas || '-'}</span></div>
                <div className="center bold" style={{ margin: '3px 0', borderTop: '1px dashed #000', paddingTop: '3px' }}>TRANSAKSI GADAI</div>

                <div className="row"><span>Taksiran</span><span>{formatRupiah(item.taksiran)}</span></div>
                <div className="row"><span>Pinjaman</span><span>{formatRupiah(item.uang_pinjaman)}</span></div>
                <div className="row"><span>Barang</span><span>{item.nama_type}</span></div>
                <hr />

                <div className="row"><span>Nama Unit</span><span>{item.nama_barang}</span></div>
                <div className="detail-text">
                  <pre>{renderDetailBarang(item)}</pre>
                </div>
                <hr />

                {renderListGadai(item)}
                <hr />

                <div className="row"><span>Pokok</span><span>{formatRupiah(item.uang_pinjaman)}</span></div>
                <div className="row"><span>Jasa Sewa</span><span>{formatRupiah(item.kalkulasi.jasa_sewa)}</span></div>
                <div className="row"><span>Admin</span><span>{formatRupiah(item.kalkulasi.admin)}</span></div>
                <div className="row"><span>Asuransi</span><span>{formatRupiah(item.kalkulasi.asuransi)}</span></div>
                <div className="row bold"><span>Total Diterima</span><span>{formatRupiah(item.kalkulasi.total_diterima)}</span></div>
                <hr />

                <div className="row"><span>Tgl Gadai</span><span>{item.tanggal_gadai}</span></div>
                <div className="row"><span>Jatuh Tempo</span><span>{item.jatuh_tempo}</span></div>

                <div className="thanks">
                  <div style={{ fontSize: '7px' }}>* Admin min Rp 5rb (HP) & Rp 10rb (Emas)</div>
                  <div>Terima kasih atas kepercayaan Anda!</div>
                  <div>Gadai cepat, aman, dan terpercaya di</div>
                  <div className="bold" style={{ marginTop: '2px' }}>SENTRA GADAI INDONESIA</div>
                </div>
              </div>
            ))}
          </div>
        </Box>
      )}

      <style>{`
        @media screen {
          .struk-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(65mm, 1fr));
            gap: 15px;
            padding: 20px;
          }
          .struk-item {
            background: #fff;
            padding: 10px;
            border: 1px solid #000;
            font-family: "Courier New", monospace;
          }
        }

        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .no-print { display: none !important; }

          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          @page {
            size: A4 landscape;
            margin: 8mm; 
          }

          body { 
            background: #fff !important; 
            width: 100%;
          }
          
          .struk-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr); 
            gap: 2mm; 
            width: 100%;
          }

          .struk-item {
            visibility: visible;
            border: 1.5px solid #000 !important; 
            padding: 3mm;
            font-size: 8px;
            page-break-inside: avoid;
            font-family: "Courier New", monospace;
            font-weight: 600;
            min-height: 92mm; 
            display: flex;
            flex-direction: column;
            box-sizing: border-box; 
          }

          .row { display: flex; justify-content: space-between; margin-bottom: 1px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          
          .detail-text pre { 
            white-space: pre-wrap; 
            font-family: inherit; 
            font-size: 7.5px; 
            margin: 0;
            line-height: 1.1;
          }

          hr { 
            border: none; 
            border-top: 1px dashed #000 !important; 
            margin: 3px 0 !important; 
            height: 0;
          }

          .thanks { 
            text-align: center; 
            font-size: 7px; 
            margin-top: auto; 
            padding-top: 5px;
            line-height: 1.2;
          }

          img { 
            filter: grayscale(1); 
            max-width: 65px; 
            margin: 0 auto 2px auto;
            display: block;
          }
        }
      `}</style>
    </Box>
  );
};

export default RekapStrukMingguan;