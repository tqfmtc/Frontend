import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { FiBookOpen, FiHeart, FiDollarSign, FiX, FiUser, FiMail, FiPhone, FiMapPin, FiBook, FiClock, FiUpload } from 'react-icons/fi'

const CallToAction = () => {
  const [ref, inView] = useInView({ triggerOnce: false, threshold: 0.1 })
  const [showTutorModal, setShowTutorModal] = useState(false)
  const [showDonationModal, setShowDonationModal] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    qualifications: '',
    certificates: null,
    memos: null,
    resume: null
  })
  const [contactFormData, setContactFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [submitStatus, setSubmitStatus] = useState('')
  const [contactSubmitStatus, setContactSubmitStatus] = useState('')
  
  const centers = [
    { id: 1, name: 'Malakpet Center' },
    { id: 2, name: 'Mehdipatnam Center' },
  ]
  const subjects = [
    'Mathematics', 'Science', 'English', 'Social Studies', 'Islamic Studies', 'Urdu', 'Hindi'
  ]
  
  const handleChange = (e) => {
    const { name, value, type } = e.target
    if (type === 'file') {
      setFormData({ ...formData, [name]: e.target.files[0] })
    } else if (type === 'checkbox') {
      const updatedSubjects = formData.assignedSubjects?.includes(value)
        ? formData.assignedSubjects.filter(subject => subject !== value)
        : [...(formData.assignedSubjects || []), value]
      setFormData({ ...formData, assignedSubjects: updatedSubjects })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }
  
  const handleContactChange = (e) => {
    const { name, value } = e.target
    setContactFormData({ ...contactFormData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitStatus('')
    
    // Custom validation for file inputs
    if (!formData.resume) {
      setSubmitStatus('Please upload your resume.')
      return
    }

    try {
      // Create FormData object to handle file uploads
      const formDataToSend = new FormData()
      formDataToSend.append('fullName', formData.fullName)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('phone', formData.phone)
      formDataToSend.append('qualifications', formData.qualifications)
      formDataToSend.append('certificates', formData.certificates)
      formDataToSend.append('memos', formData.memos)
      formDataToSend.append('resume', formData.resume)
      
      // Send application data to backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tutor-applications`, {
        method: 'POST',
        body: formDataToSend
      })

      if (!response.ok) {
        throw new Error('Failed to submit application')
      }

      setSubmitStatus('Application submitted successfully!') // Backend handles admin notification

      // Clear form data after successful primary submission and message set
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        qualifications: '',
        certificates: null,
        memos: null,
        resume: null
      })
      
      // Close modal after successful submission
      setTimeout(() => {
        setShowTutorModal(false)
        setSubmitStatus('') // Clear status after modal closes
      }, 3000)
    } catch (error) {
      setSubmitStatus('Error submitting application. Please try again.')
      console.error('Error:', error)
    }
  }

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    setContactSubmitStatus('')
    
    try {
      // Send contact form data to backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactFormData)
      })

      if (!response.ok) {
        throw new Error('Failed to submit contact form')
      }

      setContactSubmitStatus('Message sent successfully!') // Backend handles admin notification

      // Clear form data after successful primary submission and message set
      setContactFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      })
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setContactSubmitStatus('')
      }, 3000)
    } catch (error) {
      setContactSubmitStatus('Error sending message. Please try again.')
      console.error('Error:', error)
    }
  }

  const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

  return (
    <section id="contact" className="section bg-blue-50" ref={ref}>
      <div className="container-custom">
        <motion.div 
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeIn}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="section-title">
            Join Our <span className="text-primary-600">Mission</span>
          </h2>
          <p className="section-subtitle mx-auto">
            There are many ways to get involved and support the Mohalla Tuition Program.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Become a Tutor */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="card text-center hover:translate-y-[-8px] flex flex-col h-full"
          >
            <div className="flex-1 flex flex-col">
              <div className="inline-flex items-center justify-center p-3 bg-primary-100 text-primary-600 rounded-full mb-6">
                <FiBookOpen size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Become a Tutor</h3>
              <p className="text-gray-600 mb-8">Share your knowledge and make a direct impact on children's lives while gaining valuable experience.</p>
            </div>
            <div className="mt-auto">
              <button className="btn bg-primary-600 hover:bg-primary-700 text-white w-full" onClick={() => setShowTutorModal(true)}>
                Apply as Tutor
              </button>
            </div>
          </motion.div>
          {/* Volunteer With Us */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="card text-center hover:translate-y-[-8px] flex flex-col h-full"
          >
            <div className="flex-1 flex flex-col">
              <div className="inline-flex items-center justify-center p-3 bg-primary-100 text-primary-600 rounded-full mb-6">
                <FiHeart size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Volunteer With Us</h3>
              <p className="text-gray-600 mb-8">Help with organizing events, administrative tasks, or providing specialized skills to students.</p>
            </div>
            <div className="mt-auto">
              <a 
                href="https://thequranfoundation.org/become-a-volunteer/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn bg-primary-600 hover:bg-primary-700 text-white w-full block"
              >
                Volunteer Now
              </a>
            </div>
          </motion.div>
          {/* Donate */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="card text-center hover:translate-y-[-8px] flex flex-col h-full"
          >
            <div className="flex-1 flex flex-col">
              <div className="inline-flex items-center justify-center p-3 bg-primary-100 text-primary-600 rounded-full mb-6">
                <FiDollarSign size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Donate</h3>
              <p className="text-gray-600 mb-8">Support our program financially to help us reach more children and expand our impact.</p>
            </div>
            <div className="mt-auto">
              <a 
                href="https://thequranfoundation.org/donation/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn bg-primary-600 hover:bg-primary-700 text-white w-full block"
              >
                Make a Donation
              </a>
            </div>
          </motion.div>
        </div>

        {/* Tutor Modal */}
        {showTutorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative"
            >
              <button onClick={() => setShowTutorModal(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100">
                <FiX size={22} />
              </button>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">Apply as Tutor</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span> (Required)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><FiUser size={18} /></div>
                      <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span> (Required)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><FiMail size={18} /></div>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span> (Required)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><FiPhone size={18} /></div>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} pattern="[0-9]{10}" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">10-digit mobile number</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications <span className="text-red-500">*</span> (Required)</label>
                    <textarea name="qualifications" value={formData.qualifications} onChange={handleChange} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Required Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Certificates (Optional)</label>
                      <div className="relative">
                        <input type="file" name="certificates" onChange={handleChange} accept=".pdf,.doc,.docx" className="hidden" id="certificates" />
                        <label htmlFor="certificates" className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <FiUpload className="mr-2" />
                          <span className="text-sm">Upload Certificates</span>
                        </label>
                        {formData.certificates && (<p className="mt-1 text-sm text-gray-500">{formData.certificates.name}</p>)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Memos (Optional)</label>
                      <div className="relative">
                        <input type="file" name="memos" onChange={handleChange} accept=".pdf,.doc,.docx" className="hidden" id="memos" />
                        <label htmlFor="memos" className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <FiUpload className="mr-2" />
                          <span className="text-sm">Upload Memos</span>
                        </label>
                        {formData.memos && (<p className="mt-1 text-sm text-gray-500">{formData.memos.name}</p>)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Resume <span className="text-red-500">*</span> (Required)</label>
                      <div className="relative">
                        <input type="file" name="resume" onChange={handleChange} accept=".pdf,.doc,.docx" className="hidden" id="resume" required />
                        <label htmlFor="resume" className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <FiUpload className="mr-2" />
                          <span className="text-sm">Upload Resume</span>
                        </label>
                        {formData.resume && (<p className="mt-1 text-sm text-gray-500">{formData.resume.name}</p>)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                  <button type="button" onClick={() => setShowTutorModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg">Submit Application</button>
                </div>
                {/* Popover for Tutor Application Status */}
{submitStatus && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full text-center">
      <div className={`font-medium mb-6 ${submitStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>{submitStatus}</div>
      <button
        className="btn bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg"
        onClick={() => setSubmitStatus('')}
      >
        OK
      </button>
    </div>
  </div>
)}
              </form>
            </motion.div>
          </div>
        )}

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-20 bg-gray-50 rounded-xl shadow-soft p-8 md:p-12"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Get in Touch</h3>
              <p className="text-gray-700 mb-6">
                Have questions about our programs or how you can get involved? 
                Reach out to us and we'll get back to you as soon as possible.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <div className="bg-primary-100 p-2 rounded-full text-primary-600 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-gray-700">thequranfoundation@gmail.com</span>
                </div>
                <div className="flex items-center">
                  <div className="bg-primary-100 p-2 rounded-full text-primary-600 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <span className="text-gray-700">+91 91218 06777</span>
                </div>
                <div className="flex items-center">
                  <div className="bg-primary-100 p-2 rounded-full text-primary-600 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Hyderabad, India</span>
                </div>
              </div>
            </div>
            
            <div>
              <form className="space-y-4" onSubmit={handleContactSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input 
                      type="text" 
                      id="name"
                      name="name"
                      value={contactFormData.name}
                      onChange={handleContactChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" 
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input 
                      type="email" 
                      id="email"
                      name="email"
                      value={contactFormData.email}
                      onChange={handleContactChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" 
                      placeholder="Your email"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input 
                    type="text" 
                    id="subject"
                    name="subject"
                    value={contactFormData.subject}
                    onChange={handleContactChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" 
                    placeholder="Subject"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea 
                    id="message"
                    name="message"
                    value={contactFormData.message}
                    onChange={handleContactChange}
                    rows="4" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" 
                    placeholder="Your message"
                    required
                  ></textarea>
                </div>
                <button type="submit" className="w-full btn btn-primary">
                  Send Message
                </button>
                {/* Popover for Contact Form Status */}
{contactSubmitStatus && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full text-center">
      <div className={`font-medium mb-6 ${contactSubmitStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>{contactSubmitStatus}</div>
      <button
        className="btn bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg"
        onClick={() => setContactSubmitStatus('')}
      >
        OK
      </button>
    </div>
  </div>
)}
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default CallToAction