import React from 'react';
import { Link } from 'react-router-dom';
import TypewriterEffect from './TypewriterEffect';
import './Home.css';
import './TypewriterEffect.css';

const Home: React.FC = () => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          {/* Profile picture - shows on top for mobile */}
          <div className="profile-picture-mobile">
            <img src="/MEpfp.jpg" alt="Hassan Baig" className="profile-img" />
          </div>

          <h1 className="hero-title">
            Hello, I am...
            <span className="brand-highlight">
              <TypewriterEffect
                texts={[
                  'Hassan Baig',
                  'A software engineer',
                  'A coffee-addicted, animal loving software nerd'
                ]}
                speed={80}
                deleteSpeed={40}
                delay={2500}
                className="typewriter-text"
              />
            </span>
          </h1>

          <p className="hero-subtitle">
            A perpetual learner and passionate developer transforming ideas into seamless digital realities.
          </p>

          <div className="hero-actions">
            <Link to="/photos" className="action-button primary">
              <span className="button-icon">📸</span>
              Explore Gallery
            </Link>
            <Link to="/blog" className="action-button secondary">
              <span className="button-icon">✍️</span>
              Read Stories
            </Link>
          </div>
        </div>

        {/* Profile picture - shows on right for desktop */}
        <div className="hero-visual">
          <div className="profile-picture-desktop">
            <img src="/MEpfp.jpg" alt="Hassan Baig" className="profile-img" />
          </div>
        </div>
      </div>

      <div className="about-section">
        <div className="section-header">
          <h2>About Me</h2>
          <div className="section-line"></div>
        </div>

        <div className="about-content">
          <div className="about-cards">
            <div className="about-card">
              <span className="card-icon">🤔</span>
              <h3 className="card-title">Curious Thinker</h3>
              <p className="card-description">
                I'm endlessly curious about how things work at their core, diving into the smallest details that make everything tick.
              </p>
            </div>

            <div className="about-card">
              <span className="card-icon">⚙️</span>
              <h3 className="card-title">Low-Level Enthusiast</h3>
              <p className="card-description">
                Low-level programming fascinates me - understanding the foundation of operating systems and modern languages empowers my coding approach.
              </p>
            </div>

            <div className="about-card">
              <span className="card-icon">🌐</span>
              <h3 className="card-title">Full-Stack Developer</h3>
              <p className="card-description">
                Building and hosting web applications from scratch, both frontend and backend, gives me the thrill of creating something people can interact with.
              </p>
            </div>

            <div className="about-card">
              <span className="card-icon">📚</span>
              <h3 className="card-title">Continuous Learner</h3>
              <p className="card-description">
                I constantly experiment with new technologies and frameworks in my free time, pushing my skills further through self-directed learning.
              </p>
            </div>

            <div className="about-card">
              <span className="card-icon">💡</span>
              <h3 className="card-title">Creative Problem Solver</h3>
              <p className="card-description">
                Software engineering allows me to combine creativity and logic, which keeps me excited about the field every day.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="experience-section">
        <div className="section-header">
          <h2>Experience</h2>
          <div className="section-line"></div>
        </div>

        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <span className="timeline-date">May 2025 - Present</span>
              <h3 className="timeline-title">Software Engineer Intern</h3>
              <h4 className="timeline-company">Canadian UAVS</h4>
              <p className="timeline-description">
                Working on X-band radar systems supporting critical aerospace monitoring operations
              </p>
              <div className="timeline-tags">
                <span className="timeline-tag">C#</span>
                <span className="timeline-tag">Azure</span>
              </div>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <span className="timeline-date">Jan 2024 - Aug 2024</span>
              <h3 className="timeline-title">Software Engineer Intern</h3>
              <h4 className="timeline-company">Symend</h4>
              <p className="timeline-description">
                Worked on a platform to manage customer Engagement through behavioural science.
                Our Platform Managed millions of cutomers for major companies such as American Express, Telus, and BMO.
              </p>
              <div className="timeline-tags">
                <span className="timeline-tag">Typescript</span>
                <span className="timeline-tag">C#</span>
              </div>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <span className="timeline-date">Oct 2022 - Jan 2024</span>
              <h3 className="timeline-title">Software Engineer</h3>
              <h4 className="timeline-company">Schulich UAVs Club</h4>
              <p className="timeline-description">
                Developed software systems for unmanned aerial vehicle operations at the University of Calgary's UAV club.
              </p>
              <div className="timeline-tags">
                <span className="timeline-tag">Python</span>
                <span className="timeline-tag">Javascript</span>
              </div>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <span className="timeline-date">2021 - Present</span>
              <h3 className="timeline-title">Bachelor's Degree</h3>
              <h4 className="timeline-company">University of Calgary</h4>
              <p className="timeline-description">
                Bachelors of Science in Software Engineering.
              </p>
              <div className="timeline-tags">
                <span className="timeline-tag">Networked Systems</span>
                <span className="timeline-tag">Algorithms</span>
                <span className="timeline-tag">OOP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="connect-section">
        <h3>Let's Connect</h3>
        <p>I'm always open to interesting conversations and new opportunities</p>
        <div className="social-grid">
          <a href="https://www.linkedin.com/in/mirza-hassan-baig-a33780229/" className="social-card" target="_blank" rel="noopener noreferrer">
            <span className="social-icon">💼</span>
            <span className="social-name">LinkedIn</span>
            <span className="social-desc">Professional network</span>
          </a>
          <a href="https://github.com/MirzaHB" className="social-card" target="_blank" rel="noopener noreferrer">
            <span className="social-icon">🐙</span>
            <span className="social-name">GitHub</span>
            <span className="social-desc">Code & projects</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Home;
