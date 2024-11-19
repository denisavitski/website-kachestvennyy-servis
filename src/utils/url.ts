export function getHref(pathname: string) {
  if (!pathname) {
    return ''
  }

  let base = import.meta.env.PUBLIC_DOMAIN
    ? `https://${import.meta.env.PUBLIC_DOMAIN}`
    : ''

  base = base.endsWith('/') ? base : base + '/'

  pathname = pathname.startsWith('/') ? pathname.slice(1) : pathname

  return base + pathname
}
