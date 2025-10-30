import IncompleteTraining from "@/components/training/IncompleteTraining";
import ContentHeader from "@/components/ui/ContentHeader";

export default function IncompleteTrainingPage() {
  return (
    <>
      <ContentHeader
        title="Incomplete Training"
        description="View and manage incomplete training records"
      />
      <IncompleteTraining />
    </>
  );
}
