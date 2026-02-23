import * as THREE from 'three'
import gsap from 'gsap'
import SceneObject from './SceneObject.js'
import vertexShader from '../shaders/vertex.js'
import Animations from './Animations.js'

function makeReaderMaterial(stencilRef, layerBits, opts = {}) {
  return new THREE.MeshBasicMaterial({
    depthFunc: THREE.AlwaysDepth,
    stencilWrite: true,
    stencilFuncMask: layerBits,
    stencilRef: stencilRef,
    stencilFunc: THREE.EqualStencilFunc,
    stencilZPass: THREE.KeepStencilOp,
    side: THREE.DoubleSide,
    transparent: true,
    ...opts,
  })
}

export default class ProjectObject {
  constructor(ctx, stencilRef, position, fragment, config) {
    this.ctx = ctx
    this.stencilRef = (stencilRef << 1) | 1
    this.position = position
    this.config = config
    this.offsetZ = this.position.z - 2.5
    this.fragment = fragment

    this.compBit = 0x01
    this.layerBits = 0x1e

    this.scrollY = 0
    this._objects = []
    this._contentItems = []

    this._onWheel = (e) => this.onScroll(e)

    this._createWindow()
    this._createPlane()
    this._createContent()
  }

  _createPlane() {
    const planeMat = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: this.fragment,
      uniforms: {
        time: { value: 0.0 },
      },
      depthFunc: THREE.AlwaysDepth,
      depthWrite: true,
      stencilWrite: true,
      stencilFuncMask: this.layerBits,
      stencilRef: this.stencilRef,
      stencilFunc: THREE.EqualStencilFunc,
      stencilZPass: THREE.KeepStencilOp,
    })

    const geom = new THREE.PlaneGeometry(125, 125)
    this.plane = new SceneObject(geom, planeMat, {
      x: 0,
      y: 0,
      z: this.offsetZ - 5,
    })
    this.plane.mesh.userData.onAnimate = (mesh, t) => {
      planeMat.uniforms.time.value = t * 0.001
    }
    this._objects.push(this.plane)
  }

  _createWindow() {
    const windowMat = new THREE.MeshBasicMaterial({
      depthFunc: THREE.AlwaysDepth,
      stencilWrite: true,
      stencilFuncMask: this.compBit,
      stencilRef: this.stencilRef,
      stencilWriteMask: this.layerBits,
      stencilFunc: THREE.EqualStencilFunc,
      stencilZPass: THREE.ReplaceStencilOp,
      side: THREE.DoubleSide,
    })
    this._windowMaterial = windowMat

    const geom = new THREE.BoxGeometry(1, 1, 1)
    this.window = new SceneObject(geom, windowMat, this.position)
    this.window.mesh.userData.onAnimate = (mesh, t) => {
      this.window.mesh.userData.onAnimate = (mesh, t) => Animations.rotate(mesh)
    }
    this._objects.push(this.window)
  }

  _createContent() {
    const textureLoader = new THREE.TextureLoader()
    const z = this.offsetZ

    for (const block of this.config.content) {
      const x = this.position.x + block.x
      const y = block.y

      if (block.type === 'text') {
        const mat = makeReaderMaterial(this.stencilRef, this.layerBits, {
          color: 0xffffff,
        })
        const textObj = this.ctx.create_text(block.text, {
          fontSize: block.fontSize,
          maxWidth: block.maxWidth,
          anchorX: block.anchorX,
          anchorY: block.anchorY,
          material: mat,
          position: { x, y, z },
        })
        textObj.mesh.userData.baseY = y
        this._contentItems.push(textObj)
        this._objects.push(textObj)
      } else if (block.type === 'image') {
        const texture = textureLoader.load(block.src)
        const mat = makeReaderMaterial(this.stencilRef, this.layerBits, {
          map: texture,
        })
        const geom = new THREE.PlaneGeometry(1, 1)
        const mesh = new THREE.Mesh(geom, mat)
        mesh.scale.set(block.width, block.height, 1)
        mesh.position.set(x, y, z)
        mesh.userData.baseY = y
        const item = { mesh }
        this._contentItems.push(item)
        this._objects.push(item)
      }
    }
  }

  objects() {
    return this._objects
  }

  onScroll(e) {
    e.preventDefault()
    this.scrollY += e.deltaY * 0.003
    this.scrollY = Math.max(0, Math.min(this.scrollY, this.config.maxScroll ?? 5))
    for (const item of this._contentItems) {
      item.mesh.position.y = item.mesh.userData.baseY + this.scrollY
    }
  }

  resetScroll() {
    this.scrollY = 0
    for (const item of this._contentItems) {
      gsap.to(item.mesh.position, {
        y: item.mesh.userData.baseY,
        duration: 0.3,
        ease: 'power3.inOut',
      })
    }
  }
}
