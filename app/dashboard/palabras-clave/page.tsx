import { getDashboardData } from "@/lib/dashboard-datos";
import { PalabrasClaveView } from "@/components/dashboard/views/PalabrasClaveView";

export default async function PalabrasClavePage() {
  const datos = await getDashboardData();
  return <PalabrasClaveView datos={datos} />;
}
