import * as THREE from 'three'
import { Text } from 'troika-three-text'
import GUI from 'lil-gui'

import Interacter from './Interacter.js'

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

  // scenes
  scenes = {}

  constructor() {
    // scene initialization
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x000000)

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

    // listener setup
    this.create_listeners()

    // debug gui
    this.gui = new GUI()
    const camFolder = this.gui.addFolder('Camera Position')
    camFolder.add(this.camera.position, 'x').listen().step(0.01)
    camFolder.add(this.camera.position, 'y').listen().step(0.01)
    camFolder.add(this.camera.position, 'z').listen().step(0.01)
  }

  create_text(text, options = {}) {
    const troikaText = new Text()
    troikaText.text = text
    troikaText.fontSize = options.fontSize || 0.5
    troikaText.color = options.color || 0xffffff
    troikaText.anchorX = options.anchorX || 'center'
    troikaText.anchorY = options.anchorY || 'middle'
    troikaText.font = 'public/assets/fonts/fjalla.ttf'

    if (options.maxWidth) {
      troikaText.maxWidth = options.maxWidth
    }

    if (options.material) {
      troikaText.material = options.material
    }

    if (options.position) {
      troikaText.position.set(
        options.position.x || 0,
        options.position.y || 0,
        options.position.z || 0,
      )
    }

    troikaText.sync()

    return { mesh: troikaText }
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
