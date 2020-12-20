import React, {useContext, useEffect, useRef, useState} from 'react'
import bootstrap from 'bootstrap/dist/js/bootstrap.min'
import '../css/Hub.css'
import GameHubInfo from "./GameHubInfo"
import logo from '../images/icon.png'
import { UserContext } from '../context/userContext'
import history from '../history'

const Hub = () => {
    const { socket } = useContext(UserContext)

    const [createForm, setCreateForm] = useState({
        "boardSize": 9,
        "color": "B"
    })
    const [games, setGames] = useState([])
    const [alertMessage, setAlertMessage] = useState("")
    const toastEl = useRef()
    const toast = useRef()

    useEffect(() => {
        if (socket) {
            socket.onmessage = (event) => {
                if (event.data) {
                    const data = JSON.parse(event.data)
                    console.log(data)
                    if (data.type === "waiting_games") {
                        setGames(data.data.games)
                    } else if (data.type === "create_game_error") {
                        setAlertMessage(data.data.message)
                        toast.current.show()
                    } else if (data.type === "game_accepted") {
                        history.push(`/game/${data.data.gameId}`)
                    }
                }
            }
            setTimeout(() => {
                socket.send(JSON.stringify({
                    type: "get_waiting_games"
                }))
            }, 500)
        }
        toast.current = new bootstrap.Toast(toastEl.current)
    }, [socket])

    const handleCreate = () => {
        socket.send(JSON.stringify({
            type: "new_game",
            data: {
                size: parseInt(createForm.boardSize),
                color: createForm.color
            }
        }))
    }

    const handleChangeCreateForm = (e) => {
        setCreateForm({...createForm, [e.target.name]: e.target.value})
    }

    const handleAccept = (id) => {
        socket.send(JSON.stringify({
            type: "accept_game",
            data: {
                gameId: id
            }
        }))
    }

    const gameList = games.map((game) => {
        return <GameHubInfo key={game.id} game={game} onAccept={handleAccept}/>
    })

    return (
        <div className="container-fluid mt-3">
        <div aria-live="polite" aria-atomic="true" className="position-relative">
            <div className="toast-container position-absolute p-3 top-0 right-0">
                <div ref={toastEl} className="toast">
                    <div className="toast-header">
                        <img src={logo} className="rounded mr-2" alt="Go" style={{width: 20, height: 20}}/>
                        <strong className="mr-auto">Alert</strong>
                        <small>Now</small>
                        <button type="button" className="btn-close" data-bs-dismiss="toast" aria-label="Close"/>
                    </div>
                    <div className="toast-body">
                        {alertMessage}
                    </div>
                </div>
            </div>
            <div className="modal fade" id="createModal" tabIndex="-1" aria-labelledby="createModalLabel"
                 aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="createModalLabel">Create new game</h5>
                            <button type="button" className="btn-close" data-dismiss="modal"
                                    aria-label="Close"/>
                        </div>
                        <div className="modal-body">
                            <form>
                                <div className="mb-3">
                                    <label htmlFor="boardSize" className="form-label">Board size</label>
                                    <select className="form-select" id="boardSize" name="boardSize"
                                            onChange={handleChangeCreateForm} value={createForm.boardSize}>
                                        <option value="9">9x9</option>
                                        <option value="13">13x13</option>
                                        <option value="19">19x19</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="color" className="form-label">Color</label>
                                    <select className="form-select" id="color" name="color"
                                            onChange={handleChangeCreateForm} value={createForm.color}>
                                        <option value="B">Black</option>
                                        <option value="W">White</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                            <button type="button" className="btn btn-primary" onClick={handleCreate}
                                    data-dismiss="modal">Create
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <button type="button" className="btn btn-primary" data-toggle="modal" data-target="#createModal">
                Create
            </button>
            <div className="games">
                {gameList}
            </div>
        </div>
        </div>
    )
}

export default Hub