export default /* glsl */ `
uniform float time;

varying vec2 vUv;

void main()
{
  vec2 uv = vUv;
  uv.x += sin(vUv.y * 3.0 + time) * 0.05;
  uv.y += cos(vUv.x * 3.0 + time) * 0.05;
  gl_FragColor = vec4(uv, 1.0, 1.0);
}
`
