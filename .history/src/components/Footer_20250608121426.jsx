import { useLocation } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';
import { FiMail, FiPhone, FiMapPin, FiHeart } from 'react-icons/fi';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa';

const Footer = () => {
  const location = useLocation();

  // ✅ Define where to show the footer
  const showFooterOn = ['/', '/admin', '/tutor'];
  const showFooter = showFooterOn.includes(location.pathname);

  if (!showFooter) return null; // 🔥 Hide footer on other pages
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold mb-4">The Quran Foundation</h3>
            <p className="text-gray-300 mb-6 max-w-md">
              A non-profit organization dedicated to transforming the lives of marginalized communities through education, 
              social and cultural advancement in Hyderabad, India.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-accent-500 transition-colors">
                <FaFacebook size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-accent-500 transition-colors">
                <FaTwitter size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-accent-500 transition-colors">
                <FaInstagram size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-accent-500 transition-colors">
                <FaYoutube size={20} />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><ScrollLink to="home" smooth={true} duration={500} offset={-70} className="cursor-pointer text-gray-300 hover:text-accent-500 transition-colors">Home</ScrollLink></li>
              <li><ScrollLink to="about" smooth={true} duration={500} offset={-70} className="cursor-pointer text-gray-300 hover:text-accent-500 transition-colors">About Us</ScrollLink></li>
              <li><ScrollLink to="programs" smooth={true} duration={500} offset={-70} className="cursor-pointer text-gray-300 hover:text-accent-500 transition-colors">Our Programs</ScrollLink></li>
              <li><ScrollLink to="impact" smooth={true} duration={500} offset={-70} className="cursor-pointer text-gray-300 hover:text-accent-500 transition-colors">Our Impact</ScrollLink></li>
              <li><ScrollLink to="contact" smooth={true} duration={500} offset={-70} className="cursor-pointer text-gray-300 hover:text-accent-500 transition-colors">Contact Us</ScrollLink></li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center">
                <FiMapPin className="mr-3 text-accent-500" size={18} />
                <span className="text-gray-300">Hyderabad, India</span>
              </li>
              <li className="flex items-center">
                <FiPhone className="mr-3 text-accent-500" size={18} />
                <span className="text-gray-300">+91 91218 06777</span>
              </li>
              <li className="flex items-center">
                <FiMail className="mr-3 text-accent-500" size={18} />
                <span className="text-gray-300">thequranfoundation@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Footer */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center md:flex md:justify-between md:items-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} The Quran Foundation. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm mt-2 md:mt-0 flex items-center justify-center">
            Made with <FiHeart className="mx-1 text-accent-500" size={14} /> for the community
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer