import mongoose, { Model } from 'mongoose';

export async function connectToDatabase() {
  if (!isConnected()) {
    await mongoose
      .connect(process.env.MONGO_URI, {
        // Limita conexiones por app; el cluster es compartido entre varios proyectos
        maxPoolSize: Number(process.env.MONGO_POOL_SIZE) || 10,
        minPoolSize: 0,
        // Cierra conexiones sin uso después de 1 minuto (por defecto nunca se cierran)
        maxIdleTimeMS: 60000
      })
      .catch((err) => {
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
