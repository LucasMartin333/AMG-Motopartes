import type { NextAuthConfig } from "next-auth";
import { isRouteAllowedForRole } from "@/lib/permissions";
import { DEFAULT_AVATAR_COLOR } from "@/lib/avatar-colors";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;
      const isLoggedIn = !!auth?.user;
      const isAuthPage = pathname.startsWith("/login");
      const isSignOutPage = pathname.startsWith("/cerrar-sesion");
      const isApiAuth = pathname.startsWith("/api/auth");
      const isPublicApi = pathname.startsWith("/api/health");

      if (isApiAuth || isPublicApi || isSignOutPage) {
        return true;
      }

      if (!isLoggedIn && !isAuthPage) {
        return false;
      }

      if (isLoggedIn && isAuthPage) {
        return Response.redirect(new URL("/", request.nextUrl.origin));
      }

      if (isLoggedIn && auth?.user?.role) {
        if (!isRouteAllowedForRole(pathname, auth.user.role as "ADMIN" | "EMPLOYEE")) {
          return Response.redirect(new URL("/", request.nextUrl.origin));
        }
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.avatarColor = user.avatarColor || DEFAULT_AVATAR_COLOR;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "EMPLOYEE";
        session.user.avatarColor =
          (token.avatarColor as string) || DEFAULT_AVATAR_COLOR;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
