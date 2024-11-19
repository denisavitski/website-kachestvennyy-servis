export function cloneTemplateContent<T extends HTMLElement>(
  templateElement: HTMLTemplateElement | undefined | null,
  callback?: (element: T) => void,
) {
  if (templateElement) {
    const clone = templateElement.content.cloneNode(true) as DocumentFragment

    const element = clone.firstElementChild as T

    if (element) {
      callback?.(element)
    }

    return element
  }

  return null
}
