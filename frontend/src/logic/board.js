import _ from 'lodash'

export default class Board {
  constructor(size) {
    this.size = size
    this.board = this.createBoard(size)
    this.currentMoveBlack = true;
    this.lastMovePass = false;
  }

  createBoard(size) {
    let b = []
    for (let i = 0; i < size; i++) {
      b[i] = []
      for (let j = 0; j < size; j++) {
        b[i][j] = "";
      }
    }
    return b
  }

  switchPlayer() {
    this.currentMoveBlack = !this.currentMoveBlack
  }

  pass() {
    if (this.lastMovePass) {
      this.endGame()
    }
    this.lastMovePass = true
    this.switchPlayer()
  }

  endGame() {
    
  }

  move(i, j) {
    if (this.board[i][j] !== "") {
      return false
    }

    let color = this.board[i][j] = (this.currentMoveBlack ? "B" : "W")
    let captured = []
    let neighbors = this.getAdjacent(i, j)

    let self = this
    _.each(neighbors, function(n) {
      let state = self.getGroup(n[0], n[1])
      if (state !== "" && state !== color) {
        let group = self.getGroup(n[0], n[1])
        if (group) {
          if (group["liberties"] === 0) {
            captured.push(group)
          }
        }
      }
    })

    if (_.isEmpty(captured) && this.getGroup(i, j)["liberties"] === 0) {
      this.board[i][j] = ""
      return false
    }

    _.each(captured, function(group) {
      _.each(group["stones"], function(stone) {
          self.board[stone[0]][stone[1]] = "";
      })
    })

    this.lastMovePass = false
    this.switchPlayer()
    return true
  }

  getAdjacent(i, j) {
    let neighbors = []; 
    if (i > 0)
        neighbors.push([i - 1, j]);
    if (j < this.size - 1)
        neighbors.push([i, j + 1]);
    if (i < this.size - 1)
        neighbors.push([i + 1, j]);
    if (j > 0)
        neighbors.push([i, j - 1]);
    return neighbors;
  }

  getGroup(i, j) {
    let color = this.board[i][j]
    if (color === "") {
      return null
    }

    let visited = {}
    let visitedList = []
    let queue = [[i, j]]
    let count = 0

    while (queue.length > 0) {
      let stone = queue.pop()
      if (visited[stone]) {
        continue
      }

      let neighbors = this.getAdjacent(stone[0], stone[1])
      let self = this
      _.each(neighbors, function(n) {
        let state = self.board[n[0]][n[1]]
        if (state === "") {
          count++
        }
        if (state === color) {
          queue.push([n[0], n[1]])
        }
      })

      visited[stone] = true
      visitedList.push(stone)
    }

    return {
      "liberties": count,
      "stones": visitedList
    }
  }
}