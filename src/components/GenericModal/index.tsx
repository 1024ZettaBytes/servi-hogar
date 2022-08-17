import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { LoadingButton } from '@mui/lab';

export default function AlertDialog({open,title,text,isLoading, onAccept, onCancel}) {

  return (
    <div>
      <Dialog
        open={open}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {text}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          {!isLoading && <Button  variant="outlined" onClick={onCancel}>Cancelar</Button>}
          <LoadingButton loading={isLoading} color="error" variant="contained" onClick={onAccept} autoFocus>
            Continuar
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
