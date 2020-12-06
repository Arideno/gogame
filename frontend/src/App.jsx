import React, {useEffect, useState} from 'react'
import { Switch, Route, Link } from "react-router-dom"
import 'bootstrap/dist/css/bootstrap.min.css'

import Login from "./components/Login";
import Register from "./components/Register"
import Profile from "./components/Profile"
import GoGame from './components/GoGame'

import AuthService from "./services/auth.service"

import './css/App.css'

const App = () => {
    const [currentUser, setCurrentUser] = useState(undefined)

    useEffect(() => {
        const user = AuthService.getCurrentUser()

        if (user) {
            setCurrentUser(user)
        }
    }, [])

    useEffect(() => {
        if (currentUser) {
            const now = new Date()
            const expire = new Date(currentUser.expire)
            if (now > expire) {
                logOut()
                window.location.href = '/login'
            }
        }
    })

    const logOut = () => {
        AuthService.logout()
    }

    return (
        <div>
            <nav className="navbar navbar-expand navbar-dark bg-dark">
                <Link to={"/"} className="navbar-brand">
                    Arideno
                </Link>
                <div className="navbar-nav mr-auto">
                    {currentUser ? (
                        <div className="navbar-nav ml-auto">
                            <li className="nav-item">
                                <Link to={"/profile"} className="nav-link">
                                    Profile
                                </Link>
                            </li>
                            <li className="nav-item">
                                <a href="/login" className="nav-link" onClick={logOut}>
                                    Logout
                                </a>
                            </li>
                        </div>
                    ) : (
                        <div className="navbar-nav ml-auto">
                            <li className="nav-item">
                                <Link to={"/login"} className="nav-link">
                                    Login
                                </Link>
                            </li>

                            <li className="nav-item">
                                <Link to={"/register"} className="nav-link">
                                    Sign Up
                                </Link>
                            </li>
                        </div>
                    )}
                </div>
            </nav>

            <div className="container mt-3">
                <Switch>
                    <Route exact path="/login" component={Login} />
                    <Route exact path="/register" component={Register} />
                    <Route exact path="/profile" component={Profile} />
                </Switch>
            </div>
        </div>
    )
}

export default App