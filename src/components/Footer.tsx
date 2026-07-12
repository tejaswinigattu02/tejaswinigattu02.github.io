export default function Footer() {
  return (
    <footer className="footer">
      <div className="social">
        <a href="#" aria-label="GitHub">🐙</a>
        <a href="#" aria-label="Twitter">𝕏</a>
        <a href="#" aria-label="LinkedIn">🔗</a>
        <a href="#" aria-label="Discord">💬</a>
      </div>
      <p>© {new Date().getFullYear()} Upsilon Labs. All rights reserved.</p>
    </footer>
  )
}
