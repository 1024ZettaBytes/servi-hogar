import { useState } from 'react';
import {
  Card,
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useSnackbar } from 'notistack';
import {
  getFetcher,
  useGetRecolectadasReparacionExterna,
  useGetAllWarehousesOverview
} from '../../pages/api/useRequest';
import { receiveExternalRepairInWarehouse } from '../../lib/client/externalRepairsFetch';

function fmt(d) {
  return d ? new Date(d).toLocaleDateString() : '—';
}

function TablaRecolectadasReparacionExterna({ userRole }) {
  const { enqueueSnackbar } = useSnackbar();
  const { recolectadasReparacionExterna, isLoadingRecolectadasReparacionExterna } =
    useGetRecolectadasReparacionExterna(getFetcher);
  const { warehousesList } = useGetAllWarehousesOverview(
    ['ADMIN', 'AUX', 'TEC'].includes(userRole) ? getFetcher : () => null
  );

  const [target, setTarget] = useState<any>(null);
  const [warehouseId, setWarehouseId] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  const list = recolectadasReparacionExterna || [];

  const submitReceive = async () => {
    if (!warehouseId) return;
    setIsWorking(true);
    const result = await receiveExternalRepairInWarehouse(
      target._id,
      warehouseId
    );
    setIsWorking(false);
    enqueueSnackbar(result.msg, {
      variant: result.error ? 'error' : 'success',
      anchorOrigin: { vertical: 'top', horizontal: 'center' },
      autoHideDuration: 3000
    });
    if (!result.error) {
      setTarget(null);
      setWarehouseId('');
    }
  };

  return (
    <Card>
      <CardHeader title="Reparaciones externas recolectadas" />
      <Divider />
      {isLoadingRecolectadasReparacionExterna ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Folio</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Marca</TableCell>
              <TableCell>Chofer</TableCell>
              <TableCell>Recolectada</TableCell>
              <TableCell align="right">Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((r) => (
              <TableRow hover key={r._id}>
                <TableCell>#{r.totalNumber}</TableCell>
                <TableCell>{r.customerName}</TableCell>
                <TableCell>{r.brand}</TableCell>
                <TableCell>{r.pickupAssignedTo?.name || '—'}</TableCell>
                <TableCell>{fmt(r.pickupCompletedAt)}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setTarget(r);
                      setWarehouseId('');
                    }}
                  >
                    Bajar en bodega
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      )}
      {!isLoadingRecolectadasReparacionExterna && list.length === 0 && (
        <Box p={3}>
          <Typography align="center" color="text.secondary">
            No hay reparaciones externas recolectadas.
          </Typography>
        </Box>
      )}

      <Dialog open={!!target} onClose={() => setTarget(null)} fullWidth>
        <DialogTitle>
          Bajar en bodega — #{target?.totalNumber} {target?.customerName}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="wh-label">Bodega</InputLabel>
            <Select
              labelId="wh-label"
              label="Bodega"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              {(warehousesList || []).map((w) => (
                <MenuItem key={w._id} value={w._id}>
                  {w.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTarget(null)}>Cancelar</Button>
          <LoadingButton
            variant="contained"
            loading={isWorking}
            disabled={!warehouseId}
            onClick={submitReceive}
          >
            Bajar en bodega
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

export default TablaRecolectadasReparacionExterna;
