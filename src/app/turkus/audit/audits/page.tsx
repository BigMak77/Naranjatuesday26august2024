import { unstable_noStore as noStore } from "next/cache";
import dynamic from "next/dynamic";

export const revalidate = 0;
export const fetchCache = "force-no-store";

import AuditClientPage from "@/app/turkus/audit/AuditClientPage";

export default function Page() {
  return <AuditClientPage />;
}
