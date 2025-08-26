// components/user/UserPermissionsPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";

interface Permission {
  id: string;
  code: string;
  label: string;
  description: string;
}

interface Props {
  authId: string; // Supabase auth.users.id of the user being edited
  currentUserPermissions?: string[]; // Optional: permissions of the editor (for access check)
}

// The related row shape that comes back from: permission:permissions(code)
type PermissionCodeOnly = { code: string } | null;
type UserPermissionRow = {
  permission_id: string;
  // Depending on the relationship config, Supabase can return a single object or an array
  permission: PermissionCodeOnly | PermissionCodeOnly[] | null;
};

function toCodes(
  input: PermissionCodeOnly | PermissionCodeOnly[] | null | undefined,
): string[] {
  const arr = Array.isArray(input) ? input : [input];
  return arr
    .filter(
      (x): x is { code: string } =>
        !!x && typeof x === "object" && typeof x.code === "string",
    )
    .map((x) => x.code);
}

export default function UserPermissionsPanel({
  authId,
  currentUserPermissions = [],
}: Props) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userPermissionCodes, setUserPermissionCodes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const canEdit =
    currentUserPermissions.includes("grant_permissions") ||
    currentUserPermissions.includes("manage_users");

  useEffect(() => {
    const fetchData = async () => {
      const { data: allPerms, error: allPermsError } = await supabase
        .from("permissions")
        .select<"id,code,label,description">("id,code,label,description")
        .order("label");

      const { data: userPerms, error: userPermsError } = await supabase
        .from("user_permissions")
        .select("permission_id, permission:permissions(code)")
        .eq("auth_id", authId)
        .returns<UserPermissionRow[]>();

      // (Optional) You can surface these errors in your UI if you like
      if (allPermsError) console.error(allPermsError);
      if (userPermsError) console.error(userPermsError);

      // FIXED: robust permission code extraction
      const codes = (userPerms ?? []).flatMap((up) => toCodes(up.permission));

      setPermissions((allPerms as Permission[]) || []);
      setUserPermissionCodes(codes);
    };

    fetchData();
  }, [authId]);

  const handleToggle = async (code: string, checked: boolean) => {
    if (!canEdit) return;
    setSaving(true);

    try {
      const perm = permissions.find((p) => p.code === code);
      if (!perm) return;

      if (checked) {
        await supabase
          .from("user_permissions")
          .upsert({ auth_id: authId, permission_id: perm.id });
      } else {
        await supabase
          .from("user_permissions")
          .delete()
          .eq("auth_id", authId)
          .eq("permission_id", perm.id);
      }

      setUserPermissionCodes((prev) =>
        checked ? [...prev, code] : prev.filter((c) => c !== code),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="neon-panel neon-permissions-panel">
      <h3 className="neon-heading neon-heading-section">
        Additional Permissions
      </h3>

      <div className="neon-listbox">
        {permissions.map((perm) => (
          <label key={perm.code} className="neon-listbox-item">
            <input
              type="checkbox"
              className="neon-checkbox"
              checked={userPermissionCodes.includes(perm.code)}
              disabled={!canEdit || saving}
              onChange={(e) => handleToggle(perm.code, e.target.checked)}
            />
            <span>
              <span className="neon-label">{perm.label}</span>
              <br />
              <span className="neon-description">{perm.description}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
