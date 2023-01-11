import { validateUserPermissions, getUserId } from "../auth/authUtils";
import { extendRentData } from "../../../lib/data/Rents";


async function extendRentAPI(req, res, userId) {
  try{
   await extendRentData({...req.body, lastUpdatedBy: userId});
   res.status(200).json({ msg: "¡Se extendió el tiempo de renta!"});
  }catch(e){
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX"]);
  const userId = await getUserId(req);
  if (validRole)
    switch (req.method) {
      case "GET":
        break;
      case "POST":
        await extendRentAPI(req, res, userId);
        break;
      case "PUT":
        break;
      case "DELETE":
        break;
    }
}

export default handler;
