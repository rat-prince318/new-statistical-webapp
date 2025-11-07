import { useState, useEffect } from 'react';
import { Button, Box, Text, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Select, VStack, Grid, GridItem, Alert, AlertIcon, AlertDescription, Input } from '@chakra-ui/react';
import { DistributionConfig, DistributionGeneratorProps } from '../types';

function DistributionGenerator({ onDataChange }: DistributionGeneratorProps) {
  const [sampleSize, setSampleSize] = useState<number>(1000);
  const [selectedDistribution, setSelectedDistribution] = useState<string>('normal');
  const [params, setParams] = useState<Record<string, number>>({});
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Define configurations for various distributions
  const distributionConfigs: Record<string, DistributionConfig> = {
    normal: {
      name: 'Normal Distribution',
      params: [
        { name: 'mean', label: 'Mean (μ)', min: -100, max: 100, step: 0.1, defaultValue: 0 },
        { name: 'std', label: 'Standard Deviation (σ)', min: 0.1, max: 20, step: 0.1, defaultValue: 1 },
      ],
      formula: 'f(x) = (1/(σ√(2π))) * e^(-(x-μ)²/(2σ²))',
    },
    uniform: {
      name: 'Uniform Distribution',
      params: [
        { name: 'a', label: 'Minimum Value (a)', min: -100, max: 100, step: 0.1, defaultValue: 0 },
        { name: 'b', label: 'Maximum Value (b)', min: -100, max: 100, step: 0.1, defaultValue: 1 },
      ],
      formula: 'f(x) = 1/(b-a) for a ≤ x ≤ b',
    },
    binomial: {
      name: 'Binomial Distribution',
      params: [
        { name: 'n', label: 'Number of Trials (n)', min: 1, max: 100, step: 1, defaultValue: 10 },
        { name: 'p', label: 'Success Probability (p)', min: 0.1, max: 0.9, step: 0.01, defaultValue: 0.5 },
      ],
      formula: 'P(k) = C(n,k) * p^k * (1-p)^(n-k)',
    },
    poisson: {
      name: 'Poisson Distribution',
      params: [
        { name: 'lambda', label: 'λ Parameter', min: 0.1, max: 20, step: 0.1, defaultValue: 5 },
      ],
      formula: 'P(k) = (e^(-λ) * λ^k) / k!',
    },
    exponential: {
      name: 'Exponential Distribution',
      params: [
        { name: 'lambda', label: 'λ Parameter', min: 0.1, max: 5, step: 0.1, defaultValue: 1 },
      ],
      formula: 'f(x) = λ * e^(-λx) for x ≥ 0',
    },
    gamma: {
      name: 'Gamma Distribution',
      params: [
        { name: 'shape', label: 'Shape Parameter (k)', min: 0.1, max: 10, step: 0.1, defaultValue: 2 },
        { name: 'scale', label: 'Scale Parameter (θ)', min: 0.1, max: 5, step: 0.1, defaultValue: 1 },
      ],
      formula: 'f(x) = (x^(k-1) * e^(-x/θ)) / (θ^k * Γ(k)) for x > 0',
    },
  };

  // Initialize parameters
  useEffect(() => {
    const config = distributionConfigs[selectedDistribution];
    const initialParams: Record<string, number> = {};
    config.params.forEach((param) => {
      initialParams[param.name] = param.defaultValue;
    });
    setParams(initialParams);
  }, [selectedDistribution]);

  const handleParamChange = (paramName: string, value: number) => {
    setParams((prevParams) => ({
      ...prevParams,
      [paramName]: value,
    }));
  };

  const generateMockData = (): number[] => {
    const data: number[] = [];
    
    switch (selectedDistribution) {
      case 'normal':
        for (let i = 0; i < sampleSize; i++) {
          const u1 = Math.random();
          const u2 = Math.random();
          const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
          data.push(params.mean + params.std * z);
        }
        break;
      
      case 'uniform':
        const a = params.a;
        const b = params.b;
        for (let i = 0; i < sampleSize; i++) {
          data.push(a + Math.random() * (b - a));
        }
        break;
      
      case 'binomial':
        const n = params.n;
        const p = params.p;
        for (let i = 0; i < sampleSize; i++) {
          let successes = 0;
          for (let j = 0; j < n; j++) {
            if (Math.random() < p) {
              successes++;
            }
          }
          data.push(successes);
        }
        break;
      
      case 'poisson':
        const lambda = params.lambda;
        for (let i = 0; i < sampleSize; i++) {
          let k = 0;
          let p = 1;
          const l = Math.exp(-lambda);
          do {
            k++;
            p *= Math.random();
          } while (p > l);
          data.push(k - 1);
        }
        break;
      
      case 'exponential':
        const expLambda = params.lambda;
        for (let i = 0; i < sampleSize; i++) {
          data.push(-Math.log(Math.random()) / expLambda);
        }
        break;
      
      case 'gamma':
        const shape = params.shape;
        const scale = params.scale;
        for (let i = 0; i < sampleSize; i++) {
          // Generate gamma distribution random numbers using Marsaglia and Tsang's method
          if (shape < 1) {
            // Fix: Use acceptance-rejection method instead of recursive calls
            const k = shape;
            const c = (1 / k) - 1;
            let x, u;
            do {
              x = Math.pow(Math.random(), 1 / k);
              u = Math.random();
            } while (u > Math.exp(-x + c * (x - 1)));
            data.push(x * scale);
          } else {
            const d = shape - 1 / 3;
            const c = 1 / Math.sqrt(9 * d);
            let x, v, u;
            do {
              do {
                x = Math.random();
                v = 1 + c * x;
              } while (v <= 0);
              v = Math.pow(v, 3);
              u = Math.random();
            } while (u >= 1 - 0.0331 * Math.pow(x, 4) && Math.log(u) >= 0.5 * Math.pow(x, 2) + d * (1 - v + Math.log(v)));
            data.push(d * v * scale);
          }
        }
        break;
      
      default:
        throw new Error('Unsupported distribution type');
    }
    
    return data;
  };

  const handleGenerate = () => {
    try {
      setErrorMessage('');
      
      // Validate parameters
      if (selectedDistribution === 'uniform' && params.a >= params.b) {
        throw new Error('Minimum value must be less than maximum value for uniform distribution');
      }
      
      // Use setTimeout to simulate asynchronous operation without async/await
      setTimeout(() => {
        try {
          const data = generateMockData();
          const config = distributionConfigs[selectedDistribution];
          
          onDataChange(data, {
            type: selectedDistribution,
            name: config.name,
            formula: config.formula,
            parameters: { ...params },
          });
        } catch (error) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Error generating data'
          );
        }
      }, 300);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Error generating data'
      );
    }
  };

  const currentConfig = distributionConfigs[selectedDistribution];

  return (
    <Box p={4}>
      <Grid templateColumns="1fr 1fr" gap={6}>
        <GridItem>
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text mb={2} fontWeight="bold">Select Distribution Type</Text>
              <Select
                value={selectedDistribution}
                onChange={(e) => setSelectedDistribution(e.target.value)}
              >
                {Object.entries(distributionConfigs).map(([key, config]) => (
                  <option key={key} value={key}>{config.name}</option>
                ))}
              </Select>
            </Box>
            
            <Box>
              <Text mb={2} fontWeight="bold">Sample Size</Text>
              <Input
                type="number"
                min={10}
                max={10000}
                step={10}
                value={sampleSize}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 10 && val <= 10000) {
                    setSampleSize(val);
                  }
                }}
              />
            </Box>
            
            {currentConfig.params.map((param) => (
              <Box key={param.name}>
                <Text mb={2} fontWeight="bold">{param.label}</Text>
                <Input
                  type="number"
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={params[param.name] || param.defaultValue}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= param.min && val <= param.max) {
                      handleParamChange(param.name, val);
                    }
                  }}
                />
              </Box>
            ))}
            
            <Button
              onClick={handleGenerate}
              colorScheme="blue"
              variant="solid"
              size="lg"
            >
              Generate Data
            </Button>
            
            {errorMessage && (
              <Alert status="error">
                <AlertIcon />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
          </VStack>
        </GridItem>
        
        <GridItem>
          <Box p={4} bg="gray.50" borderRadius="md" height="100%">
            <Text fontWeight="bold" fontSize="lg" mb={2}>
              {currentConfig.name}
            </Text>
            
            {currentConfig.formula && (
              <Box mb={4} p={2} bg="white" borderRadius="md">
                <Text fontFamily="monospace" fontSize="sm">
                  {currentConfig.formula}
                </Text>
              </Box>
            )}
            
            <Text fontWeight="bold" mb={2}>Parameter Description:</Text>
            {currentConfig.params.map((param) => (
              <Text key={param.name} fontSize="sm" mb={1}>
                <strong>{param.label}:</strong> {param.name === 'mean' ? 'Central location of the distribution' : 
                 param.name === 'std' ? 'Degree of dispersion of the distribution' : 
                 param.name === 'a' ? 'Minimum value of the interval' : 
                 param.name === 'b' ? 'Maximum value of the interval' : 
                 param.name === 'n' ? 'Number of independent trials' : 
                 param.name === 'p' ? 'Probability of success in each trial' : 
                 param.name === 'lambda' ? 'Average number of events per unit time' : 
                 param.name === 'shape' ? 'Shape parameter that affects the distribution shape' : 
                 param.name === 'scale' ? 'Scale parameter that affects the distribution range' : ''}
              </Text>
            ))}
            
            <Box mt={6}>
              <Text fontWeight="bold" mb={2}>Instructions:</Text>
              <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                <li style={{ fontSize: 'sm', marginBottom: '4px' }}>Select distribution type</li>
                <li style={{ fontSize: 'sm', marginBottom: '4px' }}>Adjust sample size</li>
                <li style={{ fontSize: 'sm', marginBottom: '4px' }}>Set distribution parameters</li>
                <li style={{ fontSize: 'sm', marginBottom: '4px' }}>Click the "Generate Data" button</li>
              </ul>
            </Box>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
}

export default DistributionGenerator;