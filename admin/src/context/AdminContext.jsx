import { createContext, useState } from "react";
import axios from 'axios'
import {toast} from 'react-toastify'

export const AdminContext = createContext();

const AdminContextProvider = (props) => {
  const [aToken, setAToken] = useState(
    localStorage.getItem("aToken") ? localStorage.getItem("aToken") : '');
  const [doctors,setDoctors] = useState([])
  const [appointments,setAppointmnets] = useState([])
  const [dashData,setDashData] = useState(false)
  const [workshopRegistrations, setWorkshopRegistrations] = useState([])
  const [workshopRegistrationLoading, setWorkshopRegistrationLoading] = useState(false)
  
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const getAllDoctors = async()=> {
    try {
        const {data} = await axios.post(backendUrl + '/api/admin/all-doctors',{}, {headers:{aToken}} )
        if (data.success) {
            setDoctors(data.doctors)
            console.log(data.doctors)
        }else{
            toast.error(data.message)
        }
    } catch (error) {
        toast.error(error.message)
    }
  }

  const changeAvailability = async(docId)=>{
    try {
        const{data} = await axios.post(backendUrl + '/api/admin/change-availability', {docId}, {headers:{aToken}})
        if (data.success) {
            toast.success(data.message)
            getAllDoctors()
        }else{
            toast.error(data.message)
        }
    } catch (error) {
        toast.error(error.message)
    }
  }

  const getAllAppointments = async ()=>{
    try {
      const {data} =await axios.get(backendUrl+'/api/admin/appointments',{headers:{aToken}})
      if (data.success) {
        setAppointmnets(data.appointments)
        console.log(data.appointments)
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const cancelAppointment = async(appointmentId)=> {
    try {
      const {data} = await axios.post(backendUrl+'/api/admin/cancel-appointment',{appointmentId},{headers:{aToken}})
      if (data.success) {
        toast.success(data.message)
        getAllAppointments()
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const getDashData = async ()=>{
    try {
      const {data} = await axios.get(backendUrl+'/api/admin/dashboard',{headers:{aToken}})
      if (data.success) {
          setDashData(data.dashData)
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const fetchWorkshopRegistrations = async () => {
    if (!backendUrl || !aToken) return
    setWorkshopRegistrationLoading(true)
    try {
      const { data } = await axios.get(`${backendUrl}/api/workshops/registrations`, { headers: { atoken: aToken } })
      if (data.success) {
        setWorkshopRegistrations(data.data || [])
      } else {
        toast.error(data.message || 'Unable to load registrations')
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    } finally {
      setWorkshopRegistrationLoading(false)
    }
  }

  const updateWorkshopRegistrationDecision = async (registrationId, decisionStatus, decisionNote = '') => {
    if (!backendUrl || !aToken) return false
    try {
      const { data } = await axios.patch(
        `${backendUrl}/api/workshops/registrations/${registrationId}/decision`,
        { decisionStatus, decisionNote },
        { headers: { atoken: aToken } }
      )
      if (data.success) {
        toast.success(data.message || 'Registration updated')
        setWorkshopRegistrations((prev) =>
          prev.map((registration) =>
            registration.id === registrationId
              ? { ...registration, decisionStatus, decisionNote }
              : registration
          )
        )
        return true
      }
      toast.error(data.message || 'Unable to update registration')
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }
    return false
  }

  const value = {
    aToken,
    setAToken,
    backendUrl,doctors,
    getAllDoctors, changeAvailability,
    appointments,setAppointmnets,
    getAllAppointments,
    cancelAppointment,
    dashData,getDashData,
    workshopRegistrations,
    workshopRegistrationLoading,
    fetchWorkshopRegistrations,
    updateWorkshopRegistrationDecision,
  };

  return (
    <AdminContext.Provider value={value}>
      {props.children}
    </AdminContext.Provider>
  );
};

export default AdminContextProvider;
