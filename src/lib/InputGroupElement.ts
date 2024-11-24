import { dispatchEvent } from 'aptechka/utils'

export interface InputGroupEvents {
  inputGroupValueChange: CustomEvent<string>
}

export class InputGroupElement extends HTMLElement {
  #inputElements: Array<HTMLInputElement> = []

  #value: string = ''
  #input: HTMLInputElement | null = null

  public get value() {
    return this.#value
  }

  public get input() {
    return this.#input
  }

  public changeValue(value: string) {
    const input = this.#inputElements.find((input) => input.value === value)

    if (input && input.value !== this.#value) {
      input.checked = true
      this.#inputListener()
    }
  }

  protected connectedCallback() {
    this.#inputElements = [...this.querySelectorAll<HTMLInputElement>('input')]

    this.#updateValue()

    this.#inputElements.forEach((input) => {
      input.addEventListener('change', this.#inputListener)
    })
  }

  protected disconnectedCallback() {
    this.#inputElements.forEach((input) => {
      input.removeEventListener('change', this.#inputListener)
    })
  }

  #inputListener = () => {
    this.#updateValue()

    dispatchEvent(this, 'inputGroupValueChange', {
      custom: true,
      detail: this.#value,
    })
  }

  #updateValue() {
    const input = this.#inputElements.find((input) => input.checked)

    if (input) {
      this.#input = input
      this.#value = input.value.trim()
    } else {
      this.#value = ''
    }
  }
}

if (!customElements.get('input-group')) {
  customElements.define('input-group', InputGroupElement)
}

declare global {
  interface HTMLElementTagNameMap {
    'input-group': InputGroupElement
  }

  interface HTMLElementEventMap extends InputGroupEvents {}
}
