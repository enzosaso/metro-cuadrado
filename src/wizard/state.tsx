'use client'
import { createContext, useContext, useEffect, useReducer } from 'react'
import type { BudgetDraft, LineDraft, Item } from '@/types'
import { sortByParentCode } from '@/lib/wizard-helpers'

type Step = 'select' | 'edit' | 'review'

interface WizardState {
  step: Step
  draft: BudgetDraft
}

type Action =
  | { type: 'SET_STEP'; step: Step }
  | { type: 'TOGGLE_SELECT'; item: Item }
  | { type: 'SET_LINE'; item: Item; patch: Partial<LineDraft> }
  | { type: 'SET_MARKUP'; value: string }
  | { type: 'RESET' }

const initial: WizardState = {
  step: 'select',
  draft: { selectedItems: [], lines: {}, markupPercent: '0.10' }
}

const STORAGE_KEY = 'mc_wizard_v1'

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
      if (exists) delete lines[action.item.id]
      return { ...state, draft: { ...state.draft, selectedItems: sortByParentCode(selectedItems), lines } }
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
