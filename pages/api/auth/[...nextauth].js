import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { User } from "../../../lib/models/User";
import { Role } from "../../../lib/models/Role";
import { connectToDatabase } from "../../../lib/db";

Role.init();

export default NextAuth({
  session: {
    jwt: true,
    maxAge: 60 * 60 * 24,
  },
  callbacks: {
    async session({ session, token }) {
      const currentUser = token.user;
      const client = await connectToDatabase();
      const user = await User.findOne({
        user: currentUser.id,
      }).populate("role").exec();
      client.disconnect();
      session.user  = { id:user.id, name:user.name, role:user.role };
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
          id: credentials.user,
        }).populate('role').exec();

        if (!user) {
          client.disconnect();
          throw new Error("Usuario y/o contraseña incorrectos");
        }

        const isValid = await user.matchPassword(credentials.password);

        if (!isValid) {
          client.disconnect();
          throw new Error("Usuario y/o contraseña incorrectos");
        }
        client.disconnect();

        return { id: user.id, name:user.name, role: user.role} = user;
      },
    }),
  ],
});
