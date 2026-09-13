'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { navItems } from '@/lib/data';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setMobileOpen(false);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileOpen, handleKeyDown]);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 h-[84px] flex items-center transition-all duration-500 ${
          scrolled
            ? 'bg-rave-black/85 backdrop-blur-xl border-b border-white/[0.08] shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo with glow animation */}
          <Link href="/" className="flex items-center group -ml-2 select-none" aria-label="Connection Rave Home">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative"
            >
              {/* Subtle glow effect */}
              <motion.div
                className="absolute inset-0 bg-rave-red/20 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ margin: '-10px' }}
              />
              <img
                src="/assets/logo-connection.png"
                alt="Connection Sound Meets Soul"
                className="h-[52px] sm:h-[58px] w-auto object-contain relative z-10"
              />
            </motion.div>
          </Link>

          {/* Desktop Nav with enhanced hover effects */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item, index) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  key={item.href}
                  href={item.href}
                  className={`font-heading uppercase tracking-[0.15em] text-[17px] font-bold px-4 py-2 rounded-lg transition-all duration-300 relative overflow-hidden group ${
                    item.href === '/'
                      ? 'text-white'
                      : 'text-rave-muted hover:text-white'
                  }`}
                >
                  {/* Background glow on hover */}
                  <motion.div
                    className="absolute inset-0 bg-rave-red/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={{ scale: 0.8 }}
                    whileHover={{ scale: 1 }}
                  />

                  {/* Text */}
                  <span className="relative z-10 inline-block">
                    {item.label}
                  </span>

                  {/* Underline animation */}
                  {item.href === '/' ? (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute bottom-1 left-4 right-4 h-[2px] bg-rave-red rounded-full shadow-[0_0_8px_#ff173d]"
                      initial={{ scaleX: 1 }}
                    />
                  ) : (
                    <>
                      <motion.span
                        className="absolute bottom-1 left-4 right-4 h-[2px] bg-rave-red/50 rounded-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                        style={{ transformOrigin: 'left' }}
                      />
                    </>
                  )}

                  {/* Glow on active */}
                  {item.href === '/' && (
                    <span
                      className="absolute inset-0 rounded-lg animate-border-glow"
                    />
                  )}
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Mobile Toggle with enhanced animation */}
          <div className="flex items-center gap-4 lg:hidden">
            <motion.button
              className="w-10 h-10 flex items-center justify-center text-white hover:text-rave-red transition-colors rounded-lg hover:bg-rave-red/10"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer with spring animation */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[300px] sm:w-[360px] bg-rave-deep z-[70] flex flex-col shadow-2xl"
            >
              {/* Header */}
              <motion.div
                className="flex items-center justify-between p-6 border-b border-white/[0.08]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <span className="font-heading text-lg font-bold tracking-wider text-white">MENU</span>
                <motion.button
                  onClick={() => setMobileOpen(false)}
                  className="w-10 h-10 flex items-center justify-center text-white hover:text-rave-red transition-colors rounded-lg hover:bg-rave-red/10"
                  aria-label="Close menu"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </motion.div>

              {/* Nav items with stagger animation */}
              <nav className="flex-1 flex flex-col p-6 gap-2">
                {navItems.map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block font-heading uppercase tracking-[0.2em] text-lg py-3 px-4 rounded-xl transition-all duration-300 ${
                        item.href === '/'
                          ? 'text-rave-red bg-rave-red/10 border-l-2 border-rave-red shadow-[0_0_15px_rgba(255,23,61,0.3)]'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Footer decoration */}
              <motion.div
                className="p-6 border-t border-white/[0.08]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center justify-center gap-4">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-rave-red/50"
                      animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [1, 1.3, 1],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
