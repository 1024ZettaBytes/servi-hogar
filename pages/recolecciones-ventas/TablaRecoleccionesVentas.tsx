import { FC, useState } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Typography,
  CardHeader,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';
import Label from '@/components/Label';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import CancelIcon from '@mui/icons-material/Cancel';
import { useSnackbar } from 'notistack';
import { assignSalePickup, cancelSalePickup } from '../../lib/client/salePickupsFetch';
import GenericModal from '@/components/GenericModal';
import AssignOperatorModal from '@/components/AssignOperatorModal';

interface TablaRecoleccionesVentasProps {
  userRole: string;
  pendingPickups: any[];
  pastPickups: any;
}

const statusMap = {
  ESPERA: { text: 'En espera', color: 'warning' },
  ASIGNADA: { text: 'Asignada', color: 'info' },
  COMPLETADA: { text: 'Completada', color: 'success' },
  CANCELADA: { text: 'Cancelada', color: 'error' }
};

const getStatusLabel = (status: string): JSX.Element => {
  const { text, color }: any = statusMap[status] || statusMap.ESPERA;
  return <Label color={color}>{text}</Label>;
};

const TablaRecoleccionesVentas: FC<TablaRecoleccionesVentasProps> = ({
  userRole,
  pendingPickups,
  pastPickups
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [currentTab, setCurrentTab] = useState<string>('pending');
  const [operatorModalOpen, setOperatorModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState<any>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleTabsChange = (_event: any, value: string): void => {
    setCurrentTab(value);
  };

  const handleAssignOperator = (pickup: any) => {
    setSelectedPickup(pickup);
    setOperatorModalOpen(true);
  };

  const handleCancelPickup = (pickup: any) => {
    setSelectedPickup(pickup);
    setCancelModalOpen(true);
  };

  const handleOperatorClose = async (saved: boolean, operatorId: string = null) => {
    if (saved && operatorId && selectedPickup) {
      setIsAssigning(true);
      const result = await assignSalePickup(selectedPickup._id, operatorId);
      setIsAssigning(false);
      
      if (!result.error) {
        enqueueSnackbar(result.msg, {
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'center' },
          autoHideDuration: 2000
        });
      } else {
        enqueueSnackbar(result.msg, {
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'center' },
          autoHideDuration: 3000
        });
      }
    }
    setOperatorModalOpen(false);
    setSelectedPickup(null);
  };

  const handleCancelConfirm = async (reason: string) => {
    if (selectedPickup) {
      setIsCancelling(true);
      const result = await cancelSalePickup(selectedPickup._id, reason);
      setIsCancelling(false);
      
      if (!result.error) {
        enqueueSnackbar(result.msg, {
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'center' },
          autoHideDuration: 2000
        });
        setCancelModalOpen(false);
        setSelectedPickup(null);
      } else {
        enqueueSnackbar(result.msg, {
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'center' },
          autoHideDuration: 3000
        });
      }
    }
  };

  const tabs = [
    { value: 'pending', label: `Pendientes (${pendingPickups?.length || 0})` },
    { value: 'past', label: 'Historial' }
  ];

  const renderPendingPickups = () => {
    if (!pendingPickups || pendingPickups.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={8} align="center">
            <Typography variant="subtitle1" color="text.secondary">
              No hay recolecciones pendientes
            </Typography>
          </TableCell>
        </TableRow>
      );
    }

    return pendingPickups.map((pickup) => {
      const customer = pickup.sale?.customer;
      const machine = pickup.machine;
      
      return (
        <TableRow hover key={pickup._id}>
          <TableCell>
            <Typography variant="body2" fontWeight="bold">
              #{pickup.totalNumber}
            </Typography>
          </TableCell>
          <TableCell>
            <Typography variant="body2">
              {format(new Date(pickup.date), 'dd/MM/yyyy', { locale: es })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {pickup.timeOption === 'any' ? 'Todo el día' : 
                `${format(new Date(pickup.fromTime), 'HH:mm')} - ${format(new Date(pickup.endTime), 'HH:mm')}`}
            </Typography>
          </TableCell>
          <TableCell>
            <Typography variant="body2" fontWeight="bold">
              {customer?.name || 'N/A'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {customer?.phone || ''}
            </Typography>
          </TableCell>
          <TableCell>
            <Chip 
              label={`#${machine?.machineNum || 'N/A'}`} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          </TableCell>
          <TableCell>
            <Typography variant="body2" noWrap>
              {pickup.reason}
            </Typography>
          </TableCell>
          <TableCell>
            {pickup.operator ? (
              <Typography variant="body2">
                {pickup.operator.name}
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary">
                Sin asignar
              </Typography>
            )}
          </TableCell>
          <TableCell align="center">
            {getStatusLabel(pickup.status)}
          </TableCell>
          <TableCell align="center">
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {pickup.status === 'ESPERA' && userRole !== 'OPE' && (
                <>
                  <Tooltip title="Asignar operador">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleAssignOperator(pickup)}
                      disabled={isAssigning}
                    >
                      <PersonAddAlt1Icon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cancelar">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleCancelPickup(pickup)}
                      disabled={isCancelling}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          </TableCell>
        </TableRow>
      );
    });
  };

  const renderPastPickups = () => {
    if (!pastPickups?.list || pastPickups.list.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={8} align="center">
            <Typography variant="subtitle1" color="text.secondary">
              No hay historial de recolecciones
            </Typography>
          </TableCell>
        </TableRow>
      );
    }

    return pastPickups.list.map((pickup) => {
      const customer = pickup.sale?.customer;
      const machine = pickup.machine;
      
      return (
        <TableRow hover key={pickup._id}>
          <TableCell>
            <Typography variant="body2" fontWeight="bold">
              #{pickup.totalNumber}
            </Typography>
          </TableCell>
          <TableCell>
            <Typography variant="body2">
              {format(new Date(pickup.date), 'dd/MM/yyyy', { locale: es })}
            </Typography>
          </TableCell>
          <TableCell>
            <Typography variant="body2" fontWeight="bold">
              {customer?.name || 'N/A'}
            </Typography>
          </TableCell>
          <TableCell>
            <Chip 
              label={`#${machine?.machineNum || 'N/A'}`} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          </TableCell>
          <TableCell>
            <Typography variant="body2" noWrap>
              {pickup.reason}
            </Typography>
          </TableCell>
          <TableCell>
            {pickup.operator ? (
              <Typography variant="body2">
                {pickup.operator.name}
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary">
                N/A
              </Typography>
            )}
          </TableCell>
          <TableCell>
            {pickup.finishedAt ? (
              <Typography variant="caption">
                {format(new Date(pickup.finishedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
              </Typography>
            ) : 'N/A'}
          </TableCell>
          <TableCell align="center">
            {getStatusLabel(pickup.status)}
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <Card>
      <CardHeader
        title="Recolecciones de Garantía"
        subheader="Gestión de recolecciones de equipos vendidos con fallas"
      />
      
      <Tabs
        onChange={handleTabsChange}
        value={currentTab}
        variant="scrollable"
        scrollButtons="auto"
        textColor="primary"
        indicatorColor="primary"
        sx={{ px: 3 }}
      >
        {tabs.map((tab) => (
          <Tab key={tab.value} label={tab.label} value={tab.value} />
        ))}
      </Tabs>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>No.</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Máquina</TableCell>
              <TableCell>Razón</TableCell>
              <TableCell>Operador</TableCell>
              {currentTab === 'past' && <TableCell>Finalizada</TableCell>}
              <TableCell align="center">Estado</TableCell>
              {currentTab === 'pending' && <TableCell align="center">Acciones</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {currentTab === 'pending' ? renderPendingPickups() : renderPastPickups()}
          </TableBody>
        </Table>
      </TableContainer>

      {operatorModalOpen && selectedPickup && (
        <AssignOperatorModal
          open={operatorModalOpen}
          sale={selectedPickup}
          handleOnClose={handleOperatorClose}
        />
      )}

      {cancelModalOpen && selectedPickup && (
        <GenericModal
          title="Cancelar Recolección"
          text={`¿Está seguro que desea cancelar la recolección para ${selectedPickup.sale?.customer?.name}?`}
          open={cancelModalOpen}
          requiredReason={true}
          isLoading={isCancelling}
          onAccept={handleCancelConfirm}
          onCancel={() => {
            setCancelModalOpen(false);
            setSelectedPickup(null);
          }}
        />
      )}
    </Card>
  );
};

export default TablaRecoleccionesVentas;
