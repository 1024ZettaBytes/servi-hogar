import { uploadFile } from "../cloud";
import { getFileFromUrl } from "../client/utils";

export async function updateFilesData(urls, files) {
  try {
    for (const [key] of Object.entries(files)) {
      const fileName = getFileFromUrl(urls[key].url);
      console.log(key, ": ", fileName);
      await uploadFile(files[key].filepath, fileName);
    }
  } catch (e) {
    console.error(e);
    throw new Error(
      "Ocurrió un error al actualizar los archivos. Intente de nuevo."
    );
  }
}
