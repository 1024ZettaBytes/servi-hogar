import * as React from 'react';
import { useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {
  Alert,
  Box,
  Card,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  TablePagination,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import NotificationImportantOutlinedIcon from '@mui/icons-material/NotificationImportantOutlined';
import { getFetcher, useGetProducts } from 'pages/api/useRequest';
import numeral from 'numeral';

export const getStockLabel = (stock, min) => {
  if (stock <= min)
    return (
      <Chip
        icon={<NotificationImportantOutlinedIcon fontSize="small" />}
        label={stock}
        color="error"
        size="small"
      ></Chip>
    );
  if (stock <= min + 3)
    return (
      <Chip
        icon={<WarningAmberIcon fontSize="small" />}
        label={stock}
        color="warning"
        size="small"
      ></Chip>
    );
  return <Chip label={stock} color="success" size="small"></Chip>;
};
export default function InventoryTable({ showSearch }) {
  const theme = useTheme();

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [term, setTerm] = useState(null);
  const { productsList, productsError, isLoadingProducts } = useGetProducts(
    getFetcher,
    term
  );
  const applyPagination = (rowList, page, limit) => {
    return rowList.slice(page * limit, page * limit + limit);
  };
  const handlePageChange = (_event, newPage) => {
    setPage(newPage);
  };
  const handleLimitChange = (event) => {
    setLimit(parseInt(event.target.value));
  };
  const paginatedRows = applyPagination(productsList || [], page, limit);

  return (
    <Card>
      <CardHeader
        action={
          showSearch ? (
            <Box width={200}>
              <>
                <TextField
                  size="small"
                  id="input-search"
                  label="Buscar"
                  helperText="Escriba y presione ENTER"
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter') {
                      ev.preventDefault();
                      setTerm(ev.target['value']);
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                  sx={{ marginTop: '20px' }}
                />
              </>
            </Box>
          ) : null
        }
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap'
        }}
        title=""
      />
      <Divider />
      {isLoadingProducts ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <CircularProgress />
        </Box>
      ) : productsError ? (
        <Grid item>
          <br />
          <Alert severity="error">{productsError.message}</Alert>
        </Grid>
      ) : paginatedRows?.length === 0 ? (
        <Typography variant="h3" margin={2} color="#FD5B5B" textAlign="center">
          No se encontraron registros
        </Typography>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell align="center">Nombre</TableCell>
                  <TableCell align="center">Precio Int.</TableCell>
                  <TableCell align="center">Precio Venta</TableCell>
                  <TableCell align="center">Stock</TableCell>
                  <TableCell align="center">Mínimo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.map((row) => (
                  <TableRow
                    key={row.code}
                    selected={row.isSelected}
                    sx={{
                      '&.MuiTableRow-root:hover': {
                        backgroundColor: theme.palette.primary.light
                      },
                      '&.MuiTableRow-root.Mui-selected': {
                        backgroundColor: theme.palette.secondary.main
                      }
                    }}
                  >
                    <TableCell component="th" scope="row">
                      <Typography fontStyle="oblique">{row.code}</Typography>
                    </TableCell>
                    <TableCell align="center">{row.name}</TableCell>
                    <TableCell align="center">${numeral(row.latestCost).format(`0,0.00`)}</TableCell>
                    <TableCell align="center">${numeral(row.sellPrice).format(`0,0.00`)}</TableCell>
                    <TableCell align="center">
                      {getStockLabel(row.stock, row.min)}
                    </TableCell>
                    <TableCell align="center">{row.min}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box p={2}>
            <TablePagination
              labelRowsPerPage="# de resultados"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
              component="div"
              count={paginatedRows.length}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleLimitChange}
              page={page}
              rowsPerPage={limit}
              rowsPerPageOptions={[5, 10, 25, 30]}
            />
          </Box>
        </>
      )}
    </Card>
  );
}
