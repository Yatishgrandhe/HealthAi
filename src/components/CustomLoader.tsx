import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function CustomLoader({ loading }: { loading: boolean }) {
  const [showLine, setShowLine] = useState(false);
  const [showLight, setShowLight] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [showLogoText, setShowLogoText] = useState(false);

  useEffect(() => {
    if (loading) {
      // Sequence: logo in -> line -> light -> heart -> text
      setTimeout(() => setShowLine(true), 400); // line after logo
      setTimeout(() => setShowLight(true), 1100); // light after line
      setTimeout(() => setShowHeart(true), 1800); // heart after light
      setTimeout(() => setShowLogoText(true), 2600); // text after heart
    } else {
      // Reset states when loading is false
      setShowLine(false);
      setShowLight(false);
      setShowHeart(false);
      setShowLogoText(false);
    }
  }, [loading]);

  // SVG paths (approximate, can be tweaked for style)
  const pulsePath = "M 40 100 Q 60 80 80 100 Q 100 120 120 100 Q 140 80 160 100";
  const heartPath = "M160 100 C180 60 240 60 240 100 C240 160 160 200 160 260 C160 200 80 160 80 100 C80 60 140 60 160 100 Z";

  if (!loading) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: loading ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0066CC 0%, #232946 100%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        pointerEvents: loading ? 'auto' : 'none',
      }}
    >
      {/* Logo image entrance */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ position: 'relative', width: 180, height: 180, zIndex: 2 }}
      >
        <img 
          src="/health-ai-logo.png" 
          alt="Health AI Logo" 
          width={180} 
          height={180} 
          style={{
            objectFit: 'contain',
            borderRadius: '50%',
            background: 'transparent',
            display: 'block'
          }}
          onError={(e) => {
            console.error('Failed to load logo:', e);
          }}
        />
        {/* SVG overlay for animation */}
        <svg width="320" height="320" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
          {/* Pulse/ECG line */}
          {showLine && (
            <motion.path
              d={pulsePath}
              fill="none"
              stroke="#fff"
              strokeWidth={4}
              strokeDasharray={320}
              strokeDashoffset={320}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
            />
          )}
          {/* Glowing light moving along the line */}
          {showLight && (
            <motion.circle
              r={8}
              fill="url(#glow)"
              initial={{ cx: 40, cy: 100, opacity: 0 }}
              animate={{
                cx: 160,
                cy: 100,
                opacity: [0, 1, 1, 0],
              }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
            />
          )}
          <defs>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff" stopOpacity="1" />
              <stop offset="100%" stopColor="#f093fb" stopOpacity="0.2" />
            </radialGradient>
          </defs>
          {/* Heart outline traced by the light */}
          {showHeart && (
            <motion.path
              d={heartPath}
              fill="none"
              stroke="#fff"
              strokeWidth={4}
              strokeDasharray={600}
              strokeDashoffset={600}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            />
          )}
        </svg>
      </motion.div>
      {/* Logo text fade in at the end */}
      {showLogoText && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ marginTop: 32, fontSize: 48, fontWeight: 700, color: '#fff', textShadow: '0 2px 16px #764ba2' }}
        >
          Health AI
        </motion.div>
      )}
    </motion.div>
  );
} 