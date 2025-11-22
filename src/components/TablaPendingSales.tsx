import { FC, ChangeEvent, useState } from 'react';
import numeral from 'numeral';
import PropTypes from 'prop-types';
import NextLink from 'next/link';
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
import SearchIcon from '@mui/icons-material/Search';
import GenericModal from '@/components/GenericModal';
import { useSnackbar } from 'notistack';
import CancelIcon from '@mui/icons-material/Cancel';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { formatTZDate } from 'lib/client/utils';
import * as str from 'string';
import { cancelSale } from '../../lib/client/salesFetch'; 

interface TablaPendingSalesProps {
  userRole: string;
  className?: string;
  salesList: any[];
  onUpdate: () => void;
  onAssignClick: (sale: any) => void;
  onWhatsAppClick?: (sale: any) => void;
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
          case 'totalAmount':
          case 'initialPayment': {
            return compareStringsForFilter(filter, value.toString());
          }
          case 'customer': {
            const customerName = value && value['name'];
            return customerName && compareStringsForFilter(filter, customerName);
          }
          case 'assignedTo': {
            const operatorName = value && value['name'];
            return operatorName && compareStringsForFilter(filter, operatorName);
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

const TablaPendingSales: FC<TablaPendingSalesProps> = ({ 
  userRole, 
  salesList, 
  onAssignClick,
  onWhatsAppClick 
}) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar(); 
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [filter, setFilter] = useState<string>('');
  const [cancelModalIsOpen, setCancelModalIsOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [saleIdToCancel, setSaleIdToCancel] = useState<string>(null);
  const canAssignOperators = userRole === 'ADMIN' || userRole === 'AUX';
  const isOperator = userRole === 'OPE';
  const canCancel = userRole === 'ADMIN';

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

  const handleOnCancelSaleClick = (saleId: string) => {
    setSaleIdToCancel(saleId);
    setCancelModalIsOpen(true);
  };

  const handleCloseCancelModal = () => {
    setCancelModalIsOpen(false);
    setSaleIdToCancel(null); 
    setIsCancelling(false);
  };
  const handleOnConfirmCancelSale = async (reason) => {
    setIsCancelling(true);    
    const result = await cancelSale(saleIdToCancel, reason); 
    
    setCancelModalIsOpen(false);
    setIsCancelling(false);
    enqueueSnackbar(result.msg, {
      variant: !result.error ? 'success' : 'error',
      anchorOrigin: { 
        vertical: "top", 
        horizontal: "center" 
      },
      autoHideDuration: 2000,
    });
    
    // if (!result.error) {
    //   onUpdate(); 
    // }
  };
  

  const filteredSales = applyFilters(salesList, filter);
  const paginatedSales = applyPagination(filteredSales, page, limit);

  return (
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
        title="Entregas Pendientes"
      />
      <Divider />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Folio</TableCell>
              <TableCell>Equipo/Serie</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell align="center">Colonia-Sector</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Pago Inicial</TableCell>
              <TableCell align="center">Semanas</TableCell>
              {canAssignOperators && <TableCell align="center">Operador Asignado</TableCell>}
              <TableCell align="center">Creado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedSales.map((sale) => {
              const machineInfo = sale.machine
                ? `#${sale.machine.machineNum} - ${sale.machine.brand}`
                : sale.serialNumber || 'N/A';
              const customerName = sale.customer?.name || 'N/A';
              const operatorName = sale.delivery?.assignedTo?.name || null;

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
                  <TableCell align="center">
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="text.primary"
                      gutterBottom
                      noWrap
                    >
                      {sale.customer?.currentResidence?.suburb || '-'}
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="text.primary"
                      gutterBottom
                      noWrap
                    >
                      {sale.customer?.currentResidence?.sector?.name || '-'}
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="text.secondary"
                      gutterBottom
                      noWrap
                    >
                      {sale.customer?.currentResidence?.city?.name || '-'}
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
                  <TableCell align="center">
                    <Typography variant="body2">
                      {sale.totalWeeks}
                    </Typography>
                  </TableCell>
                  {canAssignOperators && (
                    <TableCell align="center">
                      {operatorName ? (
                        <Chip 
                          label={operatorName} 
                          color="success" 
                          size="small"
                          icon={<AssignmentIndIcon />}
                        />
                      ) : (
                        <Chip 
                          label="Sin asignar" 
                          color="warning" 
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                  )}
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {formatTZDate(new Date(sale.createdAt), 'DD/MM/YYYY')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      {onWhatsAppClick && (
                        <Tooltip title="Ver formato WhatsApp" arrow>
                          <IconButton
                            sx={{
                              '&:hover': {
                                background: theme.colors.success.lighter
                              },
                              color: theme.colors.success.main
                            }}
                            color="inherit"
                            size="small"
                            onClick={() => onWhatsAppClick(sale)}
                          >
                            <WhatsAppIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canAssignOperators && (
                        <Tooltip title="Asignar operador" arrow>
                          <IconButton
                            sx={{
                              '&:hover': {
                                background: theme.colors.primary.lighter
                              },
                              color: theme.palette.primary.main
                            }}
                            color="inherit"
                            size="small"
                            onClick={() => onAssignClick(sale)}
                          >
                            <AssignmentIndIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {isOperator && (
                        <NextLink href={`/ventas-pendientes/${sale._id}`} passHref>
                          <Tooltip title="Completar entrega" arrow>
                            <IconButton
                              sx={{
                                '&:hover': {
                                  background: theme.colors.success.lighter
                                },
                                color: theme.palette.success.main
                              }}
                              color="inherit"
                              size="small"
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </NextLink>
                      )}
                      {canCancel && sale.status !== 'CANCELADA' && (
                        <Tooltip title="Cancelar Venta" arrow>
                          <IconButton
                            onClick={() => handleOnCancelSaleClick(sale._id)} 
                            sx={{
                              '&:hover': { 
                                background: theme.colors.error.lighter 
                              },
                              color: theme.palette.error.main
                            }}
                            color="inherit"
                            size="small"
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
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
      {cancelModalIsOpen && (
        <GenericModal 
          open={cancelModalIsOpen}
          title={"Atención"} 
          text={'¿Está seguro de cancelar la venta seleccionada?'}
          isLoading={isCancelling}
          requiredReason 
          onAccept={handleOnConfirmCancelSale}
          onCancel={handleCloseCancelModal}
        />
    )}
    </Card>
  );
};

TablaPendingSales.propTypes = {
  salesList: PropTypes.array.isRequired,
  userRole: PropTypes.string.isRequired,
  onAssignClick: PropTypes.func.isRequired,
};

export default TablaPendingSales;
