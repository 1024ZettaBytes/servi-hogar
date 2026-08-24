import { FC, ChangeEvent } from 'react';
import {
  Button,
  Card,
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  Chip,
  Box,
  CircularProgress,
  Tooltip,
  IconButton,
  Link,
  Stack
} from '@mui/material';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { formatTZDate } from 'lib/client/utils';
import { CASH_CUT_STATUS, CASH_CUT_TYPES } from '../../../lib/consts/OBJ_CONTS';

const money = (value) =>
  value === null || value === undefined
    ? '—'
    : `$${Number(value).toLocaleString('es-MX')}`;

const statusColor = (status: string) => {
  switch (status) {
    case 'DEPOSITADO':
    case 'CONFIRMADO':
      return 'success';
    case 'PENDIENTE_DEPOSITO':
    case 'PENDIENTE_CONFIRMACION':
      return 'warning';
    default:
      return 'default';
  }
};

interface TablaCortesProps {
  cuts: any[];
  total: number;
  page: number;
  limit: number;
  isLoading?: boolean;
  canEdit?: boolean;
  isAdmin?: boolean;
  currentUserId?: string;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onEditAmount?: (cut: any) => void;
  onDeposit?: (cut: any) => void;
}

const TablaCortes: FC<TablaCortesProps> = ({
  cuts,
  total,
  page,
  limit,
  isLoading = false,
  canEdit = false,
  isAdmin = false,
  currentUserId = null,
  onPageChange,
  onLimitChange,
  onEditAmount = () => {},
  onDeposit = () => {}
}) => {
  return (
    <Card>
      <CardHeader title="Historial de cortes" />
      <Divider />
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : cuts.length === 0 ? (
        <Box py={4} textAlign="center">
          <Typography variant="subtitle1" color="text.secondary">
            Todavía no hay cortes registrados
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>CORTE</TableCell>
                  <TableCell>TIPO</TableCell>
                  <TableCell>RESPONSABLE</TableCell>
                  <TableCell align="center">FECHA</TableCell>
                  <TableCell align="right">SISTEMA</TableCell>
                  <TableCell align="right">DECLARADO</TableCell>
                  <TableCell align="right">DIFERENCIA</TableCell>
                  <TableCell align="center">ESTADO</TableCell>
                  <TableCell align="center">DETALLE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cuts.map((cut) => {
                  const difference = cut.difference || 0;
                  // Un corte de ruta sin depositar lo puede depositar su dueño
                  // o un administrador, igual que valida el servidor.
                  const canDeposit =
                    cut.type === 'RUTA' &&
                    cut.status === 'PENDIENTE_DEPOSITO' &&
                    (isAdmin || cut.user?._id === currentUserId);
                  return (
                    <TableRow hover key={cut._id}>
                      <TableCell>
                        <Typography variant="body1" fontWeight="bold" noWrap>
                          #{cut.cutNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={CASH_CUT_TYPES[cut.type] || cut.type}
                          color={cut.type === 'RUTA' ? 'info' : 'primary'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {cut.user?.name || '—'}
                        </Typography>
                        {cut.handedToUser?.name && (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            Entregó a {cut.handedToUser.name}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" noWrap>
                          {formatTZDate(new Date(cut.periodEnd), 'DD/MM/YYYY HH:mm')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {money(cut.systemAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                          justifyContent="flex-end"
                        >
                          <Typography variant="body2" fontWeight="bold">
                            {money(cut.declaredAmount)}
                          </Typography>
                          {canEdit && (
                            <Tooltip title="Corregir monto declarado">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  onEditAmount({
                                    kind: 'CUT',
                                    id: cut._id,
                                    field: 'declaredAmount',
                                    currentValue: cut.declaredAmount,
                                    label: `Corte #${cut.cutNumber} — monto declarado`
                                  })
                                }
                              >
                                <EditTwoToneIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                        {cut.edits?.length > 0 && (
                          <Typography variant="caption" color="warning.main">
                            Corregido
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          color={
                            difference === 0
                              ? 'text.secondary'
                              : difference < 0
                              ? 'error.main'
                              : 'success.main'
                          }
                        >
                          {difference === 0 ? '—' : money(difference)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={CASH_CUT_STATUS[cut.status] || cut.status}
                          color={statusColor(cut.status) as any}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {cut.depositReceiptUrl ? (
                          <Tooltip title="Ver comprobante de depósito">
                            <Link
                              href={cut.depositReceiptUrl}
                              target="_blank"
                              rel="noopener"
                            >
                              <IconButton size="small">
                                <ReceiptLongIcon fontSize="small" />
                              </IconButton>
                            </Link>
                          </Tooltip>
                        ) : canDeposit ? (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<UploadFileIcon />}
                            onClick={() => onDeposit(cut)}
                          >
                            Depositar
                          </Button>
                        ) : cut.confirmedBy?.name ? (
                          <Typography variant="caption" color="text.secondary">
                            Contado por {cut.confirmedBy.name}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            —
                          </Typography>
                        )}
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
              count={total}
              page={page}
              onPageChange={(_e, newPage) => onPageChange(newPage)}
              rowsPerPage={limit}
              onRowsPerPageChange={(e: ChangeEvent<HTMLInputElement>) =>
                onLimitChange(parseInt(e.target.value))
              }
              rowsPerPageOptions={[10, 20, 50]}
              labelRowsPerPage="Por página:"
            />
          </Box>
        </>
      )}
    </Card>
  );
};

export default TablaCortes;
