import React, { useState } from 'react';
import { Box, Text, Grid, Card, CardBody, Select, FormControl, FormLabel, Switch, Input, Button, Alert, AlertIcon, AlertDescription } from '@chakra-ui/react';
import { calculateOneSampleMeanCI, calculateMean, ConfidenceIntervalType } from '../utils/statistics';
import { BasicStats } from '../types';

interface OneSampleMeanCIProps {
  dataset?: number[];
  isGeneratedDataset?: boolean; // New flag indicating if the dataset is system-generated
  distributionInfo?: { // Dataset distribution information
    type: string;
    name: string;
    parameters: Record<string, number>;
  };
  basicStats?: BasicStats | null;
}

function OneSampleMeanCI({ dataset = [], isGeneratedDataset = false, distributionInfo, basicStats }: OneSampleMeanCIProps) {
  // Confidence interval calculation options
  const [ciOptions, setCiOptions] = useState({
    confidenceLevel: 0.95,
    isNormal: false, // Default: not assuming normal distribution
    knownVariance: false, // Default: unknown variance
    populationVariance: 0,
    intervalType: 'two-sided' as ConfidenceIntervalType
  });
  
  // Calculate sample variance (for auto-filling when dataset is generated)
  const calculateSampleVariance = (data: number[]) => {
    if (data.length <= 1) return 0;
    const mean = (basicStats?.mean || data.reduce((sum, val) => sum + val, 0) / data.length);
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (data.length - 1);
    return variance;
  };
  
  // Check if dataset is empty
  const isDatasetEmpty = dataset.length === 0 && (!basicStats || basicStats.count === 0);
  
  // Get sample statistics, prioritize passed-in statistics
  const sampleSize = basicStats?.count || dataset.length || 0;
  const sampleMean = basicStats?.mean || (dataset.length > 0 ? calculateMean(dataset) : 0);
  const sampleVariance = basicStats?.variance || (sampleSize > 1 && dataset.length > 0 ? calculateSampleVariance(dataset) : 0);
  
  // When dataset changes and distribution info is available, set parameters based on actual distribution type
  React.useEffect(() => {
    if (isGeneratedDataset && dataset.length > 0 && distributionInfo) {
      const variance = calculateSampleVariance(dataset);
      // Only assume population is normally distributed when distribution type is normal
      const isActualNormal = distributionInfo.type === 'normal';
      
      setCiOptions(prev => ({
        ...prev,
        populationVariance: variance,
        isNormal: isActualNormal,
        knownVariance: true // For generated data, we know the distribution parameters
      }));
    }
  }, [dataset, isGeneratedDataset, distributionInfo]);
  
  // Calculation result state
  const [result, setResult] = useState<{
    mean: number;
    confidenceInterval: { 
      lower: number; 
      upper: number; 
      marginOfError: number;
      method: string;
      criticalValue: number;
    };
  } | null>(null);

  const handleCalculate = () => {
    try {
      if (dataset.length === 0) {
        throw new Error('Please select or generate a dataset above first');
      }
      
      // Calculate one-sample mean confidence interval
      // Use knownVariance parameter only if it's set to true and has a valid positive value
      // If populationVariance is 0 or invalid, use unknown variance method
      const ciResult = calculateOneSampleMeanCI(
        dataset,
        ciOptions.confidenceLevel,
        ciOptions.knownVariance && ciOptions.populationVariance > 0 ? ciOptions.populationVariance : undefined,
        ciOptions.intervalType
      );
      
      setResult({
        mean: ciResult.mean,
        confidenceInterval: {
          lower: ciResult.lowerBound,
          upper: ciResult.upperBound,
          marginOfError: ciResult.marginOfError,
          method: ciResult.method,
          criticalValue: ciResult.method.includes('z-test') ? 
            (ciOptions.confidenceLevel === 0.90 ? 1.645 : 
             ciOptions.confidenceLevel === 0.95 ? 1.96 : 
             ciOptions.confidenceLevel === 0.99 ? 2.576 : 1.96) : 
            0 // We don't have the t-critical value in this function
        }
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred during calculation');
    }
  };

  // If dataset is empty, show prompt
  if (isDatasetEmpty) {
    return (
      <Box p={4}>
        <Alert status="info" mt={4}>
          <AlertIcon />
          <AlertDescription>Please upload or generate data first, then calculate confidence intervals.</AlertDescription>
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box>
      <Text fontSize="lg" mb={4}>One-Sample Mean Confidence Interval Calculation</Text>
      
      {dataset.length === 0 && (
        <Alert status="warning" mb={4}>
          <AlertIcon />
          Please select or generate a dataset in the data input and generation area above
        </Alert>
      )}
      
      <Card mb={6}>
        <CardBody>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4} mb={4}>
            <FormControl>
              <FormLabel>Confidence Level</FormLabel>
              <Select
                value={ciOptions.confidenceLevel}
                onChange={(e) => setCiOptions({ ...ciOptions, confidenceLevel: parseFloat(e.target.value) })}
              >
                <option value="0.90">90%</option>
                <option value="0.95">95%</option>
                <option value="0.99">99%</option>
                <option value="0.999">99.9%</option>
              </Select>
            </FormControl>
            
            {/* Only show manual settings when not using generated dataset */}
            {!isGeneratedDataset && (
              <>
                <FormControl>
                  <FormLabel>Population is Normally Distributed</FormLabel>
                  <Switch
                    isChecked={ciOptions.isNormal}
                    onChange={(e) => setCiOptions({ ...ciOptions, isNormal: e.target.checked })}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Known Population Variance</FormLabel>
                  <Switch
                    isChecked={ciOptions.knownVariance}
                    onChange={(e) => setCiOptions({ ...ciOptions, knownVariance: e.target.checked })}
                  />
                </FormControl>
                
                {ciOptions.knownVariance && (
                  <FormControl>
                    <FormLabel>Population Variance Value</FormLabel>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={ciOptions.populationVariance}
                      onChange={(e) => setCiOptions({ ...ciOptions, populationVariance: parseFloat(e.target.value) || 0 })}
                    />
                  </FormControl>
                )}
                
                <FormControl>
                  <FormLabel>Confidence Interval Type</FormLabel>
                  <Select
                    value={ciOptions.intervalType}
                    onChange={(e) => setCiOptions({ 
                      ...ciOptions, 
                      intervalType: e.target.value as ConfidenceIntervalType 
                    })}
                  >
                    <option value="two-sided">Two-Sided</option>
                    <option value="one-sided-lower">One-Sided Lower</option>
                    <option value="one-sided-upper">One-Sided Upper</option>
                  </Select>
                </FormControl>
              </>
            )}
            
            {/* For generated dataset, show actual distribution info */}
            {isGeneratedDataset && dataset.length > 0 && distributionInfo && (
              <FormControl>
                <FormLabel>Dataset Distribution Information</FormLabel>
                <Box p={3} bg="green.50" borderRadius="md" borderWidth={1} borderColor="green.200">
                  <Text>• Distribution Type: {distributionInfo.name}</Text>
                  <Text>• {distributionInfo.type === 'normal' ? 'Assuming population is normally distributed' : 'Using t-distribution or normal approximation based on Central Limit Theorem'}</Text>
                  <Text>• Automatically using sample variance: {ciOptions.populationVariance.toFixed(6)}</Text>
                  <Text>• Sample Size: {sampleSize}</Text>
                  <Text>• Sample Mean: {sampleMean.toFixed(4)}</Text>
                  <Text>• Sample Variance: {sampleVariance.toFixed(6)}</Text>
                  {/* Display distribution parameters */}
                  {Object.entries(distributionInfo.parameters).map(([key, value]) => (
                    <Text key={key}>• {key}: {value.toFixed(4)}</Text>
                  ))}
                </Box>
              </FormControl>
            )}
          </Grid>
          
          <Button 
            onClick={handleCalculate} 
            colorScheme="blue" 
            width="100%"
            disabled={dataset.length === 0}
          >
            Calculate Confidence Interval
          </Button>
        </CardBody>
      </Card>
      
      {result && (
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
          <Card>
            <CardBody>
              <Text fontSize="sm" color="gray.500">Sample Mean</Text>
              <Text fontSize="2xl" fontWeight="bold">{result.mean.toFixed(4)}</Text>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Text fontSize="sm" color="gray.500">CI Lower Bound</Text>
              <Text fontSize="2xl" fontWeight="bold">
                {result.confidenceInterval.lower === -Infinity ? "-∞" : result.confidenceInterval.lower.toFixed(4)}
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Text fontSize="sm" color="gray.500">CI Upper Bound</Text>
              <Text fontSize="2xl" fontWeight="bold">
                {result.confidenceInterval.upper === Infinity ? "+∞" : result.confidenceInterval.upper.toFixed(4)}
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Text fontSize="sm" color="gray.500">Interval Type</Text>
              <Text fontSize="2xl" fontWeight="bold">
                {ciOptions.intervalType}
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Text fontSize="sm" color="gray.500">Margin of Error</Text>
              <Text fontSize="2xl" fontWeight="bold">{result.confidenceInterval.marginOfError.toFixed(4)}</Text>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Text fontSize="sm" color="gray.500">Calculation Method</Text>
              <Text fontSize="lg" fontWeight="bold">{result.confidenceInterval.method}</Text>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Text fontSize="sm" color="gray.500">Critical Value</Text>
              <Text fontSize="2xl" fontWeight="bold">{result.confidenceInterval.criticalValue.toFixed(4)}</Text>
            </CardBody>
          </Card>
        </Grid>
      )}
    </Box>
  );
}

export default OneSampleMeanCI;