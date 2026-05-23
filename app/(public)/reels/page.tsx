import { redirect } from "next/navigation";

/** فهرس عام — يوجّه لقناة الجملة */
export default function ReelsIndexRedirect() {
  redirect("/wholesale/reels");
}
