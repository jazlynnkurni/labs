export function money(n) {
  return `$${n.toFixed(2)}`;
}

export function clock(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
