import { useEffect, useRef } from 'react'

export default function About() {
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
    <section className="section" id="about" ref={ref}>
      <div className="section-header reveal">
        <h2>About <span className="highlight">Upsilon Labs</span></h2>
        <p>We're a team of AI researchers and engineers dedicated to pushing the boundaries of machine intelligence.</p>
      </div>
      <div className="about-grid">
        <div className="about-text reveal">
          <h3>Innovating at the Edge of AI</h3>
          <p>
            Founded in 2020, Upsilon Labs brings together experts from deep learning,
            natural language processing, computer vision, and reinforcement learning
            to build AI systems that solve real-world problems.
          </p>
          <p>
            Our team has shipped production AI at scale — from recommendation systems
            serving millions of users to real-time computer vision pipelines processing
            terabytes of data daily.
          </p>
        </div>
        <div className="stats reveal">
          <div className="stat-card">
            <div className="number">50+</div>
            <div className="label">Projects Delivered</div>
          </div>
          <div className="stat-card">
            <div className="number">30+</div>
            <div className="label">Enterprise Clients</div>
          </div>
          <div className="stat-card">
            <div className="number">98%</div>
            <div className="label">Client Satisfaction</div>
          </div>
        </div>
      </div>
    </section>
  )
}
