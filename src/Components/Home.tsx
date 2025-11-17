import React from 'react';
import { Link } from 'react-router-dom';
import TypewriterEffect from './TypewriterEffect';
import ScrollNavigation from './ScrollNavigation';
import './Home.css';
import './TypewriterEffect.css';

const Home: React.FC = () => {
  return (
    <div className="home-container">
      <ScrollNavigation />
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
              <span className="button-icon">📚</span>
              Read Blogs
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

      <div id="about" className="about-section">
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

      <div id="experience" className="experience-section">
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

      <div id="socials" className="connect-section">
        <h3>Let's Connect</h3>
        <p>I'm always open to interesting conversations and new opportunities</p>
        <div className="social-grid">
          <a href="https://www.linkedin.com/in/mirza-hassan-baig-a33780229/" className="social-card" target="_blank" rel="noopener noreferrer">
            <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <span className="social-name">LinkedIn</span>
            <span className="social-desc">Professional network</span>
          </a>
          <a href="https://github.com/MirzaHB" className="social-card" target="_blank" rel="noopener noreferrer">
            <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span className="social-name">GitHub</span>
            <span className="social-desc">Code & projects</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Home;
