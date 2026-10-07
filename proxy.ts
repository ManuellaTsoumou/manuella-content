import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

// Next.js 16 : ce fichier remplace l'ancien middleware.ts.
// Il s'exécute avant chaque page pour vérifier que tu es connectée.
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
