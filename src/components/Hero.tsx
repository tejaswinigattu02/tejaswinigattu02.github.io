import Scene3D from './Scene3D'

export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero-canvas">
        <Scene3D />
      </div>
      <div className="hero-content">
        <span className="badge">Next-Gen AI Solutions</span>
        <h1>
          Building the <span className="gradient">Intelligent Future</span>
        </h1>
        <p>
          We engineer cutting-edge AI systems that transform how businesses operate,
          from deep learning models to autonomous agents.
        </p>
        <div className="hero-buttons">
          <a href="#contact" className="btn btn-primary">Get in Touch</a>
          <a href="#work" className="btn btn-outline">View Our Work</a>
        </div>
      </div>
      <div className="scroll-indicator">
        <div className="mouse" />
        <span>Scroll</span>
      </div>
    </section>
  )
}
