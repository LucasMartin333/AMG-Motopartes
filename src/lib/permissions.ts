import { Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export function isAdmin(user: SessionUser | null | undefined) {
  return user?.role === "ADMIN";
}

export function canManageProducts(user: SessionUser | null | undefined) {
  return isAdmin(user);
}

export function canManageSuppliers(user: SessionUser | null | undefined) {
  return isAdmin(user);
}

export function canManageUsers(user: SessionUser | null | undefined) {
  return isAdmin(user);
}

export const adminOnlyRoutes = ["/usuarios"];

export function isRouteAllowedForRole(pathname: string, role: Role) {
  if (role === "ADMIN") return true;
  return !adminOnlyRoutes.some((route) => pathname.startsWith(route));
}
