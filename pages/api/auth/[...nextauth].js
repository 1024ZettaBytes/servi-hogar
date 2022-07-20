import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import {User} from "../../../lib/models/User";
import { connectToDatabase } from '../../../lib/db';

export default NextAuth({
  session: {
    jwt: true,
    maxAge: 7 * 24 * 60 * 60,
  },
  callbacks: {
    async session({ session, token }) {
      session.user = token.user;
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
        if(!client){
          throw new Error('Error de conexión. Por favor contacte a Soporte.');
        }
        const user = await User.findOne({
          user: credentials.user,
        });
        if (!user) {
          client.disconnect();
          throw new Error('Usuario y/o contraseña incorrectos');
        }

        const isValid = await user.matchPassword(
          credentials.password,
        );

        if (!isValid) {
          client.disconnect();
          throw new Error('Usuario y/o contraseña incorrectos');
        }

        client.disconnect();
        return {username: user.user};
      },
    }),
  ],
});