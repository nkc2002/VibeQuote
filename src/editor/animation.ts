/**
 * Animation System for Canvas Editor
 *
 * Time-based animation system supporting:
 * - Fade in/out
 * - Slide up/down
 * - Slow zoom (Ken Burns effect)
 *
 * Uses requestAnimationFrame with delta time for smooth, frame-rate independent animations.
 */

// ============================================================
// Animation Types
// ============================================================

export type AnimationType =
  | "none"
  | "fadeIn"
  | "fadeOut"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "zoomIn"
  | "zoomOut"
  | "scaleUp"
  | "typewriter";

export type EasingType =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "easeOutBack";

export interface AnimationKeyframe {
  time: number; // 0-1 (percentage of total duration)
  opacity?: number;
  translateX?: number; // pixels
  translateY?: number; // pixels
  scale?: number;
  charProgress?: number; // 0-1 for typewriter effect
}

export interface LayerAnimation {
  type: AnimationType;
  startTime: number; // 0-1 (when animation starts)
  duration: number; // 0-1 (duration as percentage of total)
  easing: EasingType;
}

export interface AnimationState {
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
  charProgress: number; // 0-1 for typewriter
}

export interface AnimationConfig {
  fps: number;
  durationMs: number;
  backgroundAnimation: AnimationType;
  textAnimation: AnimationType;
}

// ============================================================
// Default Configs
// ============================================================

export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  fps: 30,
  durationMs: 5000,
  backgroundAnimation: "zoomIn",
  textAnimation: "fadeIn",
};

// Preset animation timings
export const ANIMATION_PRESETS: Record<
  AnimationType,
  { keyframes: AnimationKeyframe[]; easing: EasingType }
> = {
  none: {
    keyframes: [
      {
        time: 0,
        opacity: 1,
        translateX: 0,
        translateY: 0,
        scale: 1,
        charProgress: 1,
      },
    ],
    easing: "linear",
  },
  fadeIn: {
    keyframes: [
      { time: 0, opacity: 0 },
      { time: 0.3, opacity: 1 },
    ],
    easing: "easeOut",
  },
  fadeOut: {
    keyframes: [
      { time: 0.7, opacity: 1 },
      { time: 1, opacity: 0 },
    ],
    easing: "easeIn",
  },
  slideUp: {
    keyframes: [
      { time: 0, opacity: 0, translateY: 50 },
      { time: 0.3, opacity: 1, translateY: 0 },
    ],
    easing: "easeOut",
  },
  slideDown: {
    keyframes: [
      { time: 0, opacity: 0, translateY: -50 },
      { time: 0.3, opacity: 1, translateY: 0 },
    ],
    easing: "easeOut",
  },
  slideLeft: {
    keyframes: [
      { time: 0, opacity: 0, translateX: 80 },
      { time: 0.3, opacity: 1, translateX: 0 },
    ],
    easing: "easeOut",
  },
  slideRight: {
    keyframes: [
      { time: 0, opacity: 0, translateX: -80 },
      { time: 0.3, opacity: 1, translateX: 0 },
    ],
    easing: "easeOut",
  },
  zoomIn: {
    keyframes: [
      { time: 0, scale: 1.0 },
      { time: 1, scale: 1.05 },
    ],
    easing: "linear",
  },
  zoomOut: {
    keyframes: [
      { time: 0, scale: 1.05 },
      { time: 1, scale: 1.0 },
    ],
    easing: "linear",
  },
  scaleUp: {
    keyframes: [
      { time: 0, opacity: 0, scale: 0.8 },
      { time: 0.3, opacity: 1, scale: 1.0 },
    ],
    easing: "easeOutBack",
  },
  typewriter: {
    keyframes: [
      { time: 0, charProgress: 0 },
      { time: 0.8, charProgress: 1 },
    ],
    easing: "linear",
  },
};

// ============================================================
// Easing Functions
// ============================================================

export const easingFunctions: Record<EasingType, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

// ============================================================
// Animation Calculator
// ============================================================

/**
 * Calculate interpolated value between keyframes at a given time
 */
function getPropertyDefault(
  property: keyof Omit<AnimationKeyframe, "time">
): number {
  if (property === "opacity") return 1;
  if (property === "scale") return 1;
  if (property === "charProgress") return 1;
  return 0; // translateX, translateY default to 0
}

