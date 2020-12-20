import React  from 'react'
import '../css/Intersection.css'

export default function Intersection({row, col, i, j, color, board, move, playable, playableColor, size, isLegal, currentMoveBlack, isLast}) {
  const handleClick = (i, j) => {
    if (playable) {
      if ((playableColor === "B" && currentMoveBlack) || (playableColor === "W" && !currentMoveBlack)) {
        if (isLegal(i, j)) {
          move(i, j)
        }
      }
    }
  }

  const style = {
    top: row * size,
    left: col * size,
    width: size,
    height: size,
    borderRadius: size / 2,
  }

  let classes = "intersection"
  if (color !== " ") {
    classes += ` ${color === "W" ? "white" : "black"}`
    if (isLast) {
      classes += ' last'
    }
  }

  if (col === 0) {
    classes += " no-left"
  }

  if (col === board.length - 1) {
    classes += " no-right"
  }

  if (row === 0) {
    classes += " no-top"
  }

  if (row === board.length - 1) {
    classes += " no-bottom"
  }

  return (
    <div onClick={() => handleClick(i, j)} className={classes} style={style}/>
  )
}
