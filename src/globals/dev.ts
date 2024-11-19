import { viewport } from 'aptechka/device'
import { windowResizer } from 'aptechka/window-resizer'

if (import.meta.env.DEV) {
  addEventListener('keydown', (e) => {
    if (e.metaKey && e.code === 'KeyU') {
      e.preventDefault()
      location.href = '/ui'
    } else if (e.metaKey && e.code === 'KeyH') {
      e.preventDefault()
      location.href = '/'
    }
  })

  windowResizer.subscribe(() => {
    document.documentElement.setAttribute(
      'data-ratio',
      viewport.width / viewport.height + '',
    )
  })
}
