import * as THREE from 'three'
import gsap from 'gsap'

export default class Interacter {
  constructor(canvas, camera, scene) {
    this.canvas = canvas
    this.camera = camera
    this.scene = scene

    this.raycaster = new THREE.Raycaster()
    this.ndc = new THREE.Vector2()
    this.hovered = null
    this.onEscape = []
    this.interactables = []

    // set listeners here
    canvas.addEventListener('mousemove', (event) => this.onMouseMove(event))
    canvas.addEventListener('pointerdown', (event) => this.onPointerDown(event))
    canvas.addEventListener('wheel', (event) => event.preventDefault(), {
      passive: false,
    })
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.onEscape.length > 0) {
        const escapeFunc = this.onEscape.pop()
        escapeFunc()
      }
    })
  }

  updateNdc(event) {
    const rect = this.canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height

    this.ndc.x = x * 2 - 1
    this.ndc.y = -(y * 2 - 1)
  }

  onPointerDown(event) {
    this.updateNdc(event)
    this.raycaster.setFromCamera(this.ndc, this.camera)

    const hits = this.raycaster.intersectObjects(this.interactables, true)
    if (!hits.length) return

    const hit = hits[0]
    if (hit.object.userData.onClick) {
      hit.object.userData.onClick(hit)
    }
  }

  onMouseMove(event) {
    const mouse_x = event.clientX / window.innerWidth - 0.5
    const mouse_y = event.clientY / window.innerHeight - 0.5

    const max = 0.25

    const set_cam_x = gsap.quickTo(this.camera.rotation, 'x', {
      duration: 2,
      ease: 'power4.out',
      overwrite: 'auto',
    })

    const set_cam_y = gsap.quickTo(this.camera.rotation, 'y', {
      duration: 2,
      ease: 'power4.out',
      overwrite: 'auto',
    })

    set_cam_x(-mouse_y * max)
    set_cam_y(-mouse_x * max)

    // hover detection
    this.updateNdc(event)
    this.raycaster.setFromCamera(this.ndc, this.camera)
    const hits = this.raycaster.intersectObjects(this.interactables, true)

    if (hits.length > 0) {
      const hit = hits[0]
      if (this.hovered !== hit.object) {
        // dehover previous
        if (this.hovered?.userData.deHover) {
          this.hovered.userData.deHover()
        }
        // hover new
        this.hovered = hit.object
        if (this.hovered.userData.onHover) {
          this.hovered.userData.onHover(hit)
        }
      }
    } else {
      // no longer hovering anything
      if (this.hovered?.userData.deHover) {
        this.hovered.userData.deHover()
      }
      this.hovered = null
    }
  }
}
