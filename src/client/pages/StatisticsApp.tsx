import React, { useState, useMemo } from 'react';
import { Box, Container, Heading, Tabs, TabList, TabPanels, Tab, TabPanel, Divider, Alert, AlertIcon, Input, Button, Text, Checkbox, Stack, Textarea, Grid } from '@chakra-ui/react';
import FileUploader from '../components/FileUploader';
import DistributionGenerator from '../components/DistributionGenerator';
import ConfidenceIntervalsContainer from '../components/ConfidenceIntervalsContainer';
import BasicStatisticsTab from '../components/BasicStatisticsTab';
import MLEMoMTab from '../components/MLEMoMTab';
import HypothesisTestingTab from '../components/HypothesisTestingTab';
import SampleSizeCalculator from '../components/SampleSizeCalculator';
import { calculateMean, calculateStd, calculateMedian, calculateSkewness, calculateKurtosis } from '../utils/statistics';

// Define dataset interface
interface Dataset {
  id: string;
  name: string;
  data: number[];
  timestamp: number;
}

const StatisticsApp: React.FC = () => {
  // Dataset state management
  const [dataset1, setDataset1] = useState<number[]>([]);
  const [dataset2, setDataset2] = useState<number[]>([]);
  const [pairedData, setPairedData] = useState<{sample1: number[], sample2: number[]}>({sample1: [], sample2: []});
  
  // Data updated flag for user notification
  const [dataUpdated, setDataUpdated] = useState<boolean>(false);
  
  // Flag indicating if dataset is system generated
  const [isDatasetGenerated, setIsDatasetGenerated] = useState<boolean>(false);
  
  // Store dataset distribution information
  const [dataset1Distribution, setDataset1Distribution] = useState<{
    type: string;
    name: string;
    parameters: Record<string, number>;
  } | null>(null);
  
  // Saved datasets list
  const [savedDatasets, setSavedDatasets] = useState<Dataset[]>([]);
  
  // Dataset name input
  const [datasetName, setDatasetName] = useState<string>('');
  
  // Currently selected dataset IDs (multiple selection)
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<string[]>([]);
  
  // Direct data input
  const [directDataInput, setDirectDataInput] = useState<string>('');
  
  // Get currently selected dataset by ID
  const getSelectedDataset = (id: string): number[] => {
    const dataset = savedDatasets.find(d => d.id === id);
    return dataset ? dataset.data : [];
  };
  
  // Get all selected datasets
  const getAllSelectedDatasets = (): Dataset[] => {
    return savedDatasets.filter(d => selectedDatasetIds.includes(d.id));
  };

  // Calculate basic statistics for the currently used dataset
  const currentDataset = useMemo(() => {
    // If multiple datasets are selected, use the first one for backward compatibility
    if (selectedDatasetIds.length > 0) {
      const dataset = savedDatasets.find(d => d.id === selectedDatasetIds[0]);
      return dataset ? dataset.data : [];
    }
    return dataset1;
  }, [selectedDatasetIds, dataset1, savedDatasets]);
  
  // Calculate basic statistics
  const basicStats = useMemo(() => {
    let datasetToAnalyze: number[] = [];
    // If multiple datasets are selected, use the first one for backward compatibility
    if (selectedDatasetIds.length > 0) {
      const dataset = savedDatasets.find(d => d.id === selectedDatasetIds[0]);
      datasetToAnalyze = dataset ? dataset.data : [];
    } else {
      datasetToAnalyze = dataset1;
    }
    
    if (datasetToAnalyze.length === 0) return null;
    
    return {
      mean: calculateMean(datasetToAnalyze),
      std: calculateStd(datasetToAnalyze),
      median: calculateMedian(datasetToAnalyze),
      skewness: calculateSkewness(datasetToAnalyze),
      kurtosis: calculateKurtosis(datasetToAnalyze),
      count: datasetToAnalyze.length,
      min: Math.min(...datasetToAnalyze),
      max: Math.max(...datasetToAnalyze)
    };
  }, [selectedDatasetIds, savedDatasets, dataset1]);

  
  // Determine if data might come from normal distribution (simple heuristic based on skewness and kurtosis)
  const isLikelyNormal = useMemo(() => {
    if (!basicStats || currentDataset.length < 30) return null;
    
    // If skewness and kurtosis are within reasonable range, data might be normally distributed
    const skewnessWithinRange = Math.abs(basicStats.skewness) < 0.5;
    const kurtosisWithinRange = Math.abs(basicStats.kurtosis) < 0.5;
    
    return skewnessWithinRange && kurtosisWithinRange;
  }, [basicStats, currentDataset.length]);

  // Handle data generation event
  // Data generation handler - preserved for backward compatibility
  
  // Handle direct data input or upload (with source information)
  const handleDirectDataChange = (data: number[]) => {
    setDataset1(data);
    setDirectDataInput(data.join(', '));
    setIsDatasetGenerated(false); // Mark as user input or uploaded data
    setDataset1Distribution(null); // Clear distribution information
    setPairedData({ sample1: [], sample2: [] });
    setDataUpdated(true);
    setTimeout(() => setDataUpdated(false), 3000);
  };

  const handleDataset1Change = (data: number[], distributionInfo?: any) => {
    setDataset1(data);
    setDirectDataInput(data.join(', '));
    if (distributionInfo && distributionInfo.type && distributionInfo.parameters) {
      setDataset1Distribution({
        type: distributionInfo.type,
        name: distributionInfo.name || distributionInfo.type,
        parameters: distributionInfo.parameters as Record<string, number>
      });
      setIsDatasetGenerated(true);
    } else {
      setDataset1Distribution(null);
      setIsDatasetGenerated(false);
    }
    setDataUpdated(true);
    setTimeout(() => setDataUpdated(false), 3000);
  };

  const handleDataset2Change = (data: number[]) => {
    setDataset2(data);
    setDataUpdated(true);
    setTimeout(() => setDataUpdated(false), 3000);
  };

  const handlePairedDataChange = (sample1: number[], sample2: number[], distributionInfo?: any) => {
    setPairedData({ sample1, sample2 });
    if (distributionInfo && distributionInfo.type && distributionInfo.parameters) {
      setDataset1Distribution({
        type: distributionInfo.type,
        name: distributionInfo.name || distributionInfo.type,
        parameters: distributionInfo.parameters as Record<string, number>
      });
      setIsDatasetGenerated(true);
    }
    setDataUpdated(true);
    setTimeout(() => setDataUpdated(false), 3000);
  };

  // Paired data generation handling removed as it's not used
  
  // Handle direct data input
  const handleDirectDataInput = () => {
    try {
      // Parse data
      const dataArray = directDataInput
        .split(/[\s,]+/)
        .filter(val => val.trim() !== '')
        .map(val => parseFloat(val))
        .filter(val => !isNaN(val));
      
      if (dataArray.length === 0) {
        throw new Error('Please enter valid data');
      }
      
      handleDirectDataChange(dataArray);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error parsing data');
    }
  };
  
  // Save dataset
  const saveDataset = (data: number[], name: string) => {
    if (!name.trim()) {
      alert('Please enter dataset name');
      return;
    }
    
    const newDataset: Dataset = {
      id: `dataset_${Date.now()}`,
      name: name.trim(),
      data: [...data],
      timestamp: Date.now()
    };
    
    setSavedDatasets([...savedDatasets, newDataset]);
    setDatasetName('');
    alert('Dataset saved successfully!');
  };
  
  // Delete dataset
  const deleteDataset = (id: string) => {
    setSavedDatasets(savedDatasets.filter(dataset => dataset.id !== id));
    // If deleting currently selected dataset, remove from selection
    setSelectedDatasetIds(selectedDatasetIds.filter(selectedId => selectedId !== id));
  };
  
  // Toggle dataset selection (supports multiple selection)
  const toggleDatasetSelection = (id: string) => {
    setSelectedDatasetIds(prevSelected => {
      if (prevSelected.includes(id)) {
        // Remove from selection
        return prevSelected.filter(selectedId => selectedId !== id);
      } else {
        // Add to selection
        const newSelection = [...prevSelected, id];
        // For backward compatibility with components expecting a single dataset,
        // update dataset1 with the most recently selected dataset
        const dataset = savedDatasets.find(d => d.id === id);
        if (dataset) {
          setDataset1(dataset.data);
          setDirectDataInput(dataset.data.join(', '));
          setDataset2([]);
          setPairedData({ sample1: [], sample2: [] });
          setIsDatasetGenerated(false);
          setDataset1Distribution(null);
          setDataUpdated(true);
          setTimeout(() => setDataUpdated(false), 3000);
        }
        return newSelection;
      }
    });
  };

  return (
    <Container maxW="container.lg" py={4}>
      <Heading as="h1" size="lg" mb={4} textAlign="center">
        Statistical Analysis Tool
      </Heading>
      
      {/* Unified data input and generation area */}
      <Box 
        mb={6} 
        bg="white" 
        p={4} 
        borderRadius="lg" 
        boxShadow="0 2px 4px rgba(0,0,0,0.1)"
      >
        <Heading as="h2" size="md" mb={3} color="blue.600">
            Data Input & Generation
          </Heading>
        
        <Tabs isFitted>
          <TabList mb={3}>
            <Tab>Data Upload</Tab>
            <Tab>Data Generation</Tab>
            <Tab>History Data</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Box p={4}>
                <Heading as="h3" size="sm" mb={3} color="blue.700">
                  Direct Data Input
                </Heading>
                <Stack spacing={3} mb={6}>
                  <Textarea
                    value={directDataInput}
                    onChange={(e) => setDirectDataInput(e.target.value)}
                    placeholder="e.g., 1.2 3.4 5.6 7.8 9.0"
                    size="md"
                    height="100px"
                    resize="vertical"
                  />
                  <Button onClick={handleDirectDataInput} colorScheme="blue" width="100%">
                    Apply Data
                  </Button>
                </Stack>
                
                <Heading as="h3" size="sm" mb={3} color="blue.700">
                  CSV File Upload
                </Heading>
                <FileUploader 
                  onDataChange={(data, distributionInfo) => {
                    handleDirectDataChange(data);
                    
                    // Update distribution state if there's distribution information
                    if (distributionInfo && distributionInfo.type) {
                      setDataset1Distribution({
                        type: distributionInfo.type,
                        name: distributionInfo.name || distributionInfo.type,
                        parameters: {}
                      });
                      setIsDatasetGenerated(false);
                    } else {
                      setDataset1Distribution(null);
                      setIsDatasetGenerated(false);
                    }
                  }}
                />
              </Box>
            </TabPanel>
            <TabPanel>
              <Box p={4}>
                <Heading as="h3" size="sm" mb={3} color="blue.700">
                  Sample Generation Type
                </Heading>
                <Tabs variant="enclosed" mb={4}>
                  <TabList>
                    <Tab>Single Sample</Tab>
                    <Tab>Two Samples</Tab>
                    <Tab>Paired Samples</Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel>
                      <DistributionGenerator 
                        onDataChange={(data, distributionInfo) => {
                          handleDataset1Change(data, distributionInfo);
                        }}
                      />
                    </TabPanel>
                    <TabPanel>
                      <Stack spacing={6}>
                        <Box>
                          <Heading as="h3" size="sm" mb={3} color="blue.700">
                          Sample 1 Generation
                        </Heading>
                          <DistributionGenerator 
                            onDataChange={(data, distributionInfo) => {
                              handleDataset1Change(data, distributionInfo);
                            }}
                          />
                        </Box>
                        <Box>
                          <Heading as="h3" size="sm" mb={3} color="blue.700">
                          Sample 2 Generation
                        </Heading>
                          <DistributionGenerator 
                            onDataChange={(data) => {
                              handleDataset2Change(data);
                            }}
                          />
                        </Box>
                      </Stack>
                    </TabPanel>
                    <TabPanel>
                      <Stack spacing={6}>
                        <Box>
                          <Heading as="h3" size="sm" mb={3} color="blue.700">
                          Pre-test Data Generation
                        </Heading>
                          <DistributionGenerator 
                            onDataChange={(data, distributionInfo) => {
                              handlePairedDataChange(data, pairedData.sample2, distributionInfo);
                            }}
                          />
                        </Box>
                        <Box>
                          <Heading as="h3" size="sm" mb={3} color="blue.700">
                          Post-test Data Generation
                        </Heading>
                          <DistributionGenerator 
                            onDataChange={(data, distributionInfo) => {
                              handlePairedDataChange(pairedData.sample1, data, distributionInfo);
                            }}
                          />
                        </Box>
                      </Stack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </Box>
            </TabPanel>
            <TabPanel>
              <Stack spacing={3}>
                {/* Prompt user to save in dataset management area */}
                {dataset1.length > 0 && (
                  <Alert status="info" mb={3} size="sm">
                    <AlertIcon />
                    You can save and manage current dataset in the 'Dataset Management' section below
                  </Alert>
                )}
                
                {/* History datasets list */}
                <Box>
                  <Text fontSize="sm" mb={2} fontWeight="medium">Select History Dataset:</Text>
                  {savedDatasets.length === 0 ? (
                    <Text fontSize="sm" color="gray.500">No saved datasets yet</Text>
                  ) : (
                    <Box maxHeight="200px" overflowY="auto" borderWidth={1} borderColor="gray.200" borderRadius="lg">
                      {savedDatasets.map(dataset => (
                        <Box 
                          key={dataset.id} 
                          p={2} 
                          borderBottomWidth={1} 
                          borderBottomColor="gray.100"
                          _hover={{ bg: "gray.50" }}
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Checkbox
                              isChecked={selectedDatasetIds.includes(dataset.id)}
                              onChange={() => toggleDatasetSelection(dataset.id)}
                              mr={2}
                            />
                            <div>
                              <Text fontSize="sm" fontWeight="medium">{dataset.name}</Text>
                              <Text fontSize="xs" color="gray.500">{dataset.data.length} observations</Text>
                            </div>
                          </div>
                          <Button 
                            size="xs" 
                            colorScheme="red" 
                            onClick={() => deleteDataset(dataset.id)}
                          >
                            Delete
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Stack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
      
      <Divider my={4} />
      
      {/* Dataset Management Section - Moved before analysis section */}
      <Box 
        bg="white" 
        p={4} 
        borderRadius="lg" 
        boxShadow="0 2px 4px rgba(0,0,0,0.1)"
        mb={4}
      >
        <Heading as="h2" size="md" mb={3} color="blue.600">
          Dataset Management
        </Heading>
        
        {/* Data Update Notification */}
        {dataUpdated && (
          <Alert status="success" mb={4} size="sm">
            <AlertIcon />
            Data has been updated. You can start analysis or save
          </Alert>
        )}
        
        {/* Save Current Dataset Function */}
        {dataset1.length > 0 && (
          <Box mb={4} p={3} borderWidth={1} borderColor="blue.200" borderRadius="lg" bg="blue.50">
            <Text fontSize="sm" fontWeight="medium" mb={2}>Save current generated dataset:</Text>
            <Stack direction="row" gap={2}>
              <Input 
                value={datasetName} 
                onChange={(e) => setDatasetName(e.target.value)} 
                placeholder="Enter dataset name" 
                size="md"
                flex={1}
              />
              <Button 
                colorScheme="blue" 
                onClick={() => saveDataset(dataset1, datasetName || `Dataset_${new Date().toLocaleTimeString()}`)}
              >
                Save Dataset
              </Button>
            </Stack>
          </Box>
        )}
        
        {/* Saved Datasets List and Selection Function */}
        {savedDatasets.length > 0 && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>Select dataset for analysis:</Text>
            <Box maxHeight={200} overflowY="auto" borderWidth={1} borderColor="gray.200" borderRadius="lg">
              {savedDatasets.map(dataset => (
                <Box 
                  key={dataset.id} 
                  p={2} 
                  borderBottomWidth={1} 
                  borderBottomColor="gray.100"
                  _hover={{ bg: "gray.50" }}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Checkbox
                              isChecked={selectedDatasetIds.includes(dataset.id)}
                              onChange={() => toggleDatasetSelection(dataset.id)}
                              mr={2}
                            />
                    <div>
                      <Text fontSize="sm" fontWeight="medium">{dataset.name}</Text>
                      <Text fontSize="xs" color="gray.500">{dataset.data.length} observations · {new Date(dataset.timestamp).toLocaleString()}</Text>
                    </div>
                  </div>
                  <Button 
                    size="xs" 
                    colorScheme="red" 
                    onClick={() => deleteDataset(dataset.id)}
                  >
                    Delete
                  </Button>
                </Box>
              ))}
            </Box>
          </Box>
        )}
        
        {/* Currently Selected Datasets Information */}
        {selectedDatasetIds.length > 0 && (
          <Box mt={3} p={3} borderWidth={1} borderColor="green.200" borderRadius="lg" bg="green.50">
            <Text fontSize="sm" fontWeight="medium">Currently selected datasets:</Text>
            {selectedDatasetIds.map(id => {
              const dataset = savedDatasets.find(d => d.id === id);
              return dataset ? (
                <Text key={id} fontSize="sm">
                  {dataset.name} ({dataset.data.length} data points)
                </Text>
              ) : null;
            })}
            <Button 
              size="sm" 
              colorScheme="blue" 
              mt={2}
              onClick={() => setSelectedDatasetIds([])}
            >
              Clear Selection
            </Button>
          </Box>
        )}
        
        {savedDatasets.length === 0 && (
          <Alert status="info" mb={4} size="sm">
            <AlertIcon />
            No saved datasets yet. Generate data to save
          </Alert>
        )}
      </Box>
      
      {/* Analysis Section */}
      <Box 
        bg="white" 
        p={4} 
        borderRadius="lg" 
        boxShadow="0 2px 4px rgba(0,0,0,0.1)"
      >
        <Heading as="h2" size="md" mb={3} color="blue.600">
          Statistical Analysis
        </Heading>
        
        {/* Display Current Dataset Information and Basic Statistics */}
        {(currentDataset.length > 0) && (
          <Box mb={4} p={3} borderWidth={1} borderColor="green.200" borderRadius="lg" bg="green.50">
            <Text fontSize="sm" fontWeight="medium">Currently using dataset:</Text>
            {selectedDatasetIds.length > 0 ? (
              selectedDatasetIds.map(id => {
                const dataset = savedDatasets.find(d => d.id === id);
                return dataset ? (
                  <Text key={id} fontSize="sm">Name: {dataset.name}</Text>
                ) : null;
              })
            ) : null}
            
            {basicStats && (
              <Box mt={2}>
                <Grid gridTemplateColumns="repeat(2, 1fr)" gap={2}>
                  <Text fontSize="sm">Count: {basicStats.count}</Text>
                  <Text fontSize="sm">Mean: {basicStats.mean.toFixed(4)}</Text>
                  <Text fontSize="sm">Standard Deviation: {basicStats.std.toFixed(4)}</Text>
                  <Text fontSize="sm">Median: {basicStats.median.toFixed(4)}</Text>
                  <Text fontSize="sm">Minimum: {basicStats.min.toFixed(4)}</Text>
                  <Text fontSize="sm">Maximum: {basicStats.max.toFixed(4)}</Text>
                  {basicStats.count >= 30 && (
                    <>
                      <Text fontSize="sm">Skewness: {basicStats.skewness.toFixed(4)}</Text>
                      <Text fontSize="sm">Kurtosis: {basicStats.kurtosis.toFixed(4)}</Text>
                    </>
                  )}
                </Grid>
                
                {/* Data Distribution Hint */}
                {!isDatasetGenerated && !dataset1Distribution && isLikelyNormal !== null && (
                  <Text fontSize="sm" mt={2} color={isLikelyNormal ? "blue.600" : "orange.600"}>
                    Data Distribution Hint: {isLikelyNormal 
                      ? "Data likely follows normal distribution, parametric methods can be considered for statistical analysis"
                      : "Data may not follow normal distribution, distribution testing or non-parametric methods are recommended"
                    }
                  </Text>
                )}
              </Box>
            )}
          </Box>
        )}
        
        {/* Tabs for different analysis functions */}
        <Tabs isFitted variant="enclosed">
          <TabList mb={4}>
            <Tab>Basic Statistics</Tab>
            <Tab>Confidence Intervals</Tab>
            <Tab>MLE & MOM</Tab>
            <Tab>Hypothesis Testing</Tab>
            <Tab>Sample Size Calculation</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <BasicStatisticsTab 
                dataset={selectedDatasetIds.length > 0 ? getSelectedDataset(selectedDatasetIds[0]) : dataset1}
                basicStats={basicStats}
              />
            </TabPanel>
            <TabPanel>
              <ConfidenceIntervalsContainer 
                dataset={currentDataset}
                dataset2={dataset2}
                pairedData={pairedData ? {before: pairedData.sample1, after: pairedData.sample2} : undefined}
                isGeneratedDataset={selectedDatasetIds.length === 0 && isDatasetGenerated}
                distributionInfo={selectedDatasetIds.length === 0 && isDatasetGenerated && dataset1Distribution ? dataset1Distribution : undefined}
                basicStats={basicStats}
              />
            </TabPanel>
            <TabPanel>
              <MLEMoMTab 
                dataset={currentDataset}
                distribution={selectedDatasetIds.length === 0 ? dataset1Distribution : null}
                isGeneratedDataset={selectedDatasetIds.length === 0}
                basicStats={basicStats}
              />
            </TabPanel>
            <TabPanel>
              <HypothesisTestingTab 
                dataset={currentDataset}
                dataset2={dataset2}
                pairedData={pairedData && pairedData.sample1.length > 0 && pairedData.sample2.length > 0 ? {before: pairedData.sample1, after: pairedData.sample2} : undefined}
                isGeneratedDataset={selectedDatasetIds.length === 0}
                distributionInfo={dataset1Distribution}
                basicStats={basicStats}
              />
            </TabPanel>
            <TabPanel>
              <SampleSizeCalculator 
                basicStats={basicStats}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
      
      {/* If no dataset, display hint */}
      {dataset1.length === 0 && (
        <Alert status="info" mb={4} size="sm">
          <AlertIcon />
          Please generate data first using the data generator above
        </Alert>
      )}
    </Container>
  );
};

export default StatisticsApp;