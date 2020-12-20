import axios from 'axios'

const API_URL = 'http://localhost:8080/api/'

class UserService {
    getProfile(token) {
        return axios.get(API_URL + 'profile', { 
            headers: {Authorization: 'Bearer ' + token}
        })
    }

    changePassword(oldPassword, newPassword, token) {
        return axios.post(API_URL + 'password/change', {
            oldPassword, newPassword
        }, {
            headers: {Authorization: 'Bearer ' + token}
        })
    }
}

export default new UserService()