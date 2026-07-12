import { useEffect, useRef } from 'react'

const services = [
  { icon: '🧠', title: 'Deep Learning', desc: 'Custom neural networks for classification, regression, time-series forecasting, and anomaly detection.' },
  { icon: '💬', title: 'NLP & LLMs', desc: 'Fine-tuned language models, chatbots, summarization, sentiment analysis, and retrieval-augmented generation.' },
  { icon: '👁️', title: 'Computer Vision', desc: 'Object detection, segmentation, OCR, facial recognition, and real-time video analytics.' },
  { icon: '🤖', title: 'AI Agents', desc: 'Autonomous agents for workflow automation, decision support, and intelligent process orchestration.' },
  { icon: '📊', title: 'MLOps & Infrastructure', desc: 'End-to-end ML pipelines, model serving, monitoring, and scalable training infrastructure.' },
  { icon: '🔬', title: 'R&D Consulting', desc: 'Feasibility studies, proof-of-concepts, and custom research for novel AI applications.' },
]

export default function Services() {
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
    <section className="section" id="services" ref={ref}>
      <div className="section-header reveal">
        <h2>What <span className="highlight">We Do</span></h2>
        <p>End-to-end AI services from research to production deployment.</p>
      </div>
      <div className="services-grid">
        {services.map((s, i) => (
          <div className="service-card reveal" key={i} style={{ transitionDelay: `${i * 0.1}s` }}>
            <span className="icon">{s.icon}</span>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
