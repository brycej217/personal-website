export default /* glsl */ `
uniform float time;

varying vec2 vUv;

void main()
{
  vec2 uv = vUv;
  gl_FragColor = vec4(uv.x, 1.0, uv.y, 1.0);
}
`
