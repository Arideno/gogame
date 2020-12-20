import { useEffect, useRef } from 'react'

export const useSocket = (token) => {
    const socket = useRef(null)

    useEffect(() => {
        if (token) {
            socket.current = new WebSocket("ws://localhost:8080/ws/hub")

            socket.current.onclose = () => {
                console.log("Disconnected")
            }

            socket.current.onerror = (error) => {
                console.log(error)
            }
            
            socket.current.onopen = () => {
                if (socket.current && token) {
                    socket.current.send(JSON.stringify({
                        type: "authentication",
                        data: {
                            token: token
                        }
                    }))
                }
            }
        }
    }, [token, socket])

    return { socket: socket.current }
}