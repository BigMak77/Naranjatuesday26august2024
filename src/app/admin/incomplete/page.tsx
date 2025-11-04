import IncompleteTraining from "@/components/training/IncompleteTraining";
import ContentHeader from "@/components/ui/ContentHeader";

export default function IncompleteTrainingPage() {
  return (
    <>
      <ContentHeader
        title="Compliance Overview"
        description="View and manage incomplete training assignments for users."
      />
      <IncompleteTraining />
    </>
  );
}
