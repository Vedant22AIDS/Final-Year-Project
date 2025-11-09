import React, { useRef } from 'react'
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation
} from 'react-router-dom'

import Header from './pages/Header.tsx'
import Hero from '../src/pages/hero-section.tsx'
import Features from './pages/Features.tsx'
import Pricing from '../src/pages/Pricing.tsx'
import Footer from '../src/pages/footer.jsx'
import LoginForm from './pages/login-page.tsx'
import Info from './pages/Info.tsx'
import { DataPreprocessingApp } from './main-screen/Main.tsx'

import './App.css'

const MainApp = () => {
  const homeRef = useRef(null)
  const featuresRef = useRef(null)
  const pricingRef = useRef(null)
  const contactRef = useRef(null)

  const location = useLocation()

  const scrollToSection = ref => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Paths on which we do NOT want to show the Header
  const hideHeaderPaths = ['/login']
  // Paths on which we do NOT want to show the Footer
  const hideFooterPaths = ['/EditorApp']

  const shouldShowHeader = !hideHeaderPaths.includes(location.pathname)
  const shouldShowFooter = !hideFooterPaths.includes(location.pathname)

  return (
    <div className="App">
      {/* Header */}
      {shouldShowHeader && (
        <Header
          onHomeClick={() => scrollToSection(homeRef)}
          onFeaturesClick={() => scrollToSection(featuresRef)}
          onPricingClick={() => scrollToSection(pricingRef)}
          onContactClick={() => scrollToSection(contactRef)}
        />
      )}

      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <div ref={homeRef}>
                  <Hero />
                </div>
                <div ref={featuresRef}>
                  <Features />
                </div>
              </>
            }
          />

          <Route path="/login" element={<LoginForm />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/preprocessing-info" element={<Info />} />
          <Route path="/EditorApp" element={<DataPreprocessingApp />} />
        </Routes>
      </main>

      {/* Footer */}
      {shouldShowFooter && <Footer />}
    </div>
  )
}

const App = () => (
  <Router>
    <MainApp />
  </Router>
)

export default App
