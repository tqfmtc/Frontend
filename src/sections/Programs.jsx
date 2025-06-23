import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { FiBookOpen, FiUsers, FiAward, FiHome, FiClipboard, FiEdit, FiActivity, FiMap } from 'react-icons/fi'
import { assets } from '../assets/assets'


const Programs = () => {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1
  })

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const programData = [
    {
      icon: <FiBookOpen size={24} />,
      title: "Remedial Education",
      description: "Personalized support to help students overcome academic challenges and bridge learning gaps.",
      color: "bg-primary-100 text-primary-600"
    },
    {
      icon: <FiUsers size={24} />,
      title: "Tutor Development",
      description: "Training and mentorship for tutors who serve as role models while gaining valuable experience.",
      color: "bg-secondary-100 text-secondary-600"
    },
    {
      icon: <FiAward size={24} />,
      title: "Student Scholarships",
      description: "Financial assistance for exceptional students to pursue higher education opportunities.",
      color: "bg-accent-100 text-accent-600"
    },
    {
      icon: <FiHome size={24} />,
      title: "Community Centers",
      description: "Safe learning spaces within slum areas that provide educational resources and support.",
      color: "bg-emerald-100 text-emerald-600"
    },
    {
      icon: <FiClipboard size={24} />,
      title: "Review Meetings",
      description: "Regular review meetings to monitor student progress, address challenges, and celebrate achievements.",
      color: "bg-indigo-100 text-indigo-600"
    },
    {
      icon: <FiEdit size={24} />,
      title: "Test Quizzes",
      description: "Frequent quizzes and assessments to evaluate understanding and tailor instruction.",
      color: "bg-rose-100 text-rose-600"
    },
    {
      icon: <FiActivity size={24} />,
      title: "Sports Activities",
      description: "Organized sports and games promoting physical health, teamwork, and confidence.",
      color: "bg-orange-100 text-orange-600"
    },
    {
      icon: <FiMap size={24} />,
      title: "Excursions",
      description: "Educational excursions and field trips that broaden horizons through experiential learning.",
      color: "bg-teal-100 text-teal-600"
    }
  ]

  return (
    <section id="programs" className="section bg-white" ref={ref}>
      <div className="container-custom">
        <motion.div 
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeIn}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="section-title">
            Our <span className="text-primary-600">Mohalla Tuition</span> Program
          </h2>
          <p className="section-subtitle mx-auto">
            A flagship initiative designed to bridge the educational gap for children in underprivileged communities, 
            providing remedial classes and personalized support.
          </p>
        </motion.div>

        {/* Main Program Description */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="order-2 lg:order-1"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Transforming Education in Slum Areas
            </h3>
            <p className="text-gray-700 mb-6">
              The Mohalla Tuition Program is more than education—it's a transformative journey for students, 
              tutors, and entire communities. We provide personalized academic support to children living 
              in slum areas, helping them overcome challenges such as inconsistent schooling and limited 
              access to resources.
            </p>
            <p className="text-gray-700 mb-6">
              Not only does this program uplift students, but it also enriches the lives of tutors. 
              These tutors, the unsung heroes of this movement, serve as mentors and role models 
              while gaining both deeni (spiritual) and worldly knowledge. Through their involvement, 
              tutors experience personal growth and fulfill a noble mission of societal betterment.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <a href="#contact" className="btn btn-primary">
                Become a Tutor
              </a>
              <a href="#impact" className="btn btn-outline">
                See Our Impact
              </a>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="order-1 lg:order-2"
          >
            <div className="relative">
              <img 
                src= {assets.Programs_image} 
                alt="Students in Mohalla Tuition Program" 
                className="rounded-lg shadow-lg object-cover h-[400px] w-full"
              />
            </div>
          </motion.div>
        </div>

        {/* Program Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {programData.map((program, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: 0.6 + (index * 0.1) }}
              className="card hover:translate-y-[-8px]"
            >
              <div className={`${program.color} p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6`}>
                {program.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{program.title}</h3>
              <p className="text-gray-600">{program.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Programs