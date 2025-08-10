import HeroHeader from '@/components/HeroHeader'

// ...existing imports

const RoleProfilePage = ({ name }: { name?: string }) => {
  // ...existing state and functions

  return (
    <>
      <HeroHeader title={name || "Role Profile"} subtitle="Manage assignments and behaviours for this role profile." />
      {/* ...existing page content... */}
    </>
  )
}

// ...existing exports