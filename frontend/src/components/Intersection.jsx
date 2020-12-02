import React, { useContext } from 'react'
import { BoardContext } from '../context/boardContext'
import '../css/Intersection.css'

export default function Intersection({row, col, color}) {
  const {board, onMove} = useContext(BoardContext)

  const handleClick = (i, j) => {
    if (board.move(i, j)) {
      onMove()
    }
  }

  const style = {
    top: row * 40,
    left: col * 40
  }

  let classes = "intersection"
  if (color !== "") {
    classes += ` ${color === "W" ? "white" : "black"}`
  }

  return (
    <div onClick={() => handleClick(row, col)} className={classes} style={style}></div>
  )
}
