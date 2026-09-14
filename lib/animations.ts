import { Variants } from 'framer-motion';

const easeCubic = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];
const easeElastic = [0.68, -0.55, 0.265, 1.55] as [number, number, number, number];

// ===== SPRING PRESETS =====
export const springBounce = { type: "spring" as const, stiffness: 300, damping: 15 };
export const springSoft = { type: "spring" as const, stiffness: 100, damping: 20 };
export const springSnappy = { type: "spring" as const, stiffness: 400, damping: 17 };

// ===== FADE VARIANTS =====
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeCubic } },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: easeCubic }
  },
};

// ===== SLIDE VARIANTS =====
export const slideLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: easeCubic } },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: easeCubic } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeCubic }
  },
};

// ===== SCALE VARIANTS =====
export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springBounce
  },
};

export const bounceIn: Variants = {
  hidden: { opacity: 0, scale: 0.3 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 12 }
  },
};

export const elasticIn: Variants = {
  hidden: { opacity: 0, scale: 0, rotate: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: "spring", stiffness: 200, damping: 12 }
  },
};

// ===== SPECIAL VARIANTS =====
export const glitchIn: Variants = {
  hidden: { opacity: 0, x: -50, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: easeCubic }
  },
};

export const clipReveal: Variants = {
  hidden: { clipPath: "inset(100% 0 0 0)" },
  visible: {
    clipPath: "inset(0% 0 0 0)",
    transition: { duration: 0.8, ease: easeCubic }
  },
};

export const clipRevealLeft: Variants = {
  hidden: { clipPath: "inset(0 100% 0 0)" },
  visible: {
    clipPath: "inset(0 0% 0 0)",
    transition: { duration: 0.7, ease: easeCubic }
  },
};

export const rotateIn: Variants = {
  hidden: { opacity: 0, rotate: -15, scale: 0.9 },
  visible: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: { duration: 0.6, ease: easeCubic }
  },
};

// ===== STAGGER VARIANTS =====
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export const staggerContainerSlow: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerSlow: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

// ===== PARALLAX VARIANTS =====
export const parallaxDown: Variants = {
  hidden: { y: -50, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 1 } },
};

export const parallaxUp: Variants = {
  hidden: { y: 50, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.8 } },
};

// ===== HOVER VARIANTS =====
export const hoverLift: Variants = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -8,
    scale: 1.02,
    transition: springSnappy
  },
};

export const hoverGlow: Variants = {
  rest: { boxShadow: "0 0 10px rgba(255, 23, 61, 0.2)" },
  hover: {
    boxShadow: "0 0 30px rgba(255, 23, 61, 0.5)",
    transition: springSnappy
  },
};

// ===== LOOP ANIMATIONS (for use with animate prop) =====
export const loopPulse = {
  scale: [1, 1.05, 1],
  transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
};

export const loopFloat = {
  y: [0, -15, 0],
  transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
};

export const loopRotate = {
  rotate: [0, 360],
  transition: { duration: 8, repeat: Infinity, ease: "linear" }
};

export const loopShake = {
  x: [-5, 5, -5],
  transition: { duration: 0.3, repeat: Infinity, ease: "easeInOut" }
};

// ===== ABOUT-PAGE-SPECIFIC VARIANTS =====
// Reused across the /about tree. Components should prefer these over
// ad-hoc inlining.

export const aboutReveal: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: easeCubic,
    },
  },
};

export const aboutStagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export const aboutHeroLineReveal: Variants = {
  hidden: { y: 50, opacity: 0, clipPath: 'inset(100% 0 0 0)' },
  visible: {
    y: 0,
    opacity: 1,
    clipPath: 'inset(0% 0 0 0)',
    transition: { duration: 0.7, ease: easeCubic },
  },
};

export const aboutImageReveal: Variants = {
  hidden: { scale: 1.06, clipPath: 'inset(0 0 100% 0)' },
  visible: {
    scale: 1,
    clipPath: 'inset(0 0 0% 0)',
    transition: { duration: 1.0, ease: easeCubic },
  },
};

export const aboutCardLift: Variants = {
  rest: { y: 0, scale: 1 },
  hover: { y: -8, scale: 1.015, transition: springSnappy },
};
