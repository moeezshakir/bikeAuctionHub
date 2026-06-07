import { redirect } from "next/navigation";

export default function LegacyUserCatchAll() {
  redirect("/signin");
}
