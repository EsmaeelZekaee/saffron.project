import { Notify, type QNotifyCreateOptions } from 'quasar'

interface ShowAsyncConfirmOptions {
  message: string
  onConfirm: () => Promise<void>
  onCancel?: () => void
  position?: QNotifyCreateOptions['position']
}

export function showAsyncConfirm({
  message,
  onConfirm,
  onCancel,
  position = 'top'
}: ShowAsyncConfirmOptions): void {
  Notify.create({
    message,
    color: 'warning',
    position,
    timeout: 0,
    actions: [
      {
        label: 'بله',
        color: 'white',
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        handler: async () => {
          const pending = Notify.create({
            message: 'در حال انجام عملیات...',
            spinner: true,
            timeout: 0,
            color: 'info',
            position
          })

          try {
            await onConfirm()
            pending() // بستن نوتیف در حال انجام
            Notify.create({
              message: 'عملیات با موفقیت انجام شد.',
              color: 'green',
              position,
              timeout: 2000
            })
          } catch (error) {
            pending() // بستن نوتیف
            Notify.create({
              message: 'خطا در انجام عملیات!',
              color: 'negative',
              position,
              timeout: 3000
            })
            console.error(error)
          }
        }
      },
      {
        label: 'خیر',
        color: 'white',
        handler: () => {
          onCancel?.()
        }
      }
    ]
  })
}
