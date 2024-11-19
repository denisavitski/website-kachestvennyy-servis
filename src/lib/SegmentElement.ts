import { CSSProperty } from 'aptechka/css-property'
import {
  clamp,
  debounce,
  dispatchEvent,
  findScrollParentElement,
  getCumulativeOffsetLeft,
  getCumulativeOffsetTop,
  getStickyOffset,
} from 'aptechka/utils'
import { elementResizer } from 'aptechka/element-resizer'
import { windowResizer } from 'aptechka/window-resizer'

export interface SegmentEvents {
  segmentPass: CustomEvent<{
    passed: number
    progress: number
  }>
}

export class SegmentElement extends HTMLElement {
  static __loaded = false

  static __setLoaded = debounce(() => {
    this.__loaded = true
  }, 50)

  #scrollElement: HTMLElement = null!

  #startOffsetCSSProperty = new CSSProperty<number>(this, '--start-offset', 0, {
    rawValueCheck: false,
  })

  #distanceCSSProperty = new CSSProperty<number>(this, '--distance', 0, {
    rawValueCheck: false,
  })

  #distanceOffsetCSSProperty = new CSSProperty<number>(
    this,
    '--distance-offset',
    0,
    {
      rawValueCheck: false,
    },
  )

  #progressVarCSSProperty = new CSSProperty<string>(this, '--progress-var', '')

  #captureOnceCSSProperty = new CSSProperty<boolean>(
    this,
    '--capture-once',
    true,
  )

  #initialPosition = 0
  #start = 0
  #finish = 0
  #distance = 0
  #passed = 0
  #progress = 0
  #visible = false
  #isCaptured = false
  #isHorisontal = false

  public get scrollElement() {
    return this.#scrollElement
  }

  public get start() {
    return this.#start
  }

  public get finish() {
    return this.#finish
  }

  public get distance() {
    return this.#distance
  }

  public get passed() {
    return this.#passed
  }

  public get progress() {
    return this.#progress
  }

  public get isCaptured() {
    return this.#isCaptured
  }

  public resetCaptured() {
    this.#isCaptured = false
    this.classList.remove('captured')
  }

  protected connectedCallback() {
    const morphElement = this.closest('[data-morph]') as HTMLElement
    const morphDuration =
      parseFloat(
        getComputedStyle(morphElement).getPropertyValue('--morph-duration') ||
          '0',
      ) * 1000

    this.#scrollElement = findScrollParentElement(this)

    setTimeout(
      () => {
        if (this.#scrollElement) {
          elementResizer.subscribe(this, this.#resizeListener)
          windowResizer.subscribe(this.#resizeListener)

          this.#scrollElement.addEventListener('scroll', this.#tickListner)

          this.#progressVarCSSProperty.subscribe((e) => {
            if (e.current) {
              this.#tickListner()
            } else if (e.previous) {
              this.style.removeProperty(this.#cssVar(e.previous))
            }
          })

          this.#distanceCSSProperty.subscribe(() => {
            this.#resizeListener()
          })

          this.#startOffsetCSSProperty.observe()
          this.#distanceCSSProperty.observe()
          this.#distanceOffsetCSSProperty.observe()
          this.#progressVarCSSProperty.observe()
          this.#captureOnceCSSProperty.observe()
        }
      },
      SegmentElement.__loaded ? morphDuration / 4 : 500,
    )

    SegmentElement.__setLoaded()
  }

  protected disconnectedCallback() {
    if (this.#scrollElement) {
      elementResizer.unsubscribe(this.#resizeListener)
      windowResizer.unsubscribe(this.#resizeListener)

      this.#scrollElement.removeEventListener('scroll', this.#tickListner)

      this.#startOffsetCSSProperty.close()
      this.#distanceCSSProperty.close()
      this.#distanceOffsetCSSProperty.close()
      this.#progressVarCSSProperty.close()
      this.#captureOnceCSSProperty.close()

      this.classList.remove('captured')

      if (this.#progressVarCSSProperty.current) {
        this.style.removeProperty(
          this.#cssVar(this.#progressVarCSSProperty.current),
        )
      }
    }
  }

  #resizeListener = () => {
    this.#isHorisontal =
      this.#scrollElement.scrollWidth > this.#scrollElement.clientWidth

    this.#initialPosition = this.#isHorisontal
      ? getCumulativeOffsetLeft(this)
      : getCumulativeOffsetTop(this)

    this.#start = this.#initialPosition

    this.#start += this.#startOffsetCSSProperty.current

    this.#start -= getStickyOffset(this, this.#isHorisontal ? 'left' : 'top')

    this.#finish = this.#start

    if (this.#distanceCSSProperty.current) {
      this.#finish += this.#distanceCSSProperty.current
    } else {
      this.#finish += this.#isHorisontal ? this.offsetWidth : this.offsetHeight
    }

    this.#finish += this.#distanceOffsetCSSProperty.current

    this.#distance = this.#finish - this.#start

    this.#visible = this.offsetWidth !== 0 && this.offsetHeight !== 0

    this.#tickListner()
  }

  #tickListner = () => {
    const scrollValue = this.#isHorisontal
      ? this.#scrollElement.offsetLeft
      : this.#scrollElement.scrollTop

    this.#passed = clamp(scrollValue - this.#start, 0, this.#distance)

    this.#progress = this.#passed / this.#distance

    if (this.#progressVarCSSProperty.current) {
      this.style.setProperty(
        this.#cssVar(this.#progressVarCSSProperty.current),
        this.#progress.toFixed(6),
      )
    }

    if (this.#visible && !this.#isCaptured && scrollValue >= this.#start) {
      this.#isCaptured = true
      this.classList.add('captured')
    } else if (
      this.#visible &&
      !this.#captureOnceCSSProperty.current &&
      this.#isCaptured &&
      scrollValue < this.#start
    ) {
      this.#isCaptured = false
      this.classList.remove('captured')
    }

    dispatchEvent(this, 'segmentPass', {
      detail: {
        progress: this.#progress,
        passed: this.#passed,
      },
    })
  }

  #cssVar(value: string) {
    return `--${value}`
  }
}

if (!customElements.get('e-segment')) {
  customElements.define('e-segment', SegmentElement)
}

declare global {
  interface HTMLElementTagNameMap {
    'e-segment': SegmentElement
  }

  interface HTMLElementEventMap extends SegmentEvents {}
}
