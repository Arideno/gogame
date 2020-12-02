/* eslint-disable no-loop-func */
import _ from 'lodash'

export default class Board {
  constructor(size) {
    this.size = size
    this.board = this.createBoard(size)
    this.currentMoveBlack = true
    this.lastMovePass = false
    this.isEnd = false
    this.moves = []
    this.previousBoard = this.createBoard(size)
  }

  createBoard(size) {
    let b = []
    for (let i = 0; i < size; i++) {
      b[i] = []
      for (let j = 0; j < size; j++) {
        b[i][j] = ""
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
      this.moves.push("end")
    }
    this.lastMovePass = true
    this.moves.push("pass")
    this.switchPlayer()
  }

  endGame() {
    this.moves.push("end")
    this.isEnd = true
  }

  isLegal(i, j) {
    if (this.board[i][j] !== "") {
      return false
    }

    let copy = JSON.parse(JSON.stringify(this.board))

    let color = copy[i][j] = (this.currentMoveBlack ? "B" : "W")
    let captured = []
    let neighbors = this.getAdjacent(i, j)

    let self = this
    _.each(neighbors, function(n) {
      let state = self.getGroup(copy, n[0], n[1])
      if (state !== "" && state !== color) {
        let group = self.getGroup(copy, n[0], n[1])
        if (group) {
          if (group["liberties"] === 0) {
            captured.push(group)
          }
        }
      }
    })

    if (_.isEmpty(captured) && this.getGroup(copy, i, j)["liberties"] === 0) {
      return false
    }

    _.each(captured, function(group) {
      _.each(group["stones"], function(stone) {
          copy[stone[0]][stone[1]] = "";
      })
    })  

    return JSON.stringify(this.previousBoard) !== JSON.stringify(copy);

  }

  move(i, j) {
    this.previousBoard = JSON.parse(JSON.stringify(this.board))
    
    let color = this.board[i][j] = (this.currentMoveBlack ? "B" : "W")
    let captured = []
    let neighbors = this.getAdjacent(i, j)

    let self = this
    _.each(neighbors, function(n) {
      let state = self.getGroup(self.board, n[0], n[1])
      if (state !== "" && state !== color) {
        let group = self.getGroup(self.board, n[0], n[1])
        if (group) {
          if (group["liberties"] === 0) {
            captured.push(group)
          }
        }
      }
    })

    _.each(captured, function(group) {
      _.each(group["stones"], function(stone) {
          self.board[stone[0]][stone[1]] = "";
      })
    })

    this.lastMovePass = false
    this.switchPlayer()

    this.moves.push(`${String.fromCharCode(97 + i)}${String.fromCharCode(97 + j)}`)
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

  getGroup(board, i, j) {
    let color = board[i][j]
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
      _.each(neighbors, function(n) {
        let state = board[n[0]][n[1]]
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

  setUpFromMoves(moves) {
    this.board = this.createBoard(this.size)
    const self = this
    _.each(moves, function(m) {
      if (m.length === 2) {
        const i = m.charCodeAt(0) - 97
        const j = m.charCodeAt(1) - 97
        self.move(i, j)
      } else if (m === "pass") {
        self.pass()
      } else if (m === "end") {
        self.endGame()
      }
    })
  }
}