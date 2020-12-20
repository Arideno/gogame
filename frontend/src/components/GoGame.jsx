import React, {useContext, useEffect, useState} from 'react'
import Goban from './Goban'
import {useParams} from 'react-router-dom'
import {UserContext} from "../context/userContext";
import _, { map } from 'lodash'
import MoveSound from '../assets/sound/moveSound.mp3'
import CaptureSound from '../assets/sound/captureSound.mp3'
import useSound from 'use-sound'
import '../css/GoGame.css'

const GoGame = () => {
    const [playMoveSound, moveSound] = useSound(`${MoveSound}`, {
        interrupt: true
    })

    const [playCaptureSound] = useSound(`${CaptureSound}`, {
        interrupt: true
    })

    const { id } = useParams()

    const {userInfo, socket} = useContext(UserContext)
    const [error, setError] = useState(false)
    const [playableColor, setPlayableColor] = useState("")
    const [blackName, setBlackName] = useState("")
    const [whiteName, setWhiteName] = useState("")

    const [board, setBoard] = useState(null)
    const [currentMoveBlack, setCurrentMoveBlack] = useState(true)
    const [lastMovePass, setLastMovePass] = useState(false)
    const [isEnd, setIsEnd] = useState(false)
    const [moves, setMoves] = useState([])
    const [lastMove, setLastMove] = useState(null)
    const [previousBoard, setPreviousBoard] = useState(null)
    const [blackPoints, setBlackPoints] = useState(0)
    const [whitePoints, setWhitePoints] = useState(0)

    const switchPlayer = () => {
        setCurrentMoveBlack(!currentMoveBlack)
    }

    const pass = () => {
        if (lastMovePass) {
            console.log("end")
            setMoves([...moves, "end"])
        }
        setLastMovePass(true)
        setMoves([...moves, "pass"])
        switchPlayer()
    }

    const isLegal = (i, j) => {
        if (board[i][j] !== " ") {
            return false
        }

        let copy = JSON.parse(JSON.stringify(board))

        let color = copy[i][j] = (currentMoveBlack ? "B" : "W")
        let captured = []
        let neighbors = getAdjacent(i, j)

        _.each(neighbors, function(n) {
            let state = board[n[0]][n[1]]
            if (state !== " " && state !== color) {
                let group = getGroup(copy, n[0], n[1])
                if (group) {
                    if (group["liberties"] === 0) {
                        captured.push(group)
                    }
                }
            }
        })

        if (_.isEmpty(captured) && getGroup(copy, i, j)["liberties"] === 0) {
            return false
        }

        _.each(captured, function(group) {
            _.each(group["stones"], function(stone) {
                copy[stone[0]][stone[1]] = " ";
            })
        })

        return JSON.stringify(previousBoard) !== JSON.stringify(copy)
    }

    const move = (i, j, my = true) => {
        setPreviousBoard(JSON.parse(JSON.stringify(board)))

        let copy = JSON.parse(JSON.stringify(board))

        let color = copy[i][j] = (currentMoveBlack ? "B" : "W")
        let captured = []
        let neighbors = getAdjacent(i, j)
        let copyBlackPoints = blackPoints
        let copyWhitePoints = whitePoints

        _.each(neighbors, function(n) {
            let state = copy[n[0]][n[1]]
            if (state !== " " && state !== color) {
                let group = getGroup(copy, n[0], n[1])
                if (group) {
                    if (group["liberties"] === 0) {
                        captured.push(group)
                    }
                }
            }
        })

        _.each(captured, function(group) {
            console.log(group["stones"])
            if (currentMoveBlack) {
                copyBlackPoints += group["stones"].length
            } else {
                copyWhitePoints += group["stones"].length
            }
            _.each(group["stones"], function(stone) {
                copy[stone[0]][stone[1]] = " ";
            })
        })

        if (captured.length > 0) {
            playCaptureSound()
        }

        setLastMovePass(false)
        switchPlayer()

        setBoard(copy)
        setBlackPoints(copyBlackPoints)
        setWhitePoints(copyWhitePoints)

        setMoves([...moves, `${String.fromCharCode(i + 97)}${String.fromCharCode(j + 97)}`])
        if (my) {
            onMove(copy, `${String.fromCharCode(i + 97)}${String.fromCharCode(j + 97)}`, copyBlackPoints, copyWhitePoints)
        }

        playMoveSound()
        setTimeout(() => {
            moveSound.stop()
        }, 1000)

        setLastMove(`${String.fromCharCode(97 + i)}${String.fromCharCode(97 + j)}`)
    }

    const getAdjacent = (i, j) => {
        let neighbors = [];
        if (i > 0)
            neighbors.push([i - 1, j]);
        if (j < board.length - 1)
            neighbors.push([i, j + 1]);
        if (i < board.length - 1)
            neighbors.push([i + 1, j]);
        if (j > 0)
            neighbors.push([i, j - 1]);
        return neighbors;
    }

    const getGroup = (board, i, j) => {
        let color = board[i][j]
        if (color === " ") {
            return null
        }

        let visited = {}
        let visitedList = []
        let queue = [[i, j]]
        let count = 0

        while (queue.length > 0) {
            let stone = queue.pop()
            if (visited[stone]) {
                continue
            }

            let neighbors = getAdjacent(stone[0], stone[1])
            _.each(neighbors, function(n) {
                let state = board[n[0]][n[1]]
                if (state === " ") {
                    count++
                }
                if (state === color) {
                    queue.push([n[0], n[1]])
                }
            })

            visited[stone] = true
            visitedList.push(stone)
        }

        return {
            "liberties": count,
            "stones": visitedList
        }
    }

    const makeMove = moves => {
        const m = moves.split(',')
        move(m[m.length-1].charCodeAt(0) - 97, m[m.length-1].charCodeAt(1) - 97, false)
    }

    const setupFromPosition = (board, position, blackToMove, moves, blackPoints, whitePoints) => {
        let copy = JSON.parse(JSON.stringify(board))
        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board.length; j++) {
                copy[i][j] = position[i * board.length + j]
            }
        }
        setBoard(copy)
        setMoves(moves)
        setLastMove(moves.length > 0 ? moves[moves.length - 1] : null)
        setCurrentMoveBlack(blackToMove === 1)
        setBlackPoints(blackPoints)
        setWhitePoints(whitePoints)
    }

    const receive = event => {
        if (event.data) {
            const data = JSON.parse(event.data)
            console.log(data)
            if (data.type === "game_info_error") {
                setError(true)
            } else if (data.type === "game_info") {
                setPreviousBoard(Array(data.data.game.size).fill().map(() => Array(data.data.game.size).fill(" ")))
                if (data.data.game.black_player.id === userInfo.id) {
                    setPlayableColor("B")
                }
                if (data.data.game.white_player.id === userInfo.id) {
                    setPlayableColor("W")
                }
                setBlackName(data.data.game.black_player.username)
                setWhiteName(data.data.game.white_player.username)
                setupFromPosition(Array(data.data.game.size).fill().map(() => Array(data.data.game.size).fill(" ")), data.data.game.position, data.data.game.black_to_move, data.data.game.moves, data.data.game.black_points, data.data.game.white_points)
            } else if (data.type === "make_move") {
                if (data.data.gameId === id) {
                    makeMove(data.data.moves)
                }
            }
        }
    }

    if (socket) {
        socket.onmessage = (event) => {
            receive(event)
        }
    }

    useEffect(() => {
        if (userInfo && socket && id) {
            setTimeout(() => {
                socket.send(JSON.stringify({
                    type: "game_info",
                    data: {
                        gameId: id
                    }
                }))
            }, 1000)
        }
    }, [userInfo, socket, id])

    const onMove = (board, move, blackPoints, whitePoints) => {
        let position = ""
        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board.length; j++) {
                position += board[i][j]
            }
        }
        socket.send(JSON.stringify({
            type: "make_move",
            data: {
                gameId: id,
                move: move,
                position: position,
                blackToMove: (currentMoveBlack ? 0 : 1),
                blackPoints: blackPoints,
                whitePoints: whitePoints
            }
        }))
    }

    if (error) {
        return <h1>Game not found</h1>
    }

    if (board) {
        return (
            <div className="container-fluid mt-3">
            <div className="row mt-5">
                <div className="col-xl-7 col-12 d-flex justify-content-xl-start justify-content-center mb-xl-0 mb-4">
                    <Goban board={board} move={move} isLegal={isLegal}
                        size={30 * (19 / board.length)} playableColor={playableColor} reversed={playableColor === "W"} playable={true} currentMoveBlack={currentMoveBlack} lastMove={lastMove} />
                </div>
                <div className="col-xl-5 col-12">
                    <div className="players d-flex justify-content-xl-start justify-content-center">
                        <div className="player-container black">
                            <h3 className="player_name">{blackName}</h3>
                            <h4 className="stones">Stones: {blackPoints}</h4>
                        </div>
                        <div className="player-container white">
                            <h3 className="player_name">{whiteName}</h3>
                            <h4 className="stones">Stones: {whitePoints}</h4>
                        </div>
                    </div>
                    <div className="moves-container mt-4">
                        <h2>Moves made:</h2>
                        <div className="moves">
                            {moves.map((m, i) => (
                                `${i + 1}. ${m}` + (i !== moves.length - 1 ? ', ' : '')
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            </div>
        )
    } else {
        return <div/>
    }
}

export default GoGame