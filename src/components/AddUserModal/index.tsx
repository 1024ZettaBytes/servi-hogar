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
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { saveUser } from "../../../lib/client/usersFetch";
function AddUserModal(props) {
  const { handleOnClose, open, rolesList, tecList = [] } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: "" });
  const [selectedRole, setSelectedRole] = useState<string>(null);
  const [isReplacement, setIsReplacement] = useState(false);
  const [replacedTecId, setReplacedTecId] = useState<string>(null);

  const isTecRole = selectedRole === "TEC";

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: "" });
    const userData: any = {
      id: event.target.id.value,
      name: event.target.name.value,
      password: event.target.password.value,
      role: selectedRole,
    };
    if (isTecRole && isReplacement && replacedTecId) {
      userData.replacedTechnicianId = replacedTecId;
    }
    const result = await saveUser(userData);
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
              {isTecRole && (
                <>
                  <Grid item lg={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isReplacement}
                          onChange={(e) => {
                            setIsReplacement(e.target.checked);
                            if (!e.target.checked) setReplacedTecId(null);
                          }}
                        />
                      }
                      label="¿Reemplaza a otro técnico?"
                    />
                  </Grid>
                  {isReplacement && (
                    <Grid item lg={12}>
                      <FormControl fullWidth>
                        <InputLabel id="replace-tec-label">
                          Técnico a reemplazar
                        </InputLabel>
                        <Select
                          labelId="replace-tec-label"
                          id="replaceTec"
                          name="replaceTec"
                          label="Técnico a reemplazar"
                          required
                          value={replacedTecId || ""}
                          onChange={(event) =>
                            setReplacedTecId(event.target.value)
                          }
                        >
                          {tecList.map((tec) => (
                            <MenuItem key={tec._id} value={tec._id}>
                              {tec.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {isReplacement && replacedTecId && (
                        <Alert severity="info" sx={{ mt: 1 }}>
                          Las herramientas del técnico seleccionado se asignarán
                          automáticamente al nuevo técnico. Quedará pendiente la
                          verificación con foto por parte de los auxiliares.
                          <strong>
                            {" "}
                            Todos los auxiliares serán bloqueados hasta que se
                            realice la verificación.
                          </strong>
                        </Alert>
                      )}
                    </Grid>
                  )}
                </>
              )}
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
  tecList: PropTypes.array,
};

export default AddUserModal;
