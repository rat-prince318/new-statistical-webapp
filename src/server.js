// Temporarily not loading dotenv to avoid environment variable interference
// require('dotenv').config();
const express = require('express');
const path = require('path');
const { create, all } = require('mathjs');

// Create a mathjs instance with all functions
const math = create(all);

const app = express();
// Hardcoding port directly without using environment variables
const port = 8888;

// Middleware
app.use(express.json());

// Serve static files from both public and dist/client directories
// Prioritize using built files (dist/client), fallback to public in development
const publicPath = path.join(__dirname, '..', 'public');
const distPath = path.join(__dirname, '..', '..', 'dist', 'client');

// Check if dist/client directory exists
const fs = require('fs');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
} else {
  app.use(express.static(publicPath));
}

// Ensure API routes are defined after static file serving but before catch-all route

// Home page route - prefer returning dist/client/index.html
app.get('/', (req, res) => {
  const distIndexPath = path.join(distPath, 'index.html');
  const publicIndexPath = path.join(publicPath, 'index.html');
  
  if (fs.existsSync(distIndexPath)) {
    res.sendFile(distIndexPath);
  } else {
    res.sendFile(publicIndexPath);
  }
});

// All other non-API routes return index.html to support React client-side routing
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api')) {
    return next();
  }
  
  const distIndexPath = path.join(distPath, 'index.html');
  const publicIndexPath = path.join(publicPath, 'index.html');
  
  if (fs.existsSync(distIndexPath)) {
    res.sendFile(distIndexPath);
  } else {
    res.sendFile(publicIndexPath);
  }
});

// API documentation route
app.get('/api', (req, res) => {
  res.json({
    endpoints: [
      {
        path: '/api',
        method: 'GET',
        description: 'API documentation'
      },
      {
        path: '/api/distributions',
        method: 'GET',
        description: 'List of available probability distributions'
      },
      {
        path: '/api/distributions/:name/calculate',
        method: 'POST',
        description: 'Calculate probability distribution values',
        exampleBody: {
          parameters: { mu: 0, sigma: 1 },
          x: 0
        }
      },
      {
        path: '/api/distributions/:name/generate',
        method: 'POST',
        description: 'Generate random numbers from a distribution',
        exampleBody: {
          parameters: { mu: 0, sigma: 1 },
          count: 1000
        }
      },
      {
        path: '/api/stats/describe',
        method: 'POST',
        description: 'Calculate descriptive statistics for a dataset',
        exampleBody: {
          data: [1, 2, 3, 4, 5]
        }
      }
    ]
  });
});

// List of available distributions
const availableDistributions = [
  {
    name: 'normal',
    displayName: 'Normal Distribution',
    description: 'Gaussian distribution characterized by mean and standard deviation',
    parameters: ['mu', 'sigma'],
    constraints: { mu: 'any', sigma: '>0' }
  },
  {
    name: 'uniform',
    displayName: 'Uniform Distribution',
    description: 'Constant probability over a specified range',
    parameters: ['a', 'b'],
    constraints: { a: 'any', b: '>a' }
  },
  {
    name: 'binomial',
    displayName: 'Binomial Distribution',
    description: 'Discrete probability of successes in a fixed number of trials',
    parameters: ['n', 'p'],
    constraints: { n: 'integer>0', p: '0<=p<=1' }
  },
  {
    name: 'poisson',
    displayName: 'Poisson Distribution',
    description: 'Discrete probability of a given number of events occurring',
    parameters: ['lambda'],
    constraints: { lambda: '>0' }
  },
  {
    name: 'exponential',
    displayName: 'Exponential Distribution',
    description: 'Continuous probability describing the time between events',
    parameters: ['lambda'],
    constraints: { lambda: '>0' }
  },
  {
    name: 'gamma',
    displayName: 'Gamma Distribution',
    description: 'Two-parameter family of continuous probability distributions',
    parameters: ['shape', 'rate'],
    constraints: { shape: '>0', rate: '>0' }
  }
];

// Get available distributions
app.get('/api/distributions', (req, res) => {
  res.json(availableDistributions);
});

