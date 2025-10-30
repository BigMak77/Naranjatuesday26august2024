import Structure from '@/components/structure/RoleStructure';
import ContentHeader from '@/components/ui/ContentHeader';

export default function StructurePage() {
  return (
    <>
      <ContentHeader
        title="Role Structure"
        description="Manage organizational roles and hierarchy"
      />
      <Structure />
    </>
  );
}
