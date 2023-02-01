import * as React from "react";
import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import { useSnackbar } from "notistack";
import { Alert, Grid, TextField } from "@mui/material";
import { LoadingButton } from "@mui/lab";

export default function FormatModal({
  open,
  selectedId,
  title,
  text,
  textColor,
  formatText,
  onAccept,
  onSubmitAction,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<any>({ error: false, msg: "" });
  async function submitHandler(event) {
    event?.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: "" });
    const result = await onSubmitAction({
      id: selectedId,
      wasSent: true,
    });
    setIsLoading(false);
    if (!result.error) {
      enqueueSnackbar(result.msg, {
        variant: "success",
        anchorOrigin: {
          vertical: "top",
          horizontal: "center",
        },
        autoHideDuration: 1500,
      });
      onAccept();
    } else {
      setHasError({ error: true, msg: result.msg });
    }
  }
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
          <DialogContentText
            id="alert-dialog-description"
            color={textColor}
            fontWeight="bold"
          >
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
          {hasError.error && <Grid item mt={1}><Alert severity="error">{hasError?.msg}</Alert></Grid>}
        </DialogContent>
        <DialogActions>
          <LoadingButton
            disabled={text === "ENVIADO"}
            endIcon={<MarkEmailReadIcon />}
            color="success"
            variant="contained"
            onClick={submitHandler}
            loading={isLoading}
            autoFocus
          >
            Enviado
          </LoadingButton>
          <Button
            disabled={isLoading}
            color="primary"
            variant="outlined"
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
