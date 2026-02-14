import * as THREE from 'three'
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

  _createText() {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      depthFunc: THREE.AlwaysDepth,
      depthWrite: false,
      stencilWrite: true,
      stencilRef: 1,
      stencilZPass: THREE.ReplaceStencilOp,
      stencilFunc: THREE.EqualStencilFunc,
    })

    const projText = this.ctx.create_text('Projects', {
      fontSize: 1.5,
      material: mat,
      position: { x: 0, y: 2.5, z: -5.0 },
    })
    this.add(projText)
  }

  _createProjects() {
    // project object
    const cudaProject = new ProjectObject(
      this.ctx,
      2,
      { x: -1.5, y: 0, z: -5.0 },
      fragmentShader2,
      {
        title: 'CUDA Path Tracer',
        images: [
          'public/assets/images/cuda0.png',
          'public/assets/images/cuda1.png',
          'public/assets/images/cuda2.png',
          'public/assets/images/cuda3.png',
          'public/assets/images/cuda4.png',
        ],
        writeup:
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
          'and adaptive sampling that allocates more rays to high-variance pixels.',
      },
    )

    // glRemix project
    const glRemixProject = new ProjectObject(
      this.ctx,
      3,
      { x: 1.5, y: 0, z: -5.0 },
      fragmentShader3,
      {
        title: 'glRemix',
        images: [],
        writeup:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
          'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ' +
          'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
      },
    )

    this.projects.push(cudaProject)
    this.projects.push(glRemixProject)
  }

  createScene() {
    this.projects = []
    this._createPlane()
    this._createText()
    this._createProjects()

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

  projectClick(hit, project) {
    this.activeProject = project
    Animations.enterScene(this.ctx, project.position, null, () => {
      this.ctx.interacter.onEscape.push(() => this.exitScene())
      this.ctx.interacter.interactables = []
      this.ctx.canvas.addEventListener('wheel', project._onWheel, {
        passive: false,
      })
      window.addEventListener('keydown', project._onKeyDown)
    })
  }

  exitScene() {
    const project = this.activeProject
    this.ctx.canvas.removeEventListener('wheel', project._onWheel)
    window.removeEventListener('keydown', project._onKeyDown)
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

  boxHover(project) {
    Animations.hoverScale(project.window.mesh, 1.05, this.ctx.canvas)
  }

  boxDehover(project) {
    Animations.dehoverScale(project.window.mesh, this.ctx.canvas)
  }
}
