import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface HCMLoaderProps {
  size?: number;
  text?: string;
  className?: string;
}

export function HCMLoader({
  size = 180, // Increased base size
  text = "Vérification des permissions...",
  className = ""
}: HCMLoaderProps) {
  const brandName = "LELE HCM";
  const letters = brandName.split("");
  const [lightLogoError, setLightLogoError] = useState(false);
  const [darkLogoError, setDarkLogoError] = useState(false);

  return (
    <div className={`flex flex-col items-center justify-center space-y-6 ${className}`}>
      {/* Conteneur du logo avec aspect-ratio 1:1 pour éviter les déformations */}
      <div
        className="relative flex items-center justify-center flex-shrink-0"
        style={{ width: size * 2, height: size * 2, aspectRatio: '1 / 1' }}
      >

        {/* --- 1. FIRST ANIMATION ELEMENTS (Rings & Particles) --- */}

        {/* Outer Rotating Gradient Ring - THICKER & MORE DYNAMIC */}
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.05, 1]
          }}
          transition={{
            rotate: { duration: 3, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute inset-0 rounded-full"
        >
          {/* Dark Mode Override via CSS class since inline styles don't support dark: modifier easily without classes, 
               but we can use a separate div or CSS variable. Let's use Tailwind classes for the background instead if possible, 
               or just conditional rendering if we had the theme. 
               Actually, simpler approach: Use two divs or CSS variables. 
               Let's use the `className` approach with `dark:bg-[image:...]` if supported, or just standard CSS variables.
               
               Better yet: Use standard Tailwind gradient classes for the ring color? 
               Conic gradients are tricky in Tailwind. 
               Let's use a CSS variable approach for the colors.
           */}
          <div className="w-full h-full rounded-full dark:hidden" style={{ background: 'conic-gradient(from 0deg, transparent, #1e3a8a, #172554, transparent)' }} />
          <div className="w-full h-full rounded-full hidden dark:block" style={{ background: 'conic-gradient(from 0deg, transparent, #06b6d4, #3b82f6, transparent)' }} />
        </motion.div>

        {/* Mask for the ring (applied to parent or separate) - Re-applying mask to the container of the gradient divs */}
        <div className="absolute inset-0 rounded-full" style={{
          maskImage: 'radial-gradient(transparent 55%, black 55%)',
          WebkitMaskImage: 'radial-gradient(transparent 55%, black 55%)',
        }} />


        {/* Reverse Rotating Inner Ring - Larger */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 m-auto rounded-full border-4 border-dashed border-blue-900/40 dark:border-cyan-500/40"
          style={{ width: '88%', height: '88%' }}
        />

        {/* Orbiting Particles - More visible */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 w-full h-full"
        >
          <div className="absolute top-0 left-1/2 w-4 h-4 rounded-full shadow-[0_0_20px_rgba(30,58,138,0.5)] dark:shadow-[0_0_20px_#22d3ee] bg-blue-900 dark:bg-cyan-400 -translate-x-1/2 -translate-y-1/2" />
        </motion.div>

        {/* --- 2. DEBRIEF ELEMENTS (Logo V2 & Glow) --- */}

        {/* Deep Space Glow - INTENSE */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 m-auto rounded-full blur-[60px] bg-blue-900/20 dark:bg-blue-600/40"
          style={{ width: '130%', height: '130%' }}
        />

        {/* The Logo - MAXIMIZED SIZE & CLIPPED (Dark) / CLEAN (Light) */}
        {/* FIXED: Logo appears immediately (no initial opacity:0 delay) */}
        <motion.div
          initial={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.1 }}
          className="relative z-10 p-0 flex items-center justify-center"
        >
          {/* Light Mode Logo (No Clipping needed as per user) */}
          {!lightLogoError ? (
            <img
              src="/hcm-logo-light.png"
              alt="LELE HCM Logo"
              onError={() => setLightLogoError(true)}
              style={{
                width: size * 1.5,
                height: size * 1.5,
                objectFit: 'contain',
                transform: 'scale(1.2)'
              }}
              className="dark:hidden drop-shadow-[0_0_40px_rgba(30,58,138,0.6)]"
            />
          ) : (
            <div
              className="dark:hidden flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 drop-shadow-[0_0_40px_rgba(30,58,138,0.6)]"
              style={{ width: size * 0.8, height: size * 0.8 }}
            >
              <Sparkles className="w-1/2 h-1/2 text-white" />
            </div>
          )}

          {/* Dark Mode Logo (Clipped) */}
          {!darkLogoError ? (
            <img
              src="/hcm-logo-v2.png"
              alt="LELE HCM Logo"
              onError={() => setDarkLogoError(true)}
              style={{
                width: size * 1.5,
                height: size * 1.5,
                objectFit: 'contain',
                clipPath: 'circle(38% at 50% 50%)',
                transform: 'scale(1.2)'
              }}
              className="hidden dark:block drop-shadow-[0_0_40px_rgba(6,182,212,0.8)]"
            />
          ) : (
            <div
              className="hidden dark:flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 drop-shadow-[0_0_40px_rgba(6,182,212,0.8)]"
              style={{ width: size * 0.8, height: size * 0.8 }}
            >
              <Sparkles className="w-1/2 h-1/2 text-white" />
            </div>
          )}
        </motion.div>
      </div>

      {/* --- 3. EYE-TRACKING TEXT REVEAL --- */}
      <div className="relative flex flex-col items-center">
        <div className="flex items-center justify-center space-x-[2px] overflow-hidden py-2">
          {letters.map((letter, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, x: -20, filter: "blur(5px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.4,
                delay: 0.2 + (index * 0.1), // Faster stagger for 3s total
                ease: "easeOut"
              }}
              className="text-3xl md:text-4xl font-black tracking-wider bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x 
                bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 
                dark:from-cyan-400 dark:via-blue-500 dark:to-cyan-400 
                drop-shadow-[0_0_15px_rgba(30,58,138,0.3)] dark:drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]"
            >
              {letter === " " ? "\u00A0" : letter}
            </motion.span>
          ))}
        </div>

        {/* The "Eye" / Scanning Line */}
        <motion.div
          initial={{ width: "0%", opacity: 0, left: "0%" }}
          animate={{
            width: ["0%", "100%", "0%"],
            opacity: [0, 1, 0],
            left: ["0%", "0%", "100%"]
          }}
          transition={{
            duration: 2,
            delay: 0.2,
            ease: "easeInOut",
            times: [0, 0.5, 1],
            repeat: Infinity,
            repeatDelay: 1
          }}
          className="h-[2px] blur-[1px] w-full absolute bottom-0 
            bg-gradient-to-r from-transparent via-blue-900 to-transparent 
            dark:from-transparent dark:via-cyan-400 dark:to-transparent"
        />

        {/* Status Text */}
        {text && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] animate-pulse"
          >
            {text}
          </motion.p>
        )}
      </div>

      <style>{`
        @keyframes gradient-x {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
            animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
}

export default HCMLoader;
