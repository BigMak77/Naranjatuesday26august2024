// components/QuestionTab.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import QuestionEditor from './QuestionEditor'
import { Question, Department } from '@/types'

export default function QuestionTab() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      supabase.from('audit_questions').select('*').order('question_text'),
      supabase.from('departments').select('*').order('name'),
    ]).then(([qRes, dRes]) => {
      if (!qRes.error) setQuestions(qRes.data || [])
      if (!dRes.error) setDepartments(dRes.data || [])
      setLoading(false)
    })
  }, [])

  const updateQuestion = async (id: string, field: keyof Question, value: any) => {
    const { error } = await supabase
      .from('audit_questions')
      .update({ [field]: value })
      .eq('id', id)
    if (!error) {
      setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)))
    }
  }

  const removeQuestion = async (id: string) => {
    const { error } = await supabase
      .from('audit_questions')
      .delete()
      .eq('id', id)
    if (!error) {
      setQuestions((prev) => prev.filter((q) => q.id !== id))
    }
  }

  const addQuestion = async () => {
    const { data, error } = await supabase
      .from('audit_questions')
      .insert({ question_text: '', fail_department_id: null })
      .select()
      .single()
    if (!error && data) {
      setQuestions((prev) => [...prev, data])
    }
  }

  const bulkAddQuestions = async (bulkText: string) => {
    const lines = bulkText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
    if (lines.length === 0) return
    const { data, error } = await supabase
      .from('audit_questions')
      .insert(lines.map((question_text) => ({ question_text })))
      .select()
    if (!error && data) {
      setQuestions((prev) => [...prev, ...data])
    }
  }

  if (loading) {
    return <div className="text-[#40E0D0] text-center py-8">Loading questions...</div>
  }

  return (
    <QuestionEditor
      questions={questions}
      departments={departments}
      updateQuestion={updateQuestion}
      removeQuestion={removeQuestion}
      addQuestion={addQuestion}
      bulkAddQuestions={bulkAddQuestions}
    />
  )
}
