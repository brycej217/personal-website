import * as THREE from 'three'
import gsap from 'gsap'
import Scene from '../Scene.js'
import SceneObject from '../SceneObject.js'
import ProjectObject from '../ProjectObject.js'
import Animations from '../Animations.js'
import vertexShader from '../../shaders/vertex.js'
import fragmentShader1 from '../../shaders/fragment1.js'
import fragmentShader2 from '../../shaders/fragment2.js'
import fragmentShader3 from '../../shaders/fragment3.js'

export default class Projects extends Scene {
  _createPlane() {
    const geom = new THREE.PlaneGeometry(125, 125)

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: fragmentShader1,
      uniforms: {
        time: { value: 0.0 },
      },
      depthFunc: THREE.AlwaysDepth,
      depthWrite: false,
      stencilWrite: true,
      stencilRef: 1,
      stencilZPass: THREE.ReplaceStencilOp,
      stencilFunc: THREE.EqualStencilFunc,
    })
    this.planeMat = mat

    const plane = new SceneObject(geom, mat, { x: 0, y: 0, z: -10 })
    this.add(plane)
    plane.mesh.userData.onAnimate = (mesh, t) => {
      mat.uniforms.time.value = t * 0.001
    }
  }

  _createText(content) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      depthFunc: THREE.AlwaysDepth,
      depthWrite: false,
      stencilWrite: true,
      stencilRef: 1,
      stencilZPass: THREE.ReplaceStencilOp,
      stencilFunc: THREE.EqualStencilFunc,
    })

    const projText = this.ctx.create_text(content.title, {
      fontSize: 1.5,
      material: mat,
      position: { x: 0, y: 2.5, z: -5.0 },
    })
    this.add(projText)
    this._title = projText
  }

  _createProjects(content) {
    const fragments = [fragmentShader2, fragmentShader3]
    const positions = [
      { x: -1.5, y: 0, z: -5.0 },
      { x: 1.5, y: 0, z: -5.0 },
    ]

    content.items.forEach((item, i) => {
      const project = new ProjectObject(
        this.ctx,
        i + 2,
        positions[i],
        fragments[i],
        item,
      )
      this.projects.push(project)
    })
  }

  createScene(content) {
    this.projects = []
    this._createPlane()
    this._createText(content)
    this._createProjects(content)

    // link up projects
    for (const project of this.projects) {
      for (const obj of project.objects()) {
        this.add(obj)
      }

      project.window.onClick = (hit) => this.projectClick(hit, project)
      project.window.mesh.userData.onHover = () => this.boxHover(project)
      project.window.mesh.userData.deHover = () => this.boxDehover(project)
    }
  }

  _hideForEntry() {
    if (!this._titleHomeY) {
      this._titleHomeY = this._title.mesh.position.y
      for (const project of this.projects) {
        for (const obj of project.objects()) {
          obj.mesh.userData._homeX = obj.mesh.position.x
        }
      }
    }

    this._title.mesh.position.y = this._titleHomeY + 3
    this._title.mesh.material.opacity = 0

    for (const project of this.projects) {
      const dir = project.position.x < 0 ? -1 : 1
      for (const obj of project.objects()) {
        obj.mesh.position.x = obj.mesh.userData._homeX + dir * 10
      }
    }
  }

  onEnterAnimation(delay = 1.2) {
    const ease = 'power3.out'
    const duration = 1.0

    const tl = gsap.timeline({ delay })

    tl.to(
      this._title.mesh.position,
      {
        y: this._titleHomeY,
        duration,
        ease,
      },
      0,
    )
    tl.to(
      this._title.mesh.material,
      {
        opacity: 1,
        duration,
        ease,
      },
      0,
    )

    for (const project of this.projects) {
      for (const obj of project.objects()) {
        tl.to(
          obj.mesh.position,
          {
            x: obj.mesh.userData._homeX,
            duration,
            ease,
          },
          0.15,
        )
      }
    }
  }

  onExitAnimation(onComplete) {
    const ease = 'power3.in'
    const duration = 0.8

    const tl = gsap.timeline({ onComplete })

    tl.to(
      this._title.mesh.position,
      {
        y: this._titleHomeY + 3,
        duration,
        ease,
      },
      0,
    )
    tl.to(
      this._title.mesh.material,
      {
        opacity: 0,
        duration,
        ease,
      },
      0,
    )

    for (const project of this.projects) {
      const dir = project.position.x < 0 ? -1 : 1
      for (const obj of project.objects()) {
        tl.to(
          obj.mesh.position,
          {
            x: obj.mesh.userData._homeX + dir * 10,
            duration,
            ease,
          },
          0,
        )
      }
    }
  }

  projectClick(hit, project) {
    this.activeProject = project
    Animations.enterScene(this.ctx, project.position, null, () => {
      this.ctx.interacter.onEscape.push(() => this.exitScene())
      this.ctx.interacter.interactables = []
      this.ctx.canvas.addEventListener('wheel', project._onWheel, {
        passive: false,
      })
    })
  }

  exitScene() {
    const project = this.activeProject
    this.ctx.canvas.removeEventListener('wheel', project._onWheel)
    project.resetScroll()

    Animations.exitScene(
      this.ctx,
      { x: 0, y: 0, z: 0 },
      this.ctx.scenes['projects'],
      () => {
        this.ctx.interactables =
          Animations.getInteractables[this.ctx.scenes['splash']]
      },
    )
  }

  getScrollables() {
    const meshes = [this._title.mesh]
    for (const project of this.projects) {
      for (const obj of project.objects()) {
        meshes.push(obj.mesh)
      }
    }
    for (const obj of this.objects) {
      meshes.push(obj.mesh)
    }
    return meshes
  }

  boxHover(project) {
    Animations.hoverScale(project.window.mesh, 1.05, this.ctx.canvas)
  }

  boxDehover(project) {
    Animations.dehoverScale(project.window.mesh, this.ctx.canvas)
  }
}
