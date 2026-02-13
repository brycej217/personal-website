import * as THREE from 'three'
import gsap from 'gsap'
import Scene from '../Scene.js'
import SceneObject from '../SceneObject.js'
import Animations from '../Animations.js'

export default class Projects extends Scene {
  createMaterials() {
    this.carousel = {
      group: null,
      slides: [],
      textures: [],
      index: 0,
      aspect: 1,
      spacing: 2.2,
      z: -5,
      isAnimating: false,
    }

    this.geometries['box'] = new THREE.BoxGeometry(1, 1, 1)
    this.geometries['plane'] = new THREE.PlaneGeometry(50, 50)

    this.geometries['project-window'] = new THREE.BoxGeometry(1, 1, 10)
    this.geometries['project-plane'] = new THREE.PlaneGeometry(1, 1)

    // texture loading
    const textureLoader = new THREE.TextureLoader()
    const urls = [
      'public/assets/images/cuda0.png',
      'public/assets/images/cuda1.png',
      'public/assets/images/cuda2.png',
      'public/assets/images/cuda3.png',
      'public/assets/images/cuda4.png',
    ]
    this.carousel.textures = urls.map((url, i) =>
      textureLoader.load(url, (texture) => {
        if (i === 0) {
          const { width, height } = texture.image
          const aspect = width / height
          this.carousel.aspect = aspect
          this.geometries['project-plane'] = new THREE.PlaneGeometry(aspect, 1)

          // update all existing slide scales
          for (const slide of this.carousel.slides) {
            slide.scale.x = aspect
          }
        }
      }),
    )
    const group = new THREE.Group()
    this.carousel.group = group
    const n = this.carousel.textures.length
    for (let i = 0; i < n; i++) {
      const slide = this.makeSlide(this.carousel.textures[i])
      slide.position.x = this.carousel.spacing * (i - n / 2)
      this.carousel.slides.push(slide)
      this.carousel.group.add(slide)
    }

    this.add({ mesh: group })

    this.materials['stencil1'] = new THREE.MeshBasicMaterial({
      color: 0xf5f5dc,
      depthFunc: THREE.AlwaysDepth,
      depthWrite: false,
      stencilWrite: true,
      stencilRef: 1,
      stencilZPass: THREE.ReplaceStencilOp,
      stencilFunc: THREE.EqualStencilFunc,
    })

    this.materials['stencil12'] = new THREE.MeshBasicMaterial({
      color: 0x40e0d0,
      depthFunc: THREE.AlwaysDepth,
      stencilWrite: true,
      stencilRef: 1,
      stencilFunc: THREE.EqualStencilFunc,
      stencilZPass: THREE.IncrementStencilOp,
      side: THREE.DoubleSide,
    })
    this.materials['stencil2-white'] = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      depthFunc: THREE.AlwaysDepth,
      stencilWrite: true,
      stencilRef: 2,
      stencilFunc: THREE.EqualStencilFunc,
      stencilZPass: THREE.KeepStencilOp,
      side: THREE.DoubleSide,
    })
  }

  makeSlide(tex) {
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      depthFunc: THREE.AlwaysDepth,
      stencilWrite: true,
      stencilRef: 2,
      stencilFunc: THREE.EqualStencilFunc,
      stencilZPass: THREE.KeepStencilOp,
      side: THREE.DoubleSide,
      transparent: true,
    })

    const geom = new THREE.PlaneGeometry(1, 1)
    const mesh = new THREE.Mesh(geom, mat)
    mesh.scale.x = this.carousel.aspect
    mesh.position.set(0, 0, this.carousel.z)
    return mesh
  }

  createScene() {
    // background plane (stencil 1 reader)
    const plane = new SceneObject(
      this.geometries['plane'],
      this.materials['stencil1'],
      { x: 0, y: 0, z: -10 },
    )
    this.add(plane)

    // stencil window
    const projectWindow = new SceneObject(
      this.geometries['project-window'],
      this.materials['stencil12'],
      { x: 0, y: 0, z: -7.5 },
    )
    this.add(projectWindow)
    this.projectWindow = projectWindow

    projectWindow.onClick = (hit) => this.projectClick(hit)
    projectWindow.mesh.userData.onHover = () => this.boxHover()
    projectWindow.mesh.userData.deHover = () => this.boxDehover()

    // title text
    const cudaText = this.ctx.create_text('CUDA Path Tracer', {
      fontSize: 0.5,
      material: this.materials['stencil2-white'],
      position: { x: 0, y: 1.5, z: -5 },
    })
    this.add(cudaText)

    // writeup
    const writeupText =
      'A physically-based path tracer built from scratch using CUDA for ' +
      'GPU-accelerated rendering. Features include Monte Carlo integration, ' +
      'Russian roulette path termination, and support for diffuse, specular, ' +
      'and refractive materials. The renderer implements a BVH acceleration ' +
      'structure for efficient ray-scene intersection testing.\n\n' +
      'The renderer supports area lights, environment mapping, and depth of ' +
      'field effects. Scenes are defined using a custom JSON format that ' +
      'describes geometry, materials, and camera parameters. The BVH is ' +
      'constructed using the surface area heuristic (SAH) for optimal ' +
      'traversal performance.\n\n' +
      'Performance optimizations include shared memory usage for warp-level ' +
      'operations, persistent threads to minimize kernel launch overhead, ' +
      'and adaptive sampling that allocates more rays to high-variance pixels.'

    const writeup = this.ctx.create_text(writeupText, {
      fontSize: 0.12,
      maxWidth: 2.8,
      material: this.materials['stencil2-white'],
      anchorX: 'center',
      anchorY: 'top',
      position: { x: 0, y: -0.8, z: -5 },
    })
    this.add(writeup)

    // scrollable content tracking
    this.scrollables = [this.carousel.group, cudaText.mesh, writeup.mesh]
    for (const mesh of this.scrollables) {
      mesh.userData.baseY = mesh.position.y
    }
    this.scrollY = 0
    this._onWheel = (e) => this.onScroll(e)
    this._onKeyDown = (e) => this.onKeyDown(e)
  }

  projectClick(hit) {
    Animations.enterScene(this.ctx, -2.5, null, () => {
      this.ctx.interacter.onEscape.push(() => this.exitScene())
      this.ctx.interacter.interactables = []
      this.ctx.canvas.addEventListener('wheel', this._onWheel, {
        passive: false,
      })
      window.addEventListener('keydown', this._onKeyDown)
    })
  }

  exitScene() {
    this.ctx.canvas.removeEventListener('wheel', this._onWheel)
    window.removeEventListener('keydown', this._onKeyDown)
    this.resetScroll()

    Animations.exitScene(this.ctx, 0, this.ctx.scenes['projects'], () => {
      this.ctx.interactables =
        Animations.getInteractables[this.ctx.scenes['splash']]
    })
  }

  onKeyDown(e) {
    if (e.key === 'ArrowRight') this.nextSlide()
    if (e.key === 'ArrowLeft') this.prevSlide()
  }

  nextSlide() {
    if (this.carousel.isAnimating) return
    this.carousel.isAnimating = true

    const { group, spacing } = this.carousel

    gsap.to(group.position, {
      x: group.position.x - spacing,
      duration: 0.6,
      ease: 'power3.inOut',
      onComplete: () => {
        this.carousel.index =
          (this.carousel.index + 1) % this.carousel.textures.length
        this.carousel.isAnimating = false
      },
    })
  }

  prevSlide() {
    if (this.carousel.isAnimating) return
    this.carousel.isAnimating = true

    const { group, spacing } = this.carousel

    gsap.to(group.position, {
      x: group.position.x + spacing,
      duration: 0.6,
      ease: 'power3.inOut',
      onComplete: () => {
        this.carousel.index =
          (this.carousel.index - 1 + this.carousel.textures.length) %
          this.carousel.textures.length
        this.carousel.isAnimating = false
      },
    })
  }

  onScroll(e) {
    e.preventDefault()
    const scrollSpeed = 0.003
    this.scrollY += e.deltaY * scrollSpeed
    this.scrollY = Math.max(0, Math.min(this.scrollY, 5))
    for (const mesh of this.scrollables) {
      mesh.position.y = mesh.userData.baseY + this.scrollY
    }
  }

  resetScroll() {
    this.scrollY = 0
    for (const mesh of this.scrollables) {
      gsap.to(mesh.position, {
        y: mesh.userData.baseY,
        duration: 0.3,
        ease: 'power3.inOut',
      })
    }
  }

  boxHover() {
    Animations.hoverScale(this.projectWindow.mesh, 1.05, this.ctx.canvas)
  }

  boxDehover() {
    Animations.dehoverScale(this.projectWindow.mesh, this.ctx.canvas)
  }
}
