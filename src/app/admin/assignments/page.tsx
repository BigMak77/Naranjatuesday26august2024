"use client";

import React from "react";
import { FiRefreshCw, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import ContentHeader from "@/components/ui/ContentHeader";
import AssignmentSyncButtons from "@/components/AssignmentSyncButtons";
import StagedRoleChangeManager from "@/components/StagedRoleChangeManager";
import IntelligentRoleMigration from "@/components/IntelligentRoleMigration";

export default function AssignmentManagementPage() {
  return (
    <>
      <ContentHeader title="Assignment Management" />
      
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        
        {/* Alert Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-center">
            <FiAlertTriangle className="text-yellow-400 mr-3" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Legacy Assignment Management</h3>
              <p className="text-yellow-700">
                Use these tools to fix users who have carried over assignments from previous roles.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <FiRefreshCw className="mr-3 text-blue-600" />
            Quick Assignment Fixes
          </h2>
          <p className="text-gray-600 mb-6">
            Use these buttons to quickly identify and fix assignment issues across all users.
          </p>
          <AssignmentSyncButtons />
        </div>

        {/* Intelligent Role Migration Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <IntelligentRoleMigration />
        </div>

        {/* Staged Role Change Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <FiCheckCircle className="mr-3 text-green-600" />
            Staged Role Change Process
          </h2>
          <p className="text-gray-600 mb-6">
            For changing user roles with guaranteed assignment sync - no legacy assignments possible.
          </p>
          <StagedRoleChangeManager />
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-blue-800 mb-4">How to Use</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-blue-700 mb-2">Quick Fixes:</h4>
              <ol className="text-blue-600 space-y-1 text-sm">
                <li>1. Click "Scan" to identify users with legacy assignments</li>
                <li>2. Use "Bulk Fix" to resolve all issues at once</li>
                <li>3. Individual users can be fixed with "Fix User"</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-blue-700 mb-2">Staged Process:</h4>
              <ol className="text-blue-600 space-y-1 text-sm">
                <li>1. Enter User ID and New Role ID</li>
                <li>2. Execute each stage in order</li>
                <li>3. Cannot skip stages - ensures reliability</li>
                <li>4. Full backup and verification included</li>
              </ol>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
