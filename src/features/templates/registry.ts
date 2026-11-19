import { type ComponentType } from 'react'
import { type Design } from '../invoices/schema'
import { defaultDesign } from '../invoices/defaults'
import { Pure, type PrintProps } from '../../components/invoice/blocks'
import {
  CleanLine,
  Monochrome,
  Air,
  Executive,
  Ledger,
  BlueOffice,
  Structured,
  Formal,
  GradientEdge,
  BoldHeader,
  SplitPanel,
  AccentBar,
  Studio,
  Geometric,
  Editorial,
  ColorBlock,
  SignatureLayout,
  LuxuryGold,
  ElegantSerif,
  ArabicClassic,
  ArabicModern,
  ArabicFormal,
  DualColumn,
  SaudiBusiness,
} from './compositions'
export const templates: {
  id: Design['templateId']
  name: string
  component: ComponentType<PrintProps>
  batch: string
}[] = [
  { id: 'pure', name: 'Pure', component: Pure, batch: 'A' },
  { id: 'clean-line', name: 'Clean Line', component: CleanLine, batch: 'A' },
  { id: 'monochrome', name: 'Monochrome', component: Monochrome, batch: 'A' },
  { id: 'air', name: 'Air', component: Air, batch: 'A' },
  { id: 'executive', name: 'Executive', component: Executive, batch: 'A' },
  { id: 'ledger', name: 'Ledger', component: Ledger, batch: 'B' },
  { id: 'blue-office', name: 'Blue Office', component: BlueOffice, batch: 'B' },
  { id: 'structured', name: 'Structured', component: Structured, batch: 'B' },
  { id: 'formal', name: 'Formal', component: Formal, batch: 'B' },
  { id: 'gradient-edge', name: 'Gradient Edge', component: GradientEdge, batch: 'B' },
  { id: 'bold-header', name: 'Bold Header', component: BoldHeader, batch: 'C' },
  { id: 'split-panel', name: 'Split Panel', component: SplitPanel, batch: 'C' },
  { id: 'accent-bar', name: 'Accent Bar', component: AccentBar, batch: 'C' },
  { id: 'studio', name: 'Studio', component: Studio, batch: 'C' },
  { id: 'geometric', name: 'Geometric', component: Geometric, batch: 'C' },
  { id: 'editorial', name: 'Editorial', component: Editorial, batch: 'D' },
  { id: 'color-block', name: 'Color Block', component: ColorBlock, batch: 'D' },
  { id: 'signature', name: 'Signature', component: SignatureLayout, batch: 'D' },
  { id: 'luxury-gold', name: 'Luxury Gold', component: LuxuryGold, batch: 'D' },
  { id: 'elegant-serif', name: 'Elegant Serif', component: ElegantSerif, batch: 'D' },
  { id: 'arabic-classic', name: 'Arabic Classic', component: ArabicClassic, batch: 'E' },
  { id: 'arabic-modern', name: 'Arabic Modern', component: ArabicModern, batch: 'E' },
  { id: 'arabic-formal', name: 'Arabic Formal', component: ArabicFormal, batch: 'E' },
  { id: 'dual-column', name: 'Dual Column', component: DualColumn, batch: 'E' },
  { id: 'saudi-business', name: 'Saudi Business', component: SaudiBusiness, batch: 'E' },
]
export function templateDefaults(id: Design['templateId']): Design {
  const design = defaultDesign()
  design.templateId = id
  if (['ledger', 'monochrome', 'structured', 'arabic-formal'].includes(id)) {
    design.border = 'grid'
    design.spacing = 'compact'
    design.columns.find((c) => c.id === 'number')!.visible = true
  }
  if (['air', 'studio'].includes(id)) design.spacing = 'airy'
  if (id.startsWith('arabic-') || id === 'saudi-business') {
    design.order = 'ar-first'
    design.mode = 'ar'
  }
  if (id === 'dual-column') design.mode = 'bilingual'
  return design
}
