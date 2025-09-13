'use client'
import { createContext, useContext, useEffect, useReducer } from 'react'
import type { BudgetDraft, LineDraft } from '@/types'

type Step = 'select' | 'edit' | 'review'

interface WizardState {
  step: Step
  draft: BudgetDraft
}

type Action =
  | { type: 'SET_STEP'; step: Step }
  | { type: 'TOGGLE_SELECT'; itemId: string }
  | { type: 'SET_LINE'; itemId: string; patch: Partial<LineDraft> }
  | { type: 'SET_MARKUP'; value: string }
  | { type: 'RESET' }

const initial: WizardState = {
  step: 'select',
  draft: { selectedItemIds: [], lines: {}, markupPercent: '0.10' }
}

const STORAGE_KEY = 'mc_wizard_v1'

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step }
    case 'TOGGLE_SELECT': {
      const exists = state.draft.selectedItemIds.includes(action.itemId)
      const selectedItemIds = exists
        ? state.draft.selectedItemIds.filter(id => id !== action.itemId)
        : [...state.draft.selectedItemIds, action.itemId]
      const lines = { ...state.draft.lines }
      if (!exists && !lines[action.itemId]) lines[action.itemId] = { itemId: action.itemId, quantity: '' }
      if (exists) delete lines[action.itemId]
      return { ...state, draft: { ...state.draft, selectedItemIds, lines } }
    }
    case 'SET_LINE': {
      const current = state.draft.lines[action.itemId] ?? { itemId: action.itemId, quantity: '' }
      return {
        ...state,
        draft: { ...state.draft, lines: { ...state.draft.lines, [action.itemId]: { ...current, ...action.patch } } }
      }
    }
    case 'SET_MARKUP':
      return { ...state, draft: { ...state.draft, markupPercent: action.value } }
    case 'RESET':
      return initial
    default:
      return state
  }
}

const Ctx = createContext<ReturnType<typeof useWizardInternal> | null>(null)

function useWizardInternal() {
  const [state, dispatch] = useReducer(reducer, initial, init => {
    if (typeof window === 'undefined') return init
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as WizardState) : init
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

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
