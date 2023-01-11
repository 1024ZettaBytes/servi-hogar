import mongoose, { Model } from "mongoose"

export async function connectToDatabase() {
	const conn = await mongoose
    .connect(process.env.MONGO_URI)
    .catch(err => console.error(err))
  console.log("Mongoose Connection Established")
	return conn;
}

export function isConnected() {
  return mongoose.connection.readyState===1;
}