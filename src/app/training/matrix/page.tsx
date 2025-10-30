import TrainingMatrix from "@/components/training/TrainingMatrix";
import ContentHeader from "@/components/ui/ContentHeader";

export default function TrainingMatrixPage() {
  return (
    <>
      <ContentHeader
        title="Training Matrix"
        description="View training status across users and modules"
      />
      <TrainingMatrix />
    </>
  );
}
