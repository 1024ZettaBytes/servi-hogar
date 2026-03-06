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
  useTheme
} from '@mui/material';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';
import Label from '@/components/Label';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import ImagesModal from '@/components/ImagesModal';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useSnackbar } from 'notistack';
import { completeSalePickup, assignSalePickup } from '../../lib/client/salePickupsFetch';
import GenericModal from '@/components/GenericModal';
import AssignPickupOperatorModal from '@/components/AssignPickupOperatorModal';

interface TablaRecoleccionesVentasPendientesProps {
  userRole: string;
  pickupList: any[];
  onWhatsAppClick?: (sale: any, type: string) => void;
}

const statusMap = {
  ESPERA: { text: 'En espera', color: 'warning' },
  ASIGNADA: { text: 'Asignada', color: 'info' }
};

const getStatusLabel = (status: string): JSX.Element => {
  const { text, color }: any = statusMap[status] || statusMap.ESPERA;
  return <Label color={color}>{text}</Label>;
};

const TablaRecoleccionesVentasPendientes: FC<TablaRecoleccionesVentasPendientesProps> = ({
  userRole,
  pickupList,
  onWhatsAppClick
}) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [operatorModalOpen, setOperatorModalOpen] = useState(false);
  const [openImages, setOpenImages] = useState<boolean>(false);
  const [selectedImages, setSelectedImages] = useState<any>(null);
  const [selectedPickup, setSelectedPickup] = useState<any>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssignOperator = (pickup: any) => {
    setSelectedPickup(pickup);
    setOperatorModalOpen(true);
  };

  const handleCompleteClick = (pickup: any) => {
    setSelectedPickup(pickup);
    setCompleteModalOpen(true);
  };

  const handleOnCloseImages = () => {
    setOpenImages(false);
    setSelectedImages(null);
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
        setOperatorModalOpen(false);
        setSelectedPickup(null);
      } else {
        enqueueSnackbar(result.msg, {
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'center' },
          autoHideDuration: 3000
        });
      }
    } else {
      setOperatorModalOpen(false);
      setSelectedPickup(null);
    }
  };

  const handleCompleteConfirm = async () => {
    if (selectedPickup) {
      setIsCompleting(true);
      const result = await completeSalePickup(null, {
        pickupId: selectedPickup._id
      });
      setIsCompleting(false);
      
      if (!result.error) {
        enqueueSnackbar(result.msg, {
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'center' },
          autoHideDuration: 2000
        });
        setCompleteModalOpen(false);
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

  if (!pickupList || pickupList.length === 0) {
    return (
      <Box p={3}>
        <Typography variant="h6" color="text.secondary" align="center">
          No hay recolecciones pendientes
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <CardHeader
        title="Recolecciones de Garantía Asignadas"
        subheader={`${pickupList.length} recolección(es) pendiente(s)`}
      />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>No.</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Máquina</TableCell>
              <TableCell>Razón</TableCell>
              <TableCell>Dirección</TableCell>
              <TableCell>Operador asignado</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="center">Fotos</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pickupList.map((pickup) => {
              const customer = pickup.sale?.customer;
              const machine = pickup.machine;
              const residence = customer?.currentResidence;
              
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
                    <Typography variant="caption" display="block">
                      {machine?.brand}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {pickup.reason}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {residence ? 
                        `${residence.street || ''}, ${residence.suburb || ''}, ${residence.city?.name || ''}` 
                        : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {pickup.operator ? (
                      <Typography variant="body2" fontWeight="bold">
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
                    {pickup.sale?.delivery?.imagesUrl ? (
                      <Tooltip title="Ver fotos" arrow>
                        <IconButton
                          onClick={() => {
                            const { _id, ...images } = pickup.sale.delivery.imagesUrl;
                            setSelectedImages(images);
                            setOpenImages(true);
                          }}
                          sx={{
                            '&:hover': {
                              background: theme.colors.primary.lighter
                            },
                            color: theme.palette.primary.main
                          }}
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
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      {pickup.status === 'ESPERA' && (userRole === 'ADMIN' || userRole === 'AUX') && (
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
                      )}
                      {pickup.status === 'ASIGNADA' && userRole === 'OPE' && (
                        <Tooltip title="Completar recolección">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleCompleteClick(pickup)}
                            disabled={isCompleting}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onWhatsAppClick && (
                      <Tooltip title="Ver formato WhatsApp">
                        <IconButton
                          size="small"
                          sx={{
                            '&:hover': {
                              background: '#e8f5e9'
                            },
                            color: '#25D366'
                          }}
                          onClick={() => onWhatsAppClick(pickup.sale, 'pickup')}
                        >
                          <WhatsAppIcon fontSize="small" />
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

      {operatorModalOpen && selectedPickup && (
        <AssignPickupOperatorModal
          open={operatorModalOpen}
          handleOnClose={handleOperatorClose}
          pickup={selectedPickup}
          isAssigning={isAssigning}
        />
      )}

      {openImages && selectedImages && (
        <ImagesModal
          open={openImages}
          imagesObj={selectedImages}
          title="Fotos de la entrega"
          text=""
          onClose={handleOnCloseImages}
        />
      )}

      {completeModalOpen && selectedPickup && (
        <GenericModal
          title="Completar Recolección"
          text={`¿Confirma que ha recogido la máquina #${selectedPickup.machine?.machineNum} de ${selectedPickup.sale?.customer?.name}?`}
          open={completeModalOpen}
          isLoading={isCompleting}
          requiredReason={false}
          onAccept={handleCompleteConfirm}
          onCancel={() => {
            setCompleteModalOpen(false);
            setSelectedPickup(null);
          }}
        />
      )}
    </>
  );
};

export default TablaRecoleccionesVentasPendientes;
