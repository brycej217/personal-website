import * as THREE from 'three'
import gsap from 'gsap'

export default class Animations {
  static getInteractables(scene) {
    const meshes = scene.objects.map((o) => o.mesh)
    return meshes
  }

  static enterScene(ctx, targetPos, targetScene, onComplete) {
    gsap.to(ctx.camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 2,
      ease: 'power4.inOut',
      onComplete: () => {
        if (targetScene) {
          ctx.interacter.interactables =
            Animations.getInteractables(targetScene)
        }
        if (onComplete) onComplete()
      },
    })
  }

  static exitScene(ctx, targetPos, returnScene, onComplete) {
    if (returnScene) {
      ctx.interacter.interactables = Animations.getInteractables(returnScene)
    }
    gsap.to(ctx.camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 2,
      ease: 'power4.inOut',
      onComplete: () => {
        if (onComplete) onComplete()
      },
    })
  }

  static hoverScale(mesh, scale, canvas) {
    gsap.to(mesh.scale, {
      x: scale,
      y: scale,
      z: scale,
      duration: 0.3,
      ease: 'back.out(2)',
    })
    canvas.style.cursor = 'pointer'
  }

  static dehoverScale(mesh, canvas) {
    gsap.to(mesh.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.3,
      ease: 'power2.out',
    })
    canvas.style.cursor = 'default'
  }

  static rotate(mesh, speed = 0.005) {
    mesh.rotation.x += speed
    mesh.rotation.y += speed
  }
}
