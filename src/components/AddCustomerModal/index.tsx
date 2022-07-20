import PropTypes from "prop-types";
import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  TextField,
  Typography,
} from "@mui/material";

import { LoadingButton } from "@mui/lab";

function AddCustomerModal(props) {
  const { handleOnClose, open } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: "" });

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: "" });
    const res = await fetch("/api/customers", {
      body: JSON.stringify({
        curp: event.target.curp.value,
        name: event.target.name.value,
        cell: event.target.cell.value,
        street: event.target.street.value,
        suburb: event.target.suburb.value,
        city: event.target.city.value,
        redidenceRef: event.target.residenceRef.value,
        nameRef: event.target.nameRef.value,
        telRef: event.target.telRef.value,
        maps: event.target.maps.value,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const response = await res.json();
    setIsLoading(false);
    if ((res.status === 200 || res.status === 201) && response.ok) {
      handleSavedCustomer();
    } else {
      handleErrorOnSave(response.message);
    }
  }
  const handleClose = () => {
    setIsLoading(false);
    handleOnClose(false);
  };
  const handleSavedCustomer = () => {
    handleOnClose(true);
  };

  const handleErrorOnSave = (msg) => {
    setHasError({ error: true, msg})
  };

  return (
    <Dialog open={open} fullWidth={true} scroll={"body"}>
      <Card>
        <CardHeader title="Ingrese datos de nuevo cliente" />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <Grid
              container
              direction="column"
              justifyContent="center"
              spacing={2}
              maxWidth="lg"
            >
              <Grid item lg={12}>
                <TextField
                  required
                  id="curp"
                  name="curp"
                  label="CURP"
                  fullWidth={true}
                />
              </Grid>
              <Grid item lg={12}>
                <TextField
                  required
                  id="name"
                  name="name"
                  label="Nombre"
                  fullWidth={true}
                />
              </Grid>
              <Grid item lg={12}>
                <TextField
                  required
                  id="cell"
                  name="cell"
                  label="Celular"
                  fullWidth={true}
                />
              </Grid>
              <Grid item lg={12}>
                <TextField
                  required
                  id="street"
                  name="street"
                  label="Calle"
                  fullWidth={true}
                />
              </Grid>
              <Grid item lg={12}>
                <TextField
                  required
                  id="suburb"
                  name="suburb"
                  label="Colonia"
                  fullWidth={true}
                />
              </Grid>
              <Grid item lg={12}>
                <TextField
                  required
                  id="city"
                  name="city"
                  label="Ciudad"
                  fullWidth={true}
                />
              </Grid>
              <Grid item lg={12}>
                <TextField
                  required
                  id="residenceRef"
                  name="residenceRef"
                  label="Domicilio Referencia"
                  fullWidth={true}
                />
              </Grid>
              <Grid item lg={12}>
                <TextField
                  required
                  id="nameRef"
                  name="nameRef"
                  label="Nombre Referencia"
                  fullWidth={true}
                />
              </Grid>
              <Grid item lg={12}>
                <TextField
                  required
                  id="telRef"
                  name="telRef"
                  label="Teléfono Referencia"
                  fullWidth={true}
                />
              </Grid>
              <Grid item lg={12}>
                <TextField
                  required
                  id="maps"
                  name="maps"
                  label="Maps"
                  multiline
                  maxRows={3}
                  fullWidth={true}
                />
                {hasError.error ? (
                    <Grid item>
                      <br/>
                    <Typography
                      variant="h5"
                      component="h5"
                      color="error"
                      textAlign="center"
                    >
                      {hasError.msg}
                    </Typography>
                    
                    </Grid>
                  ) : null}
              </Grid>

              <Grid item lg={12}>
                <Grid
                  container
                  alignItems={"right"}
                  direction="row"
                  justifyContent="right"
                  spacing={2}
                >
                  <Grid item>
                    <Button
                      size="large"
                      variant="outlined"
                      onClick={() => handleClose()}
                    >
                      Cancelar
                    </Button>
                  </Grid>
                  <Grid item>
                    <LoadingButton
                      type="submit"
                      loading={isLoading}
                      size="large"
                      variant="contained"
                    >
                      Guardar
                    </LoadingButton>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Dialog>
  );
}

AddCustomerModal.propTypes = {
  handleOnClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  selectedValue: PropTypes.string.isRequired,
};

export default AddCustomerModal;
