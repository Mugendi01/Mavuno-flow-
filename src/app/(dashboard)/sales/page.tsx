import { redirect } from "next/navigation";

export default function SalesPage() {
  redirect("/transactions?type=SALE");
}
