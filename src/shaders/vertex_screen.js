export default /* glsl */ `
varying vec2 vUv;

void main()
{
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vUv = gl_Position.xy / gl_Position.w * 0.5 + 0.5;
}
`
