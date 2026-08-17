import React from 'react';
import { PROJECTS } from '../../data/projects';
import ProjectCard from './ProjectCard';
import './Projects.css';

const Projects: React.FC = () => {
  return (
    <div className="projects-container">
      <div className="projects-header">
        <h1 className="projects-page-title">
          My <span className="title-highlight">Projects</span>
        </h1>
        <p className="projects-subtitle">
          Things I've built, and what I learned building them
        </p>
      </div>

      <div className="projects-grid">
        {PROJECTS.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
};

export default Projects;
