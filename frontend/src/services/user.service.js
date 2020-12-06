import axios from 'axios'
import authHeader from "./auth-header"

const API_URL = 'http://localhost:8080/api/'

class UserService {
    getProfile() {
        return axios.get(API_URL + 'profile', {
            headers: authHeader(),
        })
    }

    changePassword(oldPassword, newPassword) {
        return axios.post(API_URL + 'password/change', {
            oldPassword, newPassword
        }, {
            headers: authHeader(),
        })
    }
}

export default new UserService()