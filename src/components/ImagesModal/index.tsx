import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import ImageListItemBar from "@mui/material/ImageListItemBar";
import Image from "next/image";
import { useSnackbar } from "notistack";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import DisabledByDefaultIcon from "@mui/icons-material/DisabledByDefault";
import { updateFiles } from "../../../lib/client/filesFetch";
import { TITLES_MAP } from "../../../lib/consts/OBJ_CONTS";
import { MuiFileInput } from "mui-file-input";
import { LoadingButton } from "@mui/lab";
import { Alert} from "@mui/material";

export default function ImagesModal({
  open,
  title,
  text,
  imagesObj,
  onClose,
  canEdit=false,
}) {

  const { enqueueSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [hasErrorSubmitting, setHasErrorSubmitting] = React.useState<any>({
    error: false,
    msg: "",
  });
  const [timestamp] = React.useState<string>(
    Date.now().toString()
  );
  const [attached, setAttached] = React.useState<any>({
    contract: { file: null, url: null },
    front: { file: null, url: null },
    board: { file: null, url: null },
    tag: { file: null, url: null },
  });

  const [isEditting, setIsEditting] = React.useState<any>({
    contract: false,
    front: false,
    board: false,
    tag: false,
  });
  const [badFormat, setBadFormat] = React.useState<any>({
    contract: false,
    front: false,
    board: false,
    tag: false,
  });
  const hasChanges = Object.values(isEditting).some((val) => val);
  const isValid = Object.keys(isEditting).every((key) =>
    isEditting[key] ? attached[key].file : true
  );
  const onSubmitChanges = async () => {
    setIsSubmitting(true);
    let files = {};
    let data = {};
    Object.keys(attached).forEach((key) => {
      if (attached[key].file !== null) {
        files[key] = { ...attached[key] };
        data[key] = { url: imagesObj[key] };
      }
    });
    const result = await updateFiles(files, data);
    setIsSubmitting(false);
    if (!result.error) {
      enqueueSnackbar("¡Fotos actualizadas con éxito!", {
        variant: "success",
        anchorOrigin: {
          vertical: "top",
          horizontal: "center",
        },
        autoHideDuration: 1500,
      });
      onClose();
    } else {
      setHasErrorSubmitting({ error: true, msg: "Ocurrió un error al actualizar las fotos. Por favor intente de nuevo." });
    }
  };
  return (
    <div>
      <Dialog
        open={open}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" sx={{ fontWeight: "bold" }}>
          {title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {text}
          </DialogContentText>
          <ImageList
            sx={{
              width: 500,
              height: 450,
              // Promote the list into its own layer in Chrome. This costs memory, but helps keeping high FPS.
              transform: "translateZ(0)",
            }}
            rowHeight={200}
            gap={1}
          >
            {Object.keys(imagesObj).map((key) => {
              return (
                <>
                  <a key={"a-" + key}>
                    <ImageListItem key={key} cols={2} rows={2}>
                      <Image
                        key={"img-" + key}
                        src={
                          attached[key].url ||
                          imagesObj[key] + `?time=${timestamp}`
                        }
                        alt="alt"
                        width={"100%"}
                        height={400}
                        onClick={() => {
                          if (!isEditting[key])
                            window.open(imagesObj[key], "_blank");
                        }}
                        style={{
                          cursor: !isEditting[key] ? "pointer" : "not-allowed",
                        }}
                        blurDataURL="/"
                        placeholder="blur"
                      />
                      <ImageListItemBar
                        key={"bar-" + key}
                        title={TITLES_MAP[key]}
                        position="top"
                        actionPosition="right"
                        actionIcon={
                          canEdit ? (
                            !isEditting[key] ? (
                              <BorderColorIcon
                                sx={{ cursor: "pointer" }}
                                onClick={() => {
                                  setIsEditting({ ...isEditting, [key]: true });
                                }}
                              />
                            ) : (
                              <DisabledByDefaultIcon
                                sx={{ cursor: "pointer" }}
                                onClick={() => {
                                  setIsEditting({
                                    ...isEditting,
                                    [key]: false,
                                  });
                                  setAttached({
                                    ...attached,
                                    [key]: { file: null, url: null },
                                  });
                                }}
                              />
                            )
                          ) : null
                        }
                      />
                       <br/>
                      {isEditting[key] && (
                       
                        <MuiFileInput
                          key={"file" + key}
                          required={!attached[key].file}
                          placeholder={"No seleccionada"}
                          label={TITLES_MAP[key]}
                          value={attached[key]?.file}
                          onChange={(file) => {
                            if (
                              file &&
                              !file.type.includes("image/") &&
                              !file.type.includes("/pdf")
                            ) {
                              setBadFormat({
                                ...badFormat,
                                [key]: true,
                              });
                              setAttached({
                                ...attached,
                                [key]: {
                                  ...attached[key],
                                  error: true,
                                },
                              });
                              return;
                            }
                            const url = file ? URL.createObjectURL(file) : null;
                            setAttached({
                              ...attached,
                              [key]: { file, url, error: false },
                            });
                          }}
                        />
                      )}
                    </ImageListItem>
                  </a>
                </>
              );
            })}
          </ImageList>
          {hasErrorSubmitting.error && (
            <Alert severity="error">{hasErrorSubmitting.msg}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          {canEdit && hasChanges && (
            <LoadingButton
              variant="contained"
              onClick={onSubmitChanges}
              disabled={!isValid}
              loading={isSubmitting}
            >
              Guardar
            </LoadingButton>
          )}

          <Button variant="outlined" onClick={onClose}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
