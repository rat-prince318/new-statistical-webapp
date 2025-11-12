import { useState, useEffect } from 'react';
import { Box, Text, Grid, Card, CardBody, Select, FormControl, FormLabel, Input, Button, Alert, ButtonGroup } from '@chakra-ui/react';
import { calculateTwoSampleConfidenceInterval, ConfidenceIntervalType } from '../utils/statistics';

interface TwoSampleMeanCIProps {
  dataset1?: number[];
  dataset2?: number[];
}

function TwoSampleMeanCI({ dataset1 = [], dataset2 = [] }: TwoSampleMeanCIProps) {
  // Data input state
  const [sample1Data, setSample1Data] = useState<string>('');
  const [sample2Data, setSample2Data] = useState<string>('');
  
  useEffect(() => {
    if (dataset1.length > 0) {
      setSample1Data(dataset1.join(', '));
    }
    if (dataset2.length > 0) {
      setSample2Data(dataset2.join(', '));
    }
  }, [dataset1, dataset2]);
  
  // Parameter input state
  const [sample1Size, setSample1Size] = useState<string>('');
  const [sample1Mean, setSample1Mean] = useState<string>('');
  const [sample1Std, setSample1Std] = useState<string>('');
  const [sample2Size, setSample2Size] = useState<string>('');
  const [sample2Mean, setSample2Mean] = useState<string>('');
  const [sample2Std, setSample2Std] = useState<string>('');
  
  // Analysis options
  const [confidenceLevel, setConfidenceLevel] = useState<string>('0.95');
  const [method, setMethod] = useState<'pooled' | 'welch'>('welch');
  const [intervalType, setIntervalType] = useState<ConfidenceIntervalType>('two-sided');
  const [inputMode, setInputMode] = useState<'data' | 'stats'>('data');
  
  // Result state
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate confidence interval for difference in two sample means
  const calculateTwoSampleCI = (): void => {
    setError(null);
    
    try {
      if (inputMode === 'data') {
        // Calculate statistics from raw data
        const data1 = sample1Data
          .split(/[\s,]+/)
          .filter(val => val.trim() !== '')
          .map(val => parseFloat(val))
          .filter(val => !isNaN(val));
        
        const data2 = sample2Data
          .split(/[\s,]+/)
          .filter(val => val.trim() !== '')
          .map(val => parseFloat(val))
          .filter(val => !isNaN(val));
        
        if (data1.length === 0 || data2.length === 0) {
          throw new Error('Both samples need valid data');
        }
        
        const confLevel = parseFloat(confidenceLevel);
        
        // Use our statistical function to calculate confidence interval
        const ciResult = calculateTwoSampleConfidenceInterval(
          data1,
          data2,
          confLevel,
          { method, intervalType }
        );
        
        setResult(ciResult);
      } else {
        // Handling for statistical input mode can be added later
        throw new Error('Statistical input mode not yet implemented');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error');
    }
  };

  return (
    <Box>
      <Text fontSize="lg" mb={4}>Two-Sample Mean Difference Confidence Interval Calculation</Text>
      
      <Card mb={6}>
        <CardBody>
          <ButtonGroup mb={4} variant="outline" borderBottomWidth="1px" borderBottomColor="gray.200">
            <Button 
              px={4} 
              py={2} 
              variant={inputMode === 'data' ? 'solid' : 'outline'}
              colorScheme="blue"
              onClick={() => setInputMode('data')}
            >
              Input Raw Data
            </Button>
            <Button 
              px={4} 
              py={2} 
              variant={inputMode === 'stats' ? 'solid' : 'outline'}
              colorScheme="blue"
              onClick={() => setInputMode('stats')}
            >
              Input Statistics
            </Button>
          </ButtonGroup>
          
          {inputMode === 'data' && (
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
              <FormControl>
                <FormLabel>Sample 1 Data (separated by spaces or commas)</FormLabel>
                <textarea
                  value={sample1Data}
                  onChange={(e) => setSample1Data(e.target.value)}
                  placeholder="Example: 1.2 3.4 5.6 7.8 9.0"
                  style={{
                    width: '100%',
                    height: '100px',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    resize: 'vertical'
                  }}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Sample 2 Data (separated by spaces or commas)</FormLabel>
                <textarea
                  value={sample2Data}
                  onChange={(e) => setSample2Data(e.target.value)}
                  placeholder="Example: 2.1 4.3 6.5 8.7 10.9"
                  style={{
                    width: '100%',
                    height: '100px',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    resize: 'vertical'
                  }}
                />
              </FormControl>
            </Grid>
          )}
          
          {inputMode === 'stats' && (
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
              <Box>
                <Text fontWeight="medium" mb={2}>Sample 1 Statistics</Text>
                <FormControl mb={2}>
                  <FormLabel fontSize="sm">Sample Size (n₁)</FormLabel>
                  <Input type="number" value={sample1Size} onChange={(e) => setSample1Size(e.target.value)} min="1" />
                </FormControl>
                <FormControl mb={2}>
                  <FormLabel fontSize="sm">Sample Mean (x̄₁)</FormLabel>
                  <Input type="number" step="any" value={sample1Mean} onChange={(e) => setSample1Mean(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Sample Standard Deviation (s₁)</FormLabel>
                  <Input type="number" step="any" value={sample1Std} onChange={(e) => setSample1Std(e.target.value)} min="0" />
                </FormControl>
              </Box>
              
              <Box>
                <Text fontWeight="medium" mb={2}>Sample 2 Statistics</Text>
                <FormControl mb={2}>
                  <FormLabel fontSize="sm">Sample Size (n₂)</FormLabel>
                  <Input type="number" value={sample2Size} onChange={(e) => setSample2Size(e.target.value)} min="1" />
                </FormControl>
                <FormControl mb={2}>
                  <FormLabel fontSize="sm">Sample Mean (x̄₂)</FormLabel>
                  <Input type="number" step="any" value={sample2Mean} onChange={(e) => setSample2Mean(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Sample Standard Deviation (s₂)</FormLabel>
                  <Input type="number" step="any" value={sample2Std} onChange={(e) => setSample2Std(e.target.value)} min="0" />
                </FormControl>
              </Box>
            </Grid>
          )}
          
          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4} mt={6}>
            <FormControl>
              <FormLabel>Confidence Level</FormLabel>
              <Select value={confidenceLevel} onChange={(e) => setConfidenceLevel(e.target.value)}>
                <option value="0.90">90%</option>
                <option value="0.95">95%</option>
                <option value="0.99">99%</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>Variance Treatment Method</FormLabel>
              <Select
                value={method}
                onChange={(e) => setMethod(e.target.value as 'pooled' | 'welch')}
              >
                <option value="pooled">Assuming Equal Variances (Pooled)</option>
                <option value="welch">Not Assuming Equal Variances (Welch)</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>Confidence Interval Type</FormLabel>
              <Select
                value={intervalType}
                onChange={(e) => setIntervalType(e.target.value as ConfidenceIntervalType)}
              >
                <option value="two-sided">Two-Sided</option>
                <option value="one-sided-lower">One-Sided Lower</option>
                <option value="one-sided-upper">One-Sided Upper</option>
              </Select>
            </FormControl>
          </Grid>
          
          <Button onClick={calculateTwoSampleCI} mt={6} colorScheme="blue" width="100%">
            Calculate Confidence Interval
          </Button>
        </CardBody>
      </Card>
      
      {error && (
        <Alert status="error" mt={4}>
          {error}
        </Alert>
      )}
      
      {result && (
        <Box mt={6}>
          <Text fontSize="lg" fontWeight="bold" mb={4}>Calculation Results</Text>
          
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
            <Card>
              <CardBody>
                <Text fontSize="sm" color="gray.500">Mean Difference</Text>
                <Text fontSize="2xl" fontWeight="bold">{result.meanDiff.toFixed(4)}</Text>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Text fontSize="sm" color="gray.500">CI Lower Bound</Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {result.lower === -Infinity ? "-∞" : result.lower.toFixed(4)}
                </Text>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Text fontSize="sm" color="gray.500">CI Upper Bound</Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {result.upper === Infinity ? "+∞" : result.upper.toFixed(4)}
                </Text>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Text fontSize="sm" color="gray.500">Margin of Error</Text>
                <Text fontSize="2xl" fontWeight="bold">{result.marginOfError.toFixed(4)}</Text>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Text fontSize="sm" color="gray.500">Calculation Method</Text>
                <Text fontSize="lg" fontWeight="bold">{result.method}</Text>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Text fontSize="sm" color="gray.500">Critical Value</Text>
                <Text fontSize="2xl" fontWeight="bold">{result.criticalValue.toFixed(4)}</Text>
              </CardBody>
            </Card>
          </Grid>
        </Box>
      )}
    </Box>
  );
}

export default TwoSampleMeanCI;