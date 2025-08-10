export type Question = {
  id: string
  question_text: string
  fail_department_id?: string | null
}

export type Department = {
  id: string
  name: string
}
