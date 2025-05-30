import { date } from 'quasar'
import type { DirectiveBinding, ObjectDirective } from 'vue'

type FormatDateValue = string | Date | {
  value: string | Date
  pattern?: string
}

const format = (binding: DirectiveBinding<FormatDateValue>): string => {
  let value: string | Date
  let pattern = 'YYYY-MM-DD HH:mm'

  if (typeof binding.value === 'object' && 'value' in binding.value) {
    value = binding.value.value
    if (binding.value.pattern) {
      pattern = binding.value.pattern
    }
  } else {
    value = binding.value 
  }

  return date.formatDate(value, pattern)
}

const formatDateDirective: ObjectDirective = {
  mounted(el: HTMLElement, binding) {
    el.innerText = format(binding)
  },
  updated(el: HTMLElement, binding) {
    el.innerText = format(binding)
  }
}

export default formatDateDirective
