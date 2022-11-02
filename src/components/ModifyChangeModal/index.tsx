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
import { updateChangeTime } from "../../../lib/client/changesFetch";
import { dateDiffInDays } from "lib/client/utils";

function ModifyChangeModal(props) {
  const { handleOnClose, open, changeToEdit } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [changeTime, setChangeTime] = useState({
    date: new Date(changeToEdit.date),
    timeOption: changeToEdit.timeOption,
    fromTime: new Date(changeToEdit.fromTime),
    endTime: new Date(changeToEdit.endTime),
  });
  const [hasError, setHasError] = useState({ error: false, msg: "" });

  const saveButtonEnabled =
    changeTime.timeOption === "any" ||
    (changeTime.date &&
      dateDiffInDays(new Date(), new Date(changeTime.date)) >= 0 &&
      changeTime.fromTime &&
      changeTime.endTime &&
      new Date(changeTime.fromTime).getTime() <=
        new Date(changeTime.endTime).getTime());

  const onChangeTime = (id, value) => {
    if (
      (id === "fromTime" || id === "endTime") &&
      value.toString() === "Invalid Date"
    ) {
      value = null;
    }

    setChangeTime({ ...changeTime, [id]: value });
  };
  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: "" });
    const result = await updateChangeTime({
      changeId: changeToEdit._id,
      changeTime,
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
              date={changeTime.date}
              minDate={new Date()}
              timeOption={changeTime.timeOption}
              fromTime={changeTime.fromTime}
              endTime={changeTime.endTime}
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

ModifyChangeModal.propTypes = {
  handleOnClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  changeToEdit: PropTypes.object.isRequired,
};

export default ModifyChangeModal;
