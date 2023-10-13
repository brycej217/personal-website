import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

// game variables
let rotate = true
let rotVec = [
  Math.random() < 0.5 ? 1 : -1,
  Math.random() < 0.5 ? 1 : -1,
  Math.random() < 0.5 ? 1 : -1,
]
let selected = null

// params
const size = 15

// scene setup
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)
camera.position.z = 30

// controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableZoom = false
controls.enablePan = false

// materials
const materials = [
  new THREE.MeshBasicMaterial({ color: 0xff0000, name: 'Red' }),
  new THREE.MeshBasicMaterial({ color: 0x00ff00, name: 'Green' }),
  new THREE.MeshBasicMaterial({ color: 0x0000ff, name: 'Blue' }),
  new THREE.MeshBasicMaterial({ color: 0xffff00, name: 'Yellow' }),
  new THREE.MeshBasicMaterial({ color: 0xff00ff, name: 'Magenta' }),
  new THREE.MeshBasicMaterial({ color: 0x00ffff, name: 'Cyan' }),
]

// cube
const createCube = (size) => {
  const cube = new THREE.Group()

  // positions
  const positions = [
    [size / 2, 0, 0],
    [-size / 2, 0, 0],
    [0, size / 2, 0],
    [0, -size / 2, 0],
    [0, 0, size / 2],
    [0, 0, -size / 2],
  ]
  // rotations
  const rotations = [
    [0, Math.PI / 2, 0],
    [0, -Math.PI / 2, 0],
    [Math.PI / 2, 0, 0],
    [-Math.PI / 2, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]
  for (let i = 0; i < 6; i++) {
    const geometry = new THREE.PlaneGeometry(size, size)
    const material = new THREE.MeshBasicMaterial({
      color: materials[i].color,
      side: THREE.DoubleSide,
      name: materials[i].name,
    })
    const plane = new THREE.Mesh(geometry, material)

    plane.position.x = positions[i][0]
    plane.position.y = positions[i][1]
    plane.position.z = positions[i][2]
    plane.setRotationFromEuler(
      new THREE.Euler(rotations[i][0], rotations[i][1], rotations[i][2])
    )
    cube.add(plane)
  }
  return cube
}
const cube = createCube(size)
cube.setRotationFromEuler(new THREE.Euler(Math.PI / 4, Math.PI / 4, 0))
scene.add(cube)

// animation
const animate = () => {
  requestAnimationFrame(animate)

  if (rotate) {
    cube.rotation.x += 0.001 * rotVec[0]
    cube.rotation.y += 0.001 * rotVec[1]
    cube.rotation.z += 0.001 * rotVec[2]
  }

  renderer.render(scene, camera)
}

// raycasting
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2(window.innerWidth, window.innerHeight)

const onPointerMove = (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
}

// hovering
const resetColors = (object) => {
  for (let i = 0; i < 6; i++) {
    object.children[i].material = new THREE.MeshBasicMaterial({
      color: materials[i].color,
      side: THREE.DoubleSide,
      name: materials[i].name,
    })
  }
}
const render = () => {
  window.requestAnimationFrame(render)
  raycaster.setFromCamera(pointer, camera)
  resetColors(cube)
  const intersects = raycaster.intersectObjects(cube.children)
  if (intersects.length <= 0) {
    return
  }
  if (selected && intersects[0].object != selected) {
    resetColors(cube)
  } else {
    intersects[0].object.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      name: 'White',
    })
  }
  renderer.render(scene, camera)
}
window.addEventListener('pointermove', onPointerMove)

//  clicking
const mouseDown = () => {
  rotate = false
  const worldPosition = new THREE.Vector3()
  raycaster.setFromCamera(pointer, camera)
  const intersects = raycaster.intersectObjects(cube.children)
  if (intersects.length > 0) {
    selected = intersects[0].object
    intersects[0].object.getWorldPosition(worldPosition)
    console.log(worldPosition)
  }
}

const mouseUp = () => {
  rotate = true
  raycaster.setFromCamera(pointer, camera)
  const intersects = raycaster.intersectObjects(cube.children)
  if (intersects.length <= 0) {
    selected = null
    return
  }
  if (intersects[0].object == selected) {
    console.log('same')
  }
  selected = null
}

window.addEventListener('mousedown', mouseDown)
window.addEventListener('mouseup', mouseUp)

animate()
render()