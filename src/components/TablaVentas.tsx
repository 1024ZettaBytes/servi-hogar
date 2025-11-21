import { FC, ChangeEvent, useState } from 'react';
import numeral from 'numeral';
import PropTypes from 'prop-types';
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
  Chip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SearchIcon from '@mui/icons-material/Search';
import PaymentIcon from '@mui/icons-material/Payment';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import { formatTZDate } from 'lib/client/utils';
import * as str from 'string';
import { useRouter } from 'next/router';
import ImagesModal from '@/components/ImagesModal';

interface TablaSalesProps {
  userRole: string;
  className?: string;
  salesList: any[];
  onUpdate: () => void;
  onPaymentClick: (sale: any) => void;
}

const compareStringsForFilter = (keyWord: string, field: string) => {
  return str(field)
    .latinise()
    .toLowerCase()
    .includes(str(keyWord).latinise().toLowerCase());
};

const applyFilters = (salesList: any[], filter: string): any[] => {
  return salesList.filter((sale) => {
    if (!filter || filter === '') {
      return true;
    }
    return (
      Object.entries(sale).filter((keyValue) => {
        const key = keyValue[0];
        const value = keyValue[1];
        if (!value) {
          return false;
        }
        switch (key) {
          case 'saleNum': {
            return compareStringsForFilter(filter, value.toString());
          }
          case 'machine': {
            const machineDesc = value
              ? ''.concat(
                  value['machineNum'] || '',
                  ' ',
                  value['brand'] || '',
                  ' ',
                  value['capacity'] || ''
                )
              : '';
            return compareStringsForFilter(filter, machineDesc);
          }
          case 'serialNumber':
          case 'status':
          case 'totalAmount':
          case 'weeklyPayment': {
            return compareStringsForFilter(filter, value.toString());
          }
          case 'customer': {
            const customerName = value && value['name'];
            return (
              customerName && compareStringsForFilter(filter, customerName)
            );
          }
        }
      }).length > 0
    );
  });
};

const applyPagination = (
  salesList: any[],
  page: number,
  limit: number
): any[] => {
  return salesList.slice(page * limit, page * limit + limit);
};

const getStatusLabel = (status: string) => {
  const map = {
    ACTIVA: {
      text: 'Activa',
      color: 'info'
    },
    PAGADA: {
      text: 'Pagada',
      color: 'success'
    },
    CANCELADA: {
      text: 'Cancelada',
      color: 'error'
    }
  };

  const { text, color }: any = map[status];

  return <Chip label={text} color={color} />;
};

const isPaymentOverdue = (nextPaymentDate: Date | null, status: string) => {
  if (!nextPaymentDate || status !== 'ACTIVA') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const paymentDate = new Date(nextPaymentDate);
  paymentDate.setHours(0, 0, 0, 0);
  return paymentDate < today;
};

