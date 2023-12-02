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
  InputLabel,
  TextField,
  Typography,
  Select,
  FormControl,
  MenuItem,
  Alert,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { saveUser } from "../../../lib/client/usersFetch";
function AddUserModal(props) {
  const { handleOnClose, open, rolesList } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: "" });
  const [selectedRole, setSelectedRole] = useState<string>(null );


  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: "" });
    const result = await saveUser({
      id: event.target.id.value,
      name: event.target.name.value,
      password: event.target.password.value,
      role: selectedRole,
    });
    setIsLoading(false);
    if (!result.error) {
      handleSavedCustomer(result.msg);
    } else {
      handleErrorOnSave(result.msg);
    }
  }
  const handleClose = () => {
    setHasError({ error: false, msg: "" });
    setIsLoading(false);
    handleOnClose(false);
  };
  const handleSavedCustomer = (successMessage) => {
    handleOnClose(true, successMessage);
  };

  const handleErrorOnSave = (msg) => {
    setHasError({ error: true, msg });
  };

  return (
    <Dialog open={open} fullWidth={true} scroll={"body"}>
      <Card>
        <CardHeader title="Ingrese datos de nuevo usuario" />
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
                <Typography
                  variant="h5"
                  component="h5"
                  color="secondary"
                  textAlign="left"
                  fontWeight="bold"
                >
                  Nombre y Apellido
                </Typography>
              </Grid>
              <Grid item lg={12}>
                <TextField
                  autoComplete="off"
                  required
                  id="name"
                  name="name"
                  label=""
                  fullWidth={true}
                />
              </Grid>
              <Grid item lg={12}>
                <Typography
                  variant="h5"
                  component="h5"
                  color="secondary"
                  textAlign="left"
                  fontWeight="bold"
                >
                  ID
                </Typography>
              </Grid>
              <Grid item lg={12}>
                <TextField
                  autoComplete="off"
                  required
                  id="id"
                  name="id"
                  label=""
                  fullWidth={true}
                />
              </Grid>
              <Grid item lg={12}>
                <Typography
                  variant="h5"
                  component="h5"
                  color="secondary"
                  textAlign="left"
                  fontWeight="bold"
                >
                  Contraseña
                </Typography>
                </Grid>
                <Grid item lg={12}>
                <TextField
                  autoComplete="off"
                  required
                  id="password"
                  name="password"
                  label=""
                  fullWidth={true}
                  InputProps={{
                    inputProps: {
                      min: 7,
                    },}}
                />
              </Grid>
              <Grid item lg={12}>
                <Typography
                  variant="h5"
                  component="h5"
                  color="secondary"
                  textAlign="left"
                  fontWeight="bold"
                >
                  Rol
                </Typography>
                </Grid>
              <Grid item lg={12}>
                <FormControl fullWidth>
                  <InputLabel id="rol-id"></InputLabel>
                  <Select
                    labelId="rol-id"
                    id="rol"
                    name="rol"
                    label=""
                    required
                    autoComplete="off"
                    value={selectedRole || ""}
                    onChange={(event) =>
                      setSelectedRole(event.target.value)
                    }
                  >
                    {rolesList
                      ? rolesList.map((city) => (
                          <MenuItem key={city.id} value={city.id}>
                            {city.name}
                          </MenuItem>
                        ))
                      : null}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item lg={12}>
                {hasError.error ? (
                  <Grid item>
                    <br />
                    <Alert severity="error">{hasError?.msg}</Alert>
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

AddUserModal.propTypes = {
  handleOnClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  rolesList: PropTypes.array.isRequired,
};

export default AddUserModal;
