/**
 * Text Animation System v2
 *
 * Animations apply ONLY to text layers.
 * Animations run when: Preview or Generate Video.
 * Animations run ONCE, no looping.
 */

// ============================================================
// Types
// ============================================================

export type AnimationType =
  | "none"
  | "fadeIn"
  | "slideUp"
  | "fadeSlide"
  | "scaleInSoft"
  | "blurReveal"
  | "maskReveal"
  | "typewriter";

export interface AnimationState {
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
  blur: number; // px
  clipPath: string; // for mask reveal
  charProgress: number; // 0-1 for typewriter
}

// ============================================================
// Animation Config
// ============================================================

// Duration as percentage of total video duration
const ANIMATION_DURATIONS: Record<AnimationType, number> = {
  none: 0,
  fadeIn: 0.22, // 22% of total duration
  slideUp: 0.25, // 25% of total duration
  fadeSlide: 0.25, // 25% of total duration
  scaleInSoft: 0.22, // 22% of total duration
  blurReveal: 0.27, // 27% of total duration
  maskReveal: 0.3, // 30% of total duration
  typewriter: 0.55, // 55% of total duration
};

// Slide distance in pixels
const SLIDE_DISTANCE = 16; // subtle, cinematic

// Scale start value for scaleInSoft
const SCALE_START = 0.9;

// Blur start value for blurReveal
const BLUR_START = 8; // subtle blur

// ============================================================
// Easing Functions
// ============================================================

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function linear(t: number): number {
  return t;
}

// ============================================================
// Animation State Calculator
// ============================================================

/**
 * Calculate animation state for a given animation type and progress
 * @param type - Animation type
 * @param progress - Animation progress (0 = start, 1 = end of animation duration)
 * @returns AnimationState with opacity, translate, scale, blur, clipPath, charProgress
 */
export function getAnimationState(
  type: AnimationType,
  progress: number
): AnimationState {
  // Clamp progress to 0-1
  const p = Math.max(0, Math.min(1, progress));

  // Default state (final/visible state)
  const finalState: AnimationState = {
    opacity: 1,
    translateX: 0,
    translateY: 0,
    scale: 1,
    blur: 0,
    clipPath: "inset(0 0 0 0)",
    charProgress: 1,
  };

  switch (type) {
    case "none":
      return finalState;

    case "fadeIn": {
      const easedP = easeOut(p);
      return {
        ...finalState,
        opacity: easedP,
      };
    }

    case "slideUp": {
      const easedP = easeOut(p);
      return {
        ...finalState,
        opacity: easedP,
        translateY: SLIDE_DISTANCE * (1 - easedP), // Start below, move up
      };
    }

    case "fadeSlide": {
      // Combined fade + slide, smooth cinematic motion
      const easedP = easeOut(p);
      return {
        ...finalState,
        opacity: easedP,
        translateY: SLIDE_DISTANCE * (1 - easedP), // subtle upward movement
      };
    }

    case "scaleInSoft": {
      // Soft scale from 0.9 to 1 with fade
      const easedP = easeOutQuad(p);
      return {
        ...finalState,
        opacity: easedP,
        scale: SCALE_START + (1 - SCALE_START) * easedP, // 0.9 -> 1
      };
    }

    case "blurReveal": {
      // Blur to clear with fade
      const easedP = easeOut(p);
      return {
        ...finalState,
        opacity: easedP,
        blur: BLUR_START * (1 - easedP), // 8px -> 0
      };
    }

    case "maskReveal": {
      // Reveal from bottom to top using clip-path
      // inset(top right bottom left)
      // Start: inset(100% 0 0 0) - fully clipped from top
      // End: inset(0 0 0 0) - fully visible
      const easedP = easeOut(p);
      const clipTop = 100 * (1 - easedP);
      return {
        ...finalState,
        clipPath: `inset(${clipTop}% 0 0 0)`,
      };
    }

    case "typewriter": {
      // Linear progress for typewriter
      return {
        ...finalState,
        charProgress: linear(p),
      };
    }

    default:
      return finalState;
  }
}

/**
 * Get animation duration as percentage of total video duration
 */
export function getAnimationDuration(type: AnimationType): number {
  return ANIMATION_DURATIONS[type] || 0;
}

/**
 * Get the final (completed) animation state
 */
export function getFinalState(): AnimationState {
  return {
    opacity: 1,
    translateX: 0,
    translateY: 0,
    scale: 1,
    blur: 0,
    clipPath: "inset(0 0 0 0)",
    charProgress: 1,
  };
}

/**
 * Get the initial animation state (before animation starts)
 */
export function getInitialState(type: AnimationType): AnimationState {
  return getAnimationState(type, 0);
}

/**
 * Animation metadata for UI
 */
export const ANIMATION_META: Record<
  AnimationType,
  { name: string; icon: string; description: string }
> = {
  none: {
    name: "Không",
    icon: "○",
    description: "Hiện ngay lập tức",
  },
  fadeIn: {
    name: "Fade In",
    icon: "◐",
    description: "Mờ dần hiện ra",
  },
  slideUp: {
    name: "Slide Up",
    icon: "↑",
    description: "Trượt lên từ dưới",
  },
  fadeSlide: {
    name: "Fade Slide",
    icon: "⤴",
    description: "Fade + trượt lên nhẹ",
  },
  scaleInSoft: {
    name: "Scale In",
    icon: "⊕",
    description: "Phóng to nhẹ từ 90%",
  },
  blurReveal: {
    name: "Blur Reveal",
    icon: "◎",
    description: "Từ mờ đến rõ",
  },
  maskReveal: {
    name: "Mask Reveal",
    icon: "▤",
    description: "Lộ ra từ dưới lên",
  },
  typewriter: {
    name: "Typewriter",
    icon: "⌨",
    description: "Gõ từng chữ",
  },
};
