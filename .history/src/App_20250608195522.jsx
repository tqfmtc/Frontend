import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import AdminPage from './pages/AdminPage'
import TutorPage from './pages/TutorPage'
import AdminDashboard from './components/admin/AdminDashboard'
import TutorDashboard from './components/tutor/TutorDashboard'
import GuestTutorPage from './pages/GuestTutorPage'
import AdminGuestPage from './pages/AdminGuestPage'
import GuestLoginPage from './pages/GuestLoginPage'
import { CenterRefetchProvider } from './context/CenterRefetchContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const userData = localStorage.getItem('userData');
  
  if (!userData) {
    return <Navigate to="/admin" replace />;
  }

  try {
    const parsedData = JSON.parse(userData);
    if (!parsedData || !parsedData._id || parsedData.role !== 'admin') {
      localStorage.removeItem('userData');
      return <Navigate to="/admin" replace />;
    }
  } catch (error) {
    localStorage.removeItem('userData');
    return <Navigate to="/admin" replace />;
  }
  
  return children;
};

// Protected Tutor Route Component
const ProtectedTutorRoute = ({ children }) => {
  const userData = localStorage.getItem('userData');
  
  if (!userData) {
    return <Navigate to="/tutor" replace />;
  }

  try {
    const parsedData = JSON.parse(userData);
    if (!parsedData || !parsedData._id || parsedData.role !== 'tutor') {
      localStorage.removeItem('userData');
      return <Navigate to="/tutor" replace />;
    }
  } catch (error) {
    localStorage.removeItem('userData');
    return <Navigate to="/tutor" replace />;
  }
  
  return children;
};

function App() {
  return (
    <CenterRefetchProvider>
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/tutor" element={<TutorPage />} />
          <Route path="/guest-login" element={<GuestLoginPage />} />
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/supervisor-dashboard" element={}
          <Route 
            path="/guest-requests" 
            element={
              <ProtectedRoute>
                <AdminGuestPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tutor/guest-tutor" 
            element={
              <ProtectedTutorRoute>
                <GuestTutorPage />
              </ProtectedTutorRoute>
            } 
          />
          <Route path="/tutor-dashboard" element={<TutorDashboard />} />
        </Routes>
      </main>
      <ToastContainer />
      {/* <Footer /> */}
    </div>
    </CenterRefetchProvider>
  )
}

export default App