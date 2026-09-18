import { Modal } from './Modal'
import { Button } from './Button'

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  isConfirming,
  tone = 'danger',
  onConfirm,
  onCancel,
}: {
  title: string
  description: string
  confirmLabel: string
  isConfirming?: boolean
  tone?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-ink-soft">{description}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Never mind
        </Button>
        <Button variant={tone === 'danger' ? 'dangerSolid' : 'primary'} isLoading={isConfirming} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
