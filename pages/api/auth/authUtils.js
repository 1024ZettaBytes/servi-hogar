import { getToken } from "next-auth/jwt";
import { connectToDatabase, isConnected } from "lib/db";
import {User} from "../../../lib/models/User";
export const validateUserPermissions = async (req, res, validRoles) => {
  const token = await getToken({ req });
  if (token && token?.user?.id) {
    const userId = token.user.id;
    if (!isConnected(userId)) await connectToDatabase();
    const user = await User.findById(userId).populate("role");
    const userRole = user?.role?.id;
    const hasValidRole = validRoles.includes(userRole);
    if (!hasValidRole) {
      res.status(403).json({ errorMsg: "No tienes permisos para ver esto :(" });
    }
    return hasValidRole ? userRole : false;
  } else {
    res.status(401).json({ errorMsg: "Por favor vuelve a iniciar sesión" });
    return false;
  }
};

export const getUserId = async (req) => {
  const token = await getToken({ req });
  return token?.user?.id;
}
