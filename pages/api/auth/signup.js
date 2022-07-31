import { connectToDatabase } from "../../../lib/db";
import { User } from "../../../lib/models/User";
import { Role } from "../../../lib/models/Role";
async function handler(req, res) {
  if (req.method !== "POST") {
    return;
  }

  const data = req.body;

  const { user, password, name, role } = data;

  if (!user || !password || !name || !role || password.trim().length < 7) {
    res.status(422).json({
      ok: false,
      message:
        "Invalid input - password should also be at least 7 characters long.",
    });
    return;
  }

  const client = await connectToDatabase();

  const existingUser = await User.findOne({ user });
  if (existingUser) {
    res
      .status(422)
      .json({ ok: false, message: `El usuario ${user} ya existe` });
    client.disconnect();
    return;
  }
  const givenRole = Role.findOne({ id: role });
  if (!givenRole) {
    res.status(422).json({ ok: false, message: `El rol ${rol} no existe` });
    client.disconnect();
    return;
  }
  const newUser = new User({ user, name, role });
  newUser.password = await newUser.encryptPassword(password);
  await newUser.save();
  res.status(200).json({ ok: true, message: "¡Usuario creado!" });
  client.disconnect();
}

export default handler;
