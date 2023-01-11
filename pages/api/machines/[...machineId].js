import {
    getMachineByIdData,
    updateMachineData
  } from "../../../lib/data/Machines";
  import {validateUserPermissions, getUserId} from "../auth/authUtils";

  async function getMachineByIdAPI(req, res) {
    
    const { machineId } = req.query;
    
    try {
      const machine = await getMachineByIdData(machineId);
      res.status(200).json( { data: machine || {} });
    } catch (e) {
      console.error(e);
      res
        .status(500)
        .json({
          errorMsg:
            "Hubo un problema al consultar los datos del equipo. Por favor intente de nuevo.",
        });
    }
  }

  async function updateMachineAPI(req, res,userId){
    try {
      await updateMachineData({...req.body , lastUpdatedBy: userId});
      res.status(200).json({ msg: "¡Equipo actualizado con éxito!" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ errorMsg: e.message });
    }
  }
async function handler(req, res) {
  const validRole = await validateUserPermissions(req, res, ["ADMIN", "AUX"]);
  const userId = await getUserId(req);
  if(validRole)
    switch (req.method) {
      case "GET":
        await getMachineByIdAPI(req, res);
        break;
      case "POST":
        return;
        break;
      case "PUT":
        await updateMachineAPI(req, res,userId);
        break;
      case "DELETE":
        return;
        break;
    }
  }
  
  export default handler;