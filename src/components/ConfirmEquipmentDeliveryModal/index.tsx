import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography
} from "@mui/material";
import { LoadingButton } from "@mui/lab";

interface Props {
  open: boolean;
  saleNum?: number | string;
  machineInfo: string;
  serialNumber?: string;
  customerName?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmEquipmentDeliverModal({
  open,
  machineInfo,
  serialNumber,
  customerName,
  loading = false,
  onConfirm,
  onCancel
}: Props) {
  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        ⚠️ Confirmar entrega de equipo
      </DialogTitle>
      <DialogContent>
        <Box
            sx={{
            bgcolor: "#f5f7fa",
            borderRadius: 2,
            p: 2,
            mb: 2
            }}
        >
            <Typography variant="caption" color="text.primary" fontWeight={700}>
                EQUIPO
            </Typography>
            <Typography fontWeight={500}>
                {machineInfo}
            </Typography>
            <Typography
                variant="caption"
                color="text.primary"
                fontWeight={700}
                sx={{ mt: 1, display: "block" }}
            >
                SERIE
            </Typography>
            <Typography fontWeight={500}>
                {serialNumber || "Sin número de serie"}
            </Typography>
            <Typography
                variant="caption"
                color="text.primary"
                fontWeight={700}
                sx={{ mt: 1, display: "block" }}
            >
                CLIENTE
            </Typography>
            <Typography fontWeight={500}>
                {customerName || "N/A"}
            </Typography>
        </Box>
        <DialogContentText>
            ¿Confirma que el equipo es el correcto para este cliente?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          disabled={loading}
          onClick={onCancel}
          >
          Cancelar
        </Button>
        <LoadingButton
          loading={loading}
          variant="contained"
          onClick={onConfirm}
        >
          Confirmar entrega
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}