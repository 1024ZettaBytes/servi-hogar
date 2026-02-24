import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Role } from "../../../lib/models/Role";
import { User } from "../../../lib/models/User";
import { connectToDatabase, isConnected } from "../../../lib/db";
import { SUPER_USERS } from "./authUtils";

Role.init();
export default NextAuth({
  session: {
    jwt: true,
    maxAge: 60 * 60 * 24,
  },
  callbacks: {
    async session({ session, token }) {
      
      const tokenUser = token.user;
      if(!isConnected()){
        await connectToDatabase();
      }
      const userOnDb = await User.findById(tokenUser.id).populate("role").exec();
      if(!userOnDb || !userOnDb.isActive){
        session.user={wasRemoved:true};
        return session;
      }
      const isSuperUser = SUPER_USERS.includes(userOnDb.id);
      if (userOnDb?.role?.id === tokenUser?.role) {
        session.user = {
          ...tokenUser,
          isBlocked: userOnDb.isBlocked,
          isSuperUser
        };
      }
      else{
        session.user = { 
          id: userOnDb?._id, 
          name: userOnDb?.name, 
          role: userOnDb?.role?.id,
          isBlocked: userOnDb.isBlocked,
          isSuperUser
        }
      }
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
          throw new Error("Usuario y/o contraseña incorrectos");
        }
        const isValid = await user.matchPassword(credentials.password);
        if (!isValid) {
          throw new Error("Usuario y/o contraseña incorrectos");
        }
        return { id: user._id, name:user.name, role: user?.role?.id};
      },
    }),
  ],
});
