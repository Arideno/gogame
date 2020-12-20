import React, { useState, useEffect, useContext } from 'react'
import { UserContext } from '../context/userContext'
import history from '../history'
import '../css/MyGames.css'
import GameInfo from './GameInfo'

const MyGames = () => {
  const { socket } = useContext(UserContext)

  const [games, setGames] = useState([])

  useEffect(() => {
    if (socket) {
        socket.onmessage = (event) => {
            if (event.data) {
                const data = JSON.parse(event.data)
                console.log(data)
                if (data.type === "current_games") {
                    setGames(data.data.games)
                }
            }
        }
        setTimeout(() => {
            socket.send(JSON.stringify({
                type: "get_current_games"
            }))
        }, 500)
    }
  }, [socket])

  const handleClick = (id) => {
    history.push(`/game/${id}`)
  }

  const gameList = games.map((game) => {
    return <GameInfo key={game.id} game={game} onClick={handleClick} />
  })

  return (
    <div className="container-fluid mt-3">
    <div className="games">
      {gameList}
    </div>
    </div>
  )

}

export default MyGames