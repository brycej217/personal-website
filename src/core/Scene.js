import * as THREE from 'three'

export default class Scene {
  constructor(ctx) {
    this.ctx = ctx
    this.objects = []
    this.geometries = {}
    this.materials = {}
    this.createMaterials()
  }

  createMaterials() {}

  add(object) {
    this.objects.push(object)
  }

  enable(ctx) {
    for (const object of this.objects) {
      ctx.scene.add(object.mesh)
    }
  }

  disable(ctx) {
    for (const object of this.objects) {
      ctx.scene.remove(object.mesh)
    }
  }

  disableObject(ctx, object) {
    ctx.scene.remove(object.mesh)
  }

  enableObject(ctx, object) {
    ctx.scene.add(object.mesh)
  }
}
