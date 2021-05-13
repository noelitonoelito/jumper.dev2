document.addEventListener("DOMContentLoaded", () => {
  // #region Game settings
  const gameUpdateSpeedInMilliseconds = 10
  const gameDrawSpeedInMilliseconds = 30
  const stageWidth = 400
  const stageHeight = 600
  const platformStartingPosition = 100
  const platformCount = 5
  const stageMoveSpeed = 4
  const platformMoveSpeed = stageMoveSpeed
  // #endregion Game settings

  class Game {
    stage
    jumper
    platforms

    constructor() {
      this.isStageAdvancing = this.isStageAdvancing.bind(this)
      this.start = this.start.bind(this)
      this._draw = this._draw.bind(this)
      this._startUpdateLoop = this._startUpdateLoop.bind(this)
      this._startDrawLoop = this._startDrawLoop.bind(this)
      this._updateState = this._updateState.bind(this)
    }

    isStageAdvancing() {
      return false
    }

    start() {
      this.stage = document.getElementById("stage")
      this.jumper = new Jumper()
      this.platforms = new Platforms()
      this.platforms.createPlatforms()
      this.jumper.setStartingPlatform(this.platforms.getLowestPlatform())

      this._startUpdateLoop()
      this._startDrawLoop()
    }

    _draw() {
      this.platforms.draw()
      this.jumper.draw()
    }

    _startUpdateLoop() {
      setInterval(this._updateState, gameUpdateSpeedInMilliseconds)
    }

    _startDrawLoop() {
      setInterval(this._draw, gameDrawSpeedInMilliseconds)
    }

    _updateState() {
      this.platforms.updateState()
    }
  }

  class Jumper {
    element
    width = 60
    height = 85
    left = 50
    bottom = 150
    right = this.left + this.width
    top = this.bottom + this.height

    constructor() {
      this.draw = this.draw.bind(this)
      this.setStartingPlatform = this.setStartingPlatform.bind(this)
      this._updateContainerBox = this._updateContainerBox.bind(this)

      this.element = document.createElement("div")
      this.element.id = "jumper"
      game.stage.appendChild(this.element)
    }

    draw() {
      this.element.style.left = `${this.left}px`
      this.element.style.bottom = `${this.bottom}px`
    }

    setStartingPlatform(platform) {
      this.left = platform.left
      this.bottom = platform.top
      this._updateContainerBox()
    }

    _updateContainerBox() {
      this.right = this.left + this.width
      this.top = this.bottom + this.height
    }
  }

  class Platform {
    element
    width = 85
    height = 15
    left = 0
    right = 0
    top = 0
    bottom = 0
    needsToDraw = true

    constructor(newPlatformBottom) {
      this.draw = this.draw.bind(this)
      this.updateState = this.updateState.bind(this)
      this._placeAtRandomLeft = this._placeAtRandomLeft.bind(this)
      this._placeAtTop = this._placeAtTop.bind(this)
      this._updateContainerBox = this._updateContainerBox.bind(this)

      this.bottom = newPlatformBottom
      this._placeAtRandomLeft()
      this._updateContainerBox()
      this.element = document.createElement("div")
      this.element.classList.add("platform-basic")
      game.stage.appendChild(this.element)
    }

    draw() {
      if (!this.needsToDraw) { return }
      this.element.style.left = `${this.left}px`
      this.element.style.bottom = `${this.bottom}px`
      this.needsToDraw = false
    }

    updateState() {
      if (!game.isStageAdvancing()) { return }

      this.bottom -= platformMoveSpeed
      this._updateContainerBox()

      if (this.top < 0) {
        this._placeAtTop()
        this._placeAtRandomLeft()
        this._updateContainerBox()
      }

      this.needsToDraw = true
    }

    _placeAtRandomLeft() {
      this.left = Math.floor(Math.random() * (stageWidth - this.width))
    }

    _placeAtTop() {
      this.bottom = stageHeight
    }

    _updateContainerBox() {
      this.right = this.left + this.width
      this.top = this.bottom + this.height
    }
  }

  class Platforms {
    listOfPlatforms = []

    constructor() {
      this.createPlatforms = this.createPlatforms.bind(this)
      this.draw = this.draw.bind(this)
      this.getLowestPlatform = this.getLowestPlatform.bind(this)
      this.updateState = this.updateState.bind(this)
    }

    createPlatforms() {
      for (let i = 0; i < platformCount; i++) {
        const platformGap = stageHeight / platformCount
        const newPlatformBottom = platformStartingPosition + (i * platformGap)
        const newPlatform = new Platform(newPlatformBottom)
        this.listOfPlatforms.push(newPlatform)
      }
    }

    draw() {
      this.listOfPlatforms.forEach((platform) => { platform.draw() })
    }

    getLowestPlatform() {
      return this.listOfPlatforms[0]
    }

    updateState() {
      this.listOfPlatforms.forEach((platform) => { platform.updateState() })
    }
  }

  const game = new Game()
  game.start()
})