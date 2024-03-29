import mongoose, { Model } from 'mongoose';

export async function connectToDatabase() {
  if (mongoose?.connection?.readyState !== 1) {
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
  return mongoose.connection.readyState === 1;
}
