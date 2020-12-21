import React from 'react'
import {Router, Link} from "react-router-dom"
import 'bootstrap/dist/css/bootstrap.min.css'
import './css/App.css'
import {UserContext} from "./context/userContext"
import useRoutes from "./routes"
import { useAuth } from './hooks/auth.hook'
import { useSocket } from './socket'
import history from './history'

const App = () => {
    const {token, login, logout, userInfo} = useAuth()
    const { socket } = useSocket(token)
    const isAuthenticated = !!token
    const routes = useRoutes()

    const handleLogout = e => {
        e.preventDefault()
        logout()
    }

    return (
        <Router history={history}>
            <UserContext.Provider value={{userInfo, login, logout, token, isAuthenticated, socket}}>
                <nav className="navbar navbar-expand navbar-dark" style={{backgroundColor: '#252525'}}>
                    <Link to={isAuthenticated ? "/" : "/login"} className="navbar-brand ms-4">
                        Go Game
                    </Link>
                    <div className="navbar-nav mr-auto">
                        {isAuthenticated ? (
                            <div className="navbar-nav ml-auto">
                                <li className="nav-item">
                                    <Link to="/my" className="nav-link">
                                        My Games
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/all" className="nav-link">
                                        All Active Games
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/profile" className="nav-link">
                                        Profile
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <a href="/logout" className="nav-link" onClick={handleLogout}>
                                        Logout
                                    </a>
                                </li>
                            </div>
                        ) : (
                            <div className="navbar-nav ml-auto">
                                <li className="nav-item">
                                    <Link to="/login" className="nav-link">
                                        Login
                                    </Link>
                                </li>

                                <li className="nav-item">
                                    <Link to="/register" className="nav-link">
                                        Sign Up
                                    </Link>
                                </li>
                            </div>
                        )}
                    </div>
                </nav>

                {routes}

            </UserContext.Provider>
        </Router>
    )

}

export default App