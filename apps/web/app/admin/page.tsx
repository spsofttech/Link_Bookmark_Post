import { redirect } from "next/navigation";

export default function AdminHomepage() {
  redirect("/admin/suite");
  return null;
}
