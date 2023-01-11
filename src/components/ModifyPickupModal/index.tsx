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
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import OperationTime from "../../../pages/renta-rapida/OperationTime";
import { updatePickupTime } from "../../../lib/client/pickupsFetch";
import { dateDiffInDays } from "lib/client/utils";

function ModifyPickupModal(props) {
  const { handleOnClose, open, pickupToEdit } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [pickupTime, setPickupTime] = useState({
    date: new Date(pickupToEdit.date),
    timeOption: pickupToEdit.timeOption,
    fromTime: new Date(pickupToEdit.fromTime),
    endTime: new Date(pickupToEdit.endTime),
  });
  const [hasError, setHasError] = useState({ error: false, msg: "" });

  const saveButtonEnabled =
    pickupTime.timeOption === "any" ||
    (pickupTime.date &&
      dateDiffInDays(new Date(), new Date(pickupTime.date)) >= 0 &&
      pickupTime.fromTime &&
      pickupTime.endTime &&
      new Date(pickupTime.fromTime).getTime() <=
        new Date(pickupTime.endTime).getTime());

  const onChangeTime = (id, value) => {
    if (
      (id === "fromTime" || id === "endTime") &&
      value.toString() === "Invalid Date"
    ) {
      value = null;
    }

    setPickupTime({ ...pickupTime, [id]: value });
  };
  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: "" });
    const result = await updatePickupTime({
      pickupId: pickupToEdit._id,
      pickupTime,
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
    <Dialog open={open} fullWidth={true} scroll={"body"}>
      <Card>
        <CardHeader title="Modificar horario de recolección" />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <OperationTime
              fullWidth
              date={pickupTime.date}
              minDate={new Date()}
              timeOption={pickupTime.timeOption}
              fromTime={pickupTime.fromTime}
              endTime={pickupTime.endTime}
              onChangeTime={onChangeTime}
            />
            <Grid
              container
              direction="column"
              justifyContent="center"
              spacing={2}
              maxWidth="lg"
            >
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

ModifyPickupModal.propTypes = {
  handleOnClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  pickupToEdit: PropTypes.object.isRequired,
};

export default ModifyPickupModal;
