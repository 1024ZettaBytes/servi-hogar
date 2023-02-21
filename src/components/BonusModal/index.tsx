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
  Alert,
  TextField,
  InputAdornment,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { addBonusAPI } from "../../../lib/client/rentsFetch";
import { addDaysToDate, capitalizeFirstLetter, formatTZDate } from "lib/client/utils";

function BonusModal(props) {
  const { handleOnClose, open, rent } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [hasError, setHasError] = useState({ error: false, msg: "" });

  const saveButtonEnabled = selectedDays > 0 && reason.trim().length > 0;

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: "" });
    const result = await addBonusAPI({
      rentId: rent._id,
      selectedDays,
      reason,
    });
    setIsLoading(false);
    if (!result.error) {
      handleUpdatedDelivery(result.msg);
    } else {
      handleErrorOnSave(result.msg);
    }
  }
  const handleClose = () => {
    setHasError({ error: false, msg: "" });
    setIsLoading(false);
    handleOnClose(false);
  };
  const handleUpdatedDelivery = (successMessage) => {
    handleOnClose(true, successMessage);
  };

  const handleErrorOnSave = (msg) => {
    setHasError({ error: true, msg });
  };

  return (
    <Dialog open={open} maxWidth="xs" scroll={"body"}>
      <Card>
        <CardHeader title="Bonificar" />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <Grid container spacing={1}>
              <Grid item lg={4} sm={6} xs={6}>
                <TextField
                  label={"Agregar:"}
                  type="number"
                  fullWidth
                  value={selectedDays}
                  variant="outlined"
                  size="small"
                  autoFocus
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="start">día(s)</InputAdornment>
                    ),
                    inputProps: {
                      min: 0,
                      style: { textAlign: "center" },
                    },
                  }}
                  onChange={(event) => {
                    setSelectedDays(Number(event.target.value));
                  }}
                />
              </Grid>
              <Grid item lg={12} sm={12} xs={12}>
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
                  fullWidth={true}
                />
              </Grid>
              {selectedDays > 0 && (
                <>
                  <Grid item lg={7} />
                  <Grid
                    item
                    xs={12}
                    sm={12}
                    lg={5}
                    mt={1}
                    sx={{ textAlign: { lg: "center" } }}
                  >
                    <Box>
                      <Typography gutterBottom variant="h5">
                        Nueva fecha de pago
                      </Typography>
                      <Typography color="black" gutterBottom>
                        {capitalizeFirstLetter(
                          formatTZDate(
                            addDaysToDate(
                              new Date(rent?.endDate),
                              selectedDays
                            ),
                            "MMM DD YYYY"
                          )
                        )}
                      </Typography>
                    </Box>
                  </Grid>
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

              <Grid item direction="column" justifyContent="center" lg={12}>
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
                      disabled={!saveButtonEnabled}
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

BonusModal.propTypes = {
  handleOnClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  rent: PropTypes.object.isRequired,
};

export default BonusModal;
