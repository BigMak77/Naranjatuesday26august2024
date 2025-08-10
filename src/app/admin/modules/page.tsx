"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import TrainingModuleManager from '@/components/TrainingModuleManager'
import { FiPackage } from 'react-icons/fi'

export default function ModuleViewPage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <TrainingModuleManager />
    </div>
  )
}
