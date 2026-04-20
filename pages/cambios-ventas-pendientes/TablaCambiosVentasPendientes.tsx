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
} from '@mui/material';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';
import Label from '@/components/Label';
import CancelIcon from '@mui/icons-material/Cancel';
import { useSnackbar } from 'notistack';
import { cancelSaleChange } from '../../lib/client/saleChangesFetch';
import GenericModal from '@/components/GenericModal';

interface TablaCambiosVentasPendientesProps {
  userRole: string;
  changeList: any[];
}

const statusMap = {
  ESPERA: { text: 'En espera', color: 'warning' },
  ASIGNADA: { text: 'Asignada', color: 'info' }
};

const getStatusLabel = (status: string): JSX.Element => {
  const { text, color }: any = statusMap[status] || statusMap.ESPERA;
  return <Label color={color}>{text}</Label>;
};

const TablaCambiosVentasPendientes: FC<TablaCambiosVentasPendientesProps> = ({
  userRole,
  changeList
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedChange, setSelectedChange] = useState<any>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelChange = (change: any) => {
    setSelectedChange(change);
    setCancelModalOpen(true);
  };

  const handleCancelConfirm = async (reason: string) => {
    if (selectedChange) {
      setIsCancelling(true);
      const result = await cancelSaleChange(selectedChange._id, reason);
      setIsCancelling(false);

      if (!result.error) {
        enqueueSnackbar(result.msg, {
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'center' },
          autoHideDuration: 2000
        });
        setCancelModalOpen(false);
        setSelectedChange(null);
      } else {
        enqueueSnackbar(result.msg, {
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'center' },
          autoHideDuration: 3000
        });
      }
    }
  };

  if (!changeList || changeList.length === 0) {
    return null;
  }

  return (
    <>
      <CardHeader
        title="Cambios de Garantía Pendientes"
        subheader={`${changeList.length} cambio(s) pendiente(s)`}
      />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>No.</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Máquina a recoger</TableCell>
              <TableCell>Máquina de reemplazo</TableCell>
              <TableCell>Razón</TableCell>
              <TableCell>Operador</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {changeList.map((change) => {
              const customer = change.sale?.customer;

              return (
                <TableRow hover key={change._id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      #{change.totalNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(change.date), 'dd/MM/yyyy', { locale: es })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {change.timeOption === 'any'
                        ? 'Todo el día'
                        : `${format(new Date(change.fromTime), 'HH:mm')} - ${format(new Date(change.endTime), 'HH:mm')}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {customer?.name || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`#${change.pickedMachine?.machineNum  || 'N/A'} (${change.pickedMachine?.serialNumber || 'N/A'})`}
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                    <Typography variant="caption" display="block">
                      {change.pickedMachine?.brand}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`#${change.leftMachine?.machineNum || 'N/A'} (${change.leftMachine?.serialNumber || 'N/A'})`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                    <Typography variant="caption" display="block">
                      {change.leftMachine?.brand}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {change.reason}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {change.operator ? (
                      <Typography variant="body2" fontWeight="bold">
                        {change.operator.name}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Sin asignar
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {getStatusLabel(change.status)}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      {['ESPERA', 'ASIGNADA'].includes(change.status) &&
                        (userRole === 'ADMIN' || userRole === 'AUX') && (
                          <Tooltip title="Cancelar cambio">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleCancelChange(change)}
                              disabled={isCancelling}
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

      {cancelModalOpen && selectedChange && (
        <GenericModal
          title="Cancelar Cambio por Garantía"
          text={`¿Está seguro que desea cancelar el cambio por garantía para ${selectedChange.sale?.customer?.name}?`}
          open={cancelModalOpen}
          requiredReason={true}
          isLoading={isCancelling}
          onAccept={handleCancelConfirm}
          onCancel={() => {
            setCancelModalOpen(false);
            setSelectedChange(null);
          }}
        />
      )}
    </>
  );
};

export default TablaCambiosVentasPendientes;
