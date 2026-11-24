// ============================================================
// Toast — a small success message that slides up from the
// bottom of the screen and disappears after a few seconds.
// The parent (App) owns the message; this only renders it.
// ============================================================

export default function Toast({ message }) {
  if (!message) return null
  return (
    <div className="toast" role="status">
      <span className="toast-check">✓</span>
      {message}
    </div>
  )
}
