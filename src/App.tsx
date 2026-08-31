import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Services from './components/Services'
import ProjectsCarousel from './components/ProjectsCarousel'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import './App.css'

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <Navbar />
            <Hero />
            <About />
            <Services />
            <ProjectsCarousel />
            <Contact />
            <Footer />
          </>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  )
}

export default App
