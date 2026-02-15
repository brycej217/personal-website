import * as THREE from 'three'
import Scene from '../Scene.js'
import Animations from '../Animations.js'
import gsap from 'gsap'
import SceneObject from '../SceneObject.js'
import vertexShader from '../../shaders/vertex.js'
import fragmentShader from '../../shaders/fragment0.js'

export default class Splash extends Scene {
  _createProjectWindow() {
    const geom = new THREE.BoxGeometry(1, 1, 1)
    const mat = new THREE.MeshBasicMaterial({
      stencilWrite: true,
      stencilRef: 1,
      stencilFunc: THREE.AlwaysStencilFunc,
      stencilZPass: THREE.ReplaceStencilOp,
      side: THREE.DoubleSide,
    })
    const projectWindow = new SceneObject(geom, mat, { x: 0, y: 0, z: 0 })
    this.add(projectWindow)

    {
      projectWindow.onClick = (hit) => this.boxClick(hit, projectWindow)
      projectWindow.mesh.userData.onHover = () => this.boxHover(projectWindow)
      projectWindow.mesh.userData.deHover = () => this.boxDehover(projectWindow)
      projectWindow.mesh.userData.onAnimate = (mesh, t) =>
        Animations.rotate(mesh)
    }
    projectWindow.mesh.userData.basePos = projectWindow.mesh.position
    this.projectWindow = projectWindow
  }

