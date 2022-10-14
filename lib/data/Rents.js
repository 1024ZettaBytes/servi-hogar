import mongoose from "mongoose";
import { connectToDatabase, isConnected } from "../db";
import { Rent } from "../models/Rent";

const getNextRentId = async () => {
  const rent = await Rent.findOne({}, {}, { sort: { num: -1 } });
  if (rent && rent.num) {
    return rent.num + 1;
  }
  return 1;
};

export async function saveRentData({
  customerId,
  rentPeriod,
  deliveryTime,
  lastUpdatedBy,
}) {
  console.log("Recieved data:");
  console.log("customerId:", customerId);
  console.log("rentPeriod:", rentPeriod);
  console.log("deliveryTime:", deliveryTime);
  console.log("lastUpdatedBy:", lastUpdatedBy);
  const currentDate = Date.now();
  if (!isConnected()) {
    await connectToDatabase();
  }
  // Check if the customer  does not have a current rent
  //
  let renta = await new Rent({
    num: await getNextRentId(),
    status: "631272987774b85c4ed1ec50",
    customer: customerId,
    startDate: deliveryTime.date,
    endDate: deliveryTime.date,
    createdAt: currentDate,
    updatedAt: currentDate,
    lastUpdatedBy,
  }).save();

  return renta;
}

export async function getRentsWithLocations() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const rentsList = [
    {
      _id: "874ju74683947583",
      rentNum: 1,
      machine: {
        machineNum: 5,
      },
      customer: {
        _id: "874ju746839jwu6583",
        currentResidence: {
          _id: "lsmndhy75252372bg",
          coordinates: {
            lat: 25.5798264,
            lng: -108.4690834,
          },
        },
      },
    },
    {
      _id: "874ju74683947584",
      rentNum: 3,
      machine: {
        machineNum: 9,
      },
      customer: {
        _id: "874ju746839jwu6511",
        currentResidence: {
          _id: "lsmndhy7525239ik",
          coordinates: {
            lat: 25.5902101,
            lng: -108.4700748,
          },
        },
      },
    },
    {
      _id: "874ju74683947585",
      rentNum: 2,
      machine: {
        machineNum: 11,
      },
      customer: {
        _id: "874ju746839jwu6fgfg",
        currentResidence: {
          _id: "lsmndhy7525237ttt",
          coordinates: {
            lat: 25.571045,
            lng: -108.4824894,
          },
        },
      },
    },
  ];
  return rentsList;
}
