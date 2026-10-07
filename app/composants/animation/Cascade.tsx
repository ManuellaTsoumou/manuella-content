'use client'

import { motion, type HTMLMotionProps } from 'motion/react'
import { apparition, cascade } from '@/lib/animation'

// Les enfants directs qui utilisent les variants « apparition » (Carte, Apparition)
// arrivent les uns après les autres.
export default function Cascade({ children, ...reste }: HTMLMotionProps<'div'>) {
  return (
    <motion.div variants={cascade} initial="cache" animate="visible" {...reste}>
      {children}
    </motion.div>
  )
}

// N'importe quel bloc qui doit apparaître en douceur, seul ou dans une <Cascade>
export function Apparition({ children, ...reste }: HTMLMotionProps<'div'>) {
  return (
    <motion.div variants={apparition} {...reste}>
      {children}
    </motion.div>
  )
}
