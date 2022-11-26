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
import { TITLES_MAP } from "../../../lib/consts/OBJ_CONTS";

export default function ImagesModal({ open, title, text, imagesObj, onClose }) {
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
                <a
                  key={key}
                  href={imagesObj[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ImageListItem key={key} cols={2} rows={2}>
                    <Image
                      src={imagesObj[key]}
                      alt="alt"
                      width={"100%"}
                      height={400}
                    />
                    <ImageListItemBar
                      title={TITLES_MAP[key]}
                      position="top"
                      actionPosition="left"
                    />
                  </ImageListItem>
                </a>
              );
            })}
          </ImageList>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
