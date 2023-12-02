import { connectToDatabase, isConnected } from '../db';
import { Role } from '../models/Role';

export async function getRolesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const roles = await Role.find().lean();
  return roles;
}
