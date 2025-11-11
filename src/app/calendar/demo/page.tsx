"use client";

import React from "react";
import CalendarDemo from "@/components/calendar/CalendarDemo";
import ContentHeader from "@/components/ui/ContentHeader";

export default function CalendarDemoPage() {
  return (
    <>
      <ContentHeader
        title="Calendar Components Demo"
        description="Interactive demonstration of assignment calendar features"
      />
      <CalendarDemo />
    </>
  );
}