// Calculate probability distribution values
app.post('/api/distributions/:name/calculate', (req, res) => {
  try {
    const { name } = req.params;
    const { parameters, x, type = 'pdf' } = req.body;

    if (!parameters || x === undefined) {
      return res.status(400).json({ error: 'Missing parameters or x value' });
    }

    // Validate distribution exists
    const distribution = availableDistributions.find(d => d.name === name);
    if (!distribution) {
      return res.status(404).json({ error: 'Distribution not found' });
    }

    // Validate parameters
    if (!validateParameters(distribution, parameters)) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    // Calculate result
    let result;
    switch (name) {
      case 'normal':
        if (type === 'pdf') {
          result = normalPDF(x, parameters.mu, parameters.sigma);
        } else if (type === 'cdf') {
          result = normalCDF(x, parameters.mu, parameters.sigma);
        } else {
          return res.status(400).json({ error: 'Invalid calculation type' });
        }
        break;
      case 'uniform':
        if (type === 'pdf') {
          result = uniformPDF(x, parameters.a, parameters.b);
        } else if (type === 'cdf') {
          result = uniformCDF(x, parameters.a, parameters.b);
        } else {
          return res.status(400).json({ error: 'Invalid calculation type' });
        }
        break;
      case 'binomial':
        if (type === 'pmf') {
          result = binomialPMF(x, parameters.n, parameters.p);
        } else if (type === 'cdf') {
          result = binomialCDF(x, parameters.n, parameters.p);
        } else {
          return res.status(400).json({ error: 'Invalid calculation type' });
        }
        break;
      case 'poisson':
        if (type === 'pmf') {
          result = poissonPMF(x, parameters.lambda);
        } else if (type === 'cdf') {
          result = poissonCDF(x, parameters.lambda);
        } else {
          return res.status(400).json({ error: 'Invalid calculation type' });
        }
        break;
      case 'exponential':
        if (type === 'pdf') {
          result = exponentialPDF(x, parameters.lambda);
        } else if (type === 'cdf') {
          result = exponentialCDF(x, parameters.lambda);
        } else {
          return res.status(400).json({ error: 'Invalid calculation type' });
        }
        break;
      case 'gamma':
        if (type === 'pdf') {
          result = gammaPDF(x, parameters.shape, parameters.rate);
        } else {
          return res.status(400).json({ error: 'Only PDF calculation available for gamma distribution' });
        }
        break;
      default:
        return res.status(400).json({ error: 'Calculation not implemented for this distribution' });
    }

    res.json({
      distribution: name,
      parameters,
      x,
      type,
      result
    });
  } catch (error) {
    console.error('Error in distribution calculation:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    });
  }
});

// Generate random numbers from a distribution
app.post('/api/distributions/:name/generate', (req, res) => {
  try {
    const { name } = req.params;
    const { parameters, count = 1000 } = req.body;

    if (!parameters || count <= 0) {
      return res.status(400).json({ error: 'Missing parameters or invalid count' });
    }

    // Validate distribution exists
    const distribution = availableDistributions.find(d => d.name === name);
    if (!distribution) {
      return res.status(404).json({ error: 'Distribution not found' });
    }

    // Validate parameters
    if (!validateParameters(distribution, parameters)) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    // Generate random numbers
    let data;
    switch (name) {
      case 'normal':
        data = generateNormal(parameters.mu, parameters.sigma, count);
        break;
      case 'uniform':
        data = generateUniform(parameters.a, parameters.b, count);
        break;
      case 'binomial':
        data = generateBinomial(parameters.n, parameters.p, count);
        break;
      case 'poisson':
        data = generatePoisson(parameters.lambda, count);
        break;
      case 'exponential':
        data = generateExponential(parameters.lambda, count);
        break;
      default:
        return res.status(400).json({ error: 'Generation not implemented for this distribution' });
    }

    res.json({
      distribution: name,
      parameters,
      count,
      data,
      stats: calculateStats(data)
    });
  } catch (error) {
    console.error('Error in random number generation:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    });
  }
});

// Calculate descriptive statistics for a dataset
app.post('/api/stats/describe', (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty dataset' });
    }

    const stats = calculateStats(data);

    res.json({
      dataLength: data.length,
      statistics: stats
    });
  } catch (error) {
    console.error('Error in descriptive statistics:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    });
  }
});

// Helper functions for probability distributions

// Normal Distribution
function normalPDF(x, mu = 0, sigma = 1) {
  const coefficient = 1 / (sigma * Math.sqrt(2 * Math.PI));
  const exponent = -0.5 * Math.pow((x - mu) / sigma, 2);
  return coefficient * Math.exp(exponent);
}

function normalCDF(x, mu = 0, sigma = 1) {
  // Using the error function approximation
  const z = (x - mu) / sigma;
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

function generateNormal(mu = 0, sigma = 1, count = 1000) {
  const data = [];
  for (let i = 0; i < count; i++) {
    // Using Box-Muller transform
    let u1 = 0, u2 = 0;
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();
    const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    data.push(z1 * sigma + mu);
  }
  return data;
}

// Uniform Distribution
function uniformPDF(x, a = 0, b = 1) {
  if (x < a || x > b) return 0;
  return 1 / (b - a);
}

function uniformCDF(x, a = 0, b = 1) {
  if (x < a) return 0;
  if (x > b) return 1;
  return (x - a) / (b - a);
}

function generateUniform(a = 0, b = 1, count = 1000) {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push(a + Math.random() * (b - a));
  }
  return data;
}

// Binomial Distribution
function binomialPMF(k, n, p) {
  if (k < 0 || k > n) return 0;
  return comb(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

function binomialCDF(k, n, p) {
  let sum = 0;
  for (let i = 0; i <= k; i++) {
    sum += binomialPMF(i, n, p);
  }
  return sum;
}

function generateBinomial(n, p, count = 1000) {
  const data = [];
  for (let i = 0; i < count; i++) {
    let successes = 0;
    for (let j = 0; j < n; j++) {
      if (Math.random() < p) {
        successes++;
      }
    }
    data.push(successes);
  }
  return data;
}

// Poisson Distribution
function poissonPMF(k, lambda) {
  if (k < 0) return 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function poissonCDF(k, lambda) {
  let sum = 0;
  for (let i = 0; i <= k; i++) {
    sum += poissonPMF(i, lambda);
  }
  return sum;
}

function generatePoisson(lambda, count = 1000) {
  const data = [];
  for (let i = 0; i < count; i++) {
    let k = 0;
    let p = 1;
    const l = Math.exp(-lambda);
    while (p > l) {
      k++;
      p *= Math.random();
    }
    data.push(k - 1);
  }
  return data;
}

// Exponential Distribution
function exponentialPDF(x, lambda = 1) {
  if (x < 0) return 0;
  return lambda * Math.exp(-lambda * x);
}

function exponentialCDF(x, lambda = 1) {
  if (x < 0) return 0;
  return 1 - Math.exp(-lambda * x);
}

function generateExponential(lambda = 1, count = 1000) {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push(-Math.log(1 - Math.random()) / lambda);
  }
  return data;
}

// Gamma Distribution
function gammaPDF(x, shape, rate) {
  if (x < 0) return 0;
  return (Math.pow(rate, shape) * Math.pow(x, shape - 1) * Math.exp(-rate * x)) / gamma(shape);
}

// Helper functions
function validateParameters(distribution, parameters) {
  try {
    // Check if all required parameters are present
    for (const param of distribution.parameters) {
      if (!(param in parameters)) {
        return false;
      }
    }

    // Check constraints based on distribution type
    switch (distribution.name) {
      case 'normal':
        return parameters.sigma > 0;
      case 'uniform':
        return parameters.b > parameters.a;
      case 'binomial':
        return Number.isInteger(parameters.n) && parameters.n > 0 && parameters.p >= 0 && parameters.p <= 1;
      case 'poisson':
      case 'exponential':
        return parameters.lambda > 0;
      case 'gamma':
        return parameters.shape > 0 && parameters.rate > 0;
      default:
        return true;
    }
  } catch (error) {
    return false;
  }
}

function calculateStats(data) {
  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;
  const sortedData = [...data].sort((a, b) => a - b);
  const median = n % 2 === 0 ? (sortedData[n/2 - 1] + sortedData[n/2]) / 2 : sortedData[Math.floor(n/2)];
  const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const min = sortedData[0];
  const max = sortedData[n - 1];
  
  // Calculate quartiles
  const q1 = sortedData[Math.floor(n * 0.25)];
  const q3 = sortedData[Math.floor(n * 0.75)];
  
  return {
    mean,
    median,
    variance,
    stdDev,
    min,
    max,
    q1,
    q3,
    count: n
  };
}

// Approximation of the error function
function erf(x) {
  // constants
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  // Save the sign of x
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  // A&S formula 7.1.26
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

// Combination function (n choose k)
function comb(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k); // take advantage of symmetry
  let c = 1;
  for (let i = 0; i < k; i++) {
    c = c * (n - i) / (i + 1);
  }
  return c;
}

// Factorial function
function factorial(n) {
  if (n < 0) return 0;
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

// Gamma function approximation
function gamma(z) {
  // Using Lanczos approximation for gamma function
  const p = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];
  
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  
  z -= 1;
  let x = p[0];
  for (let i = 1; i < p.length; i++) {
    x += p[i] / (z + i);
  }
  
  const t = z + p.length - 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

// Start the server with auto port retry mechanism
function startServer(serverPort) {
  const server = app.listen(serverPort, () => {
    console.log(`
=== Probability Distribution Webapp ===`);
    console.log(`Server running at http://localhost:${serverPort}`);
    console.log(`API documentation: http://localhost:${serverPort}/api`);
    console.log(`\nAvailable probability distributions:`);
    availableDistributions.forEach(dist => {
      console.log(`- ${dist.displayName} (${dist.name})`);
    });
    console.log(`======================================`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${serverPort} is in use, trying ${serverPort + 1}...`);
      startServer(serverPort + 1);
    } else {
      console.error('Failed to start server:', err);
    }
  });
}

startServer(port);

// Export app for testing
module.exports = app;