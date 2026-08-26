import { redirect } from "next/navigation";

export default function AdminLoginPage() {
  redirect("/sign-in?redirectTo=%2Fadmin");
}
