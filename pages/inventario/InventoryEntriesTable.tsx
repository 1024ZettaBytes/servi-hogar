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
  CircularProgress,
  Divider,
  Grid,
  TablePagination,
  Typography,
  useTheme
} from '@mui/material';
import { getFetcher, useGetProductEntries } from '../api/useRequest';
import numeral from 'numeral';
import { capitalizeFirstLetter, formatTZDate } from 'lib/client/utils';

export default function InventoryEntriesTable() {
  const theme = useTheme();

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const { entriesList, entriesError, isLoadingEntries } =
    useGetProductEntries(getFetcher);
  const applyPagination = (rowList, page, limit) => {
    return rowList.slice(page * limit, page * limit + limit);
  };
  const handlePageChange = (_event, newPage) => {
    setPage(newPage);
  };
  const handleLimitChange = (event) => {
    setLimit(parseInt(event.target.value));
  };
  const paginatedRows = applyPagination(entriesList || [], page, limit);

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
      {isLoadingEntries ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <CircularProgress />
        </Box>
      ) : entriesError ? (
        <Grid item>
          <br />
          <Alert severity="error">{entriesError.message}</Alert>
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
                  <TableCell align="center">Cantidad</TableCell>
                  <TableCell align="center">Costo unitario</TableCell>
                  <TableCell align="center">Fecha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.map((row) => (
                  <TableRow
                    key={row.code}
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
                      <Typography fontStyle="oblique">{row.product?.code}</Typography>
                    </TableCell>
                    <TableCell align="center">{row.product?.name}</TableCell>
                    <TableCell align="center">+{row.qty}</TableCell>
                    <TableCell align="center">${numeral(row.cost).format(`0,0.00`)}</TableCell>
                    <TableCell align="center">{capitalizeFirstLetter(
                          formatTZDate(new Date(row.date), "MMM DD YYYY")
                        )}</TableCell>
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
