document.addEventListener("DOMContentLoaded", () => {
  // #region Game settings
  const gameDrawSpeedInMilliseconds = 30
  const stageWidth = 400
  const stageHeight = 600
  const platformStartingPosition = 100
  const platformCount = 5
  // #endregion Game settings

  class Game {
    stage
    platforms

    constructor() {
      this.start = this.start.bind(this)
      this._draw = this._draw.bind(this)
      this._startDrawLoop = this._startDrawLoop.bind(this)
    }

    start() {
      this.stage = document.getElementById("stage")
      this.platforms = new Platforms()
      this.platforms.createPlatforms()

      this._startDrawLoop()
    }

    _draw() {
      this.platforms.draw()
    }

    _startDrawLoop() {
      setInterval(this._draw, gameDrawSpeedInMilliseconds)
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

    constructor(newPlatformBottom) {
      this.draw = this.draw.bind(this)
      this._placeAtRandomLeft = this._placeAtRandomLeft.bind(this)
      this._updateContainerBox = this._updateContainerBox.bind(this)

      this.bottom = newPlatformBottom
      this._placeAtRandomLeft()
      this._updateContainerBox()
      this.element = document.createElement("div")
      this.element.classList.add("platform-basic")
      game.stage.appendChild(this.element)
    }

    draw() {
      this.element.style.left = `${this.left}px`
      this.element.style.bottom = `${this.bottom}px`
    }

    _placeAtRandomLeft() {
      this.left = Math.floor(Math.random() * (stageWidth - this.width))
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
  }

  const game = new Game()
  game.start()
})