import { connectToDatabase } from "../../../lib/db";
import { User } from "../../../lib/models/User";
async function handler(req, res) {
  if (req.method !== "POST") {
    return;
  }

  const data = req.body;

  const { user, password } = data;

  if (
    !user ||
    !password ||
    password.trim().length < 7
  ) {
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
    res.status(422).json({ ok: false, message: "User exists already!" });
    client.disconnect();
    return;
  }
  const newUser = new User({ user, password });
  newUser.password = await newUser.encryptPassword(password);
  await newUser.save();
  res.status(201).json({ ok: true, message: "Created user!" });
  client.disconnect();
}

export default handler;
