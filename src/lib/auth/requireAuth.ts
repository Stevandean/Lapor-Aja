import { redirect } from "next/navigation";
import { getUser } from "./getUser";
import { ROUTES } from "../constants/routes";

export async function requireAuth(redirectPath = ROUTES.DASHBOARD) {
  const user = await getUser();

  if (!user) {
    redirect(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(redirectPath)}`);
  }

  return user;
}