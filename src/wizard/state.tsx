'use client'
import { createContext, useContext, useEffect, useReducer } from 'react'
import type { PersistedBudgetDraft, LineDraft, Item } from '@/types'
import { sortByItemCode } from '@/lib/wizard-helpers'

type Step = 'select' | 'edit' | 'review'

interface WizardState extends PersistedBudgetDraft {
  step: Step
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

const initial: WizardState = {
  step: 'select',
  name: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  id: '',
  userId: '',
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
    case 'RESET':
      return initial
    case 'HYDRATE':
      return action.next
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

  useEffect(() => {
    const handleHydrate = () => {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return dispatch({ type: 'RESET' })
      const next = JSON.parse(raw) as WizardState
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
