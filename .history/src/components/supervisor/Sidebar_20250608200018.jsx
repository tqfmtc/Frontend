import { motion } from 'framer-motion'
import { FiHome, FiUsers, FiMapPin, FiFileText, FiUser, FiLogOut, FiUserPlus, FiUserCheck } from 'react-icons/fi'
import { BiRupee } from 'react-icons/bi' // Importing rupee sign icon
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Sidebar = ({ activeTab, onTabChange, className }) => {
    const tabs = [
    { id: 'overview', label: 'Overview', icon: FiHome },
    { id: 'tutors', label: 'Tutors', icon: FiUsers },
    { id: 'centers', label: 'Centers', icon: FiMapPin },
    { id: 'students', label: 'Students', icon: FiUser },
    { 
      id: 'guest-requests', 
      label: 'Guest Tutors', 
      icon: FiUserCheck,
      onClick: () => navigate('/guest-requests')
    }
  ];

  

}