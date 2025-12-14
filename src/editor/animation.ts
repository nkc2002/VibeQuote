/**
 * Text Animation System
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
  | "fadeOut"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "scaleUp"
  | "typewriter";

export interface AnimationState {
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
  charProgress: number; // 0-1 for typewriter (percentage of chars visible)
}

// ============================================================
// Animation Config
// ============================================================

// Duration as percentage of total video duration
const ANIMATION_DURATIONS: Record<AnimationType, number> = {
  none: 0,
  fadeIn: 0.22, // 22% of total duration
  fadeOut: 0.18, // 18% of total duration
  slideUp: 0.25, // 25% of total duration
  slideDown: 0.25,
  slideLeft: 0.25,
  slideRight: 0.25,
  scaleUp: 0.22,
  typewriter: 0.55, // 55% of total duration
};

// Slide distance in pixels
const SLIDE_DISTANCE = 50;

// Scale start value
const SCALE_START = 0.8;

// ============================================================
// Easing Functions
// ============================================================

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
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
 * @returns AnimationState with opacity, translate, scale, charProgress
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

    case "fadeOut": {
      // Fade out runs at the END of video, so we invert
      // p=0 means start of fadeOut (fully visible)
      // p=1 means end of fadeOut (invisible)
      const easedP = easeOut(p);
      return {
        ...finalState,
        opacity: 1 - easedP,
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

    case "slideDown": {
      const easedP = easeOut(p);
      return {
        ...finalState,
        opacity: easedP,
        translateY: -SLIDE_DISTANCE * (1 - easedP), // Start above, move down
      };
    }

    case "slideLeft": {
      const easedP = easeOut(p);
      return {
        ...finalState,
        opacity: easedP,
        translateX: SLIDE_DISTANCE * (1 - easedP), // Start right, move left
      };
    }

    case "slideRight": {
      const easedP = easeOut(p);
      return {
        ...finalState,
        opacity: easedP,
        translateX: -SLIDE_DISTANCE * (1 - easedP), // Start left, move right
      };
    }

    case "scaleUp": {
      const easedP = easeOut(p);
      return {
        ...finalState,
        opacity: easedP,
        scale: SCALE_START + (1 - SCALE_START) * easedP, // 0.8 -> 1
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
 * Check if animation type runs at start or end of video
 */
export function isEndAnimation(type: AnimationType): boolean {
  return type === "fadeOut";
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
    charProgress: 1,
  };
}

/**
 * Get the initial animation state (before animation starts)
 */
export function getInitialState(type: AnimationType): AnimationState {
  return getAnimationState(type, 0);
}
