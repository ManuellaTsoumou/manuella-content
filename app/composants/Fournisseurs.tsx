'use client'

import type { ReactNode } from 'react'
import { MotionConfig } from 'motion/react'
import { FournisseurToasts } from './ui/Toast'

// reducedMotion="user" : si le téléphone demande moins de mouvement,
// Motion garde les fondus et supprime les déplacements.
export default function Fournisseurs({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <FournisseurToasts>{children}</FournisseurToasts>
    </MotionConfig>
  )
}
