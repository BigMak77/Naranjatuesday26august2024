"use client";

import ContentHeader from "@/components/ui/ContentHeader";
import QuickPermissionAssign from "@/components/user/QuickPermissionAssign";
import UserPermissionsManager from "@/components/user/UserPermissionsManager";
import { useState } from "react";
import { FiShield, FiUsers } from "react-icons/fi";

export default function PermissionsPage() {
  const [activeTab, setActiveTab] = useState<"quick" | "advanced">("quick");

  return (
    <div className="page-container">
      <ContentHeader
        title="User Permissions"
        description="Assign and manage user permissions for health & safety roles"
      />

      <div className="neon-card p-6 mb-6">
        <div className="flex gap-4 border-b border-cyan-500/20 mb-6">
          <button
            className={`px-4 py-2 transition-colors ${
              activeTab === "quick"
                ? "border-b-2 border-cyan-400 text-cyan-400 font-semibold"
                : "text-gray-400 hover:text-cyan-400"
            }`}
            onClick={() => setActiveTab("quick")}
          >
            Quick Assignment
          </button>
          <button
            className={`px-4 py-2 transition-colors ${
              activeTab === "advanced"
                ? "border-b-2 border-cyan-400 text-cyan-400 font-semibold"
                : "text-gray-400 hover:text-cyan-400"
            }`}
            onClick={() => setActiveTab("advanced")}
          >
            Advanced Permissions
          </button>
        </div>

        {activeTab === "quick" && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Quick Permission Assignment
              </h3>
              <p className="text-gray-400 text-sm">
                Quickly assign First Aider and Safety Representative permissions to users.
                First Aiders can add and edit first aid reports, while Safety Representatives
                can add and edit risk assessments.
              </p>
            </div>
            <QuickPermissionAssign />
          </div>
        )}

        {activeTab === "advanced" && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <FiUsers />
                Advanced Permissions Manager
              </h3>
              <p className="text-gray-400 text-sm">
                Manage all granular permissions for users. This includes permissions for
                training, HR, admin, Turkus, and health & safety functions.
              </p>
            </div>
            <UserPermissionsManager />
          </div>
        )}
      </div>

      <div className="neon-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Permission Roles Explained
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-black/30 rounded-lg border border-cyan-500/10">
            <h4 className="font-semibold text-cyan-400 mb-2">First Aider</h4>
            <p className="text-sm text-gray-300">
              <strong>Permissions:</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-gray-400 ml-4 mt-2">
              <li>Add first aid reports (health-safety:add-first-aid-report)</li>
              <li>Edit first aid reports (health-safety:edit-first-aid-report)</li>
            </ul>
            <p className="text-sm text-gray-400 mt-2">
              First Aiders can record and manage first aid incidents that occur in the workplace.
            </p>
          </div>

          <div className="p-4 bg-black/30 rounded-lg border border-cyan-500/10">
            <h4 className="font-semibold text-cyan-400 mb-2">Safety Representative</h4>
            <p className="text-sm text-gray-300">
              <strong>Permissions:</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-gray-400 ml-4 mt-2">
              <li>Add risk assessments (health-safety:add-risk-assessment)</li>
              <li>Edit risk assessments (health-safety:edit-risk-assessment)</li>
            </ul>
            <p className="text-sm text-gray-400 mt-2">
              Safety Representatives can create and manage risk assessments to identify and
              mitigate workplace hazards.
            </p>
          </div>

          <div className="p-4 bg-black/30 rounded-lg border border-cyan-500/10">
            <h4 className="font-semibold text-cyan-400 mb-2">H&S Admin</h4>
            <p className="text-sm text-gray-400">
              H&S Admins automatically have all health & safety permissions by virtue of their
              access level. They don't need individual permissions assigned.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
