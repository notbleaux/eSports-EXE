/**
 * NJZ Platform v2 - Footer Component
 * Multi-section footer with abyssal styling
 * 
 * @version 2.0.0
 * @requires react, framer-motion
 */

import React from 'react';
import { motion } from 'framer-motion';

/**
 * Footer link group
 * @typedef {Object} FooterLinkGroup
 * @property {string} title - Section title
 * @property {Array<{label: string, href: string}>} links - Group links
 */

/**
 * Footer props
 * @typedef {Object} FooterProps
 * @property {FooterLinkGroup[]} [linkGroups] - Footer navigation groups
 * @property {string} [logo] - Logo text
 * @property {string} [tagline] - Brand tagline
 * @property {React.ReactNode} [socialLinks] - Social media links
 * @property {string} [copyright] - Copyright text
 * @property {React.ReactNode} [bottomContent] - Additional bottom content
 */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
    },
  },
};

export function Footer({
  linkGroups = [],
  logo = 'NJZ',
  tagline = 'Navigating the digital abyss.',
  socialLinks = null,
  copyright = `© ${new Date().getFullYear()} NJZ Platform. All rights reserved.`,
  bottomContent = null,
  className = '',
  ...props
}) {
  return (
    <footer
      className={`njz-footer ${className}`}
      {...props}
    >
      {/* Top gradient border */}
      <div className="njz-footer__border" />

      <motion.div
        className="njz-footer__container"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={containerVariants}
      >
        {/* Main footer content */}
        <div className="njz-footer__main">
          {/* Brand section */}
          <motion.div className="njz-footer__brand" variants={itemVariants}>
            <a href="/" className="njz-footer__logo">
              {logo}
            </a>
            <p className="njz-footer__tagline">{tagline}</p>
            
            {socialLinks && (
              <div className="njz-footer__social">{socialLinks}</div>
            )}
          </motion.div>

          {/* Link groups */}
          <div className="njz-footer__links">
            {linkGroups.map((group, index) => (
              <motion.div
                key={group.title}
                className="njz-footer__group"
                variants={itemVariants}
              >
                <h4 className="njz-footer__group-title">{group.title}</h4>
                <ul className="njz-footer__group-list">
                  {group.links.map((link) => (
                    <li key={link.href} className="njz-footer__group-item">
                      <a
                        href={link.href}
                        className="njz-footer__link"
                      >
                        <span className="njz-footer__link-text">{link.label}</span>
                        <motion.span
                          className="njz-footer__link-arrow"
                          initial={{ x: -4, opacity: 0 }}
                          whileHover={{ x: 0, opacity: 1 }}
                        >
                          →
                        </motion.span>
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom section */}
        <motion.div className="njz-footer__bottom" variants={itemVariants}>
          <div className="njz-footer__divider" />
          
          <div className="njz-footer__bottom-content">
            <p className="njz-footer__copyright">{copyright}</p>
            
            {bottomContent && (
              <div className="njz-footer__extra">{bottomContent}</div>
            )}
          </div>
        </motion.div>

        {/* Decorative elements */}
        <div className="njz-footer__glow njz-footer__glow--1" />
        <div className="njz-footer__glow njz-footer__glow--2" />
      </motion.div>

      <style>{`
        .njz-footer {
          position: relative;
          background: #0a0a0f;
          padding: 80px 0 40px;
          overflow: hidden;
        }

        .njz-footer__border {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(0, 240, 255, 0.3) 50%,
            transparent 100%
          );
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.2);
        }

        .njz-footer__container {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 24px;
          position: relative;
          z-index: 1;
        }

        .njz-footer__main {
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
          margin-bottom: 48px;
        }

        @media (min-width: 768px) {
          .njz-footer__main {
            grid-template-columns: 1.5fr 2fr;
            gap: 80px;
          }
        }

        @media (min-width: 1024px) {
          .njz-footer__main {
            grid-template-columns: 1fr 2fr;
          }
        }

        .njz-footer__brand {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .njz-footer__logo {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
          text-decoration: none;
          background: linear-gradient(135deg, #00f0ff, #ffffff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .njz-footer__tagline {
          font-family: 'Inter', sans-serif;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
          max-width: 300px;
          margin: 0;
        }

        .njz-footer__social {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .njz-footer__links {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
        }

        @media (min-width: 640px) {
          .njz-footer__links {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .njz-footer__links {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .njz-footer__group {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .njz-footer__group-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0;
        }

        .njz-footer__group-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .njz-footer__link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          transition: color 0.2s ease;
          overflow: hidden;
        }

        .njz-footer__link:hover {
          color: #00f0ff;
        }

        .njz-footer__link-arrow {
          color: #00f0ff;
          font-size: 0.75rem;
        }

        .njz-footer__bottom {
          position: relative;
        }

        .njz-footer__divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin-bottom: 24px;
        }

        .njz-footer__bottom-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: center;
          text-align: center;
        }

        @media (min-width: 640px) {
          .njz-footer__bottom-content {
            flex-direction: row;
            justify-content: space-between;
            text-align: left;
          }
        }

        .njz-footer__copyright {
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.4);
          margin: 0;
        }

        .njz-footer__extra {
          display: flex;
          gap: 24px;
          align-items: center;
        }

        .njz-footer__glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.15;
          pointer-events: none;
        }

        .njz-footer__glow--1 {
          width: 400px;
          height: 400px;
          background: #00f0ff;
          top: -100px;
          left: -100px;
        }

        .njz-footer__glow--2 {
          width: 300px;
          height: 300px;
          background: #c9b037;
          bottom: -50px;
          right: -50px;
        }
      `}</style>
    </footer>
  );
}

export default Footer;
