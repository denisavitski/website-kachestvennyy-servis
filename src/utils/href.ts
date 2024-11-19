// Регулярное выражение для телефона (подходит для разных форматов)
const phoneRegex =
  /^(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{1,4}[-.\s]?\d{2,4}[-.\s]?\d{2,4}$/

// Регулярное выражение для email
const emailRegex = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/

export function tryCreateHrefFromContact(contact: string) {
  let href: string | undefined
  let type: 'email' | 'phone' | undefined

  if (!href) {
    if (emailRegex.test(contact)) {
      href = `mailto:${contact.trim()}`
      type = 'email'
    } else if (phoneRegex.test(contact)) {
      href = `tel:${contact.replace(/[^0-9\\.\\+]+/g, '')}`
      type = 'phone'
    }
  }

  return { href, type }
}
