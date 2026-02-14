import * as THREE from 'three'
import gsap from 'gsap'
import SceneObject from './SceneObject.js'
import vertexScreenShader from '../shaders/vertex_screen.js'
import fragment2Shader from '../shaders/fragment2.js'

function makeReaderMaterial(stencilRef, opts = {}) {
  return new THREE.MeshBasicMaterial({
    depthFunc: THREE.AlwaysDepth,
    stencilWrite: true,
    stencilRef,
    stencilFunc: THREE.EqualStencilFunc,
    stencilZPass: THREE.KeepStencilOp,
    side: THREE.DoubleSide,
    transparent: true,
    ...opts,
  })
}

export default class ProjectObject {
  constructor(ctx, stencilRef, position, config) {
    this.ctx = ctx
    this.stencilRef = stencilRef
    this.position = position
    this.config = config

    this.carousel = {
      group: null,
      slides: [],
      textures: [],
      index: 0,
      aspect: 1,
      spacing: 2.2,
      isAnimating: false,
    }

    this.scrollables = []
    this.scrollY = 0
    this._objects = []

    this._onWheel = (e) => this.onScroll(e)
    this._onKeyDown = (e) => this.onKeyDown(e)

    this._createWindow()
    this._createCarousel()
    this._createText()
    this._initScrollables()
  }

  _createWindow() {
    const windowMat = new THREE.ShaderMaterial({
      vertexShader: vertexScreenShader,
      fragmentShader: fragment2Shader,
      uniforms: {
        time: { value: 0.0 },
      },
      depthFunc: THREE.AlwaysDepth,
      stencilWrite: true,
      stencilRef: this.stencilRef,
      stencilFunc: THREE.AlwaysStencilFunc,
      stencilZPass: THREE.ReplaceStencilOp,
      side: THREE.DoubleSide,
    })
    this._windowMaterial = windowMat

    const geom = new THREE.PlaneGeometry(1, 1)
    this.window = new SceneObject(geom, windowMat, this.position)
    this.window.mesh.userData.onAnimate = (mesh, t) => {
      windowMat.uniforms.time.value = t * 0.001
    }
    this._objects.push(this.window)
  }

  _createCarousel() {
    const textureLoader = new THREE.TextureLoader()
    const slideZ = this.position.z + 2.5

    this.carousel.textures = this.config.images.map((url, i) =>
      textureLoader.load(url, (texture) => {
        if (i === 0) {
          const { width, height } = texture.image
          this.carousel.aspect = width / height
          for (const slide of this.carousel.slides) {
            slide.scale.x = this.carousel.aspect
          }
        }
      }),
    )

    const group = new THREE.Group()
    this.carousel.group = group
    const n = this.carousel.textures.length
    for (let i = 0; i < n; i++) {
      const mat = makeReaderMaterial(this.stencilRef, {
        map: this.carousel.textures[i],
      })
      const geom = new THREE.PlaneGeometry(1, 1)
      const mesh = new THREE.Mesh(geom, mat)
      mesh.scale.x = this.carousel.aspect
      mesh.position.set(0, 0, slideZ)
      mesh.position.x = this.carousel.spacing * (i - n / 2)
      this.carousel.slides.push(mesh)
      group.add(mesh)
    }

    this._objects.push({ mesh: group })
  }

  _createText() {
    const contentZ = this.position.z + 2.5
    const titleMat = makeReaderMaterial(this.stencilRef, { color: 0xffffff })
    const writeupMat = makeReaderMaterial(this.stencilRef, { color: 0xffffff })

    this._title = this.ctx.create_text(this.config.title, {
      fontSize: 0.5,
      material: titleMat,
      position: { x: this.position.x, y: 1.5, z: contentZ },
    })
    this._objects.push(this._title)

    this._writeup = this.ctx.create_text(this.config.writeup, {
      fontSize: 0.12,
      maxWidth: 2.8,
      material: writeupMat,
      anchorX: 'center',
      anchorY: 'top',
      position: { x: this.position.x, y: -0.8, z: contentZ },
    })
    this._objects.push(this._writeup)
  }

  _initScrollables() {
    this.scrollables = [
      this.carousel.group,
      this._title.mesh,
      this._writeup.mesh,
    ]
    for (const mesh of this.scrollables) {
      mesh.userData.baseY = mesh.position.y
    }
  }

  objects() {
    return this._objects
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
}
