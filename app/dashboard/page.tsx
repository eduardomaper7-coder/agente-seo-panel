import { getDashboardData } from "@/lib/dashboard-datos";
import { ResumenView } from "@/components/dashboard/views/ResumenView";

export default async function ResumenPage() {
  const datos = await getDashboardData();
  return <ResumenView datos={datos} />;
}
