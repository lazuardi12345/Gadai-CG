import React, { useEffect, useState } from "react";
import {
  Card, CardHeader, CardContent, Table, TableHead,
  TableBody, TableRow, TableCell, TablePagination,
  TextField, Button, CircularProgress, Stack, Chip, Typography,
  TableContainer, Dialog, DialogTitle, DialogContent, 
  DialogActions, Box, MenuItem, Tabs, Tab
} from "@mui/material";
import { 
  Print as PrintIcon, 
  CloudUpload as UploadIcon 
} from "@mui/icons-material";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

const PerpanjanganTempoPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tabValue, setTabValue] = useState(0);

  // Modal State
  const [openBayar, setOpenBayar] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [metodeBayar, setMetodeBayar] = useState("cash");
  const [fileBukti, setFileBukti] = useState(null); // State untuk file
  const [processLoading, setProcessLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("auth_user"));
  const userRole = user?.role?.toLowerCase() || "";
  const apiBaseUrl = userRole === "checker" ? "/checker/perpanjangan-tempo" : (userRole === "petugas" ? "/petugas/perpanjangan-tempo" : "/perpanjangan-tempo");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(apiBaseUrl);
      if (res.data.success) setData(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [userRole]);

  const filteredData = data.filter(item => {
    const matchSearch = item.detail_gadai?.no_gadai?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.detail_gadai?.nasabah?.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase());
    const statusFilter = tabValue === 0 ? "pending" : "lunas";
    return matchSearch && item.status_bayar === statusFilter;
  });

  const handleProsesBayar = async () => {
    setProcessLoading(true);
    try {
      const formData = new FormData();
      formData.append("metode_pembayaran", metodeBayar);
      // Kirim file jika ada (terutama untuk transfer)
      if (fileBukti) {
        formData.append("bukti_transfer", fileBukti);
      }

      const res = await axiosInstance.post(`${apiBaseUrl}/${selectedItem.id}/bayar?_method=PATCH`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        setOpenBayar(false);
        setFileBukti(null); // Reset file
        fetchData();
        navigate(`/print-struk-perpanjangan/${selectedItem.detail_gadai_id}`);
      }
    } catch (err) { 
      alert(err.response?.data?.message || "Gagal proses pembayaran"); 
    } finally { 
      setProcessLoading(false); 
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardHeader
        title={<Typography variant="h6" fontWeight="bold">Data Perpanjangan Tempo</Typography>}
        action={
          <Stack direction="row" spacing={2}>
            <TextField size="small" placeholder="Cari..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <Button variant="contained" onClick={() => navigate("/tambah-perpanjangan-tempo")}>Tambah</Button>
          </Stack>
        }
      />
      
      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label={`Pending (${data.filter(i => i.status_bayar === 'pending').length})`} />
        <Tab label={`Lunas (${data.filter(i => i.status_bayar === 'lunas').length})`} />
      </Tabs>

      <CardContent sx={{ p: 0 }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f8f9fa" }}>
              <TableRow>
                {["No", "No Gadai", "Nasabah", "Jatuh Tempo Baru", "Total Tagihan", "Status", "Aksi"].map(h => (
                  <TableCell key={h} align="center" sx={{ fontWeight: 'bold' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, index) => (
                <TableRow key={item.id} hover>
                  <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell align="center"><strong>{item.detail_gadai?.no_gadai}</strong></TableCell>
                  <TableCell>{item.detail_gadai?.nasabah?.nama_lengkap}</TableCell>
                  <TableCell align="center" sx={{ color: 'primary.main', fontWeight: 'bold' }}>{item.jatuh_tempo_baru}</TableCell>
                  <TableCell align="right">Rp {Number(item.nominal_admin).toLocaleString("id-ID")}</TableCell>
                  <TableCell align="center">
                    <Chip label={item.status_bayar.toUpperCase()} color={item.status_bayar === 'lunas' ? 'success' : 'warning'} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      {item.status_bayar === "pending" ? (
                        <Button variant="contained" size="small" color="success" onClick={() => { setSelectedItem(item); setOpenBayar(true); }}>Bayar</Button>
                      ) : (
                        <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={() => navigate(`/print-struk-perpanjangan/${item.detail_gadai_id}`)}>Struk</Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={filteredData.length} rowsPerPage={rowsPerPage} page={page} onPageChange={(e, p) => setPage(p)} />
      </CardContent>

      <Dialog open={openBayar} onClose={() => setOpenBayar(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>Konfirmasi Pembayaran</DialogTitle>
        <DialogContent>
           <Box sx={{ p: 2, bgcolor: '#f0f4f8', textAlign: 'center', borderRadius: 2, mb: 2 }}>
             <Typography variant="caption">Total Tagihan Perpanjangan</Typography>
             <Typography variant="h5" fontWeight="bold">Rp {Number(selectedItem?.nominal_admin).toLocaleString("id-ID")}</Typography>
           </Box>
           
           <Stack spacing={2}>
             <TextField select fullWidth label="Metode" value={metodeBayar} onChange={e => setMetodeBayar(e.target.value)}>
               <MenuItem value="cash">Cash</MenuItem>
               <MenuItem value="transfer">Transfer</MenuItem>
             </TextField>

             {metodeBayar === "transfer" && (
               <Button
                 variant="outlined"
                 component="label"
                 fullWidth
                 startIcon={<UploadIcon />}
                 color={fileBukti ? "success" : "primary"}
               >
                 {fileBukti ? fileBukti.name : "Upload Bukti Transfer"}
                 <input type="file" hidden accept="image/*" onChange={(e) => setFileBukti(e.target.files[0])} />
               </Button>
             )}
           </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenBayar(false)}>Batal</Button>
          <Button variant="contained" color="success" onClick={handleProsesBayar} disabled={processLoading || (metodeBayar === 'transfer' && !fileBukti)}>
            {processLoading ? "Memproses..." : "Bayar & Cetak"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default PerpanjanganTempoPage;