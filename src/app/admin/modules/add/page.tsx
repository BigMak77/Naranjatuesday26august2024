import AddModuleTab from "@/components/modules/AddModuleTab";
import NeonIconButton from "@/components/ui/NeonIconButton";
import { FiPlus } from "react-icons/fi";

export default function AddModulePage() {
  return (
    <>
      <NeonIconButton variant="add" icon={<FiPlus />} title="Add Module" />
      <AddModuleTab />
    </>
  );
}
