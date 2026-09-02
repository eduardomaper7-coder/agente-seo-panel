import { getDashboardData } from "@/lib/dashboard-datos";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { KeywordsExplorer } from "@/components/dashboard/KeywordsExplorer";

export default async function PalabrasClavePage() {
  const { keywords, hayHistoricoSuficiente, periodoAnalizado } = await getDashboardData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Palabras clave"
        subtitle="Consulta cómo aparece tu negocio en Google para las búsquedas que estamos trabajando."
        right={<span>{periodoAnalizado}</span>}
      />
      <Card>
        <CardBody>
          <KeywordsExplorer keywords={keywords} hayHistoricoSuficiente={hayHistoricoSuficiente} />
        </CardBody>
      </Card>
    </div>
  );
}
