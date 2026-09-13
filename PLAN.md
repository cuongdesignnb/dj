# Destiny Rave - Nâng Cấp Animation & Visual Effects

## Context
Website Destiny Rave là một landing page cho sự kiện EDM/DJ Event tại Perth. Hiện tại đã có một số animation cơ bản với Framer Motion và CSS keyframes. Dự án cần nâng cấp để đạt được hiệu ứng **club-level, đẳng cấp professional DJ/Event** - phù hợp với ngành nightlife, bar, club, và festival.

---

## 1. Tổng Quan Cấu Trúc Hiện Tại

### Files chính:
- [app/page.tsx](app/page.tsx) - Main page composition
- [components/home/HeroSection.tsx](components/home/HeroSection.tsx) - Hero với particles, lasers, pulsing text
- [components/home/Header.tsx](components/home/Header.tsx) - Navigation với mobile menu
- [components/home/EventOverview.tsx](components/home/EventOverview.tsx) - Event details
- [components/home/LineupPreview.tsx](components/home/LineupPreview.tsx) - Artist cards carousel
- [components/home/TicketsSection.tsx](components/home/TicketsSection.tsx) - Ticket pricing
- [components/home/VipTableSection.tsx](components/home/VipTableSection.tsx) - VIP booking
- [components/home/PartnersFooter.tsx](components/home/PartnersFooter.tsx) - Footer
- [components/home/SectionTitle.tsx](components/home/SectionTitle.tsx) - Section headers với animated bars
- [components/ui/MouseGlow.tsx](components/ui/MouseGlow.tsx) - Mouse-following glow
- [lib/animations.ts](lib/animations.ts) - Framer Motion variants
- [app/globals.css](app/globals.css) - CSS keyframes, neon effects

### Technologies:
- **Framer Motion** v12 - Animation library
- **Tailwind CSS** v4 - Styling
- **Next.js** 16 - Framework
- **Lucide React** - Icons

---

## 2. Animation Effects Cần Thêm

### A. Global Enhancements

#### 2.1.1 Advanced CSS Keyframes ([globals.css](app/globals.css))

Thêm các keyframes mới:

```css
/* Glitch effect cho text */
@keyframes glitch {
  0%, 100% { transform: translate(0); filter: hue-rotate(0deg); }
  20% { transform: translate(-2px, 2px); filter: hue-rotate(90deg); }
  40% { transform: translate(-2px, -2px); filter: hue-rotate(180deg); }
  60% { transform: translate(2px, 2px); filter: hue-rotate(270deg); }
  80% { transform: translate(2px, -2px); filter: hue-rotate(360deg); }
}

/* Neon flicker */
@keyframes neon-flicker {
  0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
    text-shadow:
      0 0 10px #ff173d,
      0 0 20px #ff173d,
      0 0 40px #ff173d,
      0 0 80px #ff173d;
  }
  20%, 24%, 55% {
    text-shadow: none;
  }
}

/* Scan line effect */
@keyframes scanline {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}

/* Ripple/Bass drop effect */
@keyframes bass-ripple {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2.5); opacity: 0; }
}

/* Strobe flash */
@keyframes strobe {
  0%, 100% { opacity: 0; }
  50% { opacity: 0.15; }
}

/* Shimmer */
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

/* Pulse scale */
@keyframes pulse-scale {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Rotate glow */
@keyframes rotate-glow {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

#### 2.1.2 Enhanced Animation Variants ([lib/animations.ts](lib/animations.ts))

Thêm variants mới:

```typescript
// Spring physics presets
export const springBounce = { type: "spring", stiffness: 300, damping: 15 };
export const springSoft = { type: "spring", stiffness: 100, damping: 20 };

// New variants
export const glitchIn: Variants = {
  hidden: { opacity: 0, x: -50, filter: "blur(10px)" },
  visible: {
    opacity: 1, x: 0, filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1, scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 15 }
  }
};

