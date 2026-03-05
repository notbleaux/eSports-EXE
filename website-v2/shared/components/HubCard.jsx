/**
 * NJZ Platform v2 - HubCard Component
 * Glassmorphic card for hub navigation with hover effects
 * 
 * @version 2.0.0
 * @requires react, framer-motion
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Hub card props
 * @typedef {Object} HubCardProps
 * @property {string} title - Hub title
 * @property {string} description - Hub description
 * @property {string} [icon] - Icon component or emoji
 * @property {string} [image] - Background image URL
 * @property {string} [color='cyan'] - Accent color (cyan, amber, gold)
 * @property {string} [href] - Link destination
 * @property {number} [index=0] - Card index for stagger animation
 * @property {Function} [onClick] - Click handler
 * @property {React.ReactNode} [badge] - Optional badge content
 * @property {boolean} [disabled=false] - Disabled state
 * @property {boolean} [glowing=false] - Persistent glow effect
 */

const colorVariants = {
  cyan: {
    accent: '#00f0ff',
    glow: 'rgba(0, 240, 255, 0.4)',
    subtle: 'rgba(0, 240, 255, 0.1)',
  },
  amber: {
    accent: '#ff9f1c',
    glow: 'rgba(255, 159, 28, 0.4)',
    subtle: 'rgba(255, 159, 28, 0.1)',
  },
  gold: {
    accent: '#c9b037',
    glow: 'rgba(201, 176, 55, 0.4)',
    subtle: 'rgba(201, 176, 55, 0.1)',
  },
};

export function HubCard({
  title,
  description,
  icon = '🌐',
  image = null,
  color = 'cyan',
  href = '#',
  index = 0,
  onClick,
  badge = null,
  disabled = false,
  glowing = false,
  className = '',
  ...props
}) {
  const [isHovered, setIsHovered] = useState(false);
  const colors = colorVariants[color] || colorVariants.cyan;

  const handleClick = (e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.95,
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 20,
        delay: index * 0.1,
      },
    },
  };

  return (
    <motion.a
      href={disabled ? undefined : href}
      className={`njz-hub-card ${disabled ? 'njz-hub-card--disabled' : ''} ${glowing ? 'njz-hub-card--glowing' : ''} ${className}`}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      whileHover={disabled ? {} : { y: -8, scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
      style={{
        '--hub-accent': colors.accent,
        '--hub-glow': colors.glow,
        '--hub-subtle': colors.subtle,
      }}
      {...props}
    >
      {/* Background gradient */}
      <div className="njz-hub-card__bg" />
      
      {/* Image background if provided */}
      {image && (
        <div 
          className="njz-hub-card__image"
          style={{ backgroundImage: `url(${image})` }}
        />
      )}

      {/* Glow effect */}
      <motion.div 
        className="njz-hub-card__glow"
        animate={{
          opacity: isHovered || glowing ? 1 : 0,
          scale: isHovered ? 1.2 : 1,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Content */}
      <div className="njz-hub-card__content">
        {/* Icon */}
        <motion.div 
          className="njz-hub-card__icon"
          animate={{
            scale: isHovered ? 1.1 : 1,
            rotate: isHovered ? 5 : 0,
          }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {icon}
        </motion.div>

        {/* Text content */}
        <div className="njz-hub-card__text">
          <h3 className="njz-hub-card__title">
            {title}
            {badge && (
              <span className="njz-hub-card__badge">{badge}</span>
            )}
          </h3>
          <p className="njz-hub-card__description">{description}</p>
        </div>

        {/* Arrow indicator */}
        <motion.div 
          className="njz-hub-card__arrow"
          animate={{
            x: isHovered ? 4 : 0,
            opacity: isHovered ? 1 : 0.5,
          }}
        >
          →
        </motion.div>
      </div>

      {/* Border highlight */}
      <motion.div 
        className="njz-hub-card__border"
        animate={{
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Corner accent */}
      <div className="njz-hub-card__corner" />

      <style jsx>{`
        .njz-hub-card {
          position: relative;
          display: block;
          background: rgba(26, 26, 36, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 32px;
          text-decoration: none;
          overflow: hidden;
          cursor: ${disabled ? 'not-allowed' : 'pointer'};
          transition: box-shadow 0.3s ease;
        }

        .njz-hub-card:hover {
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.4),
            0 0 60px var(--hub-glow);
        }

        .njz-hub-card--disabled {
          opacity: 0.5;
          pointer-events: none;
        }

        .njz-hub-card--glowing {
          box-shadow: 0 0 40px var(--hub-glow);
        }

        .njz-hub-card__bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.05) 0%,
            transparent 50%,
            var(--hub-subtle) 100%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .njz-hub-card:hover .njz-hub-card__bg {
          opacity: 1;
        }

        .njz-hub-card__image {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          opacity: 0.15;
          transition: opacity 0.3s ease, transform 0.5s ease;
        }

        .njz-hub-card:hover .njz-hub-card__image {
          opacity: 0.25;
          transform: scale(1.05);
        }

        .njz-hub-card__glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, var(--hub-glow) 0%, transparent 70%);
          opacity: 0;
          pointer-events: none;
        }

        .njz-hub-card__content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .njz-hub-card__icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          background: linear-gradient(135deg, var(--hub-subtle), transparent);
          border: 1px solid var(--hub-subtle);
          border-radius: 12px;
        }

        .njz-hub-card__text {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .njz-hub-card__title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .njz-hub-card__badge {
          font-size: 0.7rem;
          font-weight: 500;
          padding: 4px 10px;
          background: var(--hub-accent);
          color: #0a0a0f;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .njz-hub-card__description {
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
          margin: 0;
        }

        .njz-hub-card__arrow {
          position: absolute;
          bottom: 32px;
          right: 32px;
          font-size: 1.25rem;
          color: var(--hub-accent);
        }

        .njz-hub-card__border {
          position: absolute;
          inset: 0;
          border: 1px solid var(--hub-accent);
          border-radius: 16px;
          opacity: 0;
          pointer-events: none;
        }

        .njz-hub-card__corner {
          position: absolute;
          top: 0;
          right: 0;
          width: 60px;
          height: 60px;
          background: linear-gradient(
            135deg,
            transparent 50%,
            var(--hub-subtle) 100%
          );
          border-top-right-radius: 16px;
          opacity: 0.5;
        }
      `}</style>
    </motion.a>
  );
}

export default HubCard;
