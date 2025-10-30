import Structure from '@/components/structure/ManagerStructure';
import ContentHeader from '@/components/ui/ContentHeader';

export default function StructurePage() {
  return (
    <>
      <ContentHeader
        title="Manager Structure"
        description="Manage reporting lines and manager hierarchy"
      />
      <Structure />
    </>
  );
}
