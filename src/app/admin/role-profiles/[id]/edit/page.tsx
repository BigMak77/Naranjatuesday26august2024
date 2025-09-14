"use client";

import { useParams, useRouter } from "next/navigation";
import RoleProfileEdit from "@/components/admin/role-profiles/RoleProfileEdit";

export default function RoleProfileEditPage() {
  const params = useParams();
  const id = params?.id ?? "";
  const router = useRouter();

  return (
    <RoleProfileEdit
      roleProfileId={id as string}
      onCancel={() => router.back()}
      onSubmit={() => router.push("/admin/role-profiles")}
    />
  );
}
