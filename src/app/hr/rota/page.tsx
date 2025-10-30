import Rota from "@/components/people/Rota";
import ContentHeader from "@/components/ui/ContentHeader";

export default function RotaPage() {
  return (
    <>
      <ContentHeader
        title="Rota"
        description="Manage staff schedules and shifts"
      />
      <Rota />
    </>
  );
}
