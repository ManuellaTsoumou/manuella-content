import { ViewTransition, type ReactNode } from 'react'

// À placer dans chaque page.tsx (pas dans le layout, qui ne change jamais).
// La page qui part s'efface vite, la nouvelle glisse doucement vers le haut (voir globals.css).
export default function TransitionPage({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" default="none">
      {children}
    </ViewTransition>
  )
}
