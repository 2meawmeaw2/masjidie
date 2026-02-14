import React, { useEffect } from "react";
import {
  Canvas,
  Rect,
  Shader,
  Skia,
  // useDerivedValue was removed from here
} from "@shopify/react-native-skia";
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  useDerivedValue, // <--- Moved to here
} from "react-native-reanimated";
import { useWindowDimensions, ViewStyle } from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

// ... [Shader code remains exactly the same] ...
const source = Skia.RuntimeEffect.Make(`
uniform float2 u_resolution;
uniform float u_time;
uniform float4 u_colorBg;
uniform float4 u_color1;
uniform float4 u_color2;

float random (in float2 _st) {
    return fract(sin(dot(_st.xy, float2(12.9898,78.233))) * 43758.5453123);
}

float noise (in float2 _st) {
    float2 i = floor(_st);
    float2 f = fract(_st);

    float a = random(i);
    float b = random(i + float2(1.0, 0.0));
    float c = random(i + float2(0.0, 1.0));
    float d = random(i + float2(1.0, 1.0));

    float2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

float4 main(float2 xy) {
    float2 st = xy / u_resolution;
    float t = u_time * 0.15;
    
    // Noise also moves left to right now to match the flow
    float n1 = noise(st * 3.0 - float2(t * 0.5, 0.0)); 
    float n2 = noise(st * 2.0 - float2(t * 0.8, t * 0.1));
    
    float finalNoise = mix(n1, n2, 0.5);
    
    float4 color = u_colorBg;
    
    // --- MOVEMENT LOGIC ---
    // fract() ensures the value loops from 0.0 to 1.0 continuously
    float flowSpeed = 0.2; // Adjust speed here
    
    // Blob 1: Moves left to right
    float x1 = fract(t * flowSpeed); 
    float y1 = 0.5 + sin(t) * 0.15; // Gentle up/down wave
    
    // Blob 2: Moves left to right, offset by 0.5 (half screen)
    float x2 = fract(t * flowSpeed + 0.5); 
    float y2 = 0.5 + cos(t * 0.8) * 0.15; // Gentle up/down wave

    // Calculate distances
    float blob1 = smoothstep(0.6, 0.0, distance(st, float2(x1, y1)) - finalNoise * 0.2);
    float blob2 = smoothstep(0.6, 0.0, distance(st, float2(x2, y2)) - finalNoise * 0.2);

    // Mix colors (keeping the reduced intensity from the previous step)
    color = mix(color, u_color1, blob1 * 0.2);
    color = mix(color, u_color2, blob2 * 0.15);

    float grain = random(xy * 0.01 + u_time) * 0.03;
    
    return color + grain;
}
`)!;

interface Props {
  style?: ViewStyle;
}

const hexToFloat4 = (hex: string) => {
  "worklet";
  const color = Skia.Color(hex);
  return [color[0], color[1], color[2], color[3]];
};

export const AmbientBackground = ({ style }: Props) => {
  const { width, height } = useWindowDimensions();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const time = useSharedValue(0);

  useEffect(() => {
    time.value = withRepeat(
      withTiming(100, { duration: 2000, easing: Easing.linear }),
      -1, // Infinite iterations
      true, // <--- Set Reverse to TRUE to enable yoyo
    );
  }, []);
  // derived values from Reanimated work seamlessly with Skia props
  const uniforms = useDerivedValue(() => {
    return {
      u_resolution: [width, height],
      u_time: time.value,
      u_colorBg: hexToFloat4(theme.background),
      u_color1: hexToFloat4(Colors.gradient.start),
      u_color2: hexToFloat4(Colors.gradient.end),
    };
  }, [width, height, theme]);

  return (
    <Canvas
      style={[
        { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
        style,
      ]}
    >
      <Rect x={0} y={0} width={width} height={height}>
        <Shader source={source} uniforms={uniforms} />
      </Rect>
    </Canvas>
  );
};
