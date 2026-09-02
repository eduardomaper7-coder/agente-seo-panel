import { getDashboardData } from "@/lib/dashboard-datos";
import { PlanView } from "@/components/dashboard/views/PlanView";

export default async function PlanPage() {
  const datos = await getDashboardData();
  return <PlanView datos={datos} />;
}
