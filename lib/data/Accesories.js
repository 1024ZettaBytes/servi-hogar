import { Machine } from "../models/Machine";
import { MachineStatus } from "../models/MachineStatus";
import { Inventory } from "../models/Inventory";
import { Vehicle } from "../models/Vehicle";
Vehicle.init();
MachineStatus.init();
Machine.init();
Inventory.init();
export async function getAllAccesories() {
  let accesories = await Inventory.find({ type: "ACCESORIES" }).lean();
  let onInventary = {};
  accesories.forEach((acc) => {
    onInventary[acc.id] = acc;
  });
  let onVehicles = {
    byOperator: [],
    total: 0,
  };
  const vehiclesByOperator = await Vehicle.find({ machinesOn: { $ne: [] } })
    .populate({
      path: "operator",
      select: "name",
    })
    .select({ operator: 1, machinesOn: 1 })
    .lean();

  vehiclesByOperator.forEach((vehicle) => {
    const data = {
      operator: vehicle.operator.name,
      total: vehicle.machinesOn.length,
    };
    onVehicles.byOperator.push(data);
    onVehicles.total += data.total;
  });

  let onRentStatus = await MachineStatus.find({
    id: "RENTADO",
  });

  const onRent = await Machine.find({ status: { $in: onRentStatus } })
    .select({ _id: 1 })
    .lean();

  return { onInventary, onVehicles, onRent: onRent.length };
}
