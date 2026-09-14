import { FC } from 'react';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';

// Un equipo que regresa de una venta (CAMBIO_VENTA) recibe un nuevo folio de
// almacén (`entryNumber`) al reingresar, pero conserva `originalSaleMachineNum`
// (el número con el que se identificaba en venta). Mostramos el número de
// venta como principal -para no romper la referencia que ya conoce el equipo-
// y el folio de reingreso como un chip aparte, claramente diferenciado, en
// vez de solo texto pequeño que se confundía con un número de serie/folio más.
export const getDisplayMachineNum = (machine: any) =>
  machine?.originalSaleMachineNum ?? machine?.entryNumber;

interface MachineEntryNumberCellProps {
  machine: any;
  fallback?: string;
  suffix?: string;
}

const MachineEntryNumberCell: FC<MachineEntryNumberCellProps> = ({
  machine,
  fallback = '-',
  suffix = ''
}) => {
  const displayNum = getDisplayMachineNum(machine);
  const isReingreso = !!machine?.originalSaleMachineNum;

  return (
    <Box>
      <Tooltip
          title={`Este equipo regresó de una venta y se le asignó el folio de almacén #${machine.entryNumber} al reingresar`}
          arrow
        >
        <Typography variant="body1" fontWeight="bold" color="text.primary" noWrap>
          {isReingreso ?
          <Chip
            icon={<ReplayIcon fontSize="small" />}
            label={`Reingreso venta #${displayNum}`}
            size="small"
            color="secondary"
            variant="outlined"
            sx={{ mt: 0.5, maxWidth: '100%' }}
          /> :displayNum ? `#${displayNum}${suffix}` : fallback}
        </Typography>
      </Tooltip>
    </Box>
  );
};

export default MachineEntryNumberCell;
