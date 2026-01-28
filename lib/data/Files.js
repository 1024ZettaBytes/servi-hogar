import { uploadFile } from "../cloud";
import { getFilePathFromUrl } from "../client/utils";

export async function updateFilesData(urls, files) {
  try {
    for (const [key] of Object.entries(files)) {
      const fileName = getFilePathFromUrl(urls[key].url);
      await uploadFile(files[key].filepath, fileName);
    }
  } catch (e) {
    console.error('❌ Error in updateFilesData:', e);
    throw new Error(
      "Ocurrió un error al actualizar los archivos. Intente de nuevo."
    );
  }
}
