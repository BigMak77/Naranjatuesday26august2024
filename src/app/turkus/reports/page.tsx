import NeonPanel from "@/components/NeonPanel";
import { FiPieChart, FiPlus } from "react-icons/fi";
import NeonIconButton from "@/components/ui/NeonIconButton";

export default function TurkusReportsPage() {
  return (
    <NeonPanel>
      <h1 className="neon-form-title">
        <FiPieChart /> Turkus Reports
      </h1>
      <p className="neon-info">
        This is the Turkus Reports section. Add your reporting features here.
      </p>
      <NeonIconButton variant="add" icon={<FiPlus />} title="Add Report" />
    </NeonPanel>
  );
}
