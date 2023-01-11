import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { LoadingButton } from "@mui/lab";
import { TextField } from "@mui/material";
import { useState } from "react";

export default function AlertDialog({
  open,
  title,
  text,
  isLoading,
  requiredReason,
  onAccept,
  onCancel,
}) {
  const [reason, setReason] = useState("");
  return (
    <div>
      <Dialog
        open={open}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {text}
          </DialogContentText>
          {requiredReason && (
            <TextField
              sx={{ marginTop: 2 }}
              autoComplete="off"
              required
              label={"Razón"}
              multiline
              rows={3}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
              }}
              autoFocus
              fullWidth={true}
            />
          )}
        </DialogContent>
        <DialogActions>
          {!isLoading && (
            <Button variant="outlined" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <LoadingButton
            disabled={requiredReason && reason.trim().length <= 0}
            loading={isLoading}
            color="error"
            variant="contained"
            onClick={requiredReason ? () => onAccept(reason) : onAccept}
          >
            Continuar
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
