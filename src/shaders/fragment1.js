export default /* glsl */ `
uniform float time;
varying vec2 vUv;

float hash21(vec2 p) {
  // works fine for film grain; not "smooth noise" but that's the point
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main()
{
    vec2 uv = vUv;

    vec2 center = vec2(0.5, 0.5);
    float dist = distance(uv, center);

    float frequency = 18.0;
    float speed = 1.0;

    float wave = sin(dist * frequency - speed * time);
    float falloff = exp(-dist * 4.0);
    float ripple = wave * falloff;

    float pulse = 0.5 + 0.5 * sin(time * 0.6);
    vec3 baseColor   = vec3(0.01, 0.72, 1.0);
    vec3 rippleColor = vec3(0.62, 0.13, 0.74);
    baseColor = baseColor.bgr;
    rippleColor = rippleColor.bgr;

    baseColor   *= mix(0.95, 1.05, pulse);
    rippleColor *= mix(1.05, 0.95, pulse);

    vec3 color = mix(baseColor, rippleColor, ripple * 0.5 + 0.5);

    float grainScale = 900.0;
    float n = hash21(uv * grainScale + time * 10.0);
    float grain = (n - 0.5);
    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    float grainAmount = mix(0.05, 0.15, luma);
    color += grain * grainAmount;

    gl_FragColor = vec4(color, 1.0);
}
`