export function interpolateKeyframes(
  keyframes: AnimationKeyframe[],
  time: number,
  property: keyof Omit<AnimationKeyframe, "time">,
  easing: EasingType = "linear"
): number {
  const defaultValue = getPropertyDefault(property);
  if (keyframes.length === 0) return defaultValue;
  if (keyframes.length === 1) return keyframes[0][property] ?? defaultValue;

  // Find surrounding keyframes
  let startFrame = keyframes[0];
  let endFrame = keyframes[keyframes.length - 1];

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
      startFrame = keyframes[i];
      endFrame = keyframes[i + 1];
      break;
    }
  }

  // Before first keyframe
  if (time <= startFrame.time) {
    return startFrame[property] ?? defaultValue;
  }

  // After last keyframe
  if (time >= endFrame.time) {
    return endFrame[property] ?? defaultValue;
  }

  // Interpolate
  const startValue = startFrame[property] ?? defaultValue;
  const endValue = endFrame[property] ?? defaultValue;
  const localProgress =
    (time - startFrame.time) / (endFrame.time - startFrame.time);
  const easedProgress = easingFunctions[easing](localProgress);

  return startValue + (endValue - startValue) * easedProgress;
}

/**
 * Get animation state at a given time (0-1)
 */
export function getAnimationState(
  animationType: AnimationType,
  time: number
): AnimationState {
  const preset = ANIMATION_PRESETS[animationType];

  return {
    opacity: interpolateKeyframes(
      preset.keyframes,
      time,
      "opacity",
      preset.easing
    ),
    translateX: interpolateKeyframes(
      preset.keyframes,
      time,
      "translateX",
      preset.easing
    ),
    translateY: interpolateKeyframes(
      preset.keyframes,
      time,
      "translateY",
      preset.easing
    ),
    scale: interpolateKeyframes(preset.keyframes, time, "scale", preset.easing),
    charProgress: interpolateKeyframes(
      preset.keyframes,
      time,
      "charProgress",
      preset.easing
    ),
  };
}

/**
 * Combine multiple animation states
 */
export function combineAnimationStates(
  ...states: AnimationState[]
): AnimationState {
  return states.reduce(
    (combined, state) => ({
      opacity: combined.opacity * state.opacity,
      translateX: combined.translateX + state.translateX,
      translateY: combined.translateY + state.translateY,
      scale: combined.scale * state.scale,
      charProgress: Math.min(combined.charProgress, state.charProgress),
    }),
    { opacity: 1, translateX: 0, translateY: 0, scale: 1, charProgress: 1 }
  );
}

// ============================================================
// Animation Timeline Controller
// ============================================================

export interface TimelineController {
  currentTime: number; // 0-1
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  reset: () => void;
  seek: (time: number) => void;
  getBackgroundState: () => AnimationState;
  getTextState: () => AnimationState;
}

/**
 * Create a timeline controller for managing animation playback
 */
export function createTimelineController(
  config: AnimationConfig,
  onFrame: (time: number) => void
): TimelineController {
  let currentTime = 0;
  let isPlaying = false;
  let startTimestamp: number | null = null;
  let animationFrameId: number | null = null;

  const animate = (timestamp: number) => {
    if (!startTimestamp) startTimestamp = timestamp;

    const elapsed = timestamp - startTimestamp;
    currentTime = Math.min(elapsed / config.durationMs, 1);

    onFrame(currentTime);

    if (currentTime < 1 && isPlaying) {
      animationFrameId = requestAnimationFrame(animate);
    } else if (currentTime >= 1) {
      isPlaying = false;
    }
  };

  return {
    get currentTime() {
      return currentTime;
    },
    get isPlaying() {
      return isPlaying;
    },

    play() {
      if (isPlaying) return;
      isPlaying = true;
      startTimestamp = null;
      animationFrameId = requestAnimationFrame(animate);
    },

    pause() {
      isPlaying = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    },

    reset() {
      this.pause();
      currentTime = 0;
      startTimestamp = null;
      onFrame(0);
    },

    seek(time: number) {
      currentTime = Math.max(0, Math.min(1, time));
      startTimestamp = null;
      onFrame(currentTime);
    },

    getBackgroundState() {
      return getAnimationState(config.backgroundAnimation, currentTime);
    },

    getTextState() {
      return getAnimationState(config.textAnimation, currentTime);
    },
  };
}

// ============================================================
// Duration Helpers
// ============================================================

export type DurationOption = 5 | 10 | 15;

export function durationToMs(seconds: DurationOption): number {
  return seconds * 1000;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
