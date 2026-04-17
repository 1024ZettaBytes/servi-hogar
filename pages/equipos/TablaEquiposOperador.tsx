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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tabs,
  Tab,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import {
  loadMachineToVehicle,
  returnMachineToWarehouse
} from '../../lib/client/machinesFetch';
import { useSnackbar } from 'notistack';

interface TablaEquiposOperadorProps {
  listoMachines: any[];
  vehiMachines: any[];
  recMachines: any[];
  warehousesList: any[];
  nextMachine: number | null;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const TablaEquiposOperador: FC<TablaEquiposOperadorProps> = ({
  listoMachines,
  vehiMachines,
  recMachines,
  warehousesList,
  nextMachine
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Return to warehouse dialog state
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [machineToReturn, setMachineToReturn] = useState<any>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (machine: any) => {
    setSelectedMachine(machine);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedMachine(null);
  };

  const handleLoadToVehicle = async () => {
    if (!selectedMachine) return;
    setIsSubmitting(true);
    const result = await loadMachineToVehicle({
      machineId: selectedMachine._id
    });
    setIsSubmitting(false);
    if (!result.error) {
      enqueueSnackbar(result.msg, {
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 1500
      });
      handleCloseDialog();
    } else {
      enqueueSnackbar(result.msg, {
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 3000
      });
    }
  };
  const getSortedListoMachines = () => {
    const nextMachineObj = listoMachines.find(
      (m) => m.machineNum === nextMachine
    );
    if (!nextMachineObj) return listoMachines;
    let newArray = [...listoMachines]
      .filter((m) => m.machineNum !== nextMachine)
    newArray.unshift(nextMachineObj);
    return newArray;
  };

  // Return to warehouse handlers
  const handleOpenReturnDialog = (machine: any) => {
    setMachineToReturn(machine);
    setSelectedWarehouse('');
    setReturnDialogOpen(true);
  };

  const handleCloseReturnDialog = () => {
    setReturnDialogOpen(false);
    setMachineToReturn(null);
    setSelectedWarehouse('');
  };

  const handleReturnToWarehouse = async () => {
    if (!machineToReturn || !selectedWarehouse) return;
    setIsSubmitting(true);
    const result = await returnMachineToWarehouse({
      machineId: machineToReturn._id,
      warehouseId: selectedWarehouse
    });
    setIsSubmitting(false);
    if (!result.error) {
      enqueueSnackbar(result.msg, {
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 1500
      });
      handleCloseReturnDialog();
    } else {
      enqueueSnackbar(result.msg, {
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 3000
      });
    }
  };
  const sortedListoMachines = listoMachines ? getSortedListoMachines() : [];
  return (
    <>
      <Tabs value={tabValue} onChange={handleTabChange} variant={'fullWidth'}>
        <Tab
          label={
            <Box display="flex" alignItems="center" gap={0.5}>
              Bodega
              <Chip label={sortedListoMachines?.length} size="small" color="info" />
            </Box>
          }
        />
        <Tab
          label={
            <Box display="flex" alignItems="center" gap={0.5}>
              Emplayados
              <Chip label={vehiMachines?.length} size="small" color="success" />
            </Box>
          }
        />
        <Tab
          label={
            <Box display="flex" alignItems="center" gap={0.5}>
              Recolectados
              <Chip label={recMachines?.length} size="small" color="warning" />
            </Box>
          }
        />
      </Tabs>
      <Alert severity="info" sx={{ m: 1 }}>
        {nextMachine
          ? `El siguiente equipo a cargar es el #${nextMachine}.`
          : 'No se pudo determinar el siguiente equipo a cargar.'}
      </Alert>
      <Card>
        <CardHeader title="Equipos" />
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}></Box>

        {/* Tab: Listos */}
        <TabPanel value={tabValue} index={0}>
          {sortedListoMachines?.length === 0 ? (
            <Box p={2}>
              <Alert severity="info">No hay equipos listos disponibles.</Alert>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell># Equipo</TableCell>
                    <TableCell>Marca</TableCell>
                    <TableCell>Bodega</TableCell>
                    <TableCell align="right">Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedListoMachines?.map((machine) => (
                    <TableRow hover key={machine._id}>
                      <TableCell>
                        <Typography fontWeight="bold">
                          {machine.machineNum}
                        </Typography>
                      </TableCell>
                      <TableCell>{machine.brand || '-'}</TableCell>
                      <TableCell>
                        {machine.currentWarehouse?.name || '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          startIcon={<LocalShippingIcon />}
                          onClick={() => handleOpenDialog(machine)}
                        >
                          Subir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Tab: Emplayados (VEHI) */}
        <TabPanel value={tabValue} index={1}>
          {vehiMachines?.length === 0 ? (
            <Box p={2}>
              <Alert severity="info">
                No hay equipos emplayados en tu vehículo.
              </Alert>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell># Equipo</TableCell>
                    <TableCell>Marca</TableCell>
                    <TableCell>Capacidad</TableCell>
                    <TableCell align="right">Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vehiMachines?.map((machine) => (
                    <TableRow hover key={machine._id}>
                      <TableCell>
                        <Typography fontWeight="bold">
                          {machine.machineNum}
                        </Typography>
                      </TableCell>
                      <TableCell>{machine.brand || '-'}</TableCell>
                      <TableCell>{machine.capacity}kg</TableCell>
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          size="small"
                          color="warning"
                          startIcon={<WarehouseIcon />}
                          onClick={() => handleOpenReturnDialog(machine)}
                        >
                          Regresar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Tab: Recolectados (REC) */}
        <TabPanel value={tabValue} index={2}>
          {recMachines?.length === 0 ? (
            <Box p={2}>
              <Alert severity="info">
                No hay equipos recolectados en tu vehículo.
              </Alert>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell># Equipo</TableCell>
                    <TableCell>Marca</TableCell>
                    <TableCell>Capacidad</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recMachines?.map((machine) => (
                    <TableRow hover key={machine._id}>
                      <TableCell>
                        <Typography fontWeight="bold">
                          {machine.machineNum}
                        </Typography>
                      </TableCell>
                      <TableCell>{machine.brand || '-'}</TableCell>
                      <TableCell>{machine.capacity}kg</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Card>

      {/* Dialog para confirmar subida de equipo */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Confirmar carga de equipo</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              ¡Importante!
            </Typography>
            <Typography variant="body2">
              Verifique que el equipo esté completo antes de subirlo. Si no está
              completo, NO lo suba y avise a oficina.
            </Typography>
          </Alert>
          <Typography>
            ¿Desea subir el equipo{' '}
            <strong>#{selectedMachine?.machineNum}</strong> a su vehículo?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleLoadToVehicle}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Cargando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para regresar equipo al almacén */}
      {returnDialogOpen && (
        <Dialog
          open={returnDialogOpen}
          onClose={handleCloseReturnDialog}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Regresar equipo al almacén</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>
              Seleccione el almacén al que desea regresar el equipo{' '}
              <strong>#{machineToReturn?.machineNum}</strong>:
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="warehouse-select-label">Almacén</InputLabel>
              <Select
                labelId="warehouse-select-label"
                value={selectedWarehouse}
                label="Almacén"
                onChange={(e) => setSelectedWarehouse(e.target.value as string)}
              >
                {warehousesList?.map((warehouse) => (
                  <MenuItem key={warehouse._id} value={warehouse._id}>
                    {warehouse.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseReturnDialog} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleReturnToWarehouse}
              disabled={isSubmitting || !selectedWarehouse}
            >
              {isSubmitting ? 'Procesando...' : 'Regresar'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default TablaEquiposOperador;
