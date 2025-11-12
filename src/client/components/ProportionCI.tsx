import React, { useState, useEffect } from 'react';
import { Box, Text, FormControl, FormLabel, Input, Select, Button, Card, CardBody, Grid, Alert } from '@chakra-ui/react';
import { calculateProportionConfidenceInterval, ConfidenceIntervalType } from '../utils/statistics';

interface ProportionCIProps {
  dataset?: number[];
}

function ProportionCI({ dataset = [] }: ProportionCIProps) {
  // One proportion parameters
  const [successCount, setSuccessCount] = useState<string>('');
  const [sampleSize, setSampleSize] = useState<string>('');
  const [confidenceLevel, setConfidenceLevel] = useState<string>('0.95');
  const [method, setMethod] = useState<'wald' | 'wilson'>('wilson');
  const [intervalType, setIntervalType] = useState<ConfidenceIntervalType>('two-sided');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // If dataset is provided, automatically calculate number of successes and sample size
    if (dataset.length > 0) {
      // Assume dataset is binary (0 and 1), count number of 1s as successes
      const count = dataset.filter(value => value === 1).length;
      setSuccessCount(count.toString());
      setSampleSize(dataset.length.toString());
    }
  }, [dataset]);

  const handleCalculate = () => {
    setError(null);
    try {
      const y = parseInt(successCount);
      const n = parseInt(sampleSize);
      const cl = parseFloat(confidenceLevel);
      
      if (isNaN(y) || isNaN(n) || isNaN(cl) || y < 0 || n <= 0 || y > n) {
        throw new Error('Please enter valid success count and sample size');
      }
      
      const result = calculateProportionConfidenceInterval(y, n, cl, { method, intervalType });
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error');
    }
  };

  return (
    <Box>
      <Text fontSize="lg" mb={6}>One-Proportion Confidence Interval Calculation</Text>
          
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6} mb={6}>
        <FormControl>
          <FormLabel fontSize="sm">Success Count (y)</FormLabel>
          <Input
            type="number"
            value={successCount}
            onChange={(e) => setSuccessCount(e.target.value)}
            min="0"
          />
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm">Sample Size (n)</FormLabel>
          <Input
            type="number"
            value={sampleSize}
            onChange={(e) => setSampleSize(e.target.value)}
            min="1"
          />
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm">Confidence Level</FormLabel>
          <Select
            value={confidenceLevel}
            onChange={(e) => setConfidenceLevel(e.target.value)}
          >
            <option value="0.90">90%</option>
            <option value="0.95">95%</option>
            <option value="0.99">99%</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm">Confidence Interval Type</FormLabel>
          <Select
            value={intervalType}
            onChange={(e) => setIntervalType(e.target.value as ConfidenceIntervalType)}
          >
            <option value="two-sided">Two-Sided</option>
            <option value="one-sided-lower">One-Sided Lower</option>
            <option value="one-sided-upper">One-Sided Upper</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm">Calculation Method</FormLabel>
          <Select
            value={method}
            onChange={(e) => setMethod(e.target.value as 'wald' | 'wilson')}
          >
            <option value="wald">Wald Interval</option>
            <option value="wilson">Wilson Score Interval</option>
          </Select>
        </FormControl>
      </Grid>
      
      <Button onClick={handleCalculate} colorScheme="blue" width="100%" mb={6}>
        Calculate Confidence Interval
      </Button>
      
      {error && (
        <Alert status="error" mt={4}>
          {error}
        </Alert>
      )}
      
      {results && (
        <Card>
          <CardBody>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4} mb={4}>
              <Card>
                <CardBody>
                  <Text fontSize="sm" color="gray.500">Sample Proportion (p̂)</Text>
                  <Text fontSize="2xl" fontWeight="bold">
                    {results.proportion !== undefined ? results.proportion.toFixed(4) : 'N/A'}
                  </Text>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <Text fontSize="sm" color="gray.500">Standard Error</Text>
                  <Text fontSize="2xl" fontWeight="bold">
                    {results.standardError !== undefined ? results.standardError.toFixed(4) : 'N/A'}
                  </Text>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <Text fontSize="sm" color="gray.500">Margin of Error</Text>
                  <Text fontSize="2xl" fontWeight="bold">
                    {results.marginOfError !== undefined ? results.marginOfError.toFixed(4) : 'N/A'}
                  </Text>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <Text fontSize="sm" color="gray.500">Calculation Method</Text>
                  <Text fontSize="lg" fontWeight="bold">{results.method || 'N/A'}</Text>
                </CardBody>
              </Card>
            </Grid>
            
            <Box mt={4}>
              <Text fontSize="sm" color="gray.600">
                {confidenceLevel === '0.95' ? '95%' : confidenceLevel === '0.90' ? '90%' : '99%'} Confidence Interval:
              </Text>
              <Text fontWeight="bold" fontSize="lg">
                {results.lower !== undefined && results.upper !== undefined 
                  ? results.intervalType === 'one-sided-lower' 
                    ? `[${results.lower.toFixed(4)}, +∞)` 
                    : results.intervalType === 'one-sided-upper'
                      ? `(-∞, ${results.upper.toFixed(4)}]`
                      : `[${results.lower.toFixed(4)}, ${results.upper.toFixed(4)}]`
                  : 'N/A'
                }
              </Text>
            </Box>
          </CardBody>
        </Card>
      )}
    </Box>
  );
}

export default ProportionCI;