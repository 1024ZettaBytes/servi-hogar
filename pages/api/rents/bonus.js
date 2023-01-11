import { validateUserPermissions, getUserId } from "../auth/authUtils";
import { addRentBonusData } from "../../../lib/data/Rents";


async function addRentBonusAPI(req, res, userId) {
  try{
   await addRentBonusData({...req.body, lastUpdatedBy: userId});
   res.status(200).json({ msg: "¡Se agregó la bonificación a la renta!"});
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
        await addRentBonusAPI(req, res, userId);
        break;
      case "PUT":
        break;
      case "DELETE":
        break;
    }
}

export default handler;
