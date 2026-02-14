import * as THREE from 'three'
import Scene from '../Scene.js'
import SceneObject from '../SceneObject.js'
import ProjectObject from '../ProjectObject.js'
import Animations from '../Animations.js'
import vertexShader from '../../shaders/vertex.js'
import fragmentShader from '../../shaders/fragment1.js'

export default class Projects extends Scene {
  createMaterials() {
    this.geometries['plane'] = new THREE.PlaneGeometry(125, 125)

    this.materials['stencil1'] = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
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
    this.materials['stencil1-white'] = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      depthFunc: THREE.AlwaysDepth,
      depthWrite: false,
      stencilWrite: true,
      stencilRef: 1,
      stencilZPass: THREE.ReplaceStencilOp,
      stencilFunc: THREE.EqualStencilFunc,
    })
  }

  createScene() {
    // background plane (stencil 1 reader)
    const plane = new SceneObject(
      this.geometries['plane'],
      this.materials['stencil1'],
      { x: 0, y: 0, z: -10 },
    )
    this.add(plane)
    plane.mesh.userData.onAnimate = (mesh, t) => {
      this.materials['stencil1'].uniforms.time.value = t * 0.001
    }

    const projText = this.ctx.create_text('Projects', {
      fontSize: 0.5,
      material: this.materials['stencil1-white'],
      position: { x: 0, y: 1.0, z: -2.5 },
    })
    this.add(projText)

    // project object
    this.project = new ProjectObject(
      this.ctx,
      2,
      { x: 0, y: 0, z: -7.5 },
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

    for (const obj of this.project.objects()) {
      this.add(obj)
    }

    this.projectWindow = this.project.window
    this.projectWindow.onClick = (hit) => this.projectClick(hit)
    this.projectWindow.mesh.userData.onHover = () => this.boxHover()
    this.projectWindow.mesh.userData.deHover = () => this.boxDehover()
  }

  projectClick(hit) {
    Animations.enterScene(this.ctx, -2.5, null, () => {
      this.ctx.interacter.onEscape.push(() => this.exitScene())
      this.ctx.interacter.interactables = []
      this.ctx.canvas.addEventListener('wheel', this.project._onWheel, {
        passive: false,
      })
      window.addEventListener('keydown', this.project._onKeyDown)
    })
  }

  exitScene() {
    this.ctx.canvas.removeEventListener('wheel', this.project._onWheel)
    window.removeEventListener('keydown', this.project._onKeyDown)
    this.project.resetScroll()

    Animations.exitScene(this.ctx, 0, this.ctx.scenes['projects'], () => {
      this.ctx.interactables =
        Animations.getInteractables[this.ctx.scenes['splash']]
    })
  }

  boxHover() {
    Animations.hoverScale(this.projectWindow.mesh, 1.05, this.ctx.canvas)
  }

  boxDehover() {
    Animations.dehoverScale(this.projectWindow.mesh, this.ctx.canvas)
  }
}
