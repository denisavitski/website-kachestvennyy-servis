import type { InputGroupElement } from './InputGroupElement'

export class PortionalElement extends HTMLElement {
  #inputGroupElement: InputGroupElement | null = null
  #moreButtonElement: HTMLElement | null = null

  #itemsPerPage = 10
  #page = 1

  #itemElements: Array<HTMLElement> = []

  protected connectedCallback() {
    this.#itemsPerPage = parseInt(this.getAttribute('items-per-page') || '10')

    this.#inputGroupElement = this.querySelector('input-group')
    this.#inputGroupElement?.addEventListener(
      'inputGroupValueChange',
      this.#inputGroupValueChangeListener,
    )

    this.#moreButtonElement = document.querySelector('[data-more-button')
    this.#moreButtonElement?.addEventListener('click', this.#moreListener)

    this.#itemElements = [...this.querySelectorAll<HTMLElement>('[data-item]')]

    const notHiddenElements = this.#itemElements.filter(
      (el) => el.getAttribute('aria-hidden') !== 'true',
    )

    this.#page = Math.ceil(notHiddenElements.length / this.#itemsPerPage) || 1

    if (this.#inputGroupElement) {
      customElements.whenDefined('input-group').then(() => {
        this.#filter()
      })
    } else {
      this.#filter()
    }
  }

  protected disconnectedCallback() {
    this.#moreButtonElement?.removeEventListener('click', this.#moreListener)
    this.#inputGroupElement?.removeEventListener(
      'inputGroupValueChange',
      this.#inputGroupValueChangeListener,
    )
  }

  #moreListener = () => {
    this.#page++
    this.#filter()
  }

  #filter() {
    const visibleItems = this.#page * this.#itemsPerPage

    const filteredItemElemenets = this.#itemElements.filter((element, i) => {
      element.ariaHidden = 'false'

      let errors = 0

      if (i >= visibleItems) {
        errors++
      }

      if (this.#inputGroupElement) {
        const group = element.getAttribute('data-group')?.trim().toLowerCase()
        const inputValue = this.#inputGroupElement.value.toLocaleLowerCase()

        if (inputValue && inputValue !== group) {
          errors++
        }
      }

      if (errors) {
        element.ariaHidden = 'true'
      } else {
        element.ariaHidden = 'false'
      }

      return errors === 0
    })

    if (this.#moreButtonElement) {
      if (
        !filteredItemElemenets.length ||
        filteredItemElemenets.length === this.#itemElements.length ||
        visibleItems > filteredItemElemenets.length
      ) {
        this.#moreButtonElement.ariaHidden = 'true'
      } else {
        this.#moreButtonElement.ariaHidden = 'false'
      }
    }

    window.dispatchEvent(new Event('resize'))
  }

  #inputGroupValueChangeListener = () => {
    this.#page = 1
    this.#filter()
  }
}

if (!customElements.get('e-portional')) {
  customElements.define('e-portional', PortionalElement)
}

declare global {
  interface HTMLElementTagNameMap {
    'e-portional': PortionalElement
  }
}