const getDaysUntilPayment = (nextPaymentDate: Date | null) => {
  if (!nextPaymentDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const paymentDate = new Date(nextPaymentDate);
  paymentDate.setHours(0, 0, 0, 0);

  const diffTime = paymentDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

const TablaVentas: FC<TablaSalesProps> = ({ salesList, onPaymentClick }) => {
  const theme = useTheme();
  const router = useRouter();
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [filter, setFilter] = useState<string>('');
  const [openImages, setOpenImages] = useState<boolean>(false);
  const [selectedImages, setSelectedImages] = useState<any>(null);

  const handleOnCloseImages = () => {
    setOpenImages(false);
    setSelectedImages(null);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setFilter(value);
  };

  const handlePageChange = (_event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
  };

  const filteredSales = applyFilters(salesList, filter);
  const paginatedSales = applyPagination(filteredSales, page, limit);

  return (
    <>
      <Card>
        <CardHeader
          action={
            <Box width={200}>
              <TextField
                size="small"
                fullWidth
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                placeholder="Buscar venta..."
                variant="outlined"
              />
            </Box>
          }
          title="Ventas de Equipos"
        />
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Folio</TableCell>
                <TableCell>Equipo/Serie</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Pago Inicial</TableCell>
                <TableCell align="right">Saldo</TableCell>
                <TableCell align="center">Semanas</TableCell>
                <TableCell align="right">Pago Semanal</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Próximo Pago</TableCell>
                <TableCell align="center">Fecha</TableCell>
                <TableCell align="center">Fotos</TableCell>
                <TableCell align="center">Garantía</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSales.map((sale) => {
                const machineInfo = sale.machine
                  ? `#${sale.machine.machineNum} - ${sale.machine.brand}`
                  : sale.serialNumber || 'N/A';
                const customerName = sale.customer?.name || 'N/A';

                return (
                  <TableRow hover key={sale._id}>
                    <TableCell>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {sale.saleNum}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body1"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {machineInfo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body1"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {customerName}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        ${numeral(sale.totalAmount).format('0,0.00')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        ${numeral(sale.initialPayment).format('0,0.00')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        color={
                          sale.remainingAmount > 0
                            ? 'warning.main'
                            : 'success.main'
                        }
                      >
                        ${numeral(sale.remainingAmount).format('0,0.00')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {sale.paidWeeks}/{sale.totalWeeks}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        ${numeral(sale.weeklyPayment).format('0,0.00')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center"
                      sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 0.5 
                        }}
                      >
                        {getStatusLabel(sale.status)}
                        {sale.status === "CANCELADA" && (
                        <Tooltip
                          title={sale.delivery?.cancellationReason || "SIN RAZÓN"}
                          arrow
                        >
                          <InfoOutlinedIcon 
                            fontSize="small" 
                          />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {sale.nextPaymentDate ? (
                        (() => {
                          const daysLeft = getDaysUntilPayment(
                            sale.nextPaymentDate
                          );
                          const isOverdue = isPaymentOverdue(
                            sale.nextPaymentDate,
                            sale.status
                          );

                          if (isOverdue) {
                            const daysOverdue = Math.abs(daysLeft);
                            const missedPayments =
                              Math.floor(daysOverdue / 7) + 1;
                            return (
                              <Tooltip
                                title={`Vencido hace ${daysOverdue} día${
                                  daysOverdue !== 1 ? 's' : ''
                                }`}
                                arrow
                              >
                                <Typography
                                  variant="body2"
                                  color="error.main"
                                  fontWeight="bold"
                                  noWrap
                                  sx={{ cursor: 'pointer' }}
                                >
                                  {missedPayments} pago
                                  {missedPayments !== 1 ? 's' : ''} atrasado
                                  {missedPayments !== 1 ? 's' : ''} ⚠️
                                </Typography>
                              </Tooltip>
                            );
                          } else if (daysLeft === 0) {
                            return (
                              <Tooltip title="Pago vence hoy" arrow>
                                <Typography
                                  variant="body2"
                                  color="warning.main"
                                  fontWeight="bold"
                                  noWrap
                                  sx={{ cursor: 'pointer' }}
                                >
                                  Hoy
                                </Typography>
                              </Tooltip>
                            );
                          } else {
                            return (
                              <Tooltip
                                title={`Vence en ${daysLeft} día${
                                  daysLeft !== 1 ? 's' : ''
                                }`}
                                arrow
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  noWrap
                                  sx={{ cursor: 'pointer' }}
                                >
                                  {daysLeft} día{daysLeft !== 1 ? 's' : ''}
                                </Typography>
                              </Tooltip>
                            );
                          }
                        })()
                      ) : (
                        <Typography variant="body2" color="text.disabled">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {formatTZDate(new Date(sale.saleDate), 'DD/MM/YYYY')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {sale.delivery?.imagesUrl ? (
                        <Tooltip title="Ver fotos" arrow>
                          <IconButton
                            onClick={() => {
                              // Filter out the _id field from imagesUrl
                              const { _id, ...images } =
                                sale.delivery.imagesUrl;
                              setSelectedImages(images);
                              setOpenImages(true);
                            }}
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
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {sale.machine?.warranty ? (
                          formatTZDate(new Date(sale.machine.warranty), 'DD/MM/YYYY')
                        ) : (
                          'N/A'
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 1,
                          justifyContent: 'center'
                        }}
                      >
                        {sale.status === 'ACTIVA' && (
                          <Tooltip title="Registrar pago" arrow>
                            <IconButton
                              sx={{
                                '&:hover': {
                                  background: theme.colors.success.lighter
                                },
                                color: theme.palette.success.main
                              }}
                              color="inherit"
                              size="small"
                              onClick={() => onPaymentClick(sale)}
                            >
                              <PaymentIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Ver detalles" arrow>
                          <IconButton
                            sx={{
                              '&:hover': {
                                background: theme.colors.primary.lighter
                              },
                              color: theme.palette.primary.main
                            }}
                            color="inherit"
                            size="small"
                            onClick={() => router.push(`/ventas/${sale._id}`)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
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
            count={filteredSales.length}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleLimitChange}
            page={page}
            rowsPerPage={limit}
            rowsPerPageOptions={[5, 10, 25, 30]}
          />
        </Box>
      </Card>
      {openImages && selectedImages && (
        <ImagesModal
          open={openImages}
          imagesObj={selectedImages}
          title="Fotos de la entrega"
          text=""
          onClose={handleOnCloseImages}
        />
      )}
    </>
  );
};

TablaVentas.propTypes = {
  salesList: PropTypes.array.isRequired
};

export default TablaVentas;
