import React from 'react';
import { assets } from '../assets/assets';
import { NavLink } from 'react-router-dom';
import { FaPhone, FaEnvelope, FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 mt-20">
      <div className="container mx-auto px-6 py-12 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Information */}
          <div className="md:col-span-2">
            <NavLink to="/" className="inline-block mb-6">
              <img 
                className="w-40 h-auto" 
                src={assets.logo} 
                alt="FeelsFix Logo" 
                loading="lazy"
              />
            </NavLink>
            <p className="text-gray-600 leading-relaxed mb-6">
              FeelsFix is your trusted platform for accessible and professional online therapy. 
              We connect clients with licensed therapists, offering seamless appointment booking, 
              insightful wellness content, and interactive workshops—all in a secure and supportive 
              environment.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" aria-label="Facebook" className="text-gray-600 hover:text-primary transition-colors">
                <FaFacebook size={20} />
              </a>
              <a href="https://twitter.com" aria-label="Twitter" className="text-gray-600 hover:text-primary transition-colors">
                <FaTwitter size={20} />
              </a>
              <a href="https://instagram.com" aria-label="Instagram" className="text-gray-600 hover:text-primary transition-colors">
                <FaInstagram size={20} />
              </a>
              <a href="https://linkedin.com" aria-label="LinkedIn" className="text-gray-600 hover:text-primary transition-colors">
                <FaLinkedin size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <NavLink 
                  to="/" 
                  className="text-gray-600 hover:text-primary transition-colors"
                  activeClassName="text-primary font-medium"
                >
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/doctors" 
                  className="text-gray-600 hover:text-primary transition-colors"
                  activeClassName="text-primary font-medium"
                >
                  Our Therapists
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/about" 
                  className="text-gray-600 hover:text-primary transition-colors"
                  activeClassName="text-primary font-medium"
                >
                  About Us
                </NavLink>
              </li>
              
              
              <li>
                <NavLink 
                  to="/inquiry" 
                  className="text-gray-600 hover:text-primary transition-colors"
                  activeClassName="text-primary font-medium"
                >
                  Inquiry
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Contact Us</h3>
            <address className="not-italic text-gray-600 space-y-4">
              <div className="flex items-start">
                <FaPhone className="mt-1 mr-3 flex-shrink-0" />
                <a href="tel:+94701234567" className="hover:text-primary transition-colors">
                  +94 70 123 4567
                </a>
              </div>
              <div className="flex items-start">
                <FaEnvelope className="mt-1 mr-3 flex-shrink-0" />
                <a href="mailto:feelsfix@gmail.com" className="hover:text-primary transition-colors">
                  feelsfix@gmail.com
                </a>
              </div>
              
            </address>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              &copy; {currentYear} FeelsFix. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <NavLink 
                to="/privacy-policy" 
                className="text-gray-500 hover:text-primary text-sm transition-colors"
              >
                Privacy Policy
              </NavLink>
              <NavLink 
                to="/terms-of-service" 
                className="text-gray-500 hover:text-primary text-sm transition-colors"
              >
                Terms of Service
              </NavLink>
              <NavLink 
                to="/cookies" 
                className="text-gray-500 hover:text-primary text-sm transition-colors"
              >
                Cookie Policy
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;