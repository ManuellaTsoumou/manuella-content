'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from './ui/Toast'

type Props = {
  userId: string
  nom: string
  photoUrl: string | null
}

export default function PhotoProfil({ userId, nom, photoUrl }: Props) {
  const router = useRouter()
  const toast = useToast()
  const champ = useRef<HTMLInputElement>(null)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  async function changerPhoto(e: ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0]
    if (!fichier) return

    if (!fichier.type.startsWith('image/')) {
      setErreur('Choisis une image (JPG, PNG ou WebP).')
      return
    }
    if (fichier.size > 5 * 1024 * 1024) {
      setErreur('Ta photo dépasse 5 Mo. Choisis-en une plus légère.')
      return
    }

    setEnvoi(true)
    setErreur('')
    const supabase = createClient()
    const extension = fichier.name.split('.').pop()?.toLowerCase() || 'jpg'
    const chemin = `${userId}/photo-${Date.now()}.${extension}`

    const { error: erreurEnvoi } = await supabase.storage
      .from('avatars')
      .upload(chemin, fichier, { upsert: true })

    if (erreurEnvoi) {
      setErreur("L'envoi de la photo a échoué. Vérifie ta connexion et réessaie.")
      setEnvoi(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(chemin)
    await supabase.from('profil').update({ photo_url: data.publicUrl }).eq('id', userId)

    setEnvoi(false)
    router.refresh()
    toast('Nouvelle photo, nouvelle énergie.')
  }

  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={`Photo de ${nom}`}
          className="size-20 rounded-full object-cover ring-2 ring-bordeaux ring-offset-2 ring-offset-surface"
        />
      ) : (
        <div
          aria-hidden="true"
          className="size-20 rounded-full bg-poudre ring-2 ring-bordeaux ring-offset-2 ring-offset-surface flex items-center justify-center font-titre text-4xl text-bordeaux"
        >
          {nom.charAt(0)}
        </div>
      )}

      <button
        type="button"
        onClick={() => champ.current?.click()}
        disabled={envoi}
        className="text-xs text-bordeaux underline underline-offset-2 disabled:opacity-60 min-h-8"
      >
        {envoi ? 'Envoi…' : photoUrl ? 'Changer ma photo' : 'Ajouter ma photo'}
      </button>
      <input
        ref={champ}
        type="file"
        accept="image/*"
        onChange={changerPhoto}
        className="hidden"
      />
      {erreur && (
        <p role="alert" className="text-xs text-erreur max-w-36 text-center">
          {erreur}
        </p>
      )}
    </div>
  )
}
