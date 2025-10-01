"use client";
import React, { useState } from "react";
import { FiChevronRight } from "react-icons/fi";
import { OverlaySidebar } from "@/components/ui/OverlaySidebar";
import TrainingQuestionCategoriesTable from "@/components/training/TrainingQuestionCategoriesTable";
import NeonPanel from "@/components/NeonPanel";
import OverlayDialog from "@/components/ui/OverlayDialog";
import QuestionPackList from "@/components/training/QuestionPackList";
import AddMediaResourceForm from "@/components/training/AddMediaResourceForm";

export default function TrainingResourcesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCategoriesTable, setShowCategoriesTable] = useState(false);
  const [showAddPack, setShowAddPack] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showPackList, setShowPackList] = useState(false);
  const [showAddMedia, setShowAddMedia] = useState(false);

  return (
    <div className="after-hero global-content relative">
      {/* Sidebar Overlay Button */}
      <button
        className="fixed top-24 left-2 z-40 neon-btn neon-btn-utility neon-btn-square shadow-lg"
        style={{ width: 40, height: 40, background: '#FF8800', color: '#fff' }}
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
        title="Open sidebar"
      >
        <FiChevronRight />
      </button>
      {/* Sidebar Overlay */}
      <OverlaySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} ariaLabelledby="resources-sidebar-heading" width={340}>
        <div style={{ padding: 16 }}>
          <h3 id="resources-sidebar-heading" style={{ margin: "0 0 12px 0" }}>
            Training Resources
          </h3>
          <div className="sidebar-actions" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="sidebar-action" onClick={() => { setShowCategoriesTable(true); setSidebarOpen(false); }}>
              Show Categories Table
            </button>
            <button className="sidebar-action" onClick={() => { setShowAddQuestion(true); setSidebarOpen(false); }}>
              Add Training Question
            </button>
            <button className="sidebar-action" onClick={() => { setShowAddPack(true); setSidebarOpen(false); }}>
              Add Question Pack
            </button>
            <button className="sidebar-action" onClick={() => { setShowPackList(true); setSidebarOpen(false); }}>
              View Question Packs
            </button>
            <button className="sidebar-action" onClick={() => { setShowAddMedia(true); setSidebarOpen(false); }}>
              Add Video/Audio Resource
            </button>
          </div>
        </div>
      </OverlaySidebar>
      {/* Main content */}
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold mb-4">Training Resources</h1>
        {/* Dialog overlay for categories table */}
        {showCategoriesTable && (
          <OverlayDialog open={showCategoriesTable} onClose={() => setShowCategoriesTable(false)} ariaLabelledby="categories-table-title">
            <NeonPanel>
              <h2 id="categories-table-title">Training Categories</h2>
              <TrainingQuestionCategoriesTable />
              <button
                className="neon-btn neon-btn-secondary mt-4"
                style={{ marginTop: "1rem" }}
                onClick={() => setShowCategoriesTable(false)}
              >
                Close
              </button>
            </NeonPanel>
          </OverlayDialog>
        )}
        {showPackList && (
          <OverlayDialog open={showPackList} onClose={() => setShowPackList(false)} ariaLabelledby="pack-list-title">
            <NeonPanel>
              <h2 id="pack-list-title">Question Packs</h2>
              <QuestionPackList />
              <button
                className="neon-btn neon-btn-secondary mt-4"
                style={{ marginTop: "1rem" }}
                onClick={() => setShowPackList(false)}
              >
                Close
              </button>
            </NeonPanel>
          </OverlayDialog>
        )}
        {showAddPack && (
          <OverlayDialog open={showAddPack} onClose={() => setShowAddPack(false)} ariaLabelledby="add-pack-form-title">
            <NeonPanel>
              <h2 id="add-pack-form-title">Add Question Pack</h2>
              <React.Suspense fallback={<div>Loading…</div>}>
                {typeof window !== 'undefined' && (
                  <>
                    {(() => {
                      const AddQuestionPackForm = require("@/components/training/AddQuestionPackForm").default;
                      return <AddQuestionPackForm onSuccess={() => setShowAddPack(false)} />;
                    })()}
                  </>
                )}
              </React.Suspense>
              <button
                className="neon-btn neon-btn-secondary mt-4"
                style={{ marginTop: "1rem" }}
                onClick={() => setShowAddPack(false)}
              >
                Close
              </button>
            </NeonPanel>
          </OverlayDialog>
        )}
        {showAddQuestion && (
          <OverlayDialog open={showAddQuestion} onClose={() => setShowAddQuestion(false)} ariaLabelledby="add-training-form-title">
            <NeonPanel>
              <React.Suspense fallback={<div>Loading…</div>}>
                {typeof window !== 'undefined' && (
                  <>
                    {(() => {
                      const AddTrainingQuestionForm = require("@/components/training/AddTrainingQuestionForm").default;
                      return <AddTrainingQuestionForm onSuccess={() => setShowAddQuestion(false)} />;
                    })()}
                  </>
                )}
              </React.Suspense>
              <button
                className="neon-btn neon-btn-secondary mt-4"
                style={{ marginTop: "1rem" }}
                onClick={() => setShowAddQuestion(false)}
              >
                Close
              </button>
            </NeonPanel>
          </OverlayDialog>
        )}
        {showAddMedia && (
          <OverlayDialog open={showAddMedia} onClose={() => setShowAddMedia(false)} ariaLabelledby="add-media-form-title">
            <NeonPanel>
              <h2 id="add-media-form-title">Add Video or Audio Resource</h2>
              <AddMediaResourceForm onSuccess={() => setShowAddMedia(false)} />
            </NeonPanel>
          </OverlayDialog>
        )}
        {/* ...main page content here... */}
      </div>
    </div>
  );
}
