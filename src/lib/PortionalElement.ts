import { dispatchEvent } from 'aptechka/utils'
import type { InputGroupElement } from './InputGroupElement'

export interface PortionalEvents {
  portionalItemsChange?: CustomEvent
}

export class PortionalElement extends HTMLElement {
  #inputGroupElement: InputGroupElement | null = null
  #moreButtonElement: HTMLElement | null = null

  #itemsPerPage = 10
  #page = 1

  #itemElements: Array<HTMLElement> = []
  #visibleItemElements: Array<HTMLElement> = []

  public get visibleItemElements() {
    return this.#visibleItemElements
  }

  public get inputGroupElement() {
    return this.#inputGroupElement
  }

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

    this.#visibleItemElements = this.#itemElements.filter(
      (el) => el.getAttribute('aria-hidden') !== 'true',
    )

    this.#page = Math.ceil(this.#visibleItemElements.length / this.#itemsPerPage) || 1

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
    const pagesItemsLength = this.#page * this.#itemsPerPage

    this.#visibleItemElements = this.#itemElements.filter((element, i) => {
      element.ariaHidden = 'false'

      let errors = 0

      if (i >= pagesItemsLength) {
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
        !this.#visibleItemElements.length ||
        this.#visibleItemElements.length === this.#itemElements.length ||
        pagesItemsLength > this.#visibleItemElements.length
      ) {
        this.#moreButtonElement.ariaHidden = 'true'
      } else {
        this.#moreButtonElement.ariaHidden = 'false'
      }
    }

    dispatchEvent(this, 'portionalItemsChange', { custom: true })

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

  interface HTMLElementEventMap extends PortionalEvents {}
}
