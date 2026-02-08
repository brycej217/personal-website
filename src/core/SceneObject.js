import * as THREE from 'three'

export default class SceneObject {
  constructor(geometry, material, position = { x: 0, y: 0, z: 0 }) {
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.x = position.x
    this.mesh.position.y = position.y
    this.mesh.position.z = position.z

    this.mesh.userData.onClick = (hit) => this.onClick(hit)
    this.mesh.userData.onHover = () => this.onHover()
    this.mesh.userData.deHover = () => this.onDehover()
  }

  onClick(hit) {}

  onHover() {}

  onDehover() {}
}
