import React, { createContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from "react-toastify";

export const AppContext = createContext(); // Create the context

const AppContextProvider = (props) => {

    const currencySymbol = 'Rs'
    const isBrowser = typeof window !== 'undefined'
    const hostname = isBrowser ? window.location.hostname : ''
    const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(hostname)

    const normalizeUrl = (url) => url ? url.replace(/\/$/, '') : ''

    const resolvedBackendUrl = useMemo(() => {
        const rawEnvUrl = (import.meta.env.VITE_BACKEND_URL || '').trim()
        const cleanedEnvUrl = normalizeUrl(rawEnvUrl)

        if (import.meta.env.PROD) {
            // Ignore localhost URLs in production builds to prevent mixed-content errors.
            if (cleanedEnvUrl && !cleanedEnvUrl.includes('localhost')) {
                return cleanedEnvUrl
            }
            return ''
        }

        if (cleanedEnvUrl) {
            return cleanedEnvUrl
        }

        return isLocalHost ? 'http://localhost:4000' : ''
    }, [isLocalHost])

    useEffect(() => {
        if (!resolvedBackendUrl) {
            toast.error('Backend URL is not configured. Set VITE_BACKEND_URL to your API origin.')
        } else if (!isLocalHost && resolvedBackendUrl.startsWith('http://')) {
            toast.error('Backend URL must use HTTPS when the site runs over HTTPS to avoid network errors.')
        }
    }, [resolvedBackendUrl, isLocalHost])

    const backendUrl = resolvedBackendUrl
    const [doctors, setDoctors] = useState([])
    const [token,setToken] = useState(localStorage.getItem('token') || sessionStorage.getItem('token') || false)
    const [userData,setUserData] = useState(false)


    const getDoctorsData = async ()=>{
        try {
            const {data} = await axios.get(backendUrl + '/api/doctor/list')
            if (data.success) {
                setDoctors(data.doctors)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const loadUserProfileData = async()=>{
        try {
            const {data} = await axios.get(backendUrl + '/api/user/get-profile',{headers:{token}})
            if (data.success) {
                setUserData(data.userData)
            }else[
                toast.error(data.message)
            ]
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const value = {
        doctors,getDoctorsData,
        currencySymbol,
        token,setToken,
        backendUrl,
        userData,setUserData,
        loadUserProfileData
    };

    useEffect(()=>{
        getDoctorsData()
    },[])

    useEffect(()=>{
        if (token) {
            loadUserProfileData()
        }else{
            setUserData(false)
        }
    },[token])

    return (
        <AppContext.Provider value={value}> {/* Pass the value prop */}
            {props.children}
        </AppContext.Provider>
    );
};

export default AppContextProvider;