import * as THREE from 'three'

export default class Plane {
  id // for stencil

  mesh
  geometry
  material

  constructor(id, vertex_shader, fragment_shader) {
    this.id = id

    this.geometry = new THREE.PlaneGeometry(2, 2)
    this.material = new THREE.ShaderMaterial({
      vertexShader: vertex_shader,
      fragmentShader: fragment_shader,
      uniforms: {
        time: { value: 0 },
      },
      depthTest: false, // required for avoiding z conflicts
      depthWrite: false,
      stencilWrite: true,
      stencilRef: id + 1,
      stencilFunc: THREE.EqualStencilFunc,
    })
    this.mesh = new THREE.Mesh(this.geometry, this.material)
  }

  set_shaders(vertex_shader, fragment_shader) {
    this.material.vertexShader = vertex_shader
    this.material.fragmentShader = fragment_shader
    this.material.needsUpdate = true
  }

  set_stencil(val) {
    this.material.stencilWrite = val
    this.material.stencilFunc = val
      ? THREE.EqualStencilFunc
      : THREE.AlwaysStencilFunc
    this.mesh.renderOrder = val ? 1 : 0
  }
}
