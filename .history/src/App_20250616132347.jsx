import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import AdminPage from './pages/AdminPage'
import SupervisorPage from './pages/SupervisorPage'
import TutorPage from './pages/TutorPage'
import AdminDashboard from './components/admin/AdminDashboard'
import SupervisorDashboard from './components/supervisor/SupervisorDashboard'
import TutorDashboard from './components/tutor/TutorDashboard'
import GuestTutorPage from './pages/GuestTutorPage'
import AdminGuestPage from './pages/AdminGuestPage'
import GuestLoginPage from './pages/GuestLoginPage'
import { CenterRefetchProvider } from './context/CenterRefetchContext';

// Protected Route Component
const ProtectedRoute = ({ children, role }) => {
  const userData = localStorage.getItem('userData');
  
  if (!userData) {
    return <Navigate to={`/${role}`} replace />;
  }

  try {
    const parsedData = JSON.parse(userData);
    if (!parsedData || !parsedData._id || parsedData.role !== role) {
      localStorage.removeItem('userData');
      return <Navigate to={`/${role}`} replace />;
    }
  } catch (error) {
    localStorage.removeItem('userData');
    return <Navigate to={`/${role}`} replace />;
  }
  
  return children;
};

// Protected Tutor Route Component
const ProtectedTutorRoute = ({ children }) => {
  return <ProtectedRoute role="tutor">{children}</ProtectedRoute>;
};

const ProtectedTutorRoute = ({ children }) => {
  return <ProtectedRoute role="tutor">{children}</ProtectedRoute>;
};

// Protected Supervisor Route Component
const ProtectedSupervisorRoute = ({ children }) => {
  return <ProtectedRoute role="supervisor">{children}</ProtectedRoute>;
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
          <Route path="/supervisor" element={<SupervisorPage />} />
          <Route path="/guest-login" element={<GuestLoginPage />} />
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/supervisor-dashboard" 
            element={
            <ProtectedRoute>
            <SupervisorDashboard />
              </ProtectedRoute>
            } />
          <Route path="/tutor-dashboard" element={<ProtectedTutorRoute><TutorDashboard /></ProtectedTutorRoute>} />
        </Routes>
      </main>
      <ToastContainer />
      {/* <Footer /> */}
    </div>
    </CenterRefetchProvider>
  )
}

export default App