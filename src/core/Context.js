import * as THREE from 'three'
import gsap from 'gsap'
import GUI from 'lil-gui'

// geometry
import Plane from './Plane.js'
import Cube from './Cube.js'

// shaders
import vertex_shader from '../shaders/vertex.js'
import fragment0 from '../shaders/fragment0.js'
import fragment1 from '../shaders/fragment1.js'
import fragment2 from '../shaders/fragment2.js'

// util
import { next, prev } from './Utility.js'

export default class Context {
  // THREE
  scene
  camera
  renderer
  canvas

  // camera params
  speed = 0.025
  duration = 0.1
  reset_z = 50

  // window dimensions
  aspect
  fov = 75

  // debug
  gui

  // geoms
  cube
  planes = []
  plane_index = 0

  constructor() {
    // scene initialization
    this.scene = new THREE.Scene()

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

    // add geoms
    this.add_geoms()

    // gui
    this.gui = new GUI({ title: 'Debug' })
    this.gui.add(this.camera.position, 'z').listen().name('cam z')
    this.gui.add(this, 'plane_index').listen().name('plane idx')
    this.gui.add(this.cube, 'id').listen().name('cube idx')

    // listener setup
    this.create_listeners()
  }

  add_geoms() {
    // geometry
    this.cube = new Cube(1)

    const plane0 = new Plane(0, vertex_shader, fragment0)
    const plane1 = new Plane(1, vertex_shader, fragment1)
    const plane2 = new Plane(2, vertex_shader, fragment2)

    this.planes.push(plane0)
    this.planes.push(plane1)
    this.planes.push(plane2)

    // add geoms
    this.add_geom(this.cube)

    for (const plane of this.planes) {
      this.add_geom(plane)
    }

    // initial state: plane0 is background (stencil off), cube reveals plane1
    this.planes[0].set_stencil(false)
  }

  add_geom(geom) {
    this.scene.add(geom.mesh)
  }

  create_listeners() {
    this.renderer.setAnimationLoop((t) => this.animate(t))
    this.canvas.addEventListener('wheel', (event) => this.on_wheel(event))
    this.canvas.addEventListener('mousemove', (event) =>
      this.on_mouse_move(event)
    )
    window.addEventListener('resize', () => this.on_resize())
  }

  on_resize() {
    this.aspect = window.innerWidth / window.innerHeight
    this.camera.aspect = this.aspect
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  on_wheel(event) {
    event.preventDefault()
    const delta = event.deltaY

    gsap.killTweensOf(this.camera.position)
    const curr_z = this.camera.position.z
    let target_z = this.camera.position.z + delta * this.speed

    // entered new cube
    if (target_z < 0) {
      const curr_plane = this.planes[this.plane_index]
      const next_idx = next(this.plane_index, this.planes.length)
      const next_plane = this.planes[next_idx]

      curr_plane.set_stencil(true)
      next_plane.set_stencil(false)

      this.plane_index = next_idx
      this.cube.set_stencil(next(this.plane_index, this.planes.length))

      this.camera.position.z = this.reset_z
      this.camera.updateMatrixWorld(true)
      return
    }

    // exited cube
    if (target_z > this.reset_z) {
      const curr_plane = this.planes[this.plane_index]
      const prev_idx = prev(this.plane_index, this.planes.length)
      const prev_plane = this.planes[prev_idx]

      curr_plane.set_stencil(true)
      prev_plane.set_stencil(false)

      this.plane_index = prev_idx
      this.cube.set_stencil(curr_plane.id)

      this.camera.position.z = 0
      this.camera.updateMatrixWorld(true)
      return
    }

    gsap.to(this.camera.position, {
      z: target_z,
      duration: this.duration,
      ease: 'power4.out',
      overwrite: 'auto',
    })
  }

  on_mouse_move(event) {
    const mouse_x = event.clientX / window.innerWidth - 0.5
    const mouse_y = event.clientY / window.innerHeight - 0.5

    const max = 0.5

    const set_cam_x = gsap.quickTo(this.camera.rotation, 'x', {
      duration: 4,
      ease: 'power4.out',
      overwrite: 'auto',
    })

    const set_cam_y = gsap.quickTo(this.camera.rotation, 'y', {
      duration: 4,
      ease: 'power4.out',
      overwrite: 'auto',
    })

    set_cam_x(-mouse_y * max)
    set_cam_y(-mouse_x * max)
  }

  animate(t) {
    this.cube.mesh.rotation.x += 0.01 * 0.5
    this.cube.mesh.rotation.y += 0.01 * 0.5

    for (const plane of this.planes) {
      plane.material.uniforms.time.value = t * 0.001
    }

    this.renderer.render(this.scene, this.camera)
  }
}
