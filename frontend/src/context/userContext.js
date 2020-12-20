import React from 'react'

export const UserContext = React.createContext({
    userInfo: null,
    login: (jwtToken, expireDate) => {},
    logout: () => {},
    token: null,
    isAuthenticated: false,
    socket: null,
})