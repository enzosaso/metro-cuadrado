'use client'
import { createContext, useContext, useEffect, useReducer } from 'react'
import type { PersistedBudgetDraft, LineDraft, Item, PdfHeader, PdfFooter } from '@/types'
import { sortByItemCode } from '@/lib/wizard-helpers'

type Step = 'select' | 'edit' | 'review'

interface WizardState extends PersistedBudgetDraft {
  step: Step
  pdfHeader: PdfHeader
  pdfFooter: PdfFooter
}

type Action =
  | { type: 'SET_STEP'; step: Step }
  | { type: 'TOGGLE_SELECT'; item: Item }
  | { type: 'SET_LINE'; item: Item; patch: Partial<LineDraft> }
  | { type: 'SET_MARKUP'; value: string }
  | { type: 'RESET' }
  | { type: 'HYDRATE'; next: WizardState }
  | { type: 'SET_NAME'; name: string }
  | { type: 'SET_CREATED_AT'; createdAt: Date }
  | { type: 'SET_UPDATED_AT'; updatedAt: Date }
  | { type: 'SET_ID'; id: string }
  | { type: 'SET_USER_ID'; userId: string }
  | { type: 'SET_PDF_HEADER'; value: PdfHeader }
  | { type: 'PATCH_PDF_HEADER'; patch: Partial<PdfHeader> }
  | { type: 'SET_PDF_FOOTER'; value: PdfFooter }
  | { type: 'PATCH_PDF_FOOTER'; patch: Partial<PdfFooter> }

const todayISO = () => new Date().toISOString().slice(0, 10)

const initial: WizardState = {
  step: 'select',
  name: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  id: '',
  userId: '',
  draft: { selectedItems: [], lines: {}, markupPercent: '0.10' },
  pdfHeader: {
    title: 'Presupuesto de obra',
    date: todayISO(),
    client: '',
    address: '',
    timeEstimate: ''
  },
  pdfFooter: {
    issuer: '',
    address: '',
    contact: ''
  }
}

const STORAGE_KEY = 'mc_wizard_v1'

function withMigration(raw: unknown): WizardState {
  const parsed = (raw as WizardState) ?? initial

  // Fix fechas si vienen serializadas
  const createdAt = typeof parsed.createdAt === 'string' ? new Date(parsed.createdAt) : parsed.createdAt ?? new Date()
  const updatedAt = typeof parsed.updatedAt === 'string' ? new Date(parsed.updatedAt) : parsed.updatedAt ?? new Date()

  // Defaults no destructivos para nuevos campos
  const pdfHeader: PdfHeader = {
    title: parsed.pdfHeader?.title ?? 'Presupuesto de obra',
    date: parsed.pdfHeader?.date ?? todayISO(),
    client: parsed.pdfHeader?.client ?? '',
    address: parsed.pdfHeader?.address ?? '',
    timeEstimate: parsed.pdfHeader?.timeEstimate ?? ''
  }

  const pdfFooter: PdfFooter = {
    issuer: parsed.pdfFooter?.issuer ?? '',
    address: parsed.pdfFooter?.address ?? '',
    contact: parsed.pdfFooter?.contact ?? ''
  }

  // Draft siempre presente
  const draft = parsed.draft ?? { selectedItems: [], lines: {}, markupPercent: '0.10' }

  return {
    ...initial,
    ...parsed,
    createdAt,
    updatedAt,
    draft,
    pdfHeader,
    pdfFooter
  }
}

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step }

    case 'TOGGLE_SELECT': {
      const exists = state.draft.selectedItems.some(i => i.id === action.item.id)
      const selectedItems = exists
        ? state.draft.selectedItems.filter(i => i.id !== action.item.id)
        : [...state.draft.selectedItems, action.item]
      const lines = { ...state.draft.lines }
      if (!exists && !lines[action.item.id]) lines[action.item.id] = { item: action.item, quantity: '' }
      if (exists) {
        const { [action.item.id]: _removed, ...rest } = lines
        return { ...state, draft: { ...state.draft, selectedItems: sortByItemCode(selectedItems), lines: rest } }
      }
      return { ...state, draft: { ...state.draft, selectedItems: sortByItemCode(selectedItems), lines } }
    }

    case 'SET_LINE': {
      const current = state.draft.lines[action.item.id] ?? { item: action.item, quantity: '' }
      return {
        ...state,
        draft: { ...state.draft, lines: { ...state.draft.lines, [action.item.id]: { ...current, ...action.patch } } }
      }
    }

    case 'SET_MARKUP':
      return { ...state, draft: { ...state.draft, markupPercent: action.value } }

    case 'SET_NAME':
      return { ...state, name: action.name }

    case 'SET_CREATED_AT':
      return { ...state, createdAt: action.createdAt }

    case 'SET_UPDATED_AT':
      return { ...state, updatedAt: action.updatedAt }

    case 'SET_ID':
      return { ...state, id: action.id }

    case 'SET_USER_ID':
      return { ...state, userId: action.userId }

    case 'SET_PDF_HEADER':
      return { ...state, pdfHeader: action.value }

    case 'PATCH_PDF_HEADER':
      return { ...state, pdfHeader: { ...state.pdfHeader, ...action.patch } }

    case 'SET_PDF_FOOTER':
      return { ...state, pdfFooter: action.value }

    case 'PATCH_PDF_FOOTER':
      return { ...state, pdfFooter: { ...state.pdfFooter, ...action.patch } }

    case 'RESET':
      return initial

    case 'HYDRATE':
      return withMigration(action.next)

    default:
      return state
  }
}

const Ctx = createContext<ReturnType<typeof useWizardInternal> | null>(null)

function useWizardInternal() {
  const [state, dispatch] = useReducer(reducer, initial, init => {
    if (typeof window === 'undefined') return init
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? withMigration(JSON.parse(raw)) : init
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    const handleHydrate = () => {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return dispatch({ type: 'RESET' })
      const next = withMigration(JSON.parse(raw))
      dispatch({ type: 'HYDRATE', next })
    }

    window.addEventListener('wizard-storage-update', handleHydrate)
    return () => window.removeEventListener('wizard-storage-update', handleHydrate)
  }, [])

  return { state, dispatch }
}

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const value = useWizardInternal()
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useWizard() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useWizard must be used within WizardProvider')
  return ctx
}
