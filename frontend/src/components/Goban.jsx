import React, { useRef }  from 'react'
import Intersection from './Intersection'
import Kaya from '../assets/img/kaya.jpg'

export default function Goban({board, size, reversed, move, playable, playableColor, isLegal, currentMoveBlack, lastMove}) {
  let intersections = []
  if (reversed) {
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board.length; j++) {
        intersections.push(<Intersection board={board} key={i*board.length + j} i={board.length - 1 - i} j={board.length - 1 - j} row={i} col={j} color={board[board.length - 1 - i][board.length - 1 - j]} move={move} playable={playable} playableColor={playableColor} size={size} isLegal={isLegal} currentMoveBlack={currentMoveBlack} isLast={lastMove && lastMove.charCodeAt(0) - 97 === board.length - 1 - i && lastMove.charCodeAt(1) - 97 === board.length - 1 - j} />)
      }
    }
  } else {
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board.length; j++) {
        intersections.push(<Intersection board={board} key={i*board.length + j} i={i} j={j} row={i} col={j} color={board[i][j]} move={move} playable={playable} playableColor={playableColor} size={size} isLegal={isLegal} currentMoveBlack={currentMoveBlack} isLast={lastMove && lastMove.charCodeAt(0) - 97 === i && lastMove.charCodeAt(1) - 97 === j} />)
      }
    }
  }

  let style = {
    width: board.length * size + 10,
    height: board.length * size + 10,
    position: 'relative',
    padding: 10,
    background: `url(${Kaya}) center no-repeat`,
    backgroundSize: 'cover',
    zIndex: 0,
  }

  return <div style={style}>{intersections}</div>
}
