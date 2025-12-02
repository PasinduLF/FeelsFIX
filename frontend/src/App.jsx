import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Doctors from './pages/Doctors'
import Login from './pages/Login'
import About from './pages/About'
import MyProfile from './pages/MyProfile'
import MyAppointments from './pages/MyAppointments'
import Appointment from './pages/Appointment'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Workshop from './pages/Workshops'
import Blogs from './pages/Blogs'
import { ToastContainer } from 'react-toastify';
import Payment from './pages/Payment'
import Inquiry from './pages/Inquiry'
import ContactForm from './pages/ContactForm'
import EditContact from './pages/EditContact'
import DeleteContact from './pages/DeleteContact'
import ShowContact from './pages/ShowContact'
import ForgotPassword from './pages/ForgotPassword'
import RefundPaymentRequest from './pages/RefundPaymentRequest'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import CookiePolicy from './pages/CookiePolicy'
import MyWorkshops from './pages/MyWorkshops'
import WorkshopRegistration from './pages/WorkshopRegistration'

function App() {
  return (
    <div className='mx-4 sm:mx-[10%]'>
      <ToastContainer/>
      <Navbar/>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/doctors' element={<Doctors/>}/>
        <Route path='/doctors/:speciality' element={<Doctors/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/forgot-password' element={<ForgotPassword/>}/>
        <Route path='/about' element={<About/>}/>
        <Route path='/inquiry' element={<Inquiry/>}/>
        <Route path='/my-profile' element={<MyProfile/>}/>
        <Route path='/my-appointments' element={<MyAppointments/>}/>
  <Route path='/my-workshops' element={<MyWorkshops />}/>
        <Route path='/appointment/:docId' element={<Appointment/>}/>
        <Route path='/workshops' element={<Workshop/>}/>
  <Route path='/workshops/:workshopId/register' element={<WorkshopRegistration />}/>
        <Route path='/blogs' element={<Blogs/>}/>
        <Route path='/payment/:appointmentId' element={<Payment/>}/>
        <Route path="/contact/create" element={<ContactForm />} />
        <Route path="/contact/edit/:id" element={<EditContact />} />
        <Route path="/contact/details/:id" element={<ShowContact />} />
        <Route path="/contact/delete/:id" element={<DeleteContact />} />
        <Route path='/refund-request/:paymentId' element={<RefundPaymentRequest />} />
        <Route path='/privacy-policy' element={<PrivacyPolicy />} />
        <Route path='/terms-of-service' element={<TermsOfService />} />
        <Route path='/cookies' element={<CookiePolicy />} />
      </Routes>
      <Footer/>
    </div>
  )
}

export default App