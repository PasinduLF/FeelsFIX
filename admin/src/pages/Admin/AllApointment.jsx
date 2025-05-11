import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { FaFilePdf, FaTrash } from 'react-icons/fa'
import axios from 'axios'

const AllAppointments = () => {
  const { aToken, appointments, getAllAppointments, cancelAppointment } = useContext(AdminContext)
  const { calculateAge, slotDateFormat, currency } = useContext(AppContext)
  const [filter, setFilter] = useState('all') // 'all', 'upcoming', 'completed', 'cancelled'

  useEffect(() => {
    if (aToken) {
      getAllAppointments()
    }
  }, [aToken])

  // Filter appointments based on the selected filter
  const filteredAppointments = appointments.filter(item => {
    if (filter === 'all') return true
    if (filter === 'upcoming') return !item.cancelled && !item.isCompleted
    if (filter === 'completed') return item.isCompleted
    if (filter === 'cancelled') return item.cancelled
    return true
  })

  const handleDeleteAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to delete this cancelled appointment?')) {
      try {
        const response = await axios.delete(`http://localhost:4000/api/user/appointments/${appointmentId}`);
        if (response.data.success) {
          getAllAppointments(); // Refresh the appointments list
        }
      } catch (error) {
        console.error('Error deleting appointment:', error);
      }
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF()

    // Set default font to Helvetica for professionalism
    doc.setFont('Helvetica')

    // Add header with logo placeholder and title
    doc.setFontSize(20)
    doc.setTextColor(0, 102, 204) // Primary color (#0066CC)
    doc.text('FeelsFIX', 14, 20)
    doc.setFontSize(12)
    doc.setTextColor(100) // Gray for subtitle
    doc.text('Online Therapy Booking System', 14, 28)
    doc.setFontSize(16)
    doc.setTextColor(0)
    doc.text(`Appointments Report (${filter.charAt(0).toUpperCase() + filter.slice(1)})`, 14, 40)

    // Add a horizontal line under the header
    doc.setLineWidth(0.5)
    doc.setDrawColor(200)
    doc.line(14, 45, 196, 45)

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

    // Prepare table data using filtered appointments
    const data = filteredAppointments
      .filter(item => item.userData && item.docData)
      .map((item, index) => ({
        index: index + 1,
        patient: item.userData.name,
        age: item.userData.dob && !isNaN(calculateAge(item.userData.dob)) ? calculateAge(item.userData.dob) : 'N/A',
        dateTime: `${slotDateFormat(item.slotDate)}, ${item.slotTime}`,
        doctor: item.docData.name,
        fees: `${currency}${item.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '')}`,
        status: item.cancelled ? 'Cancelled' : item.isCompleted ? 'Completed' : 'Pending'
      }))

    // Calculate available space for summary
    const pageHeight = doc.internal.pageSize.height
    const summaryHeight = 60 // Increased for enhanced summary
    const marginBottom = 30 // Space for footer

    // Generate table with custom styling
    autoTable(doc, {
      startY: 50,
      head: [columns.map(col => col.header)],
      body: data.map(row => columns.map(col => row[col.dataKey])),
      theme: 'grid',
      styles: {
        font: 'Helvetica',
        fontSize: 10,
        cellPadding: 4,
        textColor: [50, 50, 50],
        lineColor: [200, 200, 200],
        lineWidth: 0.2,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [0, 102, 204],
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 12 }, // For #
        1: { cellWidth: 38 }, // Patient
        2: { cellWidth: 15 }, // Age
        3: { cellWidth: 38 }, // Date & Time
        4: { cellWidth: 38 }, // Doctor
        5: { cellWidth: 22 }, // Fees
        6: { cellWidth: 23 }  // Status
      },
      margin: { left: 14, right: 14 },
      pageBreak: 'auto',
      didDrawPage: (data) => {
        const finalY = data.cursor.y
        if (finalY + summaryHeight + marginBottom > pageHeight && data.cursor.y !== 50) {
          doc.addPage()
          data.cursor.y = 20
        }
      }
    })

    // Calculate appointment statistics
    const totalAppointments = filteredAppointments.length
    const completedAppointments = filteredAppointments.filter(item => item.isCompleted).length
    const canceledAppointments = filteredAppointments.filter(item => item.cancelled).length
    const pendingAppointments = filteredAppointments.filter(item => !item.isCompleted && !item.cancelled).length

    // Add enhanced appointment summary
    let finalY = doc.lastAutoTable.finalY || 50
    if (finalY + summaryHeight + marginBottom > pageHeight) {
      doc.addPage()
      finalY = 20
    }
    // Gradient background
    for (let i = 0; i < 60; i++) {
      doc.setDrawColor(220 - i * 0.2, 240 - i * 0.2, 255 - i * 0.2)
      doc.line(14, finalY + 10 + i, 196, finalY + 10 + i)
    }
    doc.setLineWidth(0.3)
    doc.setDrawColor(0, 102, 204)
    doc.rect(14, finalY + 10, 182, 60) // Border
    // Title
    doc.setFontSize(14)
    doc.setTextColor(0, 102, 204)
    doc.setFont('Helvetica', 'bold')
    doc.text('Appointment Summary', 18, finalY + 20)
    // Horizontal line under title
    doc.setLineWidth(0.2)
    doc.setDrawColor(150)
    doc.line(18, finalY + 23, 90, finalY + 23)
    // Statistics in two columns
    doc.setFontSize(10)
    doc.setTextColor(50, 50, 50)
    doc.setFont('Helvetica', 'normal')
    // Left column
    doc.text(`Total Appointments:`, 18, finalY + 32)
    doc.text(`Completed Appointments:`, 18, finalY + 42)
    // Right column
    doc.text(`Canceled Appointments:`, 100, finalY + 32)
    doc.text(`Pending Appointments:`, 100, finalY + 42)
    // Values with color accents
    doc.setTextColor(0, 102, 204)
    doc.setFont('Helvetica', 'bold')
    doc.text(`${totalAppointments}`, 60, finalY + 32)
    doc.text(`${completedAppointments}`, 68, finalY + 42)
    doc.text(`${canceledAppointments}`, 142, finalY + 32)
    doc.text(`${pendingAppointments}`, 140, finalY + 42)
    // Bullet-like circles
    doc.setFillColor(0, 102, 204)
    doc.circle(15, finalY + 30.5, 1, 'F')
    doc.circle(15, finalY + 40.5, 1, 'F')
    doc.circle(97, finalY + 30.5, 1, 'F')
    doc.circle(97, finalY + 40.5, 1, 'F')

    // Add footer with page numbers and generation date
    const pageCount = doc.internal.getNumberOfPages()
    const now = new Date()
    const dateTime = now.toLocaleString()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(`Generated on: ${dateTime}`, 14, pageHeight - 15)
      doc.text(`Page ${i} of ${pageCount}`, 196, pageHeight - 15, { align: 'right' })
    }

    // Download the PDF
    doc.save(`FeelsFIX-${filter}-appointments.pdf`)
  }

  return (
    <div className='w-full max-w-6xl m-5'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
        <p className='text-lg font-medium'>All Appointments</p>
        <div className='flex flex-wrap items-center gap-4'>
          <div className='flex space-x-2'>
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-full ${filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('upcoming')}
              className={`px-3 py-1 text-sm rounded-full ${filter === 'upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
            >
              Upcoming
            </button>
            <button 
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 text-sm rounded-full ${filter === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
            >
              Completed
            </button>
            <button 
              onClick={() => setFilter('cancelled')}
              className={`px-3 py-1 text-sm rounded-full ${filter === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}
            >
              Cancelled
            </button>
          </div>
          <button 
            onClick={generatePDF}
            className='bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2'
          >
            <FaFilePdf className='text-lg' />
            Export to PDF
          </button>
        </div>
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
        {filteredAppointments.length === 0 ? (
          <div className='text-center py-12 text-gray-600'>
            No {filter} appointments found.
          </div>
        ) : (
          filteredAppointments.map((item, index) => (
            <div 
              className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' 
              key={item._id}
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
              <div className="flex items-center gap-2">
                {item.cancelled ? (
                  <>
                    <p className='text-red-400 text-xs font-medium'>Cancelled</p>
                    <button
                      onClick={() => handleDeleteAppointment(item._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete appointment"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </>
                ) : item.isCompleted ? (
                  <p className='text-green-500 text-xs font-medium'>Completed</p>
                ) : (
                  <img
                    onClick={() => cancelAppointment(item._id)}
                    className='w-10 cursor-pointer'
                    src={assets.cancel_icon}
                    alt="Cancel appointment"
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AllAppointments