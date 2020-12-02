import React, { useContext } from 'react'
import { BoardContext } from '../context/boardContext'
import Intersection from './Intersection'

export default function Goban({reversed}) {
  const {board} = useContext(BoardContext)

  let intersections = []
  if (reversed) {
    for (let i = 0; i < board.size; i++) {
      for (let j = 0; j < board.size; j++) {
        intersections.push(<Intersection key={i*board.size + j} i={board.size - 1 - i} j={board.size - 1 - j} row={i} col={j} color={board.board[board.size - 1 - i][board.size - 1 - j]} />)
      }
    }
  } else {
    for (let i = 0; i < board.size; i++) {
      for (let j = 0; j < board.size; j++) {
        intersections.push(<Intersection key={i*board.size + j} i={i} j={j} row={i} col={j} color={board.board[i][j]} />)
      }
    }
  }

  let style = {
    width: board.size * 40,
    height: board.size * 40,
    position: 'relative'
  }

  return <div style={style}>{intersections}</div>
}
