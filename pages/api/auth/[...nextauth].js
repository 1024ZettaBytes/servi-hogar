import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { User } from "../../../lib/models/User";
import { Role } from "../../../lib/models/Role";
import { connectToDatabase } from "../../../lib/db";

export default NextAuth({
  session: {
    jwt: true,
    maxAge: 60 * 60 * 24,
  },
  callbacks: {
    async session({ session, token }) {
      const currentUser = token.user;
      console.log("Current user:", currentUser);
      const client = await connectToDatabase();
       
      const userFromDb = await User.findOne({
        user: currentUser.id,
      });
      const userRole = await Role.findOne({
        id: userFromDb.role,
      });
      client.disconnect();
      session.user  = { id: userFromDb.id, name: userFromDb.name, role: userRole };
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const client = await connectToDatabase();
        if (!client) {
          throw new Error("Error de conexión. Por favor contacte a Soporte.");
        }
        const user = await User.findOne({
          user: credentials.user,
        });
        const role = 1;

        if (!user) {
          client.disconnect();
          throw new Error("Usuario y/o contraseña incorrectos");
        }

        const isValid = await user.matchPassword(credentials.password);

        if (!isValid) {
          client.disconnect();
          throw new Error("Usuario y/o contraseña incorrectos");
        }
        const userRole = await Role.findOne({
          id: user.role,
        });
        if (!userRole) {
          client.disconnect();
          throw new Error("Rol no encontrado");
        }
        client.disconnect();
        return { id: user.user, name: user.name, role: userRole };
      },
    }),
  ],
});
