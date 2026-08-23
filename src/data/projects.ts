export interface Project {
  /** Stable slug — also the React key and the anchor for future detail routes. */
  id: string;
  title: string;
  /** One or two sentences. This is all a recruiter reads on the card. */
  summary: string;
  tech: string[];
  /** Optional context line, e.g. a hackathon name or a date range. */
  timeframe?: string;
  repoUrl?: string;
  liveUrl?: string;
  /** Blog post id (without .md) for the long-form writeup, linked as "Read the writeup". */
  blogId?: string;
  /** Shown on the home page. Keep this to three — the rest live on /projects. */
  featured?: boolean;
}

// Ordered most-impressive first; the home page takes the first three featured
// entries, so reordering here is how you re-rank what a recruiter sees.
export const PROJECTS: Project[] = [
  {
    id: 'skyeye',
    title: 'SkyEye',
    summary:
      'A live airspace and weather monitor for Alberta. Five .NET microservices move ADS-B aircraft positions over RabbitMQ into a TimescaleDB hypertable, with retry queues, dead-lettering and publisher confirms keeping the pipeline reliable. SignalR pushes those positions to a React map overlaid with Environment Canada weather radar. A detection service flags geofence crossings, rapid descents and emergency squawks, and zones drawn on the map reach the running detector without a restart.',
    tech: [
      'C#',
      '.NET 8',
      'RabbitMQ',
      'TimescaleDB',
      'SignalR',
      'React',
      'Leaflet',
      'Docker',
    ],
    timeframe: 'In progress',
    featured: true,
  },
  {
    id: 'beacons',
    title: 'Beacons',
    summary:
      'A location-locked, anonymity-first chat room. Scan a QR code to join the room tied to your physical space, and get dropped automatically once you walk away, so the conversation stays with the people actually around you. Tagged questions are answered by an AI agent, with every message passed through content moderation.',
    tech: [
      'Azure SignalR',
      'Cosmos DB',
      'Azure Functions',
      'App Service',
      'AI Content Safety',
      'Claude Haiku',
    ],
    timeframe: 'Hack the Change 2025',
    blogId: 'b9c41966-c714-4c0a-96a0-fd03554edeb4',
    featured: true,
  },
  {
    id: 'portfolio',
    title: 'This Site',
    summary:
      'A full-stack portfolio built and hosted from scratch. React 19 SPA on Azure Static Web Apps, backed by an ASP.NET Core API, with Entra ID auth gating an admin-only CMS for the blog and gallery. Uploaded photos are converted to AVIF by a blob-triggered Azure Function and served from a CDN behind a custom domain.',
    tech: [
      'React 19',
      'TypeScript',
      'ASP.NET Core',
      'C#',
      'Azure Functions',
      'Blob Storage',
      'Entra ID',
    ],
    // No liveUrl: the live site is the page you're reading this on.
    timeframe: '2025 - Present',
    blogId: '3c53e933-d99e-4feb-b6fe-09488b3223b0',
    featured: true,
  },
];

export const getFeaturedProjects = (limit = 3): Project[] =>
  PROJECTS.filter(p => p.featured).slice(0, limit);
