import {
  Grid,
  Typography,
  CardContent,
  Card,
  Box,
  Divider,
  Chip,
  Button,
  FormControl,
  Select,
  MenuItem,
  Alert,
  TextField,
  InputLabel
} from '@mui/material';
import { Skeleton } from '@mui/material';
import Text from '@/components/Text';
import numeral from 'numeral';
import Image from 'next/image';
import { capitalizeFirstLetter, formatTZDate } from 'lib/client/utils';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import SellIcon from '@mui/icons-material/Sell';
import BuildIcon from '@mui/icons-material/Build';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import PersonIcon from '@mui/icons-material/Person';
import Label from '@/components/Label';
import { useState } from 'react';
import { LoadingButton } from '@mui/lab';
import { useSnackbar } from 'notistack';
import { updateSalesMachine } from '../../../lib/client/salesMachinesFetch';
import {
  getFetcher,
  useGetAllWarehousesOverview,
  useGetAllVehicles
} from 'pages/api/useRequest';
import { mutate } from 'swr';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import { DesktopDatePicker } from '@mui/x-date-pickers';
import { convertDateToLocal, setDateToInitial } from 'lib/client/utils';

const getStatusChip = (status: string) => {
  switch (status) {
    case 'DISPONIBLE':
      return (
        <Chip
          icon={<CheckCircleOutlineIcon />}
          label="Disponible"
          color="success"
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      );
    case 'PENDIENTE':
      return (
        <Chip
          icon={<HourglassEmptyIcon />}
          label="Pendiente"
          color="warning"
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      );
    case 'VENDIDO':
      return (
        <Chip
          icon={<SellIcon />}
          label="Vendido"
          color="error"
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      );
    case 'RECOLECTADA':
      return (
        <Chip
          icon={<HourglassEmptyIcon />}
          label="Recolectada"
          color="info"
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      );
    case 'MANT_PENDIENTE':
      return (
        <Chip
          icon={<BuildIcon />}
          label="Mant. Pendiente"
          color="warning"
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      );
    case 'LISTO':
      return (
        <Chip
          icon={<CheckCircleOutlineIcon />}
          label="Listo"
          color="success"
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      );
    default:
      return (
        <Chip
          icon={<CheckCircleOutlineIcon />}
          label="Disponible"
          color="success"
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      );
  }
};
const DetailRow = ({ label, value, isLoading, isChip = false }) => (
  <>
    <Grid item xs={12} sm={4} md={3} textAlign={{ sm: 'right' }}>
      <Box pr={2} pb={2}>
        {label}:
      </Box>
    </Grid>
    <Grid item xs={12} sm={8} md={9}>
      <Box sx={{ maxWidth: { xs: 'auto', sm: 400 } }}>
        {isLoading ? (
          <Skeleton variant="text" sx={{ fontSize: '1rem', width: '150px' }} />
        ) : (
          isChip ? value : <Text color="black">{value}</Text>
        )}
      </Box>
    </Grid>
  </>
);

