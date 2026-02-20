import React, { useEffect, useState, useCallback } from "react";
import {
  Card, CardHeader, CardContent, Table, TableHead,
  TableBody, TableRow, TableCell, TablePagination,
  TextField, Button, CircularProgress, Stack, Chip, Typography,
  TableContainer, Dialog, DialogTitle, DialogContent, 
  DialogActions, Box, MenuItem, Tabs, Tab, Divider,
  useTheme, useMediaQuery
} from "@mui/material";
import { 
  Print as PrintIcon, 
  CloudUpload as UploadIcon,
  Search as SearchIcon,
  Add as AddIcon
} from "@mui/icons-material";
import axiosInstance from "api/axiosInstance";
import { useNavigate } from "react-router-dom";

const PerpanjanganTempoPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRows, setTotalRows] = useState(0); 
  
  // State Pagination & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0); 
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tabValue, setTabValue] = useState(0);

  // Modal State
  const [openBayar, setOpenBayar] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [metodeBayar, setMetodeBayar] = useState("cash");
  const [fileBukti, setFileBukti] = useState(null);
  const [processLoading, setProcessLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("auth_user"));
  const userRole = user?.role?.toLowerCase() || "";
  
  const apiBaseUrl = userRole === "checker" 
    ? "/checker/perpanjangan-tempo" 
    : (userRole === "petugas" ? "/petugas/perpanjangan-tempo" : "/perpanjangan-tempo");
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const statusFilter = tabValue === 0 ? "pending" : "lunas";
      const res = await axiosInstance.get(apiBaseUrl, {
        params: {
          page: page + 1, 
          pageSize: rowsPerPage,
          search: searchTerm,
          status: statusFilter
        }
      });

      if (res.data.success) {
        setData(res.data.data);
        setTotalRows(res.data.total);
      }
    } catch (err) { 
      console.error("Error fetching data:", err); 
    } finally { 
      setLoading(false); 
    }
  }, [apiBaseUrl, page, rowsPerPage, searchTerm, tabValue]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleProsesBayar = async () => {
    setProcessLoading(true);
    try {
      const formData = new FormData();
      formData.append("metode_pembayaran", metodeBayar);
      if (fileBukti) formData.append("bukti_transfer", fileBukti);

      const res = await axiosInstance.post(`${apiBaseUrl}/${selectedItem.id}/bayar?_method=PATCH`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        setOpenBayar(false);
        setFileBukti(null);
        fetchData();
        navigate(`/print-struk-perpanjangan/${selectedItem.detail_gadai_id}`);
      }
    } catch (err) { 
      alert(err.response?.data?.message || "Gagal proses pembayaran"); 
    } finally { 
      setProcessLoading(false); 
    }
  };

  if (loading && data.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Card sx={{ borderRadius: isMobile ? 0 : 3, boxShadow: isMobile ? 'none' : 3 }}>
      <CardHeader
        sx={{ p: 2 }}
        title={<Typography variant="h6" fontWeight="bold">Data Perpanjangan</Typography>}
        action={
          <Stack direction="row" spacing={1}>
            {!isMobile && (
              <TextField 
                size="small" 
                placeholder="Cari No. Gadai/Nama..." 
                value={searchTerm} 
                onChange={handleSearchChange} 
              />
            )}
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => navigate("/tambah-perpanjangan-tempo")}
            >
              {isMobile ? "" : "Tambah"}
            </Button>
          </Stack>
        }
      />
      
      {isMobile && (
        <Box sx={{ px: 2, pb: 2 }}>
          <TextField 
            fullWidth
            size="small" 
            placeholder="Cari..." 
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} /> }}
            value={searchTerm} 
            onChange={handleSearchChange} 
          />
        </Box>
      )}

      <Tabs 
        value={tabValue} 
        onChange={(e, v) => { setTabValue(v); setPage(0); }} 
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Pending" />
        <Tab label="Lunas" />
      </Tabs>

      <CardContent sx={{ p: 0 }}>
        {isMobile ? (
          <Box sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            {data.map((item) => (
              <Card key={item.id} sx={{ mb: 2, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" fontWeight="bold" color="primary">
                      {item.detail_gadai?.no_gadai}
                    </Typography>
                    <Chip 
                      label={item.status_bayar.toUpperCase()} 
                      color={item.status_bayar === 'lunas' ? 'success' : 'warning'} 
                      size="small" 
                      sx={{ fontSize: '0.6rem', height: 20 }}
                    />
                  </Stack>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {item.detail_gadai?.nasabah?.nama_lengkap}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Tagihan:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      Rp {Number(item.nominal_admin).toLocaleString("id-ID")}
                    </Typography>
                  </Stack>
                  <Box sx={{ mt: 2 }}>
                    {item.status_bayar === "pending" ? (
                      <Button fullWidth variant="contained" color="success" onClick={() => { setSelectedItem(item); setOpenBayar(true); }}>
                        Bayar Sekarang
                      </Button>
                    ) : (
                      <Button fullWidth variant="outlined" startIcon={<PrintIcon />} onClick={() => navigate(`/print-struk-perpanjangan/${item.detail_gadai_id}`)}>
                        Lihat Struk
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#f8f9fa" }}>
                <TableRow>
                  <TableCell align="center">No</TableCell>
                  <TableCell align="center">No Gadai</TableCell>
                  <TableCell>Nasabah</TableCell>
                  <TableCell align="center">Jatuh Tempo Baru</TableCell>
                  <TableCell align="right">Total Tagihan</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={item.id} hover>
                    <TableCell align="center">{(page * rowsPerPage) + index + 1}</TableCell>
                    <TableCell align="center"><strong>{item.detail_gadai?.no_gadai}</strong></TableCell>
                    <TableCell>{item.detail_gadai?.nasabah?.nama_lengkap}</TableCell>
                    <TableCell align="center">{item.jatuh_tempo_baru ? new Date(item.jatuh_tempo_baru).toLocaleDateString("id-ID") : '-'}</TableCell>
                    <TableCell align="right">Rp {Number(item.nominal_admin).toLocaleString("id-ID")}</TableCell>
                    <TableCell align="center">
                      <Chip label={item.status_bayar.toUpperCase()} color={item.status_bayar === 'lunas' ? 'success' : 'warning'} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      {item.status_bayar === "pending" ? (
                        <Button variant="contained" size="small" color="success" onClick={() => { setSelectedItem(item); setOpenBayar(true); }}>Bayar</Button>
                      ) : (
                        <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={() => navigate(`/print-struk-perpanjangan/${item.detail_gadai_id}`)}>Struk</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        <TablePagination 
          component="div" 
          count={totalRows} 
          rowsPerPage={rowsPerPage} 
          page={page} 
          onPageChange={(e, p) => setPage(p)} 
          onRowsPerPageChange={(e) => { 
            setRowsPerPage(parseInt(e.target.value, 10)); 
            setPage(0); 
          }}
        />
      </CardContent>
      <Dialog open={openBayar} onClose={() => setOpenBayar(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>Konfirmasi Pembayaran</DialogTitle>
        <DialogContent>
           <Box sx={{ p: 2, bgcolor: '#f0f4f8', textAlign: 'center', borderRadius: 2, mb: 2 }}>
             <Typography variant="caption">Total Tagihan</Typography>
             <Typography variant="h5" fontWeight="bold">Rp {Number(selectedItem?.nominal_admin).toLocaleString("id-ID")}</Typography>
           </Box>
           
           <Stack spacing={2}>
             <TextField select fullWidth label="Metode" value={metodeBayar} onChange={e => setMetodeBayar(e.target.value)}>
               <MenuItem value="cash">Cash</MenuItem>
               <MenuItem value="transfer">Transfer</MenuItem>
             </TextField>

             {metodeBayar === "transfer" && (
               <Button variant="outlined" component="label" fullWidth startIcon={<UploadIcon />} color={fileBukti ? "success" : "primary"}>
                 {fileBukti ? fileBukti.name : "Upload Bukti Transfer"}
                 <input type="file" hidden accept="image/*" onChange={(e) => setFileBukti(e.target.files[0])} />
               </Button>
             )}
           </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenBayar(false)}>Batal</Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={handleProsesBayar} 
            disabled={processLoading || (metodeBayar === 'transfer' && !fileBukti)}
          >
            {processLoading ? "Memproses..." : "Bayar & Cetak"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default PerpanjanganTempoPage;