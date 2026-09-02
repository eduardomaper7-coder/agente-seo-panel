import { notFound } from "next/navigation";
import { getDashboardDataById } from "@/lib/dashboard-datos";
import { ResumenView } from "@/components/dashboard/views/ResumenView";

export default async function AdminClienteResumenPage({ params }: { params: { id: string } }) {
  const datos = await getDashboardDataById(params.id);
  if (!datos) notFound();
  return <ResumenView datos={datos} basePath={`/admin/clientes/${params.id}`} />;
}
