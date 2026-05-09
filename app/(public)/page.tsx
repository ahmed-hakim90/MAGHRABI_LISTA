import { redirect } from "next/navigation";

export default function PublicRootRedirectPage() {
  redirect("/wholesale");
}
