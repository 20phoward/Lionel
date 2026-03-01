import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import IssueList from './components/IssueList';
import IssueDetail from './components/IssueDetail';
import IssueForm from './components/IssueForm';
import TeamManagement from './components/TeamManagement';
import UserManagement from './components/UserManagement';

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/issues" element={<ProtectedRoute><Layout><IssueList /></Layout></ProtectedRoute>} />
          <Route path="/issues/new" element={<ProtectedRoute roles={['admin']}><Layout><IssueForm /></Layout></ProtectedRoute>} />
          <Route path="/issues/:id" element={<ProtectedRoute><Layout><IssueDetail /></Layout></ProtectedRoute>} />
          <Route path="/teams" element={<ProtectedRoute roles={['admin']}><Layout><TeamManagement /></Layout></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute roles={['admin']}><Layout><UserManagement /></Layout></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
