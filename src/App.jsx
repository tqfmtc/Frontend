import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import AdminPage from './pages/AdminPage'
import TutorPage from './pages/TutorPage'
import AdminDashboard from './components/admin/AdminDashboard'
import TutorDashboard from './components/tutor/TutorDashboard'
import { CenterRefetchProvider } from './context/CenterRefetchContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const userData = localStorage.getItem('userData');
  
  if (!userData) {
    return <Navigate to="/admin" replace/>;
  }

  try {
    const parsedData = JSON.parse(userData);
    if (!parsedData || !parsedData._id || parsedData.role !== 'admin') {
      localStorage.removeItem('userData');
      return <Navigate to="/admin" replace />;
    }
//test phase-2
  
  } catch (error) {
    localStorage.removeItem('userData');
    return <Navigate to="/admin" replace />;
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
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
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
