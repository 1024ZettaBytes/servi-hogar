import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { TextField } from "@mui/material";

export default function FormatModal({
  open,
  title,
  text,
  formatText,
  onAccept,
}) {
  return (
    <div>
      <Dialog
        open={open}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        fullWidth
      >
        <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {text}
          </DialogContentText>
          <TextField
            autoComplete="off"
            required
            id="format"
            name="format"
            label=""
            value={formatText}
            multiline
            maxRows={10}
            fullWidth={true}
          />
        </DialogContent>
        <DialogActions>
          <Button
            color="primary"
            variant="contained"
            onClick={onAccept}
            autoFocus
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
