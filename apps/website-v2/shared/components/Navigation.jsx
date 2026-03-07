/**
 * NJZ Platform v2 - Navigation Component
 * Glassmorphic navigation with fluid animations
 * 
 * @version 2.0.0
 * @requires react, framer-motion
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Navigation link item
 * @typedef {Object} NavLink
 * @property {string} label - Display text
 * @property {string} href - Link URL
 * @property {boolean} [external] - Whether link opens externally
 * @property {string} [icon] - Optional icon name
 */

/**
 * Navigation props
 * @typedef {Object} NavigationProps
 * @property {NavLink[]} links - Navigation links
 * @property {string} [logo] - Logo text or component
 * @property {React.ReactNode} [logoComponent] - Custom logo component
 * @property {boolean} [glassEffect=true] - Enable glassmorphism
 * @property {boolean} [fixed=true] - Fixed position
 * @property {Function} [onNavigate] - Navigation callback
 * @property {string} [activePath] - Currently active path
 * @property {React.ReactNode} [actions] - Additional action buttons
 */

const navVariants = {
  hidden: { y: -100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
      staggerChildren: 0.05,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: -20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

const mobileMenuVariants = {
  closed: {
    opacity: 0,
    x: '100%',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 40,
    },
  },
  open: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 40,
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export function Navigation({
  links = [],
  logo = 'NJZ',
  logoComponent = null,
  glassEffect = true,
  fixed = true,
  onNavigate,
  activePath = '/',
  actions = null,
  className = '',
  ...props
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const navRef = useRef(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleLinkClick = (href, e) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(href);
    }
    setMobileOpen(false);
  };

  const navClasses = [
    'njz-nav',
    fixed && 'njz-nav--fixed',
    scrolled && 'njz-nav--scrolled',
    glassEffect && 'njz-nav--glass',
    className,
  ].filter(Boolean).join(' ');

  return (
    <>
      <motion.nav
        ref={navRef}
        className={navClasses}
        initial="hidden"
        animate="visible"
        variants={navVariants}
        {...props}
      >
        <div className="njz-nav__container">
          {/* Logo */}
          <motion.a
            href="/"
            className="njz-nav__logo"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => handleLinkClick('/', e)}
          >
            {logoComponent || (
              <span className="njz-nav__logo-text">{logo}</span>
            )}
          </motion.a>

          {/* Desktop Navigation */}
          <motion.ul className="njz-nav__links" variants={navVariants}>
            {links.map((link, index) => (
              <motion.li
                key={link.href || index}
                className="njz-nav__item"
                variants={itemVariants}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <motion.a
                  href={link.href}
                  className={`njz-nav__link ${
                    activePath === link.href ? 'njz-nav__link--active' : ''
                  }`}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  onClick={(e) => handleLinkClick(link.href, e)}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  {link.icon && (
                    <span className="njz-nav__link-icon">{link.icon}</span>
                  )}
                  <span className="njz-nav__link-text">{link.label}</span>
                  
                  {/* Hover indicator */}
                  <AnimatePresence>
                    {hoveredIndex === index && (
                      <motion.span
                        className="njz-nav__link-indicator"
                        layoutId="navIndicator"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </AnimatePresence>
                </motion.a>
              </motion.li>
            ))}
          </motion.ul>

          {/* Actions */}
          <motion.div className="njz-nav__actions" variants={itemVariants}>
            {actions}
          </motion.div>

          {/* Mobile Menu Button */}
          <motion.button
            className="njz-nav__mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            variants={itemVariants}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <span className={`njz-nav__hamburger ${mobileOpen ? 'is-open' : ''}`}>
              <span />
              <span />
              <span />
            </span>
          </motion.button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="njz-nav__mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="njz-nav__mobile-menu"
              initial="closed"
              animate="open"
              exit="closed"
              variants={mobileMenuVariants}
            >
              <motion.ul className="njz-nav__mobile-links">
                {links.map((link, index) => (
                  <motion.li
                    key={link.href || index}
                    className="njz-nav__mobile-item"
                    variants={itemVariants}
                  >
                    <motion.a
                      href={link.href}
                      className={`njz-nav__mobile-link ${
                        activePath === link.href ? 'njz-nav__mobile-link--active' : ''
                      }`}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      onClick={(e) => handleLinkClick(link.href, e)}
                      whileHover={{ x: 10 }}
                    >
                      <span className="njz-nav__mobile-link-text">{link.label}</span>
                      <motion.span
                        className="njz-nav__mobile-link-arrow"
                        initial={{ x: -10, opacity: 0 }}
                        whileHover={{ x: 0, opacity: 1 }}
                      >
                        →
                      </motion.span>
                    </motion.a>
                  </motion.li>
                ))}
              </motion.ul>

              {actions && (
                <motion.div
                  className="njz-nav__mobile-actions"
                  variants={itemVariants}
                >
                  {actions}
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .njz-nav {
          position: ${fixed ? 'fixed' : 'relative'};
          top: 0;
          left: 0;
          right: 0;
          z-index: 200;
          height: 72px;
          transition: all 0.3s ease;
        }

        .njz-nav--fixed {
          position: fixed;
        }

        .njz-nav--glass {
          background: linear-gradient(
            to bottom,
            rgba(10, 10, 15, 0.9) 0%,
            rgba(10, 10, 15, 0.7) 50%,
            rgba(10, 10, 15, 0.4) 100%
          );
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .njz-nav--scrolled {
          background: rgba(26, 26, 36, 0.8);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .njz-nav__container {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 24px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .njz-nav__logo {
          display: flex;
          align-items: center;
          text-decoration: none;
          color: #ffffff;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 1.5rem;
          letter-spacing: -0.02em;
        }

        .njz-nav__logo-text {
          background: linear-gradient(135deg, #00f0ff, #ffffff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .njz-nav__links {
          display: none;
          list-style: none;
          gap: 8px;
          margin: 0;
          padding: 0;
        }

        @media (min-width: 768px) {
          .njz-nav__links {
            display: flex;
          }
        }

        .njz-nav__item {
          position: relative;
        }

        .njz-nav__link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          border-radius: 8px;
          transition: color 0.2s ease;
          position: relative;
        }

        .njz-nav__link:hover {
          color: #ffffff;
        }

        .njz-nav__link--active {
          color: #00f0ff;
        }

        .njz-nav__link-indicator {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          background: #00f0ff;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
        }

        .njz-nav__actions {
          display: none;
          align-items: center;
          gap: 12px;
        }

        @media (min-width: 768px) {
          .njz-nav__actions {
            display: flex;
          }
        }

        .njz-nav__mobile-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          cursor: pointer;
          padding: 0;
        }

        @media (min-width: 768px) {
          .njz-nav__mobile-toggle {
            display: none;
          }
        }

        .njz-nav__hamburger {
          display: flex;
          flex-direction: column;
          gap: 5px;
          width: 20px;
        }

        .njz-nav__hamburger span {
          display: block;
          height: 2px;
          background: #ffffff;
          border-radius: 2px;
          transition: all 0.3s ease;
          transform-origin: center;
        }

        .njz-nav__hamburger.is-open span:nth-child(1) {
          transform: translateY(7px) rotate(45deg);
        }

        .njz-nav__hamburger.is-open span:nth-child(2) {
          opacity: 0;
        }

        .njz-nav__hamburger.is-open span:nth-child(3) {
          transform: translateY(-7px) rotate(-45deg);
        }

        .njz-nav__mobile-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 10, 15, 0.8);
          backdrop-filter: blur(10px);
          z-index: 199;
        }

        .njz-nav__mobile-menu {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          max-width: 400px;
          background: rgba(18, 18, 26, 0.98);
          backdrop-filter: blur(40px);
          z-index: 201;
          padding: 100px 32px 32px;
          border-left: 1px solid rgba(255, 255, 255, 0.08);
        }

        .njz-nav__mobile-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .njz-nav__mobile-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 0;
          color: #ffffff;
          text-decoration: none;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.25rem;
          font-weight: 600;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .njz-nav__mobile-link--active {
          color: #00f0ff;
        }

        .njz-nav__mobile-actions {
          margin-top: 32px;
          padding-top: 32px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </>
  );
}

export default Navigation;
