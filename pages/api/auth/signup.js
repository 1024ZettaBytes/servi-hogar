import { connectToDatabase, isConnected } from "../../../lib/db";
import { User } from "../../../lib/models/User";
import { Role } from "../../../lib/models/Role";
async function handler(req, res) {
  if (req.method !== "POST") {
    return;
  }

  const data = req.body;

  const { id, password, name, role } = data;

  if (!id || !password || !name || !role || password.trim().length < 7) {
    res.status(422).json({
      ok: false,
      message:
        "Invalid input - password should also be at least 7 characters long.",
    });
    return;
  }
  if (!isConnected()) {
    await connectToDatabase();
  }
  const existingUser = await User.findOne({ id });
  if (existingUser) {
    res.status(422).json({ ok: false, message: `El usuario ${id} ya existe` });
    return;
  }
  const givenRole = await Role.findOne({ id: role });
  if (!givenRole) {
    res.status(422).json({ ok: false, message: `El rol ${rol} no existe` });
    return;
  }
  const newUser = new User({ id, name, role: givenRole._id });
  newUser.password = await newUser.encryptPassword(password);
  await newUser.save();
  res.status(200).json({ ok: true, message: "¡Usuario creado!" });
}

export default handler;
