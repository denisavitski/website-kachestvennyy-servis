export class ImageCloakElement extends HTMLElement {
  #imageElement: HTMLImageElement | null = null
  #clearTimeoutId: ReturnType<typeof setTimeout> | undefined

  public updateImage(src: string, alt?: string | undefined | null) {
    if (this.#imageElement) {
      this.#imageElement.srcset = src
      this.#imageElement.alt = alt || ''
    }
  }

  protected connectedCallback() {
    this.#imageElement = this.querySelector('img')

    if (this.#imageElement) {
      const src =
        this.#imageElement.getAttribute('src') || this.#imageElement.getAttribute('srcset')

      if (!this.#imageElement.complete) {
        this.#imageElement.onload = this.#loadListener
      } else if (src) {
        setTimeout(() => {
          this.#loadListener()
        }, 20)
      }
    }
  }

  protected disconnectedCallback() {
    if (this.#imageElement) {
      this.#imageElement.onload = null
    }

    this.classList.remove('loaded', 'clear')

    clearTimeout(this.#clearTimeoutId)
  }

  #loadListener = () => {
    if (this.isConnected) {
      this.classList.add('loaded')

      this.#clearTimeoutId = setTimeout(
        () => {
          this.classList.add('clear')
        },
        (parseFloat(getComputedStyle(this).getPropertyValue('--clear-duration') || '0') || 0) *
          1000,
      )

      this.dispatchEvent(new Event('load'))
    }
  }
}

if (!customElements.get('image-cloak')) {
  customElements.define('image-cloak', ImageCloakElement)
}

declare global {
  interface HTMLElementTagNameMap {
    'image-cloak': ImageCloakElement
  }
}
