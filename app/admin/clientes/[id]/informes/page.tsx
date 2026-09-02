import { notFound } from "next/navigation";
import { getDashboardDataById } from "@/lib/dashboard-datos";
import { InformesView } from "@/components/dashboard/views/InformesView";

export default async function AdminClienteInformesPage({ params }: { params: { id: string } }) {
  const datos = await getDashboardDataById(params.id);
  if (!datos) notFound();
  return <InformesView datos={datos} />;
}
