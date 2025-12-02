import React from 'react'
import { assets } from '../assets/assets'

const About = () => {
  return (
    <div>
      <div className='text-center text-2xl pt-10 text-gray-500'>
        <p>ABOUT <span className='text-gray-700 font-medium'>US</span></p>
      </div>
      <div className='my-10 flex flex-col md:flex-row gap-12'>
        <img className='w-full md:max-w-[360px]' src={assets.about_image} alt="" />
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-sm text-gray-600'>
          <p>Welcome to FeelsFix, your trusted partner in online therapy and mental wellness. We understand that seeking mental health support can be challenging, which is why we’ve created a seamless and user-friendly platform that connects clients with licensed therapists effortlessly. Our platform offers secure appointment booking, wellness resources, and interactive workshops to enhance your therapy experience.</p>
          <p>At FeelsFix, we are committed to innovation in mental health technology, continuously improving our platform to ensure a smooth and personalized experience for every user. Whether you need professional guidance, self-care tools, or a supportive community, FeelsFix is here to help you on your journey to well-being.</p>
          <b className='text-gray-800'>Our vision</b>
          <p>At FeelsFix, our vision is to create a world where mental health support is accessible, seamless, and personalized for everyone. We strive to bridge the gap between individuals seeking therapy and professional therapists, providing a safe and supportive space for healing, growth, and well-being. Through technology, we aim to make mental health care more convenient, empowering users with the tools and guidance they need to improve their emotional well-being.</p>
        </div>
      </div>
      <div className='text-xl my-4'>
        <p>WHY <span className='text-gray-700 font-semibold'>CHOOSE US</span></p>
      </div>
      <div className='flex flex-col md:flex-row mb-20'>
        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-cpl gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
          <b>EFFICIENCY:</b>
          <p>Streamlined appointment scheduling that fits into your busy lifestyle.</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-cpl gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
        <b>CONVENIENCE:</b>
        <p>Access to a network of trusted healthcare professionals in your area.</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-cpl gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
        <b>PERSONALIZATION:</b>
        <p>Tailored recommendations and reminders to help you stay on top of your health.</p>
        </div>
      </div>
    </div>
  )
}

export default About