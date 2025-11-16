import AddModuleTab from "@/components/modules/AddModuleTab";
import TextIconButton from "@/components/ui/TextIconButtons";
import { FiPlus } from "react-icons/fi";

export default function AddModulePage() {
  return (
    <>
      <TextIconButton variant="add" icon={<FiPlus />} label="Add Module" />
      <AddModuleTab />
    </>
  );
}
