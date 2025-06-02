import { FC, ChangeEvent, useState } from 'react';
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
  useTheme,
  CardHeader,
  Chip,
  Typography
} from '@mui/material';
import NotificationImportantIcon from '@mui/icons-material/NotificationImportant';

import VisibilityIcon from '@mui/icons-material/Visibility';
import DoNotDisturbOnOutlinedIcon from '@mui/icons-material/DoNotDisturbOnOutlined';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';

import NextLink from 'next/link';

export const getStatusLabel = (status) => {
  switch (status) {
    case 'PENDIENTE':
      return (
        <Chip
          icon={<PendingActionsIcon fontSize="small" />}
          label="Pendiente"
          color="warning"
          size="small"
        ></Chip>
      );
    case 'FINALIZADO':
      return (
        <Chip
          icon={<DoneOutlineIcon fontSize="small" />}
          label="Completado"
          color="success"
          size="small"
        ></Chip>
      );
    case 'CANCELADO':
      return (
        <Chip
          icon={<DoNotDisturbOnOutlinedIcon fontSize="small" />}
          label="Cancelado"
          color="error"
          size="small"
        ></Chip>
      );
    case 'ALERTA':
      return (
        <Chip
          icon={<NotificationImportantIcon fontSize="small" />}
          label="LLAMAR A ADMINISTRADOR"
          color="error"
          size="small"
        ></Chip>
      );
  }
};

interface TablaMantPendientesProps {
  className?: string;
  listData: any[];
  userRole: string;
}

const applyPagination = (
  rentList: any[],
  page: number,
  limit: number
): any[] => {
  return rentList.slice(page * limit, page * limit + limit);
};

const TablaMantPendientes: FC<TablaMantPendientesProps> = ({
  listData,
  userRole
}) => {
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(30);

  const handlePageChange = (_event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
  };

  const paginatedMants = applyPagination(listData, page, limit);

  const theme = useTheme();
  const isAdmin = userRole === 'ADMIN';
  const canComplete = isAdmin || !listData.some((m) => m.daysSinceCreate >= 3);
  return (
    <>
      <Card>
        <CardHeader
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap'
          }}
          title="Pendientes"
        />

        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">Equipo</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Días Transcurridos</TableCell>
                {isAdmin && <TableCell align="center">Técnico</TableCell>}
                <TableCell align="center"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMants.map((mant) => {
                return (
                  <TableRow
                    key={mant?._id}
                    sx={
                      !canComplete
                        ? { backgroundColor: theme.colors.error.lighter }
                        : {}
                    }
                  >
                    <TableCell align="center">
                      <Typography fontWeight="bold">
                        {mant?.machine?.machineNum}
                      </Typography>{' '}
                    </TableCell>
                    <TableCell align="center">
                      {getStatusLabel(canComplete ? mant?.status : 'ALERTA')}
                    </TableCell>
                    <TableCell align="center">
                      {mant?.daysSinceCreate}
                    </TableCell>
                    {isAdmin && (
                      <TableCell align="center">
                        {mant?.takenBy?.name || 'Sin asignar'}
                      </TableCell>
                    )}
                    <TableCell align="center">
                      <NextLink href={`/mantenimientos/${mant?._id}`}>
                        <Tooltip title="Ver detalle" arrow>
                          <IconButton
                            disabled={!canComplete}
                            sx={{
                              '&:hover': {
                                background: theme.colors.primary.lighter
                              },
                              color: theme.colors.success.light
                            }}
                            color="inherit"
                            size="small"
                          >
                            <VisibilityIcon fontSize="medium" />
                          </IconButton>
                        </Tooltip>
                      </NextLink>
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
            count={listData.length}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleLimitChange}
            page={page}
            rowsPerPage={limit}
            rowsPerPageOptions={
              listData.length > 100 ? [30, 100, listData.length] : [30, 100]
            }
          />
        </Box>
      </Card>
    </>
  );
};

TablaMantPendientes.propTypes = {
  listData: PropTypes.array.isRequired,
  userRole: PropTypes.string.isRequired
};

TablaMantPendientes.defaultProps = {
  listData: [],
  userRole: null
};

export default TablaMantPendientes;
