import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Work", href: "#work" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`navbar${scrolled ? " scrolled" : ""}`}>
      <Link to="/" className="logo">Upsilon Labs</Link>
      <nav>
        {links.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
        {location.pathname === "/" ? (
          user ? (
            <>
              <Link to="/admin" className="nav-auth">{user.name || user.email}</Link>
              <button className="nav-auth-btn" onClick={logout}>Logout</button>
            </>
          ) : (
            <Link to="/login" className="nav-auth">
              <button className="btn btn-primary btn-sm">Login</button>
            </Link>
          )
        ) : null}
      </nav>
    </header>
  );
}
