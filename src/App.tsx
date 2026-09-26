import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './Components/layout/Layout';
import Home from './Components/Home';
import Projects from './Components/projects/Projects';
import PhotoUpload from './Components/photos/PhotoUpload';
import PhotoGallery from './Components/photos/PhotoGallery';
import Blog from './Components/Blog';
import BlogUpload from './Components/blog/BlogUpload';
import BlogPost from './Components/blog/BlogPost';
import BlogEditor from './Components/blog/BlogEditor';
import AdminRoute from './Components/auth/AdminRoute';
import { API_BASE_URL } from './api/api-client';
import './styles/darkTheme.css';

const App: React.FC = () => {
  // Wake up the backend server on app load
  useEffect(() => {
    fetch(`${API_BASE_URL}/health/wake`)
      .catch(() => {
        // Silently fail - this is just to wake up the server
        console.log('Backend wake-up call initiated');
      });
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/photo-upload" element={
              <AdminRoute>
                <PhotoUpload />
              </AdminRoute>
            } />
            <Route path="/photos" element={<PhotoGallery />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogPost />} />
            <Route path="/blog-upload" element={
              <AdminRoute>
                <BlogUpload />
              </AdminRoute>
            } />
            <Route path="/blog-editor" element={
              <AdminRoute>
                <BlogEditor />
              </AdminRoute>
            } />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
};

export default App;
