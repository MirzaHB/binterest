import React from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../../data/projects';
import './ProjectCard.css';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { title, summary, tech, timeframe, repoUrl, liveUrl, blogId } = project;

  return (
    <article className="project-card">
      <div className="project-card-body">
        <div className="project-card-heading">
          <h3 className="project-title">{title}</h3>
          {timeframe && <span className="project-timeframe">{timeframe}</span>}
        </div>

        <p className="project-summary">{summary}</p>

        <ul className="project-tech" aria-label={`${title} tech stack`}>
          {tech.map(item => (
            <li key={item} className="project-tech-item">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="project-links">
        {liveUrl && (
          <a
            href={liveUrl}
            className="project-link primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Live site
            <span aria-hidden="true"> ↗</span>
          </a>
        )}
        {repoUrl && (
          <a
            href={repoUrl}
            className="project-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Code
            <span aria-hidden="true"> ↗</span>
          </a>
        )}
        {blogId && (
          <Link to={`/blog/${blogId}`} className="project-link">
            Read the writeup
          </Link>
        )}
      </div>
    </article>
  );
};

export default ProjectCard;
