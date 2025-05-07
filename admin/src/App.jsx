import React, { useContext } from 'react'
import {Route, Routes} from 'react-router-dom'
import Login from './pages/Login'
import { ToastContainer, toast } from 'react-toastify';
import { AdminContext } from './context/AdminContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Admin/Dashboard';
import AllApointment from './pages/Admin/AllApointment';
import AddDoctor from './pages/Admin/AddDoctor';
import DoctorsList from './pages/Admin/DoctorsList';
import { DoctorContext } from './context/DoctorContext';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import DoctorAppointments from './pages/Doctor/DoctorAppointments';
import DoctorProfile from './pages/Doctor/DoctorProfile';
import Inquiry from './pages/Admin/Inquiry';
import ShowContact from '../../frontend/src/pages/ShowContact';
import DeleteContact from '../../frontend/src/pages/DeleteContact';
import ViewPayments from './pages/Admin/ViewPayments';

const App = () => {

const {aToken} = useContext(AdminContext)
const {dToken} = useContext(DoctorContext)

  return aToken || dToken ? (
    <div className='bg-[#F8F9Fd]'>
      <ToastContainer/>
      <Navbar/>
      <div className='flex items-start'>
        <Sidebar/>
        <Routes>
          {/* admin route */}
          <Route path='/' element={<></>} />
          <Route path='/admin-dashboard' element={<Dashboard/>} />
          <Route path='/all-appointments' element={<AllApointment/>} />
          <Route path='/add-doctor' element={<AddDoctor/>} />
          <Route path='/doctor-list' element={<DoctorsList/>} />
          <Route path="/inquiry" element={<Inquiry />} />
          <Route path="/contact/details/:id" element={<ShowContact />} />
          <Route path="/contact/delete/:id" element={<DeleteContact />} />
          <Route path="/payments" element={<ViewPayments />} />

          {/* doctor route */}
          <Route path='/doctor-dashboard' element={<DoctorDashboard/>} />
          <Route path='/doctor-appointments' element={<DoctorAppointments/>} />
          <Route path='/doctor-profile' element={<DoctorProfile/>} />
        </Routes>
      </div>
    </div>
  ): (
    <div>
      <Login/>
      <ToastContainer/>
    </div>
  )
}

export default App