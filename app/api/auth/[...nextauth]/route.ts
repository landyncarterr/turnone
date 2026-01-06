import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getOrCreateStripeCustomerByEmail } from "@/app/lib/stripeCustomer";

// Runtime checks for required environment variables
if (!process.env.AUTH_SECRET) {
  console.error("AUTH_SECRET is not set - authentication will not work");
}

if (!process.env.NEXTAUTH_URL) {
  console.error("NEXTAUTH_URL is not set - authentication may not work correctly");
}

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set - Google sign-in will not work");
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user?.email) {
        token.email = user.email;
        // Get or create Stripe customer for this user
        try {
          const { customerId } = await getOrCreateStripeCustomerByEmail(user.email);
          token.stripeCustomerId = customerId;
        } catch (error) {
          console.error("Error creating/getting Stripe customer:", error);
          // Don't fail auth if Stripe fails
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email;
      }
      if (token.stripeCustomerId) {
        (session as any).stripeCustomerId = token.stripeCustomerId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
});

export const { GET, POST } = handlers;
