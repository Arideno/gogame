import React, {useEffect, useRef, useState} from "react"
import Input from "react-validation/build/input";
import CheckButton from "react-validation/build/button";
import Form from "react-validation/build/form";
import UserService from "../services/user.service";

const required = (value) => {
    if (!value) {
        return (
            <div className="alert alert-danger" role="alert">
                This field is required!
            </div>
        )
    }
}

const vpassword = (value) => {
    if (value.length < 6 || value.length > 40) {
        return (
            <div className="alert alert-danger" role="alert">
                The password must be between 6 and 40 characters.
            </div>
        );
    }
}

const passwordMatch = (value, props, components) => {
    if (value !== components['repeatNewPassword'][0].value) {
        return (
            <div className="alert alert-danger" role="alert">
                Passwords do not match
            </div>
        )
    }
}

const Profile = () => {
    const [username, setUsername] = useState("")
    const form = useRef()
    const checkBtn = useRef()
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [repeatNewPassword, setRepeatNewPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [successful, setSuccessful] = useState(false)

    useEffect(() => {
        UserService.getProfile().then(
            response => {
                setUsername(response.data.username)
            },
            error => {
                console.log(error)
            }
        )
    }, [])

    const onChangeOldPassword = (e) => {
        const password = e.target.value
        setOldPassword(password)
    }

    const onChangeNewPassword = (e) => {
        const password = e.target.value
        setNewPassword(password)
    }

    const onChangeRepeatNewPassword = (e) => {
        const password = e.target.value
        setRepeatNewPassword(password)
    }

    const handleChange = (e) => {
        e.preventDefault()

        setMessage("")
        setLoading(true)
        setSuccessful(false)

        form.current.validateAll()

        if (checkBtn.current.context._errors.length === 0) {
            UserService.changePassword(oldPassword, newPassword).then(
                (response) => {
                    setMessage(response.data.message)
                    setLoading(false)
                    setSuccessful(true)
                    setOldPassword("")
                    setNewPassword("")
                    setRepeatNewPassword("")
                },
                (error) => {
                    const resMessage =
                        (error.response &&
                            error.response.data &&
                            error.response.data.message) ||
                        error.message ||
                        error.toString()

                    setMessage(resMessage)
                    setLoading(false)
                    setSuccessful(false)
                }
            );
        } else {
            setLoading(false)
        }
    }

    return (
        <div className="container">
            <header className="jumbotron">
                <h3>
                    Profile
                </h3>
                <strong>Username:</strong> {username}
            </header>
            <Form onSubmit={handleChange} ref={form}>
                <div className="form-group">
                    <label htmlFor="oldPassword">Old Password</label>
                    <Input
                        type="password"
                        className="form-control"
                        name="oldPassword"
                        value={oldPassword}
                        onChange={onChangeOldPassword}
                        validations={[required]}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <Input
                        type="password"
                        className="form-control"
                        name="newPassword"
                        value={newPassword}
                        onChange={onChangeNewPassword}
                        validations={[required, vpassword, passwordMatch]}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="repeatNewPassword">Repeat New Password</label>
                    <Input
                        type="password"
                        className="form-control"
                        name="repeatNewPassword"
                        value={repeatNewPassword}
                        onChange={onChangeRepeatNewPassword}
                        validations={[required, vpassword]}
                    />
                </div>
                <div className="form-group">
                    <button className="btn btn-primary btn-block" disabled={loading}>
                        {loading && (
                            <span className="spinner-border spinner-border-sm"/>
                        )}
                        <span>Change</span>
                    </button>
                </div>

                {message && (
                    <div className="form-group">
                        <div
                            className={successful ? "alert alert-success" : "alert alert-danger"}
                            role="alert"
                        >
                            {message}
                        </div>
                    </div>
                )}
                <CheckButton style={{display: "none"}} ref={checkBtn}/>
            </Form>
        </div>
    );
};

export default Profile