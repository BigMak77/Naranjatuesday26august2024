import { FiClipboard } from "react-icons/fi"; // Import Fi icon

export default function ManagerRisksPage() {
  return (
    <main className="manager-risks-page-wrapper">
      <h1 className="manager-risks-title">
        <FiClipboard className="manager-risks-title-icon" /> My Risk Assessments
      </h1>
      <p className="manager-risks-desc">
        This page will show risk assessments assigned to you and your team.
      </p>
    </main>
  );
}
