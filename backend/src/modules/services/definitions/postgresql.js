// PostgreSQL Service Definition
const getPostgresEnv = (localIP, availablePort, options = {}) => {
  const user = options.POSTGRES_USER || 'postgres';
  const password = options.POSTGRES_PASSWORD || 'postgres';
  return [
    `POSTGRES_USER=${user}`,
    `POSTGRES_PASSWORD=${password}`
  ];
};

export const postgresqlServiceConfig = {
  name: 'postgresql',
  displayName: 'PostgreSQL',
  description: 'Open source relational database',
  image: 'postgres:latest',
  defaultPort: 5432,
  internalPort: 5432,
  templates: {
    basic: {
      memory: '512m',
      cpus: '0.5',
      description: 'Basic PostgreSQL instance'
    },
    plus: {
      memory: '1g',
      cpus: '1.0',
      description: 'Medium PostgreSQL instance'
    },
    pro: {
      memory: '2g',
      cpus: '2.0',
      description: 'High performance PostgreSQL instance'
    }
  },
  getEnvironment: (localIP, availablePort, options = {}) => getPostgresEnv(localIP, availablePort, options),
  volumeMount: '/var/lib/postgresql/data',
  successMessage: 'PostgreSQL service deployed successfully!',
  instructions: [
    'Connect to your PostgreSQL instance using the credentials below.',
    'Default user: POSTGRES_USER',
    'Default password: POSTGRES_PASSWORD',
    'Default port: 5432'
  ],
  // For frontend to show credential fields
  credentialFields: [
    { key: 'POSTGRES_USER', label: 'Username', type: 'text', default: 'postgres' },
    { key: 'POSTGRES_PASSWORD', label: 'Password', type: 'password', default: 'postgres' }
  ]
};

export default postgresqlServiceConfig;
