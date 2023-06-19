import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { LoadingButton } from "@mui/lab";
import { asignOperator } from "lib/client/operatorsFetch";
import { useState } from "react";
import {
  Alert,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { getFetcher, useGetOperators } from "pages/api/useRequest";

export default function AlertDialog({
  open,
  type,
  id,
  currentOperator,
  onAccept,
  onCancel,
}) {
  const { operatorsList, operatorsError } = useGetOperators(getFetcher);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedOperator, setSelectedOperator] = useState(
    currentOperator || null
  );
  const [hasErrorSubmitting, setHasErrorSubmitting] = useState<any>({
    error: false,
    msg: "",
  });
  const handleOnSubmit = async () => {
    setIsSubmitting(true);
    const result = await asignOperator({
      type,
      id,
      selectedOperator
    });
    setIsSubmitting(false);
    if (!result.error) {
      onAccept();
    } else {
      setHasErrorSubmitting({ error: true, msg: result.msg });
    }
  };
  return (
    <div>
      <Dialog
        open={open}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Asignar/Cambiar Operador
        </DialogTitle>
        <DialogContent>
          <Grid container marginTop={1}>
            <Grid item lg={12} md={12} xs={12}>
              {operatorsError ? (
                <Alert severity="error">{operatorsError?.message}</Alert>
              ) : (
                <FormControl fullWidth>
                  <InputLabel id="vehicle-id">Operador</InputLabel>
                  {operatorsList && (
                    <Select
                      labelId="vehicle-id"
                      id="vehicle"
                      name="vehicle"
                      label="Operador"
                      required
                      autoComplete="off"
                      value={selectedOperator || ""}
                      onChange={(event) => {
                        setSelectedOperator(event.target.value);
                      }}
                    >
                      {operatorsList
                        ? operatorsList.map((operator) => (
                            <MenuItem key={operator._id} value={operator._id}>
                              {operator.name}
                            </MenuItem>
                          ))
                        : null}
                    </Select>
                  )}
                </FormControl>
              )}
            </Grid>
            {hasErrorSubmitting.error && (
              <>
                <Grid item xs={12} sm={12} lg={12} />
                <Grid item lg={6} m={1}>
                  <Alert severity="error">{hasErrorSubmitting.msg}</Alert>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          {!isSubmitting && (
            <Button variant="outlined" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <LoadingButton
            disabled={!selectedOperator || isSubmitting}
            loading={isSubmitting}
            color="success"
            variant="contained"
            onClick={handleOnSubmit}
          >
            Guardar
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
