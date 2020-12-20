import React from 'react'
import {Redirect, Route, Switch} from "react-router-dom"
import Hub from "./components/Hub";
import Profile from "./components/Profile";
import GoGame from "./components/GoGame";
import Login from "./components/Login";
import Register from "./components/Register";
import MyGames from './components/MyGames';
import AllGames from './components/AllGames';

const useRoutes = () => {
    return (
        <Switch>
            <Route path="/profile" exact>
                <Profile />
            </Route>
            <Route path="/game/:id">
                <GoGame />
            </Route>
            <Route path="/login" exact>
                <Login />
            </Route>
            <Route path="/register" exact>
                <Register />
            </Route>
            <Route path="/" exact>
                <Hub />
            </Route>
            <Route path="/my" exact>
                <MyGames />
            </Route>
            <Route path="/all" exact>
                <AllGames />
            </Route>
            <Redirect to="/" />
        </Switch>
    )
}

export default useRoutes