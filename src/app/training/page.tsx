"use client";
import React from "react";
import Link from "next/link";
import TrainerRecordingPage from "@/components/userview/TrainerView";
import AccessControlWrapper from "@/components/AccessControlWrapper";
import NeonPanel from "@/components/NeonPanel";

export default function TrainingPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin", "Trainer"]}
      redirectOnNoAccess={true}
      noAccessMessage="Trainer access required. Redirecting to your dashboard..."
    >
      <div className="p-6">
        <NeonPanel className="mb-6">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Training Management</h2>
            <div className="flex flex-wrap gap-3">
              <Link 
                href="/training/explorer"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                🔍 Explore Training Components
              </Link>
              <Link 
                href="/training/matrix"
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                📊 Training Matrix
              </Link>
              <Link 
                href="/training/assessment"
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                📝 Assessment Center
              </Link>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Use the Component Explorer to understand and test all available training components.
            </p>
          </div>
        </NeonPanel>
        <TrainerRecordingPage />
      </div>
    </AccessControlWrapper>
  );
}
