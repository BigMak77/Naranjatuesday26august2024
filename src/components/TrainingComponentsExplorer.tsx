"use client";

import React, { useState } from "react";
import NeonPanel from "@/components/NeonPanel";
import ContentHeader from "@/components/ui/ContentHeader";

// Import all training components
import TestRunner from "@/components/training/TestRunner";
import TrainingAssessment from "@/components/training/TrainingAssessment";
import UserTrainingDashboard from "@/components/training/UserTrainingDashboard";
import MyTeamTraining from "@/components/training/MyTeamTraining";
import QuestionPackList from "@/components/training/QuestionPackList";
import TrainingMaterialsManager from "@/components/training/TrainingMaterialsManager";
import TrainingMaterialsManagerDialog from "@/components/training/TrainingMaterialsManagerDialog";
import TrainingQuestionsSection from "@/components/training/TrainingQuestionsSection";
import TrainingQuestionCategoriesTable from "@/components/training/TrainingQuestionCategoriesTable";
import TrainingQuestionCategory from "@/components/training/TrainingQuestionCategory";
import TrainingQuestionForm from "@/components/training/TrainingQuestionForm";
import AddTrainingQuestionForm from "@/components/training/AddTrainingQuestionForm";
import AddQuestionPackForm from "@/components/training/AddQuestionPackForm";
import AddMediaResourceForm from "@/components/training/AddMediaResourceForm";

interface TrainingComponent {
  key: string;
  name: string;
  description: string;
  category: string;
  component: React.ReactNode;
}

const trainingComponents: TrainingComponent[] = [
  {
    key: "user-training-dashboard",
    name: "User Training Dashboard",
    description: "Personal training dashboard for individual users to view their assigned training modules and progress",
    category: "Dashboard",
    component: <UserTrainingDashboard authId="demo-user-id" />
  },
  {
    key: "my-team-training",
    name: "My Team Training",
    description: "Training overview for managers to monitor their team's training progress and compliance",
    category: "Management",
    component: <MyTeamTraining />
  },
  {
    key: "training-assessment",
    name: "Training Assessment",
    description: "Component for managing training assessments, follow-ups, and competency evaluations",
    category: "Assessment",
    component: <TrainingAssessment />
  },
  {
    key: "test-runner",
    name: "Test Runner",
    description: "Interactive test/quiz interface for users to take training assessments with questions and scoring",
    category: "Assessment",
    component: <TestRunner />
  },
  {
    key: "question-pack-list",
    name: "Question Pack List",
    description: "Manage and view collections of training questions organized into question packs",
    category: "Content",
    component: <QuestionPackList />
  },
  {
    key: "training-materials-manager",
    name: "Training Materials Manager",
    description: "Upload, organize, and manage training materials, documents, and resources",
    category: "Content",
    component: <TrainingMaterialsManager />
  },
  {
    key: "training-materials-dialog",
    name: "Training Materials Dialog",
    description: "Modal dialog for adding/editing training materials and resources",
    category: "Content",
    component: <TrainingMaterialsManagerDialog open={true} onClose={() => {}} />
  },
  {
    key: "training-questions-section",
    name: "Training Questions Section",
    description: "Interface for managing and organizing training questions by categories and types",
    category: "Content",
    component: <TrainingQuestionsSection moduleId="demo-module-id" />
  },
  {
    key: "training-question-categories",
    name: "Question Categories Table",
    description: "Table view for managing training question categories and organization",
    category: "Content",
    component: <TrainingQuestionCategoriesTable />
  },
  {
    key: "training-question-category",
    name: "Question Category",
    description: "Individual training question category component for detailed category management",
    category: "Content",
    component: <TrainingQuestionCategory />
  },
  {
    key: "training-question-form",
    name: "Question Form",
    description: "Form interface for creating and editing individual training questions",
    category: "Forms",
    component: <TrainingQuestionForm moduleId="demo-module-id" />
  },
  {
    key: "add-training-question-form",
    name: "Add Training Question",
    description: "Form specifically for adding new training questions to the system",
    category: "Forms",
    component: <AddTrainingQuestionForm />
  },
  {
    key: "add-question-pack-form",
    name: "Add Question Pack",
    description: "Form for creating new question packs and organizing related questions",
    category: "Forms",
    component: <AddQuestionPackForm />
  },
  {
    key: "add-media-resource-form",
    name: "Add Media Resource",
    description: "Form for uploading and managing media resources for training materials",
    category: "Forms",
    component: <AddMediaResourceForm />
  }
];

const categories = ["All", "Dashboard", "Management", "Assessment", "Content", "Forms"];

export default function TrainingComponentsExplorer() {
  const [activeTab, setActiveTab] = useState<string>(trainingComponents[0].key);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredComponents = trainingComponents.filter(
    component => selectedCategory === "All" || component.category === selectedCategory
  );

  const activeComponent = trainingComponents.find(comp => comp.key === activeTab);

  return (
    <div className="p-6">
      <ContentHeader 
        title="Training Components Explorer"
        description="Explore and understand all training-related components in the system"
      />
      
      <div className="mb-6">
        {/* Category Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Filter by Category:</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Component Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200">
          {filteredComponents.map((component) => (
            <button
              key={component.key}
              onClick={() => setActiveTab(component.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === component.key
                  ? "bg-blue-500 text-white border-b-2 border-blue-500"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-b-2 border-transparent"
              }`}
            >
              {component.name}
            </button>
          ))}
        </div>

        {/* Component Info */}
        {activeComponent && (
          <NeonPanel className="mb-4">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {activeComponent.name}
              </h3>
              <p className="text-gray-600 mb-2">
                <span className="font-medium">Category:</span> {activeComponent.category}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Description:</span> {activeComponent.description}
              </p>
            </div>
          </NeonPanel>
        )}
      </div>

      {/* Component Display */}
      <NeonPanel>
        <div className="p-4">
          {activeComponent ? (
            <div>
              <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> This component is displayed in a controlled environment. 
                  Some features may require additional context or data to function properly.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                {activeComponent.component}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Select a component tab to view its functionality
            </div>
          )}
        </div>
      </NeonPanel>
    </div>
  );
}
