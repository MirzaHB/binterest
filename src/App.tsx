import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Components/layout/Layout';
import Home from './Components/Home';
import PhotoUpload from './Components/photos/PhotoUpload';
import PhotoGallery from './Components/photos/PhotoGallery';
import Blog from './Components/Blog';
import BlogUpload from './Components/blog/BlogUpload';
import BlogPost from './Components/blog/BlogPost';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/photo-upload" element={<PhotoUpload />} />
          <Route path="/photos" element={<PhotoGallery />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/blog-upload" element={<BlogUpload />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;