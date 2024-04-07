import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { LoadingButton } from "@mui/lab";
import { Alert, Grid, Typography } from "@mui/material";
import { useState } from "react";
import Image from "next/image";
import { MuiFileInput } from "mui-file-input";

export default function ConfirmWithFileModal({
  open,
  title,
  text,
  isLoading,
  hasErrorSubmitting,
  onAccept,
  onCancel,
}) {
  const [attached, setAttached] = useState<any>({
    voucher: { file: null, url: null },
  });
  const [badFormat, setBadFormat] = useState<any>({
    voucher: false,
  });
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
          <Grid container marginTop={1}>
            <Grid item xs={12} sm={12} lg={12} />
            {attached.voucher?.url &&
              !attached.voucher.file.name.includes("pdf") && (
                <Grid item lg={12} m={1}>
                  <Image
                    src={attached.voucher.url}
                    alt="Comprobante de pago"
                    width={200}
                    height={300}
                  />
                </Grid>
              )}
            <Grid item lg={6} m={1}>
              <MuiFileInput
                required
                placeholder={"No seleccionada"}
                label={"Foto de comprobante"}
                value={attached.voucher?.file}
                onChange={(file) => {
                  if (
                    file &&
                    !file.type.includes("image/") &&
                    !file.type.includes("/pdf")
                  ) {
                    setBadFormat({
                      ...badFormat,
                      voucher: true,
                    });
                    setAttached({
                      ...attached,
                      voucher: {
                        ...attached.voucher,
                        file: null,
                        url: null,
                        error: true,
                      },
                    });
                    return;
                  }
                  const url = file ? URL.createObjectURL(file) : null;
                  setAttached({
                    ...attached,
                    voucher: { file, url, error: false },
                  });
                  setBadFormat({
                    ...badFormat,
                    voucher: false,
                  });
                }}
              />
            </Grid>
            <Grid item lg={12} />
            {attached.voucher?.error && (
              <Grid item lg={4} m={1}>
                <Typography color="error">
                  Seleccione un archivo válido(*.jpg, *.jpeg, *.png).
                </Typography>
              </Grid>
            )}
            {hasErrorSubmitting && (
              <Grid item lg={12} m={1}>
                <Alert severity="error">{hasErrorSubmitting.msg}</Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          {!isLoading && (
            <Button variant="outlined" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <LoadingButton
            disabled={attached?.voucher?.file === null || badFormat?.voucher}
            loading={isLoading}
            color="error"
            variant="contained"
            onClick={() => onAccept(attached?.voucher?.file)}
          >
            Continuar
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
