import * as THREE from 'three'
import Scene from '../Scene.js'
import Animations from '../Animations.js'
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
  }

  _createPlane() {
    const geom = new THREE.PlaneGeometry(125, 125)
    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0.0 },
      },
    })
    const plane = new SceneObject(geom, mat, {
      x: 0,
      y: 0,
      z: -10,
    })
    plane.mesh.userData.onAnimate = (mesh, t) => {
      mat.uniforms.time.value = t * 0.001
    }
    this.add(plane)
  }

  _createText() {
    const text = this.ctx.create_text("Hi, I'm Bryce", {
      fontSize: 2.5,
      position: { x: 0, y: 3.5, z: -5 },
    })
    this.add(text)
    this.text = text
  }

  createScene() {
    this._createProjectWindow()
    this._createPlane()
    this._createText()
  }

  boxClick(hit) {
    const projects = this.ctx.scenes['projects']
    Animations.enterScene(this.ctx, { x: 0, y: 0, z: 0 }, projects, () => {
      this.ctx.interacter.onEscape.push(() => this.exitScene())

      projects.planeMat.stencilFunc = THREE.AlwaysStencilFunc // project background plane now always writing 1
      this.disableObject(this.ctx, this.text)
    })
  }

  exitScene() {
    const projects = this.ctx.scenes['projects']

    projects.planeMat.stencilFunc = THREE.EqualStencilFunc
    this.enableObject(this.ctx, this.text)
    Animations.exitScene(this.ctx, { x: 0, y: 0, z: 5 }, this, () => {})
  }

  boxHover(window) {
    Animations.hoverScale(window.mesh, 1.15, this.ctx.canvas)
  }

  boxDehover(window) {
    Animations.dehoverScale(window.mesh, this.ctx.canvas)
  }
}
