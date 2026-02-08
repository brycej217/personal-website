import * as THREE from 'three'
import Scene from '../Scene.js'
import Animations from '../Animations.js'
import SceneObject from '../SceneObject.js'

export default class Splash extends Scene {
  createMaterials() {
    this.geometries['box'] = new THREE.BoxGeometry(1, 1, 1)
    this.materials['stencil1'] = new THREE.MeshBasicMaterial({
      stencilWrite: true,
      stencilRef: 1,
      stencilFunc: THREE.AlwaysStencilFunc,
      stencilZPass: THREE.ReplaceStencilOp,
      side: THREE.DoubleSide,
    })
  }

  createScene() {
    const splashBox = new SceneObject(
      this.geometries['box'],
      this.materials['stencil1'],
      { x: 0, y: 0, z: 0 },
    )
    this.add(splashBox)
    this.splashBox = splashBox

    {
      this.splashBox.onClick = (hit) => this.boxClick(hit)
      this.splashBox.mesh.userData.onHover = (hit) => this.boxHover()
      this.splashBox.mesh.userData.deHover = () => this.boxDehover()
      this.splashBox.mesh.userData.onAnimate = (mesh, t) =>
        Animations.rotate(mesh)
    }

    const text = this.ctx.create_text("Hi, I'm Bryce", -5, 3.5, 2.5)
    this.add(text)
    this.text = text
  }

  boxClick(hit) {
    const projects = this.ctx.scenes['projects']
    Animations.enterScene(this.ctx, 0, projects, () => {
      this.ctx.interacter.onEscape.push(() => this.exitScene())
      this.disable(this.ctx)

      projects.materials['stencil1'].stencilFunc = THREE.AlwaysStencilFunc
      projects.materials['stencil12'].stencilFunc = THREE.AlwaysStencilFunc
    })
  }

  exitScene() {
    const projects = this.ctx.scenes['projects']

    projects.materials['stencil1'].stencilFunc = THREE.EqualStencilFunc
    projects.materials['stencil12'].stencilFunc = THREE.EqualStencilFunc
    this.enable(this.ctx)

    Animations.exitScene(this.ctx, 5, this, () => {})
  }

  boxHover() {
    Animations.hoverScale(this.splashBox.mesh, 1.15, this.ctx.canvas)
  }

  boxDehover() {
    Animations.dehoverScale(this.splashBox.mesh, this.ctx.canvas)
  }
}
