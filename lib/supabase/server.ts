import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Client Supabase pour les pages qui s'affichent côté serveur
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Appelé depuis une page serveur : le proxy s'occupe de rafraîchir la session.
          }
        },
      },
    }
  )
}
