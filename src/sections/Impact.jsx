import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import YouTube from 'react-youtube'; // ✅ Import YouTube
import YouTubeLazyPlayer from './YouTubeLazyPlayer'; // Adjust the path

const Impact = () => {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1
  });

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const videoOptions = {
    height: '350',  // ✅ Fit the design
    width: '100%',
    playerVars: {
      autoplay: 0,
    },
  };

  const stats = [
    { value: "3,000+", label: "Students Reached", description: "Children from slum areas who received educational support" },
    { value: "70+", label: "Mohalla Centers", description: "Local tuition centers established in underprivileged areas" },
    { value: "300+", label: "Tutors Trained", description: "Dedicated mentors empowering the next generation" },
    { value: "85%", label: "Academic Improvement", description: "Average improvement in student academic performance" }
  ];

  return (
    <section id="impact" className="section bg-primary-800 text-white" ref={ref}>
      <div className="container-custom">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeIn}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="section-title text-white">
            Our <span className="text-accent-400">Impact</span>
          </h2>
          <p className="section-subtitle mx-auto text-gray-200">
            Through our Mohalla Tuition Program, we've created meaningful change in communities across Hyderabad.
          </p>
        </motion.div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.4, delay: 0.3 + (index * 0.1) }}
              className="bg-primary-700/50 backdrop-blur-sm rounded-lg p-6 text-center"
            >
              <h3 className="text-4xl font-bold text-accent-400 mb-2">{stat.value}</h3>
              <p className="text-lg font-medium text-white mb-2">{stat.label}</p>
              <p className="text-gray-300 text-sm">{stat.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Impact Story */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-white"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Text Section */}
            <div>
              <h3 className="text-2xl font-bold mb-4">Transforming Communities</h3>
              <p className="mb-4 text-gray-200">
                Beyond individual success stories, our Mohalla Tuition Program has a ripple effect,
                transforming entire communities by raising educational standards and creating
                opportunities for children who might otherwise be left behind.
              </p>
              <p className="mb-6 text-gray-200">
                By establishing tuition centers directly within slum areas, we've created accessible
                educational hubs that serve as beacons of hope and advancement. These centers
                become integral parts of the community, fostering a culture of learning and growth.
              </p>
              <ul className="space-y-2">
                {[
                  "Improved school attendance and retention rates",
                  "Increased community involvement in children's education",
                  "Higher rates of students pursuing further education",
                  "Development of local educational leadership"
                ].map((item, index) => (
                  <li key={index} className="flex items-center">
                    <svg className="h-5 w-5 text-accent-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-200">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Video Section */}
            <div className="relative">
              <YouTubeLazyPlayer
                videoId="QfsD7YgpVDU"
                height="350px"
                className="w-full"
              />
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Impact;
