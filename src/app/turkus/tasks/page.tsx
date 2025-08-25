"use client";

import React from "react";
import MyTasks from "@/components/task/MyTasksWidget";

export default function TurkusTasksPage() {
  return (
    <div className="global-content">
      <main className="page-main">
        <MyTasks />
      </main>
    </div>
  );
}
