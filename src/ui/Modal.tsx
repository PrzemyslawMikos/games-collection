import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from '../i18n'

interface ModalProps {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}

export function Modal({ title, children, onClose, wide = false }: ModalProps) {
  const { t } = useTranslation()
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal-card${wide ? ' modal-card-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" type="button" aria-label={t('common.close')} onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}
