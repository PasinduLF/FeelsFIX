import React, { useContext, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const AllAppointments = () => {
  const { aToken, appointments, getAllAppointments, cancelAppointment } = useContext(AdminContext)
  const { calculateAge, slotDateFormat, currency } = useContext(AppContext)

  useEffect(() => {
    if (aToken) {
      getAllAppointments()
    }
  }, [aToken])

  const generatePDF = () => {
    const doc = new jsPDF()
    
    // Set document title
    doc.setFontSize(18)
    doc.text('FeelsFIX - All Appointments Details Report', 14, 20)

    // Define table columns
    const columns = [
      { header: '#', dataKey: 'index' },
      { header: 'Patient', dataKey: 'patient' },
      { header: 'Age', dataKey: 'age' },
      { header: 'Date & Time', dataKey: 'dateTime' },
      { header: 'Doctor', dataKey: 'doctor' },
      { header: 'Fees', dataKey: 'fees' },
      { header: 'Status', dataKey: 'status' }
    ]

    // Prepare table data
    const data = appointments
      .filter(item => item.userData && item.docData)
      .map((item, index) => ({
        index: index + 1,
        patient: item.userData.name,
        age: calculateAge(item.userData.dob),
        dateTime: `${slotDateFormat(item.slotDate)}, ${item.slotTime}`,
        doctor: item.docData.name,
        fees: `${currency}${item.amount}`,
        status: item.cancelled ? 'Cancelled' : item.isCompleted ? 'Completed' : 'Pending'
      }))

    // Generate table
    autoTable(doc, {
      startY: 30,
      head: [columns.map(col => col.header)],
      body: data.map(row => columns.map(col => row[col.dataKey])),
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 102, 204] },
      margin: { top: 30 }
    })

    // Calculate appointment statistics
    const totalAppointments = appointments.length
    const completedAppointments = appointments.filter(item => item.isCompleted).length
    const canceledAppointments = appointments.filter(item => item.cancelled).length
    const pendingAppointments = appointments.filter(item => !item.isCompleted && !item.cancelled).length

    // Add appointment summary below the table
    const finalY = doc.lastAutoTable.finalY || 30
    doc.setFontSize(12)
    doc.text('Appointment Summary', 14, finalY + 10)
    doc.setFontSize(10)
    doc.text(`Total Appointments: ${totalAppointments}`, 14, finalY + 20)
    doc.text(`Completed Appointments: ${completedAppointments}`, 14, finalY + 30)
    doc.text(`Canceled Appointments: ${canceledAppointments}`, 14, finalY + 40)
    doc.text(`Pending Appointments: ${pendingAppointments}`, 14, finalY + 50)

    // Add footer with date and time
    const now = new Date()
    const dateTime = now.toLocaleString()
    doc.setFontSize(10)
    doc.text(`Generated on: ${dateTime}`, 14, doc.internal.pageSize.height - 10)

    // Download the PDF
    doc.save('FeelsFIX-allAppointments.pdf')
  }

  return (
    <div className='w-full max-w-6xl m-5'>
      <div className='flex justify-between items-center mb-3'>
        <p className='text-lg font-medium'>All Appointments</p>
        <button 
          onClick={generatePDF}
          className='bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors'
        >
          Generate PDF
        </button>
      </div>
      <div className='bg-white border rounded text-sm max-h-[80vh] min-h-[60vh] overflow-y-scroll'>
        <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] grid-flow-col py-3 px-6 border-b'>
          <p>#</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Doctor</p>
          <p>Fees</p>
          <p>Actions</p>
        </div>
        {appointments.map((item, index) => (
          <div 
            className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' 
            key={index}
          >
            <p className='max-sm:hidden'>{index + 1}</p>
            <div className='flex items-center gap-2'>
              <img className='w-8 rounded-full' src={item.userData?.image} alt="" />
              <p>{item.userData?.name}</p>
            </div>
            <p className='max-sm:hidden'>{item.userData?.dob ? calculateAge(item.userData.dob) : 'N/A'}</p>
            <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
            <div className='flex items-center gap-2'>
              <img className='w-8 rounded-full bg-gray-200' src={item.docData?.image} alt="" />
              <p>{item.docData?.name}</p>
            </div>
            <p>{currency}{item.amount}</p>
            {item.cancelled
              ? <p className='text-red-400 text-xs font-medium'>Cancelled</p> 
              : item.isCompleted 
              ? <p className='text-green-500 text-xs font-medium'>Completed</p> 
              : <img 
                  onClick={() => cancelAppointment(item._id)} 
                  className='w-10 cursor-pointer' 
                  src={assets.cancel_icon} 
                  alt="" 
                />
            }
          </div>
        ))}
      </div>
    </div>
  )
}

export default AllAppointments