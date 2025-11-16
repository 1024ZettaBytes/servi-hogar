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
  Typography,
  CardHeader,
  Chip
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { capitalizeFirstLetter, formatTZDate } from 'lib/client/utils';
import OperatorModal from '@/components/OperatorModal';
import { useSnackbar } from 'notistack';

interface TablaAccionesVencidasProps {
  actionsList: any[];
}

const getActionTypeLabel = (type: string): JSX.Element => {
  const map = {
    ENTREGA: {
      text: 'Entrega',
      color: 'primary'
    },
    CAMBIO: {
      text: 'Cambio',
      color: 'warning'
    },
    RECOLECCION: {
      text: 'Recolección',
      color: 'error'
    }
  };

  const { text, color }: any = map[type];

  return <Chip label={text} color={color} />;
};

const TablaAccionesVencidas: FC<TablaAccionesVencidasProps> = ({ actionsList = [] }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(5);
  const [operatorModalOpen, setOperatorModalOpen] = useState<boolean>(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);

  const handlePageChange = (_event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
  };

  const handleReassignClick = (action: any) => {
    setSelectedAction(action);
    setOperatorModalOpen(true);
  };

  const getActionTypeForAPI = (type: string): string => {
    const typeMap = {
      'ENTREGA': 'delivery',
      'CAMBIO': 'change',
      'RECOLECCION': 'pickup'
    };
    return typeMap[type] || type;
  };

  const handleOnReassignedOperator = async () => {
    setOperatorModalOpen(false);
    setSelectedAction(null);
    enqueueSnackbar('Operador reasignado exitosamente', {
      variant: 'success',
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'center'
      },
      autoHideDuration: 2000
    });
  };

  const handleCancelReassign = () => {
    setOperatorModalOpen(false);
    setSelectedAction(null);
  };

  const getDaysOverdue = (takenAt: Date | null): number => {
    if (!takenAt) {
      return 999; // Return a high number for actions that were never taken
    }
    const now = new Date();
    const taken = new Date(takenAt);
    const diffTime = Math.abs(now.getTime() - taken.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const paginatedActions = actionsList.slice(page * limit, page * limit + limit);

  return (
    <Card>
      <CardHeader title="Vueltas Vencidas (Más de 3 días)" />
      <Divider />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Dirección</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Equipo(s)</TableCell>
              <TableCell>Operador</TableCell>
              <TableCell>Asignado Hace</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedActions.map((action) => {
              const customer = action.rent?.customer;
              const residence = customer?.currentResidence;
              const daysOverdue = getDaysOverdue(action.takenAt);
              
              let equipment = '';
              if (action.type === 'ENTREGA') {
                equipment = action.rent?.machine?.machineNum || 'N/A';
              } else if (action.type === 'CAMBIO') {
                equipment = `${action.pickedMachine?.machineNum || 'N/A'} → ${action.leftMachine?.machineNum || 'N/A'}`;
              } else if (action.type === 'RECOLECCION') {
                equipment = action.rent?.machine?.machineNum || 'N/A';
              }

              return (
                <TableRow hover key={action._id}>
                  <TableCell>
                    {getActionTypeLabel(action.type)}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="text.primary"
                      gutterBottom
                      noWrap
                    >
                      {customer?.name || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {residence ? 
                        `${residence.street} ${residence.number}, ${residence.suburb}` : 
                        'N/A'
                      }
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {residence?.sector?.name || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {customer?.cell || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.primary">
                      {equipment}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.primary">
                      {action.operator?.name || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`${daysOverdue} días`} 
                      color={daysOverdue > 5 ? 'error' : 'warning'} 
                      size="small"
                    />
                    {action.takenAt ? (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {capitalizeFirstLetter(
                          formatTZDate(new Date(action.takenAt), 'MMM DD, h:mm a')
                        )}
                      </Typography>
                    ) : (
                      <Typography variant="caption" display="block" color="text.secondary">
                        Sin fecha de asignación
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Reasignar Operador" arrow>
                      <IconButton
                        sx={{
                          '&:hover': {
                            background: 'warning.main',
                            color: 'warning.contrastText'
                          },
                          color: 'warning.main'
                        }}
                        color="inherit"
                        size="small"
                        onClick={() => handleReassignClick(action)}
                      >
                        <SwapHorizIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
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
          count={actionsList.length}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleLimitChange}
          page={page}
          rowsPerPage={limit}
          rowsPerPageOptions={[5, 10, 25, 30]}
        />
      </Box>
      {operatorModalOpen && selectedAction && (
        <OperatorModal
          open={operatorModalOpen}
          type={getActionTypeForAPI(selectedAction.type)}
          id={selectedAction._id}
          currentOperator={selectedAction.operator?._id}
          onAccept={handleOnReassignedOperator}
          onCancel={handleCancelReassign}
        />
      )}
    </Card>
  );
};

TablaAccionesVencidas.propTypes = {
  actionsList: PropTypes.array.isRequired
};

export default TablaAccionesVencidas;
