import { getDashboardData } from "@/lib/dashboard-datos";
import { CompetidoresView } from "@/components/dashboard/views/CompetidoresView";

export default async function CompetidoresPage() {
  const datos = await getDashboardData();
  return <CompetidoresView datos={datos} />;
}
