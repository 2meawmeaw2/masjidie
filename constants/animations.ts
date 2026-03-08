import { Easing } from "react-native-reanimated";

/**
 * A collection of smooth, non-bouncy animation properties for consistent UI transitions.
 * Use these with `withTiming` from react-native-reanimated.
 */
export const SmoothAnimations = {
  // Very smooth exponential curve, excellent for entering elements (e.g. lists fading in)
  entering: Easing.out(Easing.exp),

  // Quadratic curve, good for quick interactive responses (like button press in/out states)
  interactive: Easing.out(Easing.quad),

  // Standard smooth easing, slow start, fast middle, slow end (good for general UI motion)
  standard: Easing.bezier(0.2, 0.0, 0, 1.0),

  // Decelerated easing (starts fast, ends slow)
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1),

  // Accelerated easing (starts slow, ends fast)
  accelerate: Easing.bezier(0.4, 0.0, 1, 1),

  // Custom curve for layout changes or drawer menus
  layout: Easing.bezier(0.25, 0.1, 0.25, 1),
};
