import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { assets } from '../assets/assets'; // Assuming your assets.js is in the '../assets' folder

const Testimonials = () => {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  });

  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      content:
        "The Mohalla Tuition Program changed my life. I was struggling in school, but the tutors helped me understand my subjects better. Now I'm one of the top students in my class and dream of becoming a doctor.",
      role: "Student, 8th Grade",
      image: assets.transformationStoryOne,
    },
    {
      content:
        "Being a tutor with the Mohalla program has been incredibly rewarding. I've watched my students grow academically while also developing as a teacher myself. It's a beautiful exchange of knowledge that benefits everyone involved.",
      role: "Tutor, 3 years",
      image: assets.transformationStoryTwo,

    },
    {
      content:
        "As a parent in our community, I've seen remarkable changes since the Mohalla Tuition Center opened. My children are more confident, their grades have improved, and they're excited about learning. This program truly transforms lives.",
      role: "Parent",
      image: assets.transformationStoryThree,

    },
  ];

    // Preload all testimonial images on mount
    useEffect(() => {
      testimonials.forEach((testimonial) => {
        const img = new window.Image();
        img.src = testimonial.image;
      });
    }, []);
  
  useEffect(() => {
    if (!inView) return;

    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [inView, testimonials.length]);

  const handlePrev = () => {
    setCurrentTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  const handleNext = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section className="section bg-gray-50" ref={ref}>
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="section-title">
            Stories of <span className="text-primary-600">Transformation</span>
          </h2>
          <p className="section-subtitle mx-auto">
            Hear from the students, tutors, and community members whose lives
            have been impacted by our program.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative"
        >
          <div className="relative bg-white rounded-xl shadow-soft overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Testimonial Image */}
              <div className="hidden md:block">
                <div className="h-full relative">
                  <div className="absolute inset-0 bg-primary-600/10"></div>
                  <img
                    src={testimonials[currentTestimonial].image}
                    alt={testimonials[currentTestimonial]?.name || "Default Alt Text"}
                    className="w-full h-auto max-w-[610px] max-h-[360px] object-cover rounded-lg shadow-md"
                    style={{
                      aspectRatio: "1 / 1", // Maintains a square aspect ratio
                      objectFit: "cover", // Ensures the image fills the box without distortion
                    }}
                  />
                </div>
              </div>


              {/* Testimonial Content */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <svg
                  className="h-12 w-12 text-primary-200 mb-6"
                  fill="currentColor"
                  viewBox="0 0 32 32"
                >
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>

                <p className="text-xl text-gray-700 mb-8 italic">
                  "{testimonials[currentTestimonial].content}"
                </p>

                <div className="mt-auto">
                  <p className="font-bold text-gray-900">
                    {testimonials[currentTestimonial].name}
                  </p>
                  <p className="text-gray-600">
                    {testimonials[currentTestimonial].role}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between mt-6">
            <button
              onClick={handlePrev}
              className="p-2 rounded-full bg-white shadow-sm border border-gray-200 text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
              aria-label="Previous testimonial"
            >
              <FiArrowLeft size={20} />
            </button>

            <div className="flex space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial
                      ? 'bg-primary-600'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="p-2 rounded-full bg-white shadow-sm border border-gray-200 text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
              aria-label="Next testimonial"
            >
              <FiArrowRight size={20} />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