export const rotateIn: Variants = {
  hidden: { opacity: 0, rotate: -10, scale: 0.9 },
  visible: {
    opacity: 1, rotate: 0, scale: 1,
    transition: { duration: 0.6 }
  }
};

export const clipReveal: Variants = {
  hidden: { clipPath: "inset(100% 0 0 0)" },
  visible: {
    clipPath: "inset(0% 0 0 0)",
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

// Stagger với delay nhỏ hơn cho nhiều items
export const staggerFast: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } }
};

// Parallax variants
export const parallaxDown: Variants = {
  hidden: { y: -50, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 1 } }
};
```

### B. Component Enhancements

#### 2.2.1 HeroSection ([components/home/HeroSection.tsx](components/home/HeroSection.tsx))

**Thêm effects:**

1. **Glitch Effect trên "DESTINY" title**
   - CSS class `glitch-text` với animation
   - Layer effects với `::before` và `::after`
   - Random glitch trigger (không phải lúc nào cũng glitch)

2. **Audio Waveform Visualization**
   - 3-4 bars nhỏ dưới DESTINY
   - Animate height liên tục với random heights
   - Styling như equalizer bar

3. **Enhanced Laser Beams**
   - Thêm beam thứ 4 với màu khác
   - Intensity animation (opacity pulse)
   - Glow effect mạnh hơn

4. **Background Pulse Effect**
   - Toàn bộ hero background pulse theo beat giả lập
   - Scale nhẹ 1.0 -> 1.02
   - Timing: 2-3 giây

5. **Staggered Reveal cho tất cả elements**
   - Sponsors block: fade + slide
   - Tagline: fade + scale
   - DESTINY: với glitch effect
   - Description: fade up với delay
   - Alert badge: bounce in
   - Button: glow pulse

#### 2.2.2 SectionTitle ([components/home/SectionTitle.tsx](components/home/SectionTitle.tsx))

**Thêm effects:**

1. **Neon Underline Animation**
   - Gradient underline màu đỏ
   - Width animation: 0 -> 100%
   - Glow pulse khi visible

2. **Eyebrow Reveal**
   - Split text animation (từng chữ)
   - Fade in với slight y movement

3. **Title Glow**
   - Text shadow pulse
   - Intensity thay đổi theo scroll

#### 2.2.3 LineupPreview ([components/home/LineupPreview.tsx](components/home/LineupPreview.tsx))

**Thêm effects:**

1. **3D Tilt Effect**
   - Mouse position tracking
   - Transform: perspective(1000px) rotateX/Y
   - Max rotation: 5-8 độ

2. **Image Reveal**
   - Clip-path animation khi scroll vào view
   - Grayscale -> Color transition

3. **Neon Border Intensify**
   - Border glow mạnh hơn khi hover
   - Shadow expansion

4. **Card Stagger Animation**
   - Cards xuất hiện với stagger delay
   - Slide in từ bottom

#### 2.2.4 TicketsSection ([components/home/TicketsSection.tsx](components/home/TicketsSection.tsx))

**Thêm effects:**

1. **Price Counter Animation**
   - Number counting animation khi visible
   - Start from 0 -> actual price

2. **Card Glow Pulse**
   - Hover state với glow pulse
   - Border flicker effect

3. **Badge Bounce**
   - "Best Value" badge bounce in
   - Subtle pulse animation

4. **Trust Items Reveal**
   - Stagger fade in từ bottom
   - Icon spin/rotate animation

#### 2.2.5 VipTableSection ([components/home/VipTableSection.tsx](components/home/VipTableSection.tsx))

**Thêm effects:**

1. **Parallax Background**
   - Background image di chuyển chậm hơn scroll
   - Layer separation effect

2. **Price Animation**
   - $3,200 counter effect
   - Format với comma

3. **Spotlight Effect**
   - Glow di chuyển theo section
   - Subtle movement

#### 2.2.6 Header ([components/home/Header.tsx](components/home/Header.tsx))

**Thêm effects:**

1. **Logo Glow Pulse**
   - Logo có subtle neon glow
   - Pulse animation nhẹ

2. **Nav Items Hover**
   - Letter spacing expand
   - Underline slide animation
   - Background glow

#### 2.2.7 PartnersFooter ([components/home/PartnersFooter.tsx](components/home/PartnersFooter.tsx))

**Thêm effects:**

1. **Logo Marquee**
   - Partners strip auto-scroll
   - Infinite loop animation

2. **Social Icons Hover**
   - Scale + glow effect
   - Color transition

3. **Newsletter Input Focus**
   - Border glow animation
   - Placeholder fade

### C. New Reusable Components

#### 2.3.1 AnimatedText ([components/ui/AnimatedText.tsx])
- Text scramble effect (khi load)
- Random characters -> actual text
- Props: text, duration, delay

#### 2.3.2 ParticleField ([components/ui/ParticleField.tsx])
- Enhanced particles system
- Props: count, colors, speed
- Canvas-based hoặc div-based

#### 2.3.3 AudioBars ([components/ui/AudioBars.tsx])
- Audio waveform visualization bars
- Props: barCount, colors
- Continuous animation

#### 2.3.4 GlitchText ([components/ui/GlitchText.tsx])
- CSS glitch effect wrapper
- Props: text, intensity, triggerOnHover

#### 2.3.5 NeonBorder ([components/ui/NeonBorder.tsx])
- Animated neon border component
- Props: color, intensity, animate

---

## 3. Implementation Plan

### Phase 1: Global Foundations
1. Thêm advanced CSS keyframes vào [globals.css](app/globals.css)
2. Cập nhật [lib/animations.ts](lib/animations.ts) với variants mới
3. Tạo [components/ui/GlitchText.tsx](components/ui/GlitchText.tsx)
4. Tạo [components/ui/AudioBars.tsx](components/ui/AudioBars.tsx)

### Phase 2: HeroSection
1. Thêm glitch effect cho DESTINY title
2. Thêm AudioBars dưới title
3. Enhance laser beams
4. Background pulse effect
5. Stagger reveal cho tất cả elements

### Phase 3: Section Components
1. Update SectionTitle với animated underline
2. Enhance LineupPreview với 3D tilt
3. Add price counter animation cho TicketsSection
4. Parallax effect cho VipTableSection

### Phase 4: Polish & Refinement
1. Update Header với enhanced hover states
2. Add logo marquee cho PartnersFooter
3. Fine-tune timing và easing
4. Test performance trên mobile
5. Optimize animations cho reduced motion

---

## 4. File Changes Summary

### New Files:
- `components/ui/GlitchText.tsx` - Glitch effect component
- `components/ui/AudioBars.tsx` - Audio visualization bars

### Modified Files:
- `app/globals.css` - Thêm 8+ keyframes mới
- `lib/animations.ts` - Thêm 5+ variants mới
- `components/home/HeroSection.tsx` - Major enhancement
- `components/home/SectionTitle.tsx` - Animated underline
- `components/home/LineupPreview.tsx` - 3D tilt + reveal
- `components/home/TicketsSection.tsx` - Counter animation
- `components/home/VipTableSection.tsx` - Parallax + counter
- `components/home/Header.tsx` - Enhanced hover states
- `components/home/PartnersFooter.tsx` - Marquee animation

---

## 5. Verification Plan

1. **Build & Run**: `npm run dev`
2. **Visual Testing**:
   - Hero section: Check glitch effect, audio bars, laser beams
   - Scroll through all sections: Verify scroll-triggered animations
   - Hover effects: Test all interactive elements
   - Mobile: Test touch interactions
3. **Performance**: Check for jank/lag in animations
4. **Accessibility**: Verify `prefers-reduced-motion` works correctly

---

## 6. Dependencies

Hiện tại đã có đủ dependencies:
- framer-motion v12
- lucide-react
- Tailwind CSS v4

Không cần thêm thư viện mới.
