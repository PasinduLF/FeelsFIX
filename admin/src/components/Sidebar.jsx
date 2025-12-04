import React, { useContext } from 'react'
import { AdminContext } from '../context/AdminContext'
import { NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'
import { DoctorContext } from '../context/DoctorContext'

const Sidebar = () => {
    const { aToken } = useContext(AdminContext)
    const { dToken } = useContext(DoctorContext)

    const adminLinks = [
        { label: 'Dashboard', to: '/admin-dashboard', icon: assets.home_icon },
        { label: 'Appointments', to: '/all-appointments', icon: assets.appointment_icon },
        { label: 'Add Workshop', to: '/add-workshop', icon: assets.add_icon },
        { label: 'Workshops', to: '/workshop-bars', icon: assets.list_icon },
        { label: 'Workshop Registrations', to: '/workshop-registrations', icon: assets.appointments_icon },
        { label: 'Add Doctor', to: '/add-doctor', icon: assets.add_icon },
        { label: 'Doctors List', to: '/doctor-list', icon: assets.people_icon },
        { label: 'Payments', to: '/payments', icon: assets.earning_icon },
        { label: 'Finance Dashboard', to: '/finance-dashboard', icon: assets.earning_icon },
        { label: 'Inquiry', to: '/inquiry', icon: assets.people_icon },
        { label: 'User Management', to: '/user-management', icon: assets.people_icon },
    ]

    const doctorLinks = [
        { label: 'Dashboard', to: '/doctor-dashboard', icon: assets.home_icon },
        { label: 'Appointments', to: '/doctor-appointments', icon: assets.appointment_icon },
        { label: 'Profile', to: '/doctor-profile', icon: assets.people_icon },
    ]

    const navClasses = ({ isActive }) =>
        `flex items-center gap-3 py-3.5 px-3 md:min-w-72 cursor-pointer transition ${
            isActive ? 'bg-[#F2F3FF] border-r-4 border-primary text-primary' : 'hover:bg-[#F7F8FF]'
        }`

    const renderLinks = (links) =>
        links.map((link) => (
            <NavLink key={link.to} className={navClasses} to={link.to}>
                <span className='flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EEF2FF]'>
                    <img className='h-5 w-5 object-contain' src={link.icon} alt='' />
                </span>
                <p className='hidden md:block font-medium'>{link.label}</p>
            </NavLink>
        ))

    return (
        <div className='min-h-screen border-r bg-white'>
            {aToken && <ul className='mt-5 space-y-1 text-[#515151]'>{renderLinks(adminLinks)}</ul>}
            {dToken && <ul className='mt-5 space-y-1 text-[#515151]'>{renderLinks(doctorLinks)}</ul>}
        </div>
    )
}

export default Sidebar