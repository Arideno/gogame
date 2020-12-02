import React, { useContext } from 'react'
import { BoardContext } from '../context/boardContext'
import '../css/Intersection.css'

export default function Intersection({row, col, i, j, color}) {
  const {board, onMove} = useContext(BoardContext)

  const handleClick = (i, j) => {
    console.log(i, j)
    if (board.isLegal(i, j)) {
      board.move(i, j)
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
    <div onClick={() => handleClick(i, j)} className={classes} style={style}/>
  )
}
