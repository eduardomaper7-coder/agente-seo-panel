import { notFound } from "next/navigation";
import { getDashboardDataById } from "@/lib/dashboard-datos";
import { PalabrasClaveView } from "@/components/dashboard/views/PalabrasClaveView";

export default async function AdminClientePalabrasClavePage({ params }: { params: { id: string } }) {
  const datos = await getDashboardDataById(params.id);
  if (!datos) notFound();
  return <PalabrasClaveView datos={datos} />;
}
