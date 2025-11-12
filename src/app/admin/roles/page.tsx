"use client";

import React from "react";
import Link from "next/link";
import { FiUsers, FiSettings, FiRefreshCw, FiPlus } from "react-icons/fi";
import ContentHeader from "@/components/ui/ContentHeader";
import AssignmentSyncButtons from "@/components/AssignmentSyncButtons";
import AccessControlWrapper from "@/components/AccessControlWrapper";

export default function RolesManagementPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin"]}
      redirectOnNoAccess={true}
      noAccessMessage="You don't have permission to manage roles."
    >
      <ContentHeader title="Role Management" />
      
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        
        {/* Navigation Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link 
            href="/admin/roles/add" 
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center mb-4">
              <FiPlus className="text-green-600 mr-3" size={24} />
              <h3 className="text-xl font-semibold">Add New Role</h3>
            </div>
            <p className="text-gray-600">Create new roles and assign training modules</p>
          </Link>

          <Link 
            href="/admin/roles/modules" 
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center mb-4">
              <FiSettings className="text-blue-600 mr-3" size={24} />
              <h3 className="text-xl font-semibold">Manage Assignments</h3>
            </div>
            <p className="text-gray-600">Configure training assignments for roles</p>
          </Link>

          <Link 
            href="/admin/assignments" 
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center mb-4">
              <FiRefreshCw className="text-orange-600 mr-3" size={24} />
              <h3 className="text-xl font-semibold">Assignment Sync</h3>
            </div>
            <p className="text-gray-600">Fix legacy assignment issues</p>
          </Link>
        </div>

        {/* Quick Assignment Sync Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-4">
            <FiUsers className="text-purple-600 mr-3" size={28} />
            <div>
              <h2 className="text-2xl font-bold">Assignment Sync Tools</h2>
              <p className="text-gray-600">Quick tools to fix users with legacy assignments</p>
            </div>
          </div>
          
          <div className="mt-6">
            <AssignmentSyncButtons />
          </div>
        </div>

      </div>
    </AccessControlWrapper>
  );
}
