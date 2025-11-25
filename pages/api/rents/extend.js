import { validateUserPermissions, getUserId, getUserRole } from "../auth/authUtils";
import { extendRentData } from "../../../lib/data/Rents";
import { recordAuxActionAndCheckBlocking } from "../../../lib/data/Users";


async function extendRentAPI(req, res, userId, userRole) {
  try{
   await extendRentData({...req.body, lastUpdatedBy: userId});
   
   // If AUX user, record action and check blocking
   let wasBlocked = false;
   if (userRole === 'AUX') {
     wasBlocked = await recordAuxActionAndCheckBlocking(userId);
   }
   
   res.status(200).json({ msg: "¡Se extendió el tiempo de renta!", wasBlocked });
  }catch(e){
    console.error(e);
    res.status(500).json({ errorMsg: e.message });
  }
}

async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX", "OPE"]);
  const userId = await getUserId(req);
  const userRole = await getUserRole(req);
  if (validRole)
    switch (req.method) {
      case "GET":
        break;
      case "POST":
        await extendRentAPI(req, res, userId, userRole);
        break;
      case "PUT":
        break;
      case "DELETE":
        break;
    }
}

export default handler;
