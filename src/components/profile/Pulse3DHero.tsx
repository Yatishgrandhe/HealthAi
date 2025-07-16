"use client";

import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";

export default function Pulse3DHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="w-full"
    >
      <div className="w-full h-64 md:h-80 rounded-3xl overflow-hidden shadow-xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 mb-6">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Sphere args={[1, 100, 200]} scale={2}>
            <meshStandardMaterial
              color="#ffffff"
              wireframe
              transparent
              opacity={0.3}
            />
          </Sphere>
          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white font-heading font-bold text-lg drop-shadow-lg">Health AI 3D</div>
        </div>
      </div>
    </motion.div>
  );
} 