"use client";

import React from "react";

interface UserTrainingRequestProps {
  userId: string;
}

const UserTrainingRequest: React.FC<UserTrainingRequestProps> = ({ userId }) => {
  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">Training Requests</h3>
      <p className="text-sm text-gray-600 mb-4">
        Request additional training materials or modules here.
      </p>
      <div className="text-sm text-gray-500">
        Feature coming soon... (User ID: {userId})
      </div>
    </div>
  );
};

export default UserTrainingRequest;
