import { useState, useCallback, useEffect } from 'react'
import history from '../history'
import UserService from "../services/user.service"

const storageName = 'userData'

export const useAuth = () => {
  const [token, setToken] = useState(null)
  const [expire, setExpire] = useState(null)
  const [userInfo, setUserInfo] = useState(null)

  const login = useCallback((jwtToken, expireDate) => {
    setToken(jwtToken)
    setExpire(expireDate)

    localStorage.setItem(storageName, JSON.stringify({
      token: jwtToken, expire: expireDate
    }))

    UserService.getProfile(jwtToken).then(response => {
        setUserInfo(response.data)
    }, error => {
        console.log(error)
    })
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setExpire(null)
    setUserInfo(null)
    localStorage.removeItem(storageName)
    history.push('/login')
  }, [])

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem(storageName))

    if (data && data.expire) {
      const now = new Date()
      const expire = new Date(data.expire)
      if (now > expire) {
        logout()
        return
      }
    }

    if (data && data.token) {
      login(data.token, data.expire)
    } else {
      history.push('/login')
    }
  }, [login, logout])

  return { login, logout, token, expire, userInfo }
}