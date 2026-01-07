import { FC, useState } from 'react';
import numeral from 'numeral';
import {
  Tooltip,
  Divider,
  Box,
  Card,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableContainer,
  Typography,
  useTheme,
  CardHeader,
  TextField,
  InputAdornment,
  Grid,
  Alert,
  Skeleton
} from '@mui/material';

import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import SearchIcon from '@mui/icons-material/Search';
import { capitalizeFirstLetter, formatTZDate } from 'lib/client/utils';
import { PAYMENT_METHODS } from '../../lib/consts/OBJ_CONTS';
import { getFetcher, useGetPayments } from 'pages/api/useRequest';
interface TablaPagosProps {
  className?: string;
}


const TablaPagos: FC<TablaPagosProps> = () => {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(30);
  const [searchTerm, setSearchTerm] = useState(null);
  const [searchText, setSearchText] = useState(null);

  const { payments, paymentsError } = useGetPayments(
    getFetcher,
    limit,
    page +  1,
    searchTerm
  );
  const generalError = paymentsError;
  const completeData = payments;

  const handlePageChange = (_event, newPage) => {
    setPage(newPage);
  };
  const handleLimitChange = (event) => {
    setLimit(parseInt(event.target.value));
  };

  const theme = useTheme();
  return (
    <Grid item xs={12}>
    {generalError ? (
      <Alert severity="error">
        {paymentsError?.message}
      </Alert>
    ) : !completeData ? (
      <Skeleton
        variant="rectangular"
        width={"100%"}
        height={500}
        animation="wave"
      />
    ) : (
      <Card>
        

      <Card>
        <CardHeader
          action={
            <Box width={200}>
              <TextField
                size="small"
                helperText="Escriba y presione ENTER"
                id="input-search-payment"
                label="Buscar"
                value={searchText}
                onChange={(event) => {
                  setSearchText(event.target.value);
                }}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter") {
                    ev.preventDefault();
                    setSearchTerm(searchText);
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
            </Box>
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
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center"># pago</TableCell>
                <TableCell align="center">Fecha</TableCell>
                <TableCell align="center">Cliente</TableCell>
                <TableCell align="center">Concepto</TableCell>
                <TableCell align="center">Método</TableCell>
                <TableCell align="center">Cuenta</TableCell>
                <TableCell align="center">Folio</TableCell>
                <TableCell align="center">Comprobante</TableCell>
                <TableCell align="center">Importe</TableCell>
                <TableCell align='center'>Recargo</TableCell>
                <TableCell align="center">Usuario</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments?.list?.map((payment) => {
                return (
                  <TableRow key={payment?._id}>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {payment.number || "VENTA"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {capitalizeFirstLetter(
                          formatTZDate(payment?.date || payment?.paymentDate, 'MMMM DD YYYY')
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {payment?.customer?.name || payment?.sale?.customer?.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {payment?.description || `Abono de venta`}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {PAYMENT_METHODS[payment?.method] || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {payment?.paymentAccount 
                          ? `${payment.paymentAccount.bank} ${payment.paymentAccount.count} (${payment.paymentAccount.number.slice(-4)})` 
                          : payment?.account 
                            ? payment.account 
                            : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {payment?.folio}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {payment.voucherUrl || payment.imageUrl ? (
                        <a
                          href={payment.voucherUrl || payment.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Tooltip title="Ver comprobante" arrow>
                            <IconButton
                              sx={{
                                '&:hover': {
                                  background: theme.colors.primary.lighter
                                },
                                color: theme.palette.primary.main
                              }}
                              color="inherit"
                              size="small"
                            >
                              <ImageSearchIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </a>
                      ) : null}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="green" noWrap>
                        {numeral(payment?.amount).format(
                          `$${payment.amount}0,0.00`
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ color: 'warning.dark' }} noWrap>
                        {numeral(payment?.lateFee).format(
                          `$${payment.lateFee}0,0.00`
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                      >
                        {payment?.lastUpdatedBy?.name || payment?.createdBy?.name}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Box p={2}>
          <TablePagination
            component="div"
            count={payments.total}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleLimitChange}
            page={page}
            rowsPerPage={limit}
            rowsPerPageOptions={[5, 10, 25, 30]}
          />
        </Box>
      </Card>
      </Card>
    )}
  </Grid>

  );
};

export default TablaPagos;
