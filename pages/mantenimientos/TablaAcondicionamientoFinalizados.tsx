import { FC, ChangeEvent, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Divider,
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableContainer,
  Typography,
  CardHeader,
  Chip,
  Avatar,
  AvatarGroup
} from '@mui/material';
import { formatTZDate } from 'lib/client/utils';
import {
  WAREHOUSE_MACHINE_ORIGIN_LABELS,
  WAREHOUSE_ORIGIN_COLORS
} from '../../lib/consts/OBJ_CONTS';

const applyPagination = (list: any[], page: number, limit: number): any[] => {
  return list.slice(page * limit, page * limit + limit);
};

const getOriginChip = (origin: string) => {
  if (!origin) return '-';
  const label = WAREHOUSE_MACHINE_ORIGIN_LABELS[origin] || origin;
  const color = WAREHOUSE_ORIGIN_COLORS[origin] || 'default';
  return <Chip label={label} color={color as any} size="small" />;
};

const getStatusChip = (status: string) => {
  const color = status === 'COMPLETADO' ? 'success' : 'error';
  return <Chip label={status} color={color} size="small" />;
};

interface TablaAcondicionamientoFinalizadosProps {
  listData: any[];
  userRole: string;
}

const TablaAcondicionamientoFinalizados: FC<
  TablaAcondicionamientoFinalizadosProps
> = ({ listData, userRole }) => {
  const isAdminOrAux = ['ADMIN', 'AUX'].includes(userRole);
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);

  const handlePageChange = (_event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
    setPage(0);
  };

  const paginatedRecords = applyPagination(listData || [], page, limit);
  const colSpan = isAdminOrAux ? 8 : 7;

  return (
    <Card>
      <CardHeader
        title={`Acondicionamientos finalizados (${(listData || []).length})`}
      />
      <Divider />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#Ingreso</TableCell>
              <TableCell>Marca</TableCell>
              <TableCell>N. Serie</TableCell>
              <TableCell>Origen</TableCell>
              {isAdminOrAux && <TableCell>Técnico</TableCell>}
              <TableCell>Estado</TableCell>
              <TableCell>Fotos</TableCell>
              <TableCell>Finalizado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRecords.map((record) => {
              const machine = record.warehouseMachine || {};
              const photos =
                record.conditioningPhotos?.length > 0
                  ? record.conditioningPhotos
                  : machine.conditioningPhotos || [];
              const finishedAt = record.completedAt || record.updatedAt;
              return (
                <TableRow hover key={record._id}>
                  <TableCell>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="text.primary"
                      noWrap
                    >
                      {machine.entryNumber ? `#${machine.entryNumber}` : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" color="text.primary" noWrap>
                      {machine.brand || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {machine.serialNumber || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{getOriginChip(machine.origin)}</TableCell>
                  {isAdminOrAux && (
                    <TableCell>
                      <Typography variant="body2" color="text.primary" noWrap>
                        {record.technician?.name || 'Sin asignar'}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell>{getStatusChip(record.status)}</TableCell>
                  <TableCell>
                    {photos.length > 0 ? (
                      <AvatarGroup max={4}>
                        {photos.map((url, i) => (
                          <Avatar
                            key={i}
                            src={url}
                            sx={{ width: 32, height: 32, cursor: 'pointer' }}
                            onClick={() => window.open(url, '_blank')}
                          />
                        ))}
                      </AvatarGroup>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {finishedAt
                        ? formatTZDate(finishedAt, 'DD MMM YYYY HH:mm')
                        : '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
            {paginatedRecords.length === 0 && (
              <TableRow>
                <TableCell colSpan={colSpan} align="center">
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 3 }}
                  >
                    No hay acondicionamientos finalizados
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box p={2}>
        <TablePagination
          component="div"
          count={(listData || []).length}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleLimitChange}
          page={page}
          rowsPerPage={limit}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage="Filas por página"
        />
      </Box>
    </Card>
  );
};

TablaAcondicionamientoFinalizados.propTypes = {
  listData: PropTypes.array.isRequired,
  userRole: PropTypes.string.isRequired
};

export default TablaAcondicionamientoFinalizados;
