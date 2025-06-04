import type { Directive } from 'vue';

const DecimalDirective: Directive<HTMLElement, number> = {
  mounted(el, binding) {
    const input = el.querySelector('input') as HTMLInputElement ;
    if (!input) return;

    const decimals = typeof binding.value === 'number' ? binding.value : 2;

    const fix = () => {
      const rawValue = input.value.trim();
      const parsed = parseFloat(rawValue);

      if (!isNaN(parsed)) {
        const formatted = parsed.toFixed(decimals);
        if (formatted !== rawValue) {
          input.value = formatted;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    };

    input.addEventListener('blur', fix);
  },

  updated(el, binding) {
    const input = el.querySelector('input') as HTMLInputElement;
    if (!input) return;

    const decimals = typeof binding.value === 'number' ? binding.value : 2;
    const rawValue = input.value.trim();
    const parsed = parseFloat(rawValue);

    if (!isNaN(parsed)) {
      const formatted = parsed.toFixed(decimals);
      if (formatted !== rawValue) {
        input.value = formatted;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  },
};

export default DecimalDirective;
