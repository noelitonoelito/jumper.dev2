document.addEventListener("DOMContentLoaded", () => {
  // #region Game settings
  const gameUpdateSpeedInMilliseconds = 10
  const gameDrawSpeedInMilliseconds = 30
  const stageWidth = 400
  const stageHeight = 600
  const platformStartingPosition = 100
  const platformAdvancingLine = 400
  const stageMoveSpeed = 1
  const jumperMaxHeight = 250
  const maxPlatformGap = Math.floor(jumperMaxHeight * 0.9)
  const jumperJumpSpeed = 8
  const jumperFallSpeed = 5
  const jumperLeftRightSpeed = 6
  const scoreIncreaseRate = 0.1
  // #endregion Game settings

  /**
   * Generates a random number between `min` and `max`
   * @param min the minimum number that should be returned
   * @param max the maximum number that should be returned
   * @returns a randomly generated number
   */
  function randomNumber(min, max) {
    return (Math.random() * (max - min)) + min
  }

  // https://stackoverflow.com/questions/29325069/how-to-generate-random-numbers-biased-towards-one-value-in-a-range
  /**
   * Generates a random number between `min` and `max` favoring to the
   * degree of `influence` towards the `bias` 
   * @param min the minimum number that should be returned
   * @param max the maximum number that should be returned
   * @param bias the number within `min` and `max` that the result should
   * gravitate towards
   * @param influence a number from 0 to 1 to determine the amount of
   * influence towards the bias. 0 - least influence; 1 - most influence
   * @returns a randomly generated number
   */
  function getRandomNumberWithBias(min, max, bias, influence) {
    const n = randomNumber(min, max)
    const randomMixer = Math.random() * influence
    return n * (1 - randomMixer) + bias * randomMixer
  }

  class Game {
    stage
    scoreBoard
    jumper
    platforms
    isGameOver = false
    score = 0
    updateLoopTicker
    drawLoopTicker
    backgroundY = 0
    isTouchEnabled = false
    needsToDraw = true

    constructor() {
      this.gameOver = this.gameOver.bind(this)
      this.isStageAdvancing = this.isStageAdvancing.bind(this)
      this.start = this.start.bind(this)
      this._createAndDrawGameOver = this._createAndDrawGameOver.bind(this)
      this._createScoreBoard = this._createScoreBoard.bind(this)
      this._draw = this._draw.bind(this)
      this._keyPushedDown = this._keyPushedDown.bind(this)
      this._keyReleased = this._keyReleased.bind(this)
      this._startDrawLoop = this._startDrawLoop.bind(this)
      this._startUpdateLoop = this._startUpdateLoop.bind(this)
      this._updateState = this._updateState.bind(this)
      this._watchUserActions = this._watchUserActions.bind(this)

      this.isTouchEnabled = "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
    }

    gameOver() {
      this.isGameOver = true
      clearInterval(this.updateLoopTicker)
      clearInterval(this.drawLoopTicker)
      this._createAndDrawGameOver()
    }

    isStageAdvancing() {
      return this.jumper.bottom > platformAdvancingLine
    }

    start() {
      this.stage = document.getElementById("stage")
      this.jumper = new Jumper()
      this.platforms = new Platforms()
      this._createScoreBoard()
      this.platforms.createPlatforms()
      this.jumper.setStartingPlatform(this.platforms.getLowestPlatform())

      this._watchUserActions()
      this._startUpdateLoop()
      this._startDrawLoop()
    }

    _createAndDrawGameOver() {
      const gameOver = document.createElement("div")
      gameOver.id = "gameOver"
      gameOver.innerHTML = "Game Over"
      this.stage.appendChild(gameOver)
    }

    _createScoreBoard() {
      this.scoreBoard = document.createElement("div")
      this.scoreBoard.id = "scoreBoard"
      this.scoreBoard.innerHTML = this.score
      this.stage.appendChild(this.scoreBoard)
    }

    _draw() {
      if (this.needsToDraw) {
        this.stage.style.backgroundPositionY = `${this.backgroundY}px`
        this.scoreBoard.innerHTML = Math.floor(this.score)
        this.needsToDraw = false
      }

      this.platforms.draw()
      this.jumper.draw()
    }

    _keyPushedDown(e) {
      if (["ArrowLeft", "a", "A"].includes(e.key)) {
        this.jumper.moveLeft()
      } else if (["ArrowRight", "d", "D"].includes(e.key)) {
        this.jumper.moveRight()
      }
    }

    _keyReleased(e) {
      this.jumper.moveStraight()
    }

    _startDrawLoop() {
      this.drawLoopTicker =
        setInterval(this._draw, gameDrawSpeedInMilliseconds)
    }

    _startUpdateLoop() {
      this.updateLoopTicker =
        setInterval(this._updateState, gameUpdateSpeedInMilliseconds)
    }

    _updateState() {
      if (this.isStageAdvancing()) {
        this.backgroundY += stageMoveSpeed
        this.score += scoreIncreaseRate
        this.needsToDraw = true
      }

      this.platforms.updateState()
      this.jumper.updateState()
    }

    _watchUserActions() {
      const leftButton = document.getElementById("leftButton")
      const rightButton = document.getElementById("rightButton")

      document.addEventListener("keydown", this._keyPushedDown)
      document.addEventListener("keyup", this._keyReleased)

      leftButton.addEventListener(
        "mousedown",
        this.jumper.moveLeft,
        { passive: true }
      )
      leftButton.addEventListener(
        "mouseup",
        this.jumper.moveStraight,
        { passive: true }
      )
      leftButton.addEventListener(
        "touchstart",
        this.jumper.moveLeft,
        { passive: true }
      )
      leftButton.addEventListener(
        "touchend",
        this.jumper.moveStraight,
        { passive: true }
      )

      rightButton.addEventListener(
        "mousedown",
        this.jumper.moveRight,
        { passive: true }
      )
      rightButton.addEventListener(
        "mouseup",
        this.jumper.moveStraight,
        { passive: true }
      )
      rightButton.addEventListener(
        "touchstart",
        this.jumper.moveRight,
        { passive: true }
      )
      rightButton.addEventListener(
        "touchend",
        this.jumper.moveStraight,
        { passive: true }
      )
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
    isJumping = true
    isFacingRight = true
    jumpHeight = 0
    isMovingLeft = false
    isMovingRight = false
    needsToDraw = true
    needsToUpdateFlipCssClass = true
    needsToUpdateJumpingCssClass = false

    constructor() {
      this.draw = this.draw.bind(this)
      this.updateState = this.updateState.bind(this)
      this.moveLeft = this.moveLeft.bind(this)
      this.moveRight = this.moveRight.bind(this)
      this.moveStraight = this.moveStraight.bind(this)
      this.setStartingPlatform = this.setStartingPlatform.bind(this)
      this._fall = this._fall.bind(this)
      this._incrementJumpHeight = this._incrementJumpHeight.bind(this)
      this._jump = this._jump.bind(this)
      this._updateContainerBox = this._updateContainerBox.bind(this)

      this.element = document.createElement("div")
      this.element.id = "jumper"
      game.stage.appendChild(this.element)
    }

    draw() {
      if (!this.needsToDraw) { return }

      if (this.needsToUpdateFlipCssClass) {
        if (this.isFacingRight) {
          this.element.classList.add("flip")
        } else {
          this.element.classList.remove("flip")
        }

        this.needsToUpdateFlipCssClass = false
      }

      if (this.needsToUpdateJumpingCssClass) {
        if (this.isJumping) {
          this.element.classList.add("jumping")
        } else {
          this.element.classList.remove("jumping")
        }

        this.needsToUpdateJumpingCssClass = false
      }

      this.element.style.left = `${this.left}px`
      this.element.style.bottom = `${this.bottom}px`
      this.needsToDraw = false
    }

    moveLeft() {
      if (this.isFacingRight) { this.needsToUpdateFlipCssClass = true }

      this.isFacingRight = false
      this.isMovingLeft = true
      this.isMovingRight = false
    }

    moveRight() {
      if (!this.isFacingRight) { this.needsToUpdateFlipCssClass = true }

      this.isFacingRight = true
      this.isMovingLeft = false
      this.isMovingRight = true
    }

    moveStraight() {
      this.isMovingLeft = false
      this.isMovingRight = false
    }

    updateState() {
      if (game.isGameOver) { return }

      // update vertical position
      if (this.isJumping) {
        this._incrementJumpHeight()

        // Move jumper but only if the stage isn't advancing. Once jumper
        //   gets to a certain stage height, we move the stage down instead
        //   to simulate the jumper moving up.
        if (!game.isStageAdvancing()) { this.bottom += jumperJumpSpeed }
      } else {
        this.bottom -= jumperFallSpeed
      }

      // update horizontal position
      if (this.isMovingLeft && this.left > 0) {
        this.left = Math.max(this.left - jumperLeftRightSpeed, 0)
      } else if (this.isMovingRight && this.right < stageWidth) {
        this.left = Math.min(this.left + jumperLeftRightSpeed, stageWidth)
      }

      this._updateContainerBox()

      // hit bottom of stage
      if (this.top <= 0) {
        game.gameOver()
      }

      // reached max jump height; start falling
      if (this.isJumping && this.jumpHeight >= jumperMaxHeight) {
        this._fall()
      }

      // landed on platform; jump again
      if (!this.isJumping && game.platforms.isOnAPlatform(this)) {
        this.jumpHeight = 0
        this._jump()
      }

      this.needsToDraw = true
    }

    setStartingPlatform(platform) {
      this.left = platform.left
      this.bottom = platform.top
      this._updateContainerBox()
    }

    _fall() {
      if (this.isJumping) { this.needsToUpdateJumpingCssClass = true }
      this.isJumping = false
    }

    _incrementJumpHeight() {
      this.jumpHeight += jumperJumpSpeed
    }

    _jump() {
      if (!this.isJumping) { this.needsToUpdateJumpingCssClass = true }
      this.isJumping = true
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
      this.destroy = this.destroy.bind(this)
      this.draw = this.draw.bind(this)
      this.updateState = this.updateState.bind(this)
      this._placeAtRandomLeft = this._placeAtRandomLeft.bind(this)
      this._updateContainerBox = this._updateContainerBox.bind(this)

      this.bottom = newPlatformBottom
      this._placeAtRandomLeft()
      this._updateContainerBox()
      this.element = document.createElement("div")
      this.element.classList.add("platform-basic")
      game.stage.appendChild(this.element)
    }

    destroy() {
      this.element?.remove()
    }

    draw() {
      if (!this.needsToDraw) { return }
      this.element.style.left = `${this.left}px`
      this.element.style.bottom = `${this.bottom}px`
      this.needsToDraw = false
    }

    updateState() {
      if (!game.isStageAdvancing()) { return }

      this.bottom -= jumperJumpSpeed
      this._updateContainerBox()
      this.needsToDraw = true
    }

    _placeAtRandomLeft() {
      this.left = randomNumber(0, stageWidth - this.width)
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
      this.isOnAPlatform = this.isOnAPlatform.bind(this)
      this.updateState = this.updateState.bind(this)
      this._destroyPlatformsBelowStage = this._destroyPlatformsBelowStage.bind(this)
      this._getHighestPlatform = this._getHighestPlatform.bind(this)
      this._getNextPlatformPosition = this._getNextPlatformPosition.bind(this)
    }

    createPlatforms() {
      let highestPlatform = this._getHighestPlatform()

      if (highestPlatform?.top > stageHeight) { return }

      let nextPlatformBottom = this._getNextPlatformPosition()

      while (nextPlatformBottom <= stageHeight + maxPlatformGap) {
        const newPlatform = new Platform(nextPlatformBottom)
        this.listOfPlatforms.push(newPlatform)
        nextPlatformBottom = this._getNextPlatformPosition()
      }
    }

    draw() {
      this.listOfPlatforms.forEach((platform) => { platform.draw() })
    }

    getLowestPlatform() {
      return this.listOfPlatforms[0]
    }

    isOnAPlatform(jumper) {
      return this.listOfPlatforms.some((platform) => {
        const isHorizontallyOnPlatform = jumper.bottom >= platform.bottom &&
          jumper.bottom <= platform.top
        const isVerticallyOnPlatform = jumper.right >= platform.left &&
          jumper.left <= platform.right
        return isHorizontallyOnPlatform && isVerticallyOnPlatform
      })
    }

    updateState() {
      this.listOfPlatforms.forEach((platform) => { platform.updateState() })

      if (game.isStageAdvancing()) {
        this.createPlatforms()
        this._destroyPlatformsBelowStage()
      }
    }

    _destroyPlatformsBelowStage() {
      for (let i = 0; i < this.listOfPlatforms.length; i++) {
        if (this.listOfPlatforms[i].top < 0) {
          this.listOfPlatforms.shift().destroy()
          continue;
        }

        break;
      }
    }

    _getHighestPlatform() {
      return this.listOfPlatforms[this.listOfPlatforms.length - 1]
    }

    _getNextPlatformPosition() {
      const highestPlatform = this._getHighestPlatform()
      return highestPlatform ?
        getRandomNumberWithBias(
          highestPlatform.top,
          highestPlatform.top + maxPlatformGap,
          highestPlatform.top + maxPlatformGap,
          1
        ) :
        platformStartingPosition
    }
  }

  const game = new Game()
  game.start()
})