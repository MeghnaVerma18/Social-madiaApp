// File: client/src/context/AuthenticationContextProvider.jsx

import React, { createContext, useState } from 'react';
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const AuthenticationContext = createContext();

const AuthenticationContextProvider = ({ children }) => {

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const profilePic = 'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?...';

  const inputs = {
    username,
    email,
    password,
    profilePic
  };

  const navigate = useNavigate();

  const login = async () => {
    try {
      const loginInputs = { email, password };

      await axios.post('http://localhost:6001/api/login', loginInputs)
        .then(res => {
          console.log("✅ Login response:", res);
          localStorage.setItem('userToken', res.data.token);
          localStorage.setItem('userId', res.data.user._id);
          localStorage.setItem('username', res.data.user.username);
          localStorage.setItem('email', res.data.user.email);
          localStorage.setItem('profilePic', res.data.user.profilePic);
          localStorage.setItem('posts', res.data.user.posts);
          localStorage.setItem('followers', res.data.user.followers);
          localStorage.setItem('following', res.data.user.following);
          navigate('/');
        })
        .catch(err => {
          console.error("❌ Login error:", err.response?.data?.msg || err.message);
          alert(err.response?.data?.msg || "Login failed");
        });

    } catch (err) {
      console.error("❌ Login crash:", err);
    }
  };

  const register = async () => {
    try {
      await axios.post('http://localhost:6001/api/register', inputs)
        .then(res => {
          localStorage.setItem('userToken', res.data.token);
          localStorage.setItem('userId', res.data.user._id);
          localStorage.setItem('username', res.data.user.username);
          localStorage.setItem('email', res.data.user.email);
          localStorage.setItem('profilePic', res.data.user.profilePic);
          localStorage.setItem('posts', res.data.user.posts);
          localStorage.setItem('followers', res.data.user.followers);
          localStorage.setItem('following', res.data.user.following);
          navigate('/');
        })
        .catch(err => {
          console.error("❌ Register error:", err.response?.data?.msg || err.message);
          alert(err.response?.data?.msg || "Register failed");
        });

    } catch (err) {
      console.error("❌ Register crash:", err);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/landing');
  };

  return (
    <AuthenticationContext.Provider value={{
      login,
      register,
      logout,
      username, setUsername,
      email, setEmail,
      password, setPassword
    }}>
      {children}
    </AuthenticationContext.Provider>
  );
};

export default AuthenticationContextProvider;
