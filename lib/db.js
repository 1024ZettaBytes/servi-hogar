import mongoose, { Model } from 'mongoose';

export async function connectToDatabase() {
  if (!isConnected()) {
    await mongoose.connect(process.env.MONGO_URI).catch((err) => {
      console.error(err);
      throw new Error(
        'Error al conectarse a la base de datos. Contacte al administrador.'
      );
    });
    console.log('Mongoose Connection Established');
  }
  return mongoose.connection;
}

export function isConnected() {
  return [1, 2].includes(mongoose.connection.readyState);
}
