import { NextResponse } from 'next/server'

export async function updateSession() {
  const supabaseResponse = NextResponse.next()

  // If session/cookie management is needed, use standard fetch API or Next.js middleware utilities instead.

  return supabaseResponse
}