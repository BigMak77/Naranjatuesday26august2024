import { unstable_noStore as noStore } from "next/cache";
import ClientAuditShell from "./ClientAuditShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function AuditPage() {
  noStore();
  return (
    <div className="centered-content">
      <div className="turkus-audit-content">
        <ClientAuditShell />
      </div>
    </div>
  );
}
