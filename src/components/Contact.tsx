import { useEffect, useRef } from 'react'

export default function Contact() {
  const ref = useRef<HTMLElement>(null!)

  useEffect(() => {
    const el = ref.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.querySelectorAll('.reveal').forEach(r => r.classList.add('visible'))
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="section" id="contact" ref={ref}>
      <div className="section-header reveal">
        <h2>Get In <span className="highlight">Touch</span></h2>
        <p>Have a project in mind? Let's build something intelligent together.</p>
      </div>
      <div className="contact-wrap">
        <div className="contact-info reveal">
          <h3>Let's Talk</h3>
          <p>Reach out and we'll get back to you within 24 hours.</p>
          <div className="detail">
            <span className="emoji">📧</span>
            <span>hello@upsilonlabs.me</span>
          </div>
          <div className="detail">
            <span className="emoji">📍</span>
            <span>San Francisco, CA</span>
          </div>
          <div className="detail">
            <span className="emoji">🕐</span>
            <span>Mon–Fri, 9am–6pm PST</span>
          </div>
        </div>
        <form className="contact-form reveal" onSubmit={e => e.preventDefault()}>
          <input type="text" placeholder="Your Name" required />
          <input type="email" placeholder="Your Email" required />
          <input type="text" placeholder="Subject" />
          <textarea placeholder="Tell us about your project..." required />
          <button type="submit">Send Message</button>
        </form>
      </div>
    </section>
  )
}