  _createPlane() {
    const geom = new THREE.PlaneGeometry(125, 125)
    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0.0 },
        camY: { value: 0.0 },
      },
    })
    const plane = new SceneObject(geom, mat, {
      x: 0,
      y: 0,
      z: -10,
    })
    plane.mesh.userData.onAnimate = (mesh, t) => {
      mat.uniforms.time.value = t * 0.001
      mat.uniforms.camY.value = this.scrollY
    }
    this.add(plane)
  }

  _createTitle(content) {
    const title = this.ctx.create_text(content.title, {
      fontSize: 1.5,
      position: { x: 0, y: 2.5, z: 0 },
      material: new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
      }),
    })
    this.add(title)
    this.title = title
  }

  _createText(content) {
    // About Me
    this.learn = this.ctx.create_text(content.learn, {
      fontSize: 0.35,
      maxWidth: 5,
      anchorX: 'center',
      anchorY: 'top',
      position: { x: 0, y: -2.0, z: 0 },
    })
    this.add(this.learn)

    // Down Arrow
    this.arrow = this.ctx.create_text('↓', {
      fontSize: 0.4,
      anchorX: 'center',
      anchorY: 'top',
      position: { x: 0, y: -2.6, z: -0.01 },
    })
    this.add(this.arrow)
    gsap.to(this.arrow.mesh.position, {
      y: this.arrow.mesh.position.y - 0.15,
      duration: 0.8,
      ease: 'power1.inOut',
      yoyo: true,
      repeat: -1,
    })

    // Hi, I'm Bryce
    this.about = this.ctx.create_text(content.about, {
      fontSize: 0.2,
      maxWidth: 5,
      anchorX: 'center',
      anchorY: 'top',
      position: { x: 0, y: -5.75, z: 0 },
    })
    this.add(this.about)
  }

  _createHeadshot(content) {
    const texture = new THREE.TextureLoader().load(content.headshot)
    const headshotMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    const headshotGeom = new THREE.PlaneGeometry(2.5, 2.5)
    const headshotMesh = new THREE.Mesh(headshotGeom, headshotMat)
    headshotMesh.position.set(0, -4.0, -0.02)
    this.headshot = { mesh: headshotMesh, material: headshotMat }
    this.add(this.headshot)
  }

  createScene(content) {
    this._createProjectWindow()
    this._createPlane()
    this._createTitle(content)
    this._createText(content)
    this._createHeadshot(content)

    this._initScrollables()
    this._initAnimatables()
    this._onWheel = (e) => this.onScroll(e)

    this.ctx.canvas.addEventListener('wheel', this._onWheel, {
      passive: false,
    })
  }

  boxClick(hit) {
    this.resetScroll()

    const projects = this.ctx.scenes['projects']
    this.ctx.canvas.removeEventListener('wheel', this._onWheel)
    this.onExitAnimation()
    projects.onEnterAnimation()
    Animations.enterScene(
      this.ctx,
      this.projectWindow.mesh.userData.basePos,
      projects,
      () => {
        this.ctx.interacter.onEscape.push(() => this.exitScene())
        projects.planeMat.stencilFunc = THREE.AlwaysStencilFunc // project background plane now always writing 1
        this.disableObject(this.ctx, this.title)
      },
    )
  }

  exitScene() {
    const projects = this.ctx.scenes['projects']

    projects.planeMat.stencilFunc = THREE.EqualStencilFunc
    this.enableObject(this.ctx, this.title)
    this.onEnterAnimation()
    projects.onExitAnimation()
    Animations.exitScene(this.ctx, { x: 0, y: 0, z: 5 }, this, () => {
      this.ctx.canvas.addEventListener('wheel', this._onWheel, {
        passive: false,
      })
    })
  }

  boxHover(window) {
    Animations.hoverScale(window.mesh, 1.15, this.ctx.canvas)
  }

  boxDehover(window) {
    Animations.dehoverScale(window.mesh, this.ctx.canvas)
  }

  _initScrollables() {
    this.scrollY = 0
    this.scrollables = [
      this.projectWindow.mesh,
      this.title.mesh,
      this.about.mesh,
      this.learn.mesh,
      this.arrow.mesh,
      this.headshot.mesh,
    ]

    for (const mesh of this.scrollables) {
      mesh.userData.baseY = mesh.position.y
    }
  }

  addScrollables(meshes) {
    for (const mesh of meshes) {
      mesh.userData.baseY = mesh.position.y
      this.scrollables.push(mesh)
    }
  }

  onScroll(e) {
    e.preventDefault()
    const scrollSpeed = 0.003
    this.scrollY += e.deltaY * scrollSpeed
    this.scrollY = Math.max(0, Math.min(this.scrollY, 6))
    for (const mesh of this.scrollables) {
      mesh.position.y = mesh.userData.baseY + this.scrollY
    }
    const opacityScale = 0.5
    const arrowOpacity = Math.max(0, 1 - this.scrollY * opacityScale)
    this.arrow.mesh.material.opacity = arrowOpacity
    this.arrow.mesh.visible = arrowOpacity > 0
    this.headshot.material.opacity = Math.min(1, this.scrollY * opacityScale)
  }

  resetScroll() {
    this.scrollY = 0
    for (const mesh of this.scrollables) {
      gsap.to(mesh.position, {
        y: mesh.userData.baseY,
        duration: 0.6,
        ease: 'power3.inOut',
      })
    }
  }

  _initAnimatables() {
    this._titleHomeY = this.title.mesh.position.y
    this._belowItems = [
      this.learn.mesh,
      this.arrow.mesh,
      this.about.mesh,
      this.headshot.mesh,
    ]
    for (const mesh of this._belowItems) {
      mesh.userData._homeY = mesh.position.y
    }
  }

  onExitAnimation() {
    const ease = 'power3.in'
    const duration = 0.8

    const tl = gsap.timeline()

    tl.to(
      this.title.mesh.position,
      { y: this._titleHomeY + 3, duration, ease },
      0,
    )
    tl.to(this.title.mesh.material, { opacity: 0, duration, ease }, 0)

    for (const mesh of this._belowItems) {
      tl.to(mesh.position, { y: mesh.userData._homeY - 5, duration, ease }, 0)
    }
  }

  onEnterAnimation(delay = 1.2) {
    const ease = 'power3.out'
    const duration = 1.0

    const tl = gsap.timeline({ delay })

    tl.to(this.title.mesh.position, { y: this._titleHomeY, duration, ease }, 0)
    tl.to(this.title.mesh.material, { opacity: 1, duration, ease }, 0)

    for (const mesh of this._belowItems) {
      tl.to(mesh.position, { y: mesh.userData._homeY, duration, ease }, 0.15)
    }
  }
}
