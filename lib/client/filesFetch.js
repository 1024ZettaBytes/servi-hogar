import axios from "axios";
import { ROUTES } from "../consts/API_URL_CONST";

export async function updateFiles(attachment, completeData) {
    try {
      const URL = ROUTES.ALL_FILES_API;
      const json = JSON.stringify(completeData);
      const data = new FormData();
      data.append("body", json);
      if (attachment) {
        Object.keys(attachment).forEach((key) => {
          data.append(key, attachment[key].file);
        });
      }
      const res = await axios.post(URL, data, {
        headers: {
          Accept: "application/json ,text/plain, */*",
          "Content-Type": "multipart/form-data",
        },
      });
      return { error: false, msg: res.data.msg };
    } catch (err) {
      return {
        error: true,
        msg:
          err?.response?.data?.errorMsg ||
          "Error al actualizar los archivos. Por favor intente de nuevo.",
      };
    }
  }