"use server"
import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function requireUser() {
  const session = await auth();
  
  console.log("requireUser - session:", session);
  
  if (!session?.user) {
    return redirect("/login");
  }
  
  return {
    ...session.user,
    id: session.user.id,
    userType: session.user.userType || session.user.role
  };
}
