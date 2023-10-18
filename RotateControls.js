import { Euler, EventDispatcher, Vector3 } from 'three'

const _xAxis = new Vector3(1, 0, 0)
const _yAxis = new Vector3(0, 1, 0)

const _changeEvent = { type: 'change' }

class RotateControls extends EventDispatcher {
  constructor(object, domElement) {
    super()

    this.object = object
    this.domElement = domElement

    this.isDown = false
    this.canRotate = true

    this.pointerSpeed = 2.0

    this._onMouseMove = onMouseMove.bind(this)
    this._onMouseDown = onMouseDown.bind(this)
    this._onMouseUp = onMouseUp.bind(this)

    this.connect()
  }

  connect() {
    this.domElement.ownerDocument.addEventListener(
      'mousemove',
      this._onMouseMove
    )
    this.domElement.ownerDocument.addEventListener(
      'mousedown',
      this._onMouseDown
    )
    this.domElement.ownerDocument.addEventListener('mouseup', this._onMouseUp)
  }

  disconnect() {
    this.domElement.ownerDocument.removeEventListener(
      'mousemove',
      this._onMouseMove
    )
    this.domElement.ownerDocument.removeEventListener(
      'mousedown',
      this._onMouseDown
    )
    this.domElement.ownerDocument.removeEventListener(
      'mouseup',
      this._onMouseUp
    )
  }

  dispose() {
    this.disconnect()
  }

  getObject() {
    return this.camera
  }

  getDirection(v) {
    return v.set(0, 0, -1).applyQuaternion(this.object.quaternion)
  }
}

// event listeners

function onMouseMove(event) {
  if (this.isDown === false) return
  if (this.canRotate === false) return

  const movementX =
    event.movementX || event.mozMovementX || event.webkitMovementX || 0
  const movementY =
    event.movementY || event.mozMovementY || event.webkitMovementY || 0

  const object = this.object

  const angleX = movementY * 0.002 * this.pointerSpeed
  const angleY = movementX * 0.002 * this.pointerSpeed

  object.rotateOnWorldAxis(_xAxis, angleX)
  object.rotateOnWorldAxis(_yAxis, angleY)

  this.dispatchEvent(_changeEvent)
}
function onMouseDown(event) {
  this.isDown = true
}
function onMouseUp(event) {
  this.isDown = false
}

export { RotateControls }
