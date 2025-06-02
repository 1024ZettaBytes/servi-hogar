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
  TablePagination,
  Typography,
  useTheme
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import NotificationImportantOutlinedIcon from '@mui/icons-material/NotificationImportantOutlined';
import { getFetcher, useGetUsedProducts } from '../api/useRequest';
import numeral from 'numeral';
import { formatTZDate } from 'lib/client/utils';

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
export default function InventoryIssuesTable() {
  const theme = useTheme();

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const { usedList, usedError, isLoadingUsed } = useGetUsedProducts(getFetcher);
  const applyPagination = (rowList, page, limit) => {
    return rowList.slice(page * limit, page * limit + limit);
  };
  const handlePageChange = (_event, newPage) => {
    setPage(newPage);
  };
  const handleLimitChange = (event) => {
    setLimit(parseInt(event.target.value));
  };
  const paginatedRows = applyPagination(usedList || [], page, limit);
  return (
    <Card>
      <CardHeader
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap'
        }}
        title=""
      />
      <Divider />
      {isLoadingUsed ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <CircularProgress />
        </Box>
      ) : usedError ? (
        <Grid item>
          <br />
          <Alert severity="error">{usedError.message}</Alert>
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
                  <TableCell align="left">Código</TableCell>
                  <TableCell align="center">Nombre</TableCell>
                  <TableCell align="center">Cantidad</TableCell>
                  <TableCell align="center">Gasto</TableCell>

                  <TableCell align="center">Fecha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.map((row) => (
                  <TableRow
                    key={row._id}
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
                      {row.inventoryProduct?.code}
                    </TableCell>
                    <TableCell align="center">
                      {row.inventoryProduct?.name}
                    </TableCell>
                    <TableCell align="center">{row.qty}</TableCell>
                    <TableCell align="center">
                      {numeral(row.qty * row.price).format('$0,0.00')}
                    </TableCell>
                    <TableCell align="center">
                      {formatTZDate(row?.date, 'DD MMM YYYY')}
                    </TableCell>
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
