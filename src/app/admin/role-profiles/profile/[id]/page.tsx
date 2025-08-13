const RoleProfilePage = ({ name }: { name?: string }) => {
  // ...existing state and functions

  return (
    <>
      <h1>{name || "Role Profile"}</h1>
      <p>Manage assignments and behaviours for this role profile.</p>
      {/* ...existing page content... */}
    </>
  )
}

// ...existing exports