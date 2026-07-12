import { useEffect, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'

const projects = [
  { tag: 'NLP', title: 'Sentinel AI', desc: 'Real-time sentiment analysis pipeline processing 10M+ social media posts daily for brand monitoring.' },
  { tag: 'Vision', title: 'MediScan', desc: 'Computer vision system for automated medical imaging analysis, achieving 97% diagnostic accuracy.' },
  { tag: 'MLOps', title: 'Nova ML Platform', desc: 'End-to-end MLOps platform serving 500+ models in production with auto-scaling and monitoring.' },
  { tag: 'Agents', title: 'AutoFlow', desc: 'Autonomous workflow agent that reduced manual processing time by 85% for a Fortune 500 company.' },
  { tag: 'LLM', title: 'CorpusGPT', desc: 'Domain-specific LLM fine-tuned on 50M+ documents for legal document analysis and contract review.' },
  { tag: 'Audio', title: 'WaveSync', desc: 'Real-time speech synthesis and voice cloning system with sub-100ms latency.' },
]

export default function ProjectsCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' })
  const sectionRef = useRef<HTMLElement>(null!)

  useEffect(() => {
    const el = sectionRef.current
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
    <section className="carousel-section" id="work" ref={sectionRef}>
      <div className="section-header reveal">
        <h2>Featured <span className="highlight">Projects</span></h2>
        <p>A selection of AI systems we've built for our clients.</p>
      </div>
      <div className="embla reveal" ref={emblaRef}>
        <div className="embla__container">
          {projects.map((p, i) => (
            <div className="embla__slide" key={i}>
              <div className="project-card">
                <span className="tag">{p.tag}</span>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="carousel-controls reveal">
        <button className="carousel-btn" onClick={() => emblaApi?.scrollPrev()}>‹</button>
        <button className="carousel-btn" onClick={() => emblaApi?.scrollNext()}>›</button>
      </div>
    </section>
  )
}
