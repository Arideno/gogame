import React, { useState } from 'react'
import { BoardContext } from '../context/boardContext'
import Board from '../logic/board'
import Goban from './Goban'

export default function GoGame() {
  const [board] = useState(new Board(19))
  const [update, setUpdate] = useState(false)

  const onMove = () => {
    setUpdate(!update)
  }

  return (
    <BoardContext.Provider value={{board, onMove}}>
      <Goban reversed={true} />
    </BoardContext.Provider>
  )
}
