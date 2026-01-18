export function next(i, n) {
  return (i + 1) % n
}

export function prev(i, n) {
  return (i - 1 + n) % n
}
