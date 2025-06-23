import { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';
import { motion } from 'framer-motion';
import { FiMenu, FiX } from 'react-icons/fi';
import Logo from './Logo';


const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isLoginPage = location.pathname === '/admin' || location.pathname === '/tutor';

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (location.pathname === '/admin-dashboard' || location.pathname === '/tutor-dashboard') return null;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: 'about' },
    { name: 'Programs', path: 'programs' },
    { name: 'Impact', path: 'impact' },
    { name: 'Contact', path: 'contact' },
    { name: 'Admin', path: '/admin', special: true },
    { name: 'Tutor', path: '/tutor', special: true }
  ];

  const showLogoHalo = location.pathname === '/' && !isScrolled && !isLoginPage;

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isLoginPage
        ? 'bg-white shadow-md py-2'
        : isScrolled
          ? 'bg-white shadow-md py-2'
          : 'bg-transparent py-4'
    }`}>
      <div className="container-custom">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <RouterLink to="/" className="relative z-10" onClick={closeMenu}>
            <div className="flex items-center">
              <span
                className={`relative ${showLogoHalo ? 'after:content-[" "] after:absolute after:left-1/2 after:top-1/2 after:w-[110%] after:h-[110%] after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-white after:opacity-60 after:blur-[8px] after:-z-10' : ''}`}
                style={{ display: 'inline-block' }}
              >
                <Logo useLink={false} />
              </span>
            </div>
          </RouterLink>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) =>
              !link.special ? (
                location.pathname === '/' ? (
                  <ScrollLink
                    key={link.name}
                    to={link.path}
                    smooth={true}
                    duration={500}
                    offset={-70}
                    className={`px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${
                      (isScrolled || isLoginPage)
                        ? 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                        : 'text-white hover:text-accent-300'
                    }`}
                    onClick={closeMenu}
                  >
                    {link.name}
                  </ScrollLink>
                ) : (
                  <RouterLink
                    key={link.name}
                    to={`/#${link.path}`}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      (isScrolled || isLoginPage)
                        ? 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                        : 'text-white hover:text-accent-300'
                    }`}
                    onClick={closeMenu}
                  >
                    {link.name}
                  </RouterLink>
                )
              ) : null
            )}

            {/* Special Buttons */}
            <div className="ml-6 flex items-center space-x-2">
              {navLinks.filter(link => link.special).map((link) => (
                <RouterLink
                  key={link.name}
                  to={link.path}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    link.name === 'Admin'
                      ? 'bg-secondary-600 text-white hover:bg-secondary-700'
                      : link.name === 'Tutor'
                        ? 'bg-accent-600 text-white hover:bg-accent-700'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                  } ${isLoginPage ? 'shadow' : ''}`}
                  onClick={closeMenu}
                >
                  {link.name}
                </RouterLink>
              ))}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className={`p-2 rounded-md ${
                (isScrolled || isLoginPage) ? 'text-gray-700 hover:text-primary-600' : 'text-white hover:text-accent-300'
              }`}
            >
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="md:hidden bg-white shadow-lg absolute top-full left-0 right-0 overflow-hidden"
        >
          <div className="px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((link) =>
              !link.special ? (
                location.pathname === '/' ? (
                  <ScrollLink
                    key={link.name}
                    to={link.path}
                    smooth={true}
                    duration={500}
                    offset={-70}
                    className={`block px-3 py-2 text-base font-medium rounded-md cursor-pointer ${
                      (isScrolled || isLoginPage || showLogoHalo)
                        ? 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                        : 'text-white hover:text-accent-300'
                    }`}
                    onClick={closeMenu}
                  >
                    {link.name}
                  </ScrollLink>
                ) : (
                  <RouterLink
                    key={link.name}
                    to={`/#${link.path}`}
                    className={`block px-3 py-2 text-base font-medium rounded-md cursor-pointer ${
                      (isScrolled || isLoginPage || showLogoHalo)
                        ? 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                        : 'text-white hover:text-accent-300'
                    }`}
                    onClick={closeMenu}
                  >
                    {link.name}
                  </RouterLink>
                )
              ) : null
            )}

            {/* Mobile Admin/Tutor */}
            {navLinks.filter(link => link.special).map((link) => (
              <RouterLink
                key={link.name}
                to={link.path}
                className={`block px-4 py-2 text-sm font-medium rounded-md ${
                  (link.name === 'Admin'
                    ? 'bg-secondary-600 text-white hover:bg-secondary-700'
                    : link.name === 'Tutor'
                      ? 'bg-accent-600 text-white hover:bg-accent-700'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  )}
                }`}
                onClick={closeMenu}
              >
                {link.name}
              </RouterLink>
            ))}
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