function SalesMachineInfoTab({ salesMachine }) {
  const isLoading = !salesMachine;
  const { enqueueSnackbar } = useSnackbar();
  const { warehousesList, warehousesError } = useGetAllWarehousesOverview(getFetcher);
  const { vehiclesList, vehiclesError } = useGetAllVehicles(getFetcher);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [locationType, setLocationType] = useState<'warehouse' | 'vehicle'>('warehouse');
  const [selectedWarehouse, setSelectedWarehouse] = useState(salesMachine?.currentWarehouse?._id || null);
  const [selectedVehicle, setSelectedVehicle] = useState(salesMachine?.currentVehicle?._id || null);
  const [warrantyDate, setWarrantyDate] = useState<Date>(salesMachine?.warranty ? convertDateToLocal(new Date(salesMachine.warranty)) : null);
  const [selectedStatus, setSelectedStatus] = useState(salesMachine?.status || 'DISPONIBLE');

  // Allow editing if machine is DISPONIBLE, PENDIENTE, RECOLECTADA, MANT_PENDIENTE, or LISTO (in repair workflow)
  // But not if it's VENDIDO and with customer
  const canEdit = salesMachine && 
    (salesMachine.status === 'DISPONIBLE' || salesMachine.status === 'PENDIENTE' || 
     salesMachine.status === 'RECOLECTADA' || salesMachine.status === 'MANT_PENDIENTE' || 
     salesMachine.status === 'LISTO') && 
    !(salesMachine.isSold && salesMachine.status === 'VENDIDO');

  const getLocationDisplay = () => {
    // Priority 1: If in vehicle (e.g., picked up for repair)
    if (salesMachine?.currentVehicle) {
      return (
        <Label color="warning">
          <LocalShippingIcon fontSize="small" sx={{ mr: 0.5 }} />
          <b>Vehículo: {salesMachine.currentVehicle.operator?.name || 'N/A'}</b>
        </Label>
      );
    }
    
    // Priority 2: If in warehouse
    if (salesMachine?.currentWarehouse) {
      return (
        <Label color="info">
          <WarehouseIcon fontSize="small" sx={{ mr: 0.5 }} />
          <b>{salesMachine.currentWarehouse.name}</b>
        </Label>
      );
    }
    
    // Priority 3: If sold, show customer name
    if (salesMachine?.isSold && salesMachine?.sale?.customer) {
      return (
        <Label color="error">
          <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />
          <b>Cliente: {salesMachine.sale.customer.name}</b>
        </Label>
      );
    }
    
    // No location assigned
    return (
      <Label color="secondary">
        <LocationOnIcon fontSize="small" sx={{ mr: 0.5 }} />
        <b>Sin asignar</b>
      </Label>
    );
  };

  const handleEditClick = () => {
    if (salesMachine?.currentWarehouse) {
      setLocationType('warehouse');
      setSelectedWarehouse(salesMachine.currentWarehouse._id);
      setSelectedVehicle(null);
    } else if (salesMachine?.currentVehicle) {
      setLocationType('vehicle');
      setSelectedVehicle(salesMachine.currentVehicle._id);
      setSelectedWarehouse(null);
    } else {
      setLocationType('warehouse');
      setSelectedWarehouse(null);
      setSelectedVehicle(null);
    }
    setWarrantyDate(salesMachine?.warranty ? convertDateToLocal(new Date(salesMachine.warranty)) : null);
    setSelectedStatus(salesMachine?.status || 'DISPONIBLE');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setSelectedWarehouse(salesMachine?.currentWarehouse?._id || null);
    setSelectedVehicle(salesMachine?.currentVehicle?._id || null);
    setWarrantyDate(salesMachine?.warranty ? convertDateToLocal(new Date(salesMachine.warranty)) : null);
    setSelectedStatus(salesMachine?.status || 'DISPONIBLE');
    setIsEditing(false);
  };

  const handleLocationTypeChange = (event) => {
    const newType = event.target.value;
    setLocationType(newType);
    if (newType === 'warehouse') {
      setSelectedVehicle(null);
    } else {
      setSelectedWarehouse(null);
    }
  };



  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateSalesMachine({
        _id: salesMachine._id,
        machineNum: salesMachine.machineNum,
        brand: salesMachine.brand,
        cost: salesMachine.cost,
        serialNumber: salesMachine.serialNumber,
        currentWarehouse: locationType === 'warehouse' ? selectedWarehouse : null,
        currentVehicle: locationType === 'vehicle' ? selectedVehicle : null,
        warranty: warrantyDate,
        status: selectedStatus
      });

      if (!result.error) {
        enqueueSnackbar('Información actualizada exitosamente', {
          variant: 'success',
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'center'
          },
          autoHideDuration: 1500
        });
        setIsEditing(false);
        // Refresh the data
        mutate(`/api/sales-machines/${salesMachine._id}`);
      } else {
        enqueueSnackbar(result.msg || 'Error al actualizar', {
          variant: 'error',
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'center'
          },
          autoHideDuration: 2000
        });
      }
    } catch (error) {
      enqueueSnackbar('Error al actualizar la ubicación', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center'
        },
        autoHideDuration: 2000
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <Box
            p={3}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h4" gutterBottom>
                Datos generales
              </Typography>
            </Box>
            {canEdit && (
              <Box>
                {!isEditing ? (
                  <Button
                    variant="outlined"
                    startIcon={<EditTwoToneIcon />}
                    onClick={handleEditClick}
                  >
                    Modificar
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      Cancelar
                    </Button>
                    <LoadingButton
                      variant="contained"
                      onClick={handleSave}
                      loading={isSaving}
                      disabled={
                        (locationType === 'warehouse' && !selectedWarehouse) ||
                        (locationType === 'vehicle' && !selectedVehicle)
                      }
                    >
                      Guardar
                    </LoadingButton>
                  </Box>
                )}
              </Box>
            )}
          </Box>
          <Divider />
          <CardContent sx={{ p: 4 }}>
            <Typography variant="subtitle2">
              <Grid
                container
                direction={'row'}
                alignItems="left"
                justifyItems="left"
              >

                <DetailRow
                  label="Número de Equipo"
                  isLoading={isLoading}
                  value={`#${salesMachine?.machineNum}`}
                />
                
                <DetailRow
                  label="Marca"
                  isLoading={isLoading}
                  value={salesMachine?.brand}
                />
                
                <DetailRow
                  label="Costo"
                  isLoading={isLoading}
                  value={numeral(salesMachine?.cost).format('$0,0.00')}
                />
                
                <DetailRow
                  label="Número de Serie"
                  isLoading={isLoading}
                  value={salesMachine?.serialNumber || 'N/A'}
                />

                <DetailRow
                  label="Origen"
                  isLoading={isLoading}
                  value={
                    salesMachine?.isFromRent ? (
                      <Chip label="Rentas" color="info" size="small" />
                    ) : (
                      <Chip label="Nuevo" color="default" size="small" variant="outlined" />
                    )
                  }
                />

                <Grid item xs={12} sm={4} md={3} textAlign={{ sm: 'right' }}>
                  <Box pr={2} pb={2}>
                    Estado:
                  </Box>
                </Grid>
                <Grid item xs={12} sm={8} md={9}>
                  <Box sx={{ maxWidth: { xs: 'auto', sm: 400 } }}>
                    {isLoading ? (
                      <Skeleton variant="text" sx={{ fontSize: '1rem', width: '150px' }} />
                    ) : !isEditing || salesMachine?.status === 'MANT_PENDIENTE' || salesMachine?.status === 'LISTO' ? (
                      getStatusChip(salesMachine?.status)
                    ) : salesMachine?.status === 'RECOLECTADA' ? (
                      <FormControl fullWidth size="small">
                        <InputLabel>Estado</InputLabel>
                        <Select
                          value={selectedStatus}
                          label="Estado"
                          onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                          <MenuItem value="RECOLECTADA">Recolectada</MenuItem>
                          <MenuItem value="MANT_PENDIENTE">Mant. Pendiente</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      getStatusChip(salesMachine?.status)
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4} md={3} textAlign={{ sm: 'right' }}>
                  <Box pr={2} pb={2}>
                    Ubicación:
                  </Box>
                </Grid>
                <Grid item xs={12} sm={8} md={9}>
                  <Box sx={{ maxWidth: { xs: 'auto', sm: 400 } }}>
                    {isLoading ? (
                      <Skeleton variant="text" sx={{ fontSize: '1rem', width: '150px' }} />
                    ) : !isEditing ? (
                      getLocationDisplay()
                    ) : salesMachine?.status === 'MANT_PENDIENTE' ? (
                      getLocationDisplay()
                    ) : (
                      <Box>
                        <FormControl component="fieldset" sx={{ mb: 2 }}>
                          <FormLabel component="legend">Tipo de ubicación</FormLabel>
                          <RadioGroup
                            row
                            value={locationType}
                            onChange={handleLocationTypeChange}
                          >
                            <FormControlLabel
                              value="warehouse"
                              control={<Radio />}
                              label="Bodega"
                            />
                            <FormControlLabel
                              value="vehicle"
                              control={<Radio />}
                              label="Vehículo"
                            />
                          </RadioGroup>
                        </FormControl>

                        {locationType === 'warehouse' && (
                          <>
                            {warehousesError ? (
                              <Alert severity="error">{warehousesError?.message}</Alert>
                            ) : !warehousesList ? (
                              <Skeleton variant="rectangular" width="100%" height={40} />
                            ) : (
                              <FormControl fullWidth>
                                <Select
                                  size="small"
                                  id="warehouse"
                                  name="warehouse"
                                  value={selectedWarehouse || ''}
                                  onChange={(event) => setSelectedWarehouse(event.target.value)}
                                >
                                  {warehousesList.map((warehouse) => (
                                    <MenuItem key={warehouse._id} value={warehouse._id}>
                                      {warehouse.name}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          </>
                        )}

                        {locationType === 'vehicle' && (
                          <>
                            {vehiclesError ? (
                              <Alert severity="error">{vehiclesError?.message}</Alert>
                            ) : !vehiclesList ? (
                              <Skeleton variant="rectangular" width="100%" height={40} />
                            ) : (
                              <FormControl fullWidth>
                                <Select
                                  size="small"
                                  id="vehicle"
                                  name="vehicle"
                                  value={selectedVehicle || ''}
                                  onChange={(event) => setSelectedVehicle(event.target.value)}
                                >
                                  {vehiclesList.map((vehicle) => (
                                    <MenuItem key={vehicle._id} value={vehicle._id}>
                                      {vehicle.operator?.name || 'N/A'}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          </>
                        )}
                      </Box>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4} md={3} mt={2} textAlign={{ sm: 'right' }}>
                  <Box pr={2} pb={2}>
                    Garantía:
                  </Box>
                </Grid>
                <Grid item xs={12} sm={8} md={9} mt={2}>
                  <Box sx={{ maxWidth: { xs: 'auto', sm: 400 } }}>
                    {isLoading ? (
                      <Skeleton variant="text" sx={{ fontSize: '1rem', width: '150px' }} />
                    ) : (
                      <>
                        {!isEditing ? (
                          <Text color="black">
                            {salesMachine?.warranty 
                              ? capitalizeFirstLetter(
                                  formatTZDate(new Date(salesMachine.warranty), 'DD MMMM YYYY')
                                )
                              : 'N/A'
                            }
                          </Text>
                        ) : (
                          <DesktopDatePicker
                            label="Fecha de garantía"
                            value={warrantyDate}
                            minDate={setDateToInitial(convertDateToLocal(new Date()))}
                            onChange={(newValue) => setWarrantyDate(newValue as Date)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                size="small"
                                fullWidth
                              />
                            )}
                          />
                        )}
                      </>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4} md={3} textAlign={{ sm: 'right' }}>
                  <Box pr={2} pb={2}>
                    Fotos:
                  </Box>
                </Grid>
                <Grid item xs={12} sm={8} md={9}>
                  {isLoading ? (
                    <Skeleton variant="rectangular" width={210} height={118} />
                  ) : (
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {salesMachine?.photosUrls?.map((url, index) => (
                        <a href={url} target="_blank" rel="noopener noreferrer" key={index}>
                          <Image
                            src={url}
                            alt={`Foto ${index + 1} del equipo`}
                            width={150}
                            height={200}
                            style={{ 
                              objectFit: 'cover', 
                              borderRadius: '8px',
                              cursor: 'pointer' 
                            }}
                          />
                        </a>
                      ))}
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default SalesMachineInfoTab;