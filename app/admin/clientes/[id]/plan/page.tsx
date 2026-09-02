import { notFound } from "next/navigation";
import { getDashboardDataById } from "@/lib/dashboard-datos";
import { PlanView } from "@/components/dashboard/views/PlanView";

export default async function AdminClientePlanPage({ params }: { params: { id: string } }) {
  const datos = await getDashboardDataById(params.id);
  if (!datos) notFound();
  return <PlanView datos={datos} />;
}
