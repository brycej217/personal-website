import * as THREE from 'three'
import GUI from 'lil-gui'

import Interacter from './Interacter.js'
// text
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'
import SceneObject from './SceneObject.js'

export default class Context {
  // THREE
  scene
  camera
  renderer
  canvas
  interacter
  size = new THREE.Vector2()

  // camera params
  speed = 0.025
  duration = 0.1

  // window dimensions
  aspect
  fov = 75

  // debug
  gui

  // scenes
  scenes = {}

  // font
  font

  constructor(font) {
    // scene initialization
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x000000)
    this.font = font

    // camera initialization
    this.aspect = window.innerWidth / window.innerHeight
    this.camera = new THREE.PerspectiveCamera(this.fov, this.aspect, 0.1, 1000)
    this.camera.position.z = 5

    // renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      stencil: true,
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)

    document.body.appendChild(this.renderer.domElement)
    this.canvas = this.renderer.domElement // canvas

    this.renderer.getDrawingBufferSize(this.size)

    // interactions
    this.interacter = new Interacter(this.canvas, this.camera, this.scene)

    // gui
    this.gui = new GUI({ title: 'Debug' })
    this.gui.add(this.camera.position, 'z').listen().name('cam z')

    // listener setup
    this.create_listeners()
  }

  create_text(text, z, y, size) {
    const geometry = new TextGeometry(text, {
      font: this.font,
      size: size,
      height: 0.001,
      depth: 0,
      curveSegments: 12,
    })

    geometry.center()

    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
    })

    const textObj = new SceneObject(geometry, material)
    textObj.mesh.position.z = z
    textObj.mesh.position.y = y
    return textObj
  }

  create_listeners() {
    this.renderer.setAnimationLoop((t) => this.animate(t))
    window.addEventListener('resize', () => this.on_resize())
  }

  on_resize() {
    this.aspect = window.innerWidth / window.innerHeight
    this.camera.aspect = this.aspect
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.getDrawingBufferSize(this.size)
  }

  animate(t) {
    this.renderer.render(this.scene, this.camera)

    for (const child of this.scene.children) {
      if (child.userData.onAnimate) {
        child.userData.onAnimate(child, t)
      }
    }
  }
}
