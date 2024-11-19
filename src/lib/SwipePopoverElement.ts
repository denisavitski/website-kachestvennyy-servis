import { Damped } from 'aptechka/animation'
import { CSSProperty } from 'aptechka/css-property'
import { PopoverElement } from 'aptechka/popover'
import { setupDrag } from 'aptechka/utils'

export class SwipePopoverElement extends PopoverElement {
  #swipeEnabled = new CSSProperty(this, '--swipe-enabled', false)

  #swipeKnobElement: HTMLElement | null = null
  #swipeElement: HTMLElement | null = null
  #damped = new Damped(0, { min: 0 })

  constructor() {
    super()

    this.addEventListener('popoverClosed', () => {
      this.#damped.set(0, { equalize: true })
    })
  }

  protected override connectedCallback() {
    super.connectedCallback()

    this.#swipeKnobElement = this.querySelector('[data-swipe-knob]')
    this.#swipeElement = this.querySelector('[data-swipe]')

    this.#swipeKnobElement = this.#swipeKnobElement || this.#swipeElement

    if (this.#swipeElement && this.#swipeKnobElement) {
      this.#damped.subscribe((e) => {
        this.#swipeElement!.style.transform = `translateY(${e.current}px)`
      })

      this.#swipeKnobElement.addEventListener('pointerdown', this.#grabListener)
    }

    this.#swipeEnabled.subscribe((e) => {
      if (this.#swipeElement && this.#swipeKnobElement) {
        if (e.current) {
          this.#swipeKnobElement.style.touchAction = 'pan-x'
        } else {
          this.#swipeKnobElement.style.touchAction = ''
          this.#swipeElement.style.transform = ''
        }
      }
    })

    this.#swipeEnabled.observe()
  }

  protected override disconnectedCallback() {
    super.disconnectedCallback()

    this.#damped.close()
    this.#swipeEnabled.close()

    this.#swipeKnobElement?.removeEventListener(
      'pointerdown',
      this.#grabListener,
    )
  }

  #grabListener = (grabEvent: PointerEvent) => {
    if (!this.#swipeEnabled.current) {
      return
    }

    let delta = 0

    setupDrag(
      (moveEvent) => {
        moveEvent.preventDefault()
        moveEvent.stopPropagation()

        delta = moveEvent.y - grabEvent.y
        this.#damped.set(delta, { mass: 0, stiffness: 0, damping: 50 })
      },
      () => {
        if (delta > 60) {
          this.close()
        } else {
          this.#damped.set(0, { damping: 20 })
        }
      },
    )
  }
}

if (!customElements.get('e-swipe-popover')) {
  customElements.define('e-swipe-popover', SwipePopoverElement)
}

declare global {
  interface HTMLElementTagNameMap {
    'e-swipe-popover': SwipePopoverElement
  }
}
