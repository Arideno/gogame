import React, {useContext, useEffect, useState} from 'react'
import '../css/GameHubInfo.css'
import Goban from "./Goban"
import {UserContext} from "../context/userContext";

const GameHubInfo = ({ game, onAccept }) => {
    const {userInfo} = useContext(UserContext)

    const [disable, setDisable] = useState(false)

    useEffect(() => {
        if (game.black_player) {
            if (userInfo.id === game.black_player.id) {
                setDisable(true)
            }
        }
        if (game.white_player) {
            if (userInfo.id === game.white_player.id) {
                setDisable(true)
            }
        }
    }, [userInfo, game])

    return (
        <div className="game">
            <div className="board">
                <Goban board={Array(game.size).fill().map(() => Array(game.size).fill(" "))} playable={false} size={270 / game.size} />
                <div className="size">
                    <h3>{game.size}x{game.size}</h3>
                </div>
            </div>
            <h4 style={{color: 'white'}}>Black: {game.black_player ? game.black_player.username : "-"}</h4>
            <h4 style={{color: 'white'}}>White: {game.white_player ? game.white_player.username : "-"}</h4>
            <button className="btn btn-success mt-1" onClick={() => onAccept(game.id)} disabled={disable}>Accept</button>
        </div>
    )
}

export default GameHubInfo