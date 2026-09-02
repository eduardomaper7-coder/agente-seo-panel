import { getDashboardData } from "@/lib/dashboard-datos";
import { InformesView } from "@/components/dashboard/views/InformesView";

export default async function InformesPage() {
  const datos = await getDashboardData();
  return <InformesView datos={datos} />;
}
