import * as THREE from 'three'
import Scene from '../Scene.js'
import SceneObject from '../SceneObject.js'
import Animations from '../Animations.js'

export default class Projects extends Scene {
  createMaterials() {
    this.geometries['box'] = new THREE.BoxGeometry(1, 1, 1)
    this.geometries['plane'] = new THREE.PlaneGeometry(50, 50)

    this.materials['stencil1'] = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      depthFunc: THREE.AlwaysDepth,
      depthWrite: false,
      stencilWrite: true,
      stencilRef: 1,
      stencilFunc: THREE.EqualStencilFunc,
    })

    this.materials['stencil12'] = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      depthFunc: THREE.AlwaysDepth,
      stencilWrite: true,
      stencilRef: 1,
      stencilFunc: THREE.EqualStencilFunc,
      stencilZPass: THREE.IncrementStencilOp,
      side: THREE.DoubleSide,
    })
    this.materials['stencil2'] = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      depthFunc: THREE.AlwaysDepth,
      stencilWrite: true,
      stencilRef: 2,
      stencilFunc: THREE.GreaterEqualStencilFunc,
      stencilZPass: THREE.KeepStencilOp,
      side: THREE.DoubleSide,
    })
  }

  createScene() {
    const projectBox = new SceneObject(
      this.geometries['box'],
      this.materials['stencil12'],
      { x: 0, y: 0, z: -2.5 },
    )
    this.add(projectBox)
    this.projectBox = projectBox

    const plane = new SceneObject(
      this.geometries['plane'],
      this.materials['stencil1'],
      { x: 0, y: 0, z: -10 },
    )
    this.add(plane)

    projectBox.onClick = (hit) => this.boxClick(hit)
    projectBox.mesh.userData.onHover = () => this.boxHover()
    projectBox.mesh.userData.deHover = () => this.boxDehover()
    projectBox.mesh.userData.onAnimate = (mesh, t) => Animations.rotate(mesh)

    const inner = new SceneObject(
      this.geometries['box'],
      this.materials['stencil2'],
      { x: 0, y: 0, z: -5 },
    )
    inner.mesh.userData.onAnimate = (mesh, t) => Animations.rotate(mesh)
    this.add(inner)
    this.inner = inner
  }

  boxClick(hit) {
    Animations.enterScene(this.ctx, -2.5, null, () => {
      this.ctx.interacter.onEscape.push(() => this.exitScene())
    })
  }

  exitScene() {
    Animations.exitScene(this.ctx, 0, this.ctx.scenes['splash'], () => {})
  }

  boxHover() {
    Animations.hoverScale(this.projectBox.mesh, 1.15, this.ctx.canvas)
  }

  boxDehover() {
    Animations.dehoverScale(this.projectBox.mesh, this.ctx.canvas)
  }
}
