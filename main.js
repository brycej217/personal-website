import * as THREE from 'three'
import gsap from 'gsap'
import { RotateControls } from './RotateControls.js'

// game variables
let rotate = true
let rotVec = [
  Math.random() < 0.5 ? 1 : -1,
  Math.random() < 0.5 ? 1 : -1,
  Math.random() < 0.5 ? 1 : -1,
]
let selected = null
let canHighlight = true
let onFace = false
let index

// params
const camDist = 30
const cubeSize = 15

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
camera.position.z = camDist

// raycasting
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2(window.innerWidth, window.innerHeight)

// materials
const materials = [
  new THREE.MeshBasicMaterial({ color: 0xff0000, name: 'Red' }),
  new THREE.MeshBasicMaterial({ color: 0x00ff00, name: 'Green' }),
  new THREE.MeshBasicMaterial({ color: 0x0000ff, name: 'Blue' }),
  new THREE.MeshBasicMaterial({ color: 0xffff00, name: 'Yellow' }),
  new THREE.MeshBasicMaterial({ color: 0xff00ff, name: 'Magenta' }),
  new THREE.MeshBasicMaterial({ color: 0x00ffff, name: 'Cyan' }),
]

// look rotations
const lookRotations = [
  [-Math.PI / 2, 0, 0],
  [Math.PI / 2, 0, 0],
  [0, -Math.PI / 2, 0],
  [0, Math.PI / 2, 0],
  [0, 0, 0],
  [0, 0, -Math.PI / 2],
]

/*
Creates a "cube" out of 6 planes of certain size
Uses materials array to determine face colors
*/
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
const cube = createCube(cubeSize)
cube.setRotationFromEuler(new THREE.Euler(Math.PI / 4, Math.PI / 4, 0))
scene.add(cube)

// controls
const controls = new RotateControls(cube, renderer.domElement)

/*
Automatically rotates cube every frame
*/
const animate = () => {
  requestAnimationFrame(animate)

  if (rotate) {
    cube.rotation.x += 0.001 * rotVec[0]
    cube.rotation.y += 0.001 * rotVec[1]
    cube.rotation.z += 0.001 * rotVec[2]
  }

  renderer.render(scene, camera)
}

/*
Update pointer when pointer moves
*/
const onPointerMove = (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
}

/*
Resets all colors of the cube
*/
const resetColors = (object) => {
  for (let i = 0; i < 6; i++) {
    object.children[i].material = new THREE.MeshBasicMaterial({
      color: materials[i].color,
      side: THREE.DoubleSide,
      name: materials[i].name,
      wireframe: false,
    })
  }
}

/*
Highlights cube faces when hovered over by mouse
Updates every frame
*/
const highlight = () => {
  window.requestAnimationFrame(highlight)
  raycaster.setFromCamera(pointer, camera)
  resetColors(cube)
  if (canHighlight === false) return
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
window.addEventListener('pointermove', onPointerMove) // tracks pointer position for highlight function

/*
Sets selected to face clicked on
Stops rotation
*/
const mouseDown = () => {
  rotate = false
  raycaster.setFromCamera(pointer, camera)
  const intersects = raycaster.intersectObjects(cube.children)
  if (intersects.length > 0) {
    selected = intersects[0].object
  }
}

/*
Creates animation for cube looking at specific position
*/
const cubeLook = (position, duration) => {
  controls.canRotate = false
  const prevRot = new THREE.Vector3()
  const targetRot = new THREE.Vector3()
  const prevEuler = new THREE.Euler()

  prevRot.copy(cube.rotation)
  prevEuler.setFromVector3(prevRot)

  cube.lookAt(position)
  targetRot.copy(cube.rotation)
  cube.setRotationFromEuler(prevEuler)

  gsap.to(cube.rotation, {
    x: targetRot.x,
    y: targetRot.y,
    z: targetRot.z,
    duration: duration,
    onComplete: () => {
      controls.canRotate = true
    },
  })
}

/*
Creates animation for camera zooming in
*/
const camZoom = (position, duration) => {
  gsap.to(camera.position, {
    z: position,
    duration: duration,
    onComplete: () => {
      if (onFace)
      {
        onFace = false
        cube.visible = true
        canHighlight = true
        return
      }
      onFace = true
      scene.background = new THREE.Color(materials[index].color) // change scene background color
      cube.visible = false // hide cube
      cube.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), Math.PI)
      camera.position.z = camDist * 2 // bring camera to twice the starting position
      rotate = true
    },
  })
}

/*
If mouse is released on nothing or non selected, nothing happens
If mouse is released on selected, rotate cube to face camera
*/
const mouseUp = () => {
  raycaster.setFromCamera(pointer, camera)
  const intersects = raycaster.intersectObjects(cube.children)
  if (intersects.length <= 0) {
    // if released on nothing
    selected = null
    rotVec = [
      Math.random() < 0.5 ? 1 : -1,
      Math.random() < 0.5 ? 1 : -1,
      Math.random() < 0.5 ? 1 : -1,
    ]
    rotate = true
    return
  }
  if (intersects[0].object == selected) {
    // if released on selected
    for (let i = 0; i < 6; i++) {
      if (cube.children[i] == selected) {
        index = i
      }
    }
    const pos = new THREE.Vector3(
      lookRotations[index][0],
      lookRotations[index][1],
      lookRotations[index][2]
    )
    canHighlight = false
    cubeLook(pos, 1)
    camZoom(cubeSize - 2.5, 1)
  } // if released on not selected
  else {
    rotVec = [
      Math.random() < 0.5 ? 1 : -1,
      Math.random() < 0.5 ? 1 : -1,
      Math.random() < 0.5 ? 1 : -1,
    ]
    rotate = true
  }
  selected = null
}

const keyDown = (event) => {
  switch (event.key) {
    case 'Escape':
      console.log('esc')
      if (onFace)
      {
        camZoom(camDist, 1)
      }
  }
}

window.addEventListener('mousedown', mouseDown)
window.addEventListener('mouseup', mouseUp)
window.addEventListener('keydown', keyDown)

animate()
highlight()