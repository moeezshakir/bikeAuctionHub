import { redirect } from "next/navigation";

export default function LegacyAdminCatchAll() {
  redirect("/admin/admin-signin");
}
