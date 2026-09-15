import type { GameEntry, GamePlan } from '../domain/model'
import { useTranslation } from '../i18n'
import { EntryForm, PlanForm } from './forms'
import { Modal } from './Modal'

type PlanValues = Partial<Omit<GamePlan, 'id' | 'gameId' | 'createdAt' | 'updatedAt'>>
type EntryValues = Partial<Omit<GameEntry, 'id' | 'gameId' | 'createdAt' | 'updatedAt'>>

export function PlanModal({ plan, platformSuggestions, currencySuggestions, onClose, onSubmit }: {
  plan?: GamePlan
  platformSuggestions: string[]
  currencySuggestions: string[]
  onClose: () => void
  onSubmit: (values: PlanValues) => void
}) {
  const { t } = useTranslation()
  return <Modal title={plan ? t('collection.editPlan') : t('collection.addPlan')} wide onClose={onClose}>
    <PlanForm initial={plan} platformSuggestions={platformSuggestions} currencySuggestions={currencySuggestions} submitLabel={plan ? t('common.saveChanges') : t('common.addPlan')} onCancel={onClose} onSubmit={onSubmit} />
  </Modal>
}

export function PlanConversionModal({ plan, platformSuggestions, currencySuggestions, onClose, onSubmit }: {
  plan: GamePlan
  platformSuggestions: string[]
  currencySuggestions: string[]
  onClose: () => void
  onSubmit: (values: EntryValues) => void
}) {
  const { t } = useTranslation()
  return <Modal title={t('collection.convertPlan')} wide onClose={onClose}>
    <EntryForm initial={{ platform: plan.platform, version: plan.version, notes: plan.notes, condition: 'unknown', completion: 'not-started' }} platformSuggestions={platformSuggestions} currencySuggestions={currencySuggestions} submitLabel={t('collection.addToCollection')} onCancel={onClose} onSubmit={onSubmit} />
  </Modal>
}
