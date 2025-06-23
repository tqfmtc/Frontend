import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import AnnouncementBanner from '../components/Announcement/AnnouncementBanner'
import Hero from '../sections/Hero'
import About from '../sections/About'
import Programs from '../sections/Programs'
import Impact from '../sections/Impact'
import Testimonials from '../sections/Testimonials'
import CallToAction from '../sections/CallToAction'
import Footer from '../components/Footer'

const HomePage = () => {
  useEffect(() => {
    // Scroll to the top when the component mounts
    window.scrollTo(0, 0)
    
    // Handle hash links after page load
    const { hash } = window.location
    if (hash) {
      setTimeout(() => {
        const id = hash.replace('#', '')
        const element = document.getElementById(id)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }, [])

  return (
    <div>
      <AnnouncementBanner />
      <Hero />
      <About />
      <Programs />
      <Impact />
      <Testimonials />
      <CallToAction />
      <Footer />
    </div>
  )
}

export default HomePage