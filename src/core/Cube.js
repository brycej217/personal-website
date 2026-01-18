import * as THREE from 'three'

export default class Cube {
  id // for stencil

  mesh
  geometry
  material

  constructor(id) {
    this.id = id

    this.geometry = new THREE.BoxGeometry(1, 1, 1)
    this.material = new THREE.MeshBasicMaterial({
      depthWrite: false,
      stencilWrite: true,
      stencilRef: id,
      stencilFunc: THREE.AlwaysStencilFunc,
      stencilZPass: THREE.ReplaceStencilOp,
    })
    this.material.side = THREE.DoubleSide
    this.mesh = new THREE.Mesh(this.geometry, this.material)
  }
}
