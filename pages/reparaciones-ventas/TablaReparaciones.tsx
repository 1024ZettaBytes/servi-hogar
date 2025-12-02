import { FC, useState } from 'react';
import {
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
  Box,
  Tabs,
  Tab,
  CircularProgress,
  TextField
} from '@mui/material';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';
import Label from '@/components/Label';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useSnackbar } from 'notistack';
import { completeSaleRepair, cancelSaleRepair } from '../../lib/client/saleRepairsFetch';
import GenericModal from '@/components/GenericModal';

interface TablaReparacionesProps {
  userRole: string;
  pendingRepairs: any[];
  allRepairs: any[];
  isLoading: boolean;
}

const statusMap = {
  PENDIENTE: { text: 'Pendiente', color: 'warning' },
  COMPLETADA: { text: 'Completada', color: 'success' },
  CANCELADA: { text: 'Cancelada', color: 'error' }
};

const getStatusLabel = (status: string): JSX.Element => {
  const { text, color }: any = statusMap[status] || statusMap.PENDIENTE;
  return <Label color={color}>{text}</Label>;
};

const TablaReparaciones: FC<TablaReparacionesProps> = ({
  pendingRepairs,
  allRepairs,
  isLoading
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [currentTab, setCurrentTab] = useState(0);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<any>(null);
  const [description, setDescription] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const tabs = [
    { value: 0, label: 'Pendientes' },
    { value: 1, label: 'Todas' }
  ];

  const handleTabsChange = (_event: any, value: number): void => {
    setCurrentTab(value);
  };

  const handleCompleteClick = (repair: any) => {
    setSelectedRepair(repair);
    setDescription(repair.description || '');
    setCompleteModalOpen(true);
  };

  const handleCancelClick = (repair: any) => {
    setSelectedRepair(repair);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleCompleteConfirm = async () => {
    if (!selectedRepair || !description.trim()) {
      enqueueSnackbar('La descripción del trabajo es requerida', {
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
      return;
    }

    setIsProcessing(true);
    const result = await completeSaleRepair({
      repairId: selectedRepair._id,
      description
    });
    setIsProcessing(false);

    if (!result.error) {
      enqueueSnackbar(result.msg, {
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 2000
      });
      setCompleteModalOpen(false);
      setSelectedRepair(null);
      setDescription('');
    } else {
      enqueueSnackbar(result.msg, {
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 3000
      });
    }
  };

  const handleCancelConfirm = async () => {
    if (!selectedRepair || !cancelReason.trim()) {
      enqueueSnackbar('La razón de cancelación es requerida', {
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
      return;
    }

    setIsProcessing(true);
    const result = await cancelSaleRepair({
      repairId: selectedRepair._id,
      reason: cancelReason
    });
    setIsProcessing(false);

    if (!result.error) {
      enqueueSnackbar(result.msg, {
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 2000
      });
      setCancelModalOpen(false);
      setSelectedRepair(null);
      setCancelReason('');
    } else {
      enqueueSnackbar(result.msg, {
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 3000
      });
    }
  };

  const displayList = currentTab === 0 ? pendingRepairs : allRepairs;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <CardHeader
        title="Reparaciones de Equipos Vendidos"
        action={
          <Tabs
            value={currentTab}
            onChange={handleTabsChange}
            textColor="primary"
            indicatorColor="primary"
          >
            {tabs.map((tab) => (
              <Tab key={tab.value} label={tab.label} value={tab.value} />
            ))}
          </Tabs>
        }
      />

      {!displayList || displayList.length === 0 ? (
        <Box p={3}>
          <Typography variant="h6" color="text.secondary" align="center">
            No hay reparaciones {currentTab === 0 ? 'pendientes' : 'registradas'}
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>No.</TableCell>
                <TableCell>Fecha Ingreso</TableCell>
                <TableCell>Máquina</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Técnico</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayList.map((repair) => {
                const machine = repair.machine;
                const pickup = repair.salePickup;
                const customer = pickup?.sale?.customer;
                const technician = repair.takenBy;

                return (
                  <TableRow hover key={repair._id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        #{repair.totalNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(repair.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`#${machine?.machineNum || 'N/A'}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Typography variant="caption" display="block">
                        {machine?.brand}
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
                      <Typography variant="body2">
                        {technician?.name || 'Sin asignar'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        noWrap 
                        sx={{ maxWidth: 200 }}
                        title={repair.description || 'Sin descripción'}
                      >
                        {repair.description || 'Sin descripción'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {getStatusLabel(repair.status)}
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={1} justifyContent="center">
                        {repair.status === 'PENDIENTE' && (
                          <>
                            <Tooltip title="Completar reparación">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleCompleteClick(repair)}
                                disabled={isProcessing}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancelar">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleCancelClick(repair)}
                                disabled={isProcessing}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {completeModalOpen && selectedRepair && (
        <GenericModal
          title="Completar Reparación"
          text={
            <Box>
              <Typography gutterBottom>
                Complete la reparación de la máquina #{selectedRepair.machine?.machineNum}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Descripción del trabajo realizado *"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                margin="normal"
                placeholder="Describa el trabajo realizado y las piezas utilizadas..."
              />
            </Box>
          }
          open={completeModalOpen}
          isLoading={isProcessing}
          requiredReason={false}
          onAccept={handleCompleteConfirm}
          onCancel={() => {
            setCompleteModalOpen(false);
            setSelectedRepair(null);
            setDescription('');
          }}
        />
      )}

      {cancelModalOpen && selectedRepair && (
        <GenericModal
          title="Cancelar Reparación"
          text={
            <Box>
              <Typography gutterBottom>
                ¿Está seguro de cancelar la reparación #{selectedRepair.totalNumber}?
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Razón de cancelación *"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                margin="normal"
                placeholder="Explique el motivo de la cancelación..."
              />
            </Box>
          }
          open={cancelModalOpen}
          isLoading={isProcessing}
          requiredReason={false}
          onAccept={handleCancelConfirm}
          onCancel={() => {
            setCancelModalOpen(false);
            setSelectedRepair(null);
            setCancelReason('');
          }}
        />
      )}
    </>
  );
};

export default TablaReparaciones;
