import { Storage } from "@google-cloud/storage";
const filesHost = process.env.FILES_HOST;
const bucketName = process.env.CLOUD_BUCKET;

const storage = new Storage({
  projectId: process.env.CLOUD_PROJECT,
  credentials: {
    client_email: process.env.CLOUD_EMAIL,
    private_key: process.env.CLOUD_KEY,
  },
});

const bucket = storage.bucket(bucketName);

export async function uploadFile(filePath, fileName) {
  await bucket.upload(filePath, { destination: fileName });
  await bucket.file(fileName).makePublic();
  return `${filesHost}${bucketName}/${fileName}`;
}
export async function deleteFile(fileName) {
  const exists = await fileExists(fileName);
  if (exists) {
    await bucket.file(fileName).delete();
  }
}

export async function fileExists(fileName) {
  return (await bucket.file(fileName).exists())[0];
}
