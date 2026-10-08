import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ajouterSujet, decider } from './actions'
import StatutSujet from '../composants/StatutSujet'
import TransitionPage from '../composants/animation/TransitionPage'
import Cascade from '../composants/animation/Cascade'
import Carte from '../composants/ui/Carte'
import Champ, { ListeDeroulante } from '../composants/ui/Champ'
import { BoutonEnvoi } from '../composants/ui/Bouton'
import FormulaireAction from '../composants/ui/FormulaireAction'
import EtatVide from '../composants/ui/EtatVide'
import { SkeletonPage } from '../composants/ui/Skeleton'

type Filtres = Promise<{ theme?: string; statut?: string }>

const LIBELLES_STATUT: Record<string, string> = {
  idee: 'Idées',
  valide: 'Validés',
  a_apprendre: 'À apprendre',
  tourne: 'Tournés',
  publie: 'Publiés',
  rejete: 'Rejetés',
}

export default function Page({ searchParams }: { searchParams: Filtres }) {
  return (
    <TransitionPage>
      <Suspense fallback={<SkeletonPage texte="Chargement de ta banque…" cartes={4} />}>
        <Banque searchParams={searchParams} />
      </Suspense>
    </TransitionPage>
  )
}

async function Banque({ searchParams }: { searchParams: Filtres }) {
  const { theme, statut } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: themes } = await supabase
    .from('themes')
    .select('id, nom')
    .order('ordre')

  let requete = supabase
    .from('sujets')
    .select('id, titre, statut, theme_id')
    .order('created_at', { ascending: false })
  if (theme) requete = requete.eq('theme_id', theme)
  requete = statut ? requete.eq('statut', statut) : requete.neq('statut', 'rejete')
  const { data: sujets } = await requete

  const nomsThemes = new Map((themes ?? []).map((t) => [t.id, t.nom]))
  const liste = sujets ?? []
  const idees = liste.filter((s) => s.statut === 'idee')
  const autres = liste.filter((s) => s.statut !== 'idee')

  // Construit le lien d'un filtre en gardant l'autre
  const lien = (cle: 'theme' | 'statut', valeur?: string) => {
    const params = new URLSearchParams()
    if (cle !== 'theme' && theme) params.set('theme', theme)
    if (cle !== 'statut' && statut) params.set('statut', statut)
    if (valeur) params.set(cle, valeur)
    const texte = params.toString()
    return texte ? `/sujets?${texte}` : '/sujets'
  }

  const pastille = (actif: boolean) =>
    `shrink-0 h-9 px-4 rounded-full text-sm flex items-center transition-colors duration-200 ${
      actif
        ? 'bg-bordeaux text-blanc font-medium shadow-carte'
        : 'bg-surface border border-ligne text-texte-doux hover:border-bordeaux hover:text-bordeaux'
    }`

  return (
    <main className="min-h-dvh max-w-md mx-auto pt-8 pb-32">
      <header className="px-6">
        <p className="surtitre text-bordeaux">
          {liste.length} sujet{liste.length > 1 ? 's' : ''}
          {theme ? ` en ${nomsThemes.get(theme) ?? ''}` : ''}
        </p>
        <h1 className="mt-2 font-titre text-titre-1 font-medium">
          Ta banque <em className="text-bordeaux">de sujets</em>
        </h1>
      </header>

      <nav aria-label="Filtrer par thème" className="mt-6 flex gap-2 overflow-x-auto px-5 pb-1">
        <Link href={lien('theme')} className={pastille(!theme)}>
          Tous les thèmes
        </Link>
        {themes?.map((t) => (
          <Link key={t.id} href={lien('theme', t.id)} className={pastille(theme === t.id)}>
            {t.nom}
          </Link>
        ))}
      </nav>

      <nav aria-label="Filtrer par statut" className="mt-2 flex gap-2 overflow-x-auto px-5 pb-1">
        <Link href={lien('statut')} className={pastille(!statut)}>
          En cours
        </Link>
        {Object.entries(LIBELLES_STATUT).map(([valeur, label]) => (
          <Link key={valeur} href={lien('statut', valeur)} className={pastille(statut === valeur)}>
            {label}
          </Link>
        ))}
      </nav>

      <Cascade key={`${theme ?? ''}-${statut ?? ''}`} className="mt-6 px-5 flex flex-col gap-3">
        {idees.map((sujet) => (
          <Carte key={sujet.id} className="flex flex-col gap-3">
            <p className="surtitre text-texte-doux">
              Nouvelle idée{sujet.theme_id ? ` · ${nomsThemes.get(sujet.theme_id)}` : ''}
            </p>
            <h2 className="font-titre text-titre-2 font-semibold">
              <Link
                href={`/sujets/${sujet.id}`}
                className="hover:text-bordeaux transition-colors"
              >
                {sujet.titre}
              </Link>
            </h2>
            <div className="flex gap-2">
              <FormulaireAction action={decider} messageSucces="Sujet validé. Belle intuition." className="flex-1">
                <input type="hidden" name="id" value={sujet.id} />
                <input type="hidden" name="decision" value="valide" />
                <BoutonEnvoi pleineLargeur>Valider</BoutonEnvoi>
              </FormulaireAction>
              <FormulaireAction
                action={decider}
                messageSucces="C’est noté, l’agent retiendra que ce n’était pas pour toi."
                className="flex-1"
              >
                <input type="hidden" name="id" value={sujet.id} />
                <input type="hidden" name="decision" value="rejete" />
                <BoutonEnvoi variante="contour" pleineLargeur>
                  Mettre de côté
                </BoutonEnvoi>
              </FormulaireAction>
            </div>
          </Carte>
        ))}

        {autres.map((sujet) => (
          <Carte
            key={sujet.id}
            className="px-4 py-3 flex justify-between items-center gap-3"
          >
            <div className="min-w-0">
              {sujet.theme_id && !theme && (
                <p className="text-xs text-texte-doux">{nomsThemes.get(sujet.theme_id)}</p>
              )}
              <h2 className="text-[15px] font-medium leading-snug">
                <Link href={`/sujets/${sujet.id}`} className="hover:text-bordeaux transition-colors">
                  {sujet.titre}
                </Link>
              </h2>
            </div>
            <StatutSujet id={sujet.id} statut={sujet.statut} />
          </Carte>
        ))}
      </Cascade>

      {liste.length === 0 && (
        <EtatVide
          titre="Cette page t’attend encore."
          texte="Change de filtre, ou note juste en dessous l’idée qui te trotte dans la tête. Les meilleures commencent souvent par une phrase griffonnée."
        />
      )}

      <section className="mt-6 mx-5">
        <Carte ton="poudre">
          <h2 className="font-titre text-titre-2 font-semibold">Ajouter une idée</h2>
          <FormulaireAction
            action={ajouterSujet}
            messageSucces="Idée enregistrée. Elle t’attend dans ta banque."
            className="mt-4 flex flex-col gap-3"
          >
            <Champ label="Ton sujet (ex. la jalousie entre filles)" name="titre" required />
            <ListeDeroulante label="Thème" name="theme_id" defaultValue={theme ?? ''}>
              <option value="">Sans thème</option>
              {themes?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nom}
                </option>
              ))}
            </ListeDeroulante>
            <BoutonEnvoi taille="grand" pleineLargeur className="mt-1" texteChargement="Enregistrement">
              Ajouter à ma banque
            </BoutonEnvoi>
          </FormulaireAction>
        </Carte>
      </section>
    </main>
  )
}
