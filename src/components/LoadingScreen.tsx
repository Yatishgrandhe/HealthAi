import { motion, AnimatePresence } from 'framer-motion';


interface LoadingScreenProps {
  loading: boolean;
}

export default function LoadingScreen({ loading }: LoadingScreenProps) {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Rotating gradient ring behind logo */}
          <motion.div
            style={{
              position: 'absolute',
              width: 180,
              height: 180,
              borderRadius: '50%',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
              background: 'conic-gradient(from 0deg, #ff6b6b, #4ecdc4, #7B61FF, #f093fb, #ff6b6b)',
              filter: 'blur(2px) brightness(1.1)',
              opacity: 0.7,
            }}
            animate={{ rotate: [0, 360] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          />
          {/* Pulsing logo */}
          <motion.div
            style={{ zIndex: 2 }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.12, 1], opacity: 1 }}
            transition={{ duration: 1.2, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
          >
            <img 
          src="/health-ai-logo.png" 
          alt="Health AI Logo" 
          width={120} 
          height={120} 
          style={{
            borderRadius: '50%',
            background: 'transparent',
            display: 'block'
          }}
        />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 