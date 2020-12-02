import React, { useContext } from 'react'
import { BoardContext } from '../context/boardContext'
import Intersection from './Intersection'

export default function Goban() {
  const {board} = useContext(BoardContext)

  let intersections = []
  for (let i = 0; i < board.size; i++) {
    for (let j = 0; j < board.size; j++) {
      intersections.push(<Intersection key={i*board.size + j} row={i} col={j} color={board.board[i][j]} />)
    }
  }

  let style = {
    width: board.size * 40,
    height: board.size * 40,
    position: 'relative'
  }

  return <div style={style}>{intersections}</div>
}
