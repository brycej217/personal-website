import * as THREE from 'three'
import gsap from 'gsap'
import GUI from 'lil-gui'

const scene = new THREE.Scene()

const z = 5

const aspect = window.innerWidth / window.innerHeight
const fov = THREE.MathUtils.degToRad(75)
const distance = z

const height = 2 * distance * Math.tan(fov / 2)
const width = height * aspect

//const camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0.1, 1000);
const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
const stable_cam = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

let geometry = new THREE.BoxGeometry(1, 1, 1);


const gui = new GUI({ title: 'Debug' });

const camPos = { x: 0, y: 0, z: 0 };
gui.add(camPos, 'z').listen().name('cam z');

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  stencil: true
})

renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap

camera.position.z = z

const color = 0xffffff
const intensity = 1
const light = new THREE.DirectionalLight(color, intensity)
light.position.set(2, -2, 10)
light.target.position.set(0, 0, -5)
light.castShadow = true

const point_light = new THREE.PointLight(color, intensity)
light.position.set(0, 0, 0)
light.castShadow = false
scene.add(point_light)

light.shadow.mapSize.width = 2048
light.shadow.mapSize.height = 2048

scene.add(light)
scene.add(light.target)

light.shadow.camera.updateProjectionMatrix()
light.target.updateMatrixWorld(true)
light.updateMatrixWorld(true)

let cube_rotate = true

const canvas = renderer.domElement

canvas.addEventListener('wheel', on_wheel);
canvas.addEventListener('mousemove', on_mouse_move);

const set_cam_x = gsap.quickTo(camera.rotation, "x",
  {
    duration: 4,
    ease: "power4.out",
    overwrite: "auto"
  }
)

const set_cam_y = gsap.quickTo(camera.rotation, "y",
  {
    duration: 4,
    ease: "power4.out",
    overwrite: "auto"
  }
)

function on_mouse_move(event)
{
  const mouse_x = event.clientX / window.innerWidth - 0.5;
  const mouse_y = event.clientY / window.innerHeight - 0.5;

  const max = 0.5;
  set_cam_x(-mouse_y * max);
  set_cam_y(-mouse_x * max);
}

const speed = 0.025
const duration = 0.1
const reset_z = 50;

const vertex_shader = 
`
varying vec2 vUv;


void main()
{
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const fragment_shader =
`
uniform mat4 invProj;
uniform mat4 invView;
uniform vec3 camPos;

uniform mat4 invM;

uniform float time;
varying vec2 vUv;

void main() 
{

gl_FragColor = vec4(vUv, 1.0, 1.0);
}
`;

const shade_mat = new THREE.ShaderMaterial({
  vertexShader: vertex_shader,
  fragmentShader: fragment_shader,
  uniforms: {
    time: {value: 0}
  }
});

const stencil_mat = new THREE.MeshBasicMaterial(
  {
      depthWrite: false,
  stencilWrite: true,
  stencilRef: 1,
    stencilFunc: THREE.AlwaysStencilFunc,
  stencilZPass: THREE.ReplaceStencilOp
  }
)
const cube = new THREE.Mesh(geometry, stencil_mat);
scene.add(cube);
stencil_mat.side = THREE.DoubleSide
shade_mat.side = THREE.DoubleSide

renderer.setAnimationLoop(animate)
document.body.appendChild(renderer.domElement)

const plane_geom = new THREE.PlaneGeometry( 2, 2);
const plane_mat = new THREE.ShaderMaterial(
  {
    vertexShader: vertex_shader,
    fragmentShader: fragment_shader,
    uniforms:
    {    invProj: {value: new THREE.Matrix4()},
    invView: {value: new THREE.Matrix4()},
    camPos: {value: new THREE.Vector3()},
    invM: {value: new THREE.Matrix4()},
      time: {value: 0}
    },
  stencilWrite: true,
  stencilRef: 1,
  stencilFunc: THREE.EqualStencilFunc,
  stencilFail: THREE.KeepStencilOp,
  stencilZFail: THREE.KeepStencilOp,
  stencilZPass: THREE.KeepStencilOp
  });
const plane = new THREE.Mesh(plane_geom, plane_mat);
plane.position.z = 5;
scene.add(plane);

function on_wheel(event) {
  event.preventDefault()
  const delta = event.deltaY

    gsap.killTweensOf(camera.position);
    const curr_z = camera.position.z;
    let target_z = camera.position.z + delta * speed;

  // when fully inside cube
  if (target_z < 0) {
    cube_rotate = false;

    plane_mat.stencilWrite = false;
    plane_mat.stencilFunc = THREE.AlwaysStencilFunc;

    //scene.remove(cube);

    camera.position.z = reset_z;
    camera.updateMatrixWorld(true);
    return;
  }

  if (target_z > reset_z)
  {
    cube_rotate = true;
    camera.position.z = 0;

    plane_mat.stencilWrite = true;
    plane_mat.stencilFunc = THREE.EqualStencilFunc;

    //scene.add(cube);
    camera.updateMatrixWorld(true);
    return;
  }

  cube_rotate = true;

  gsap.to(camera.position, {
    z: target_z,
    duration: duration,
    ease: "power4.out",
    overwrite: "auto"
  })
}

function animate(t) {
  if (cube_rotate) {
    cube.rotation.x += 0.01 * 0.5
    cube.rotation.y += 0.01 * 0.5
  }
  camPos.z = camera.position.z;
  plane.position.z = camera.position.z - 5;

  plane_mat.uniforms.time.value = t * 0.001;
  shade_mat.uniforms.time.value = t * 0.001;
  plane_mat.uniforms.invProj.value.copy(stable_cam.projectionMatrixInverse);
  plane_mat.uniforms.invView.value.copy(stable_cam.matrixWorld);
  plane_mat.uniforms.camPos.value.copy(stable_cam.position);
  plane_mat.uniforms.invM.value.copy(cube.matrixWorld).invert();
  renderer.render(scene, camera)
}