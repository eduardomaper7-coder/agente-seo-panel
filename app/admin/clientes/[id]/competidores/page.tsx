import { notFound } from "next/navigation";
import { getDashboardDataById } from "@/lib/dashboard-datos";
import { CompetidoresView } from "@/components/dashboard/views/CompetidoresView";

export default async function AdminClienteCompetidoresPage({ params }: { params: { id: string } }) {
  const datos = await getDashboardDataById(params.id);
  if (!datos) notFound();
  return <CompetidoresView datos={datos} />;
}
