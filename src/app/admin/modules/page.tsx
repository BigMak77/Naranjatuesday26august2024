"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import TrainingModuleManager from '@/components/TrainingModuleManager'
import HeroHeader from '@/components/HeroHeader'
import { FiPackage } from 'react-icons/fi'

export default function ModuleViewPage() {
  return (
    <>
      <HeroHeader
        title="Training Modules"
        titleIcon={<FiPackage className="text-[#40E0D0] text-2xl" />}
        subtitle="Manage, view, edit, and assign training modules."
      />
      <div className="max-w-6xl mx-auto p-6">
        <TrainingModuleManager />
      </div>
    </>
  )
}
