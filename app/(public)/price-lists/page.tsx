import { redirect } from "next/navigation";

/** Legacy path — default catalog channel is wholesale. */
export default function LegacyPriceListsIndexPage() {
  redirect("/wholesale/price-lists");
}
