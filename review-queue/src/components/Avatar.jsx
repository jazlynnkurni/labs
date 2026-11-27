// Initials on a soft tint. The tint only tells people apart; it follows the name, so the
// same person always gets the same one.
export default function Avatar({ name }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span className="avatar" data-tone={h % 6} aria-hidden="true">
      {initials}
    </span>
  );
}
