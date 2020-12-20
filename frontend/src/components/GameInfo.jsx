import React from 'react'
import '../css/GameInfo.css'
import Goban from "./Goban"

const GameInfo = ({ game, onClick }) => {
    const board = Array(game.size).fill().map(() => Array(game.size).fill(" "))
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board.length; j++) {
            board[i][j] = game.position[i * board.length + j]
        }
    }
    return (
        <div className="game-container" onClick={() => onClick(game.id)}>
            <div className="title-white">
                <span className="player-name">{game.white_player.username}</span>
                <span className="score">{game.white_points} points</span>
            </div>
            <div className="board">
                <Goban board={board} playable={false} size={270 / game.size} lastMove={game.moves.length > 0 ? game.moves[game.moves.length-1] : null} />
            </div>
            <div className="title-black">
                <span className="player-name">{game.black_player.username}</span>
                <span className="score">{game.black_points} points</span>
            </div>
        </div>
    )
}

export default GameInfo