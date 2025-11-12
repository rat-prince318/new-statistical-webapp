import { useState, useEffect } from 'react';
import { Box, Text, Button, VStack, HStack, Card, CardBody, Table, Tr, Th, Td, Alert, Select, Textarea, Switch, FormControl, FormLabel } from '@chakra-ui/react';
import { calculateTwoSampleConfidenceInterval, ConfidenceIntervalType, getZCriticalValue } from '../utils/statistics';

interface PairedMeanCIProps {
  pairedData?: { before: number[]; after: number[] };
}

function PairedMeanCI({ pairedData = { before: [], after: [] } }: PairedMeanCIProps) {
  const [beforeData, setBeforeData] = useState<string>('');
  const [afterData, setAfterData] = useState<string>('');
  const [confidenceLevel, setConfidenceLevel] = useState<string>('0.95');
  const [intervalType, setIntervalType] = useState<ConfidenceIntervalType>('two-sided');
  const [knownVariance, setKnownVariance] = useState<boolean>(false);
  const [populationVariance, setPopulationVariance] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (pairedData && pairedData.before && pairedData.after && pairedData.before.length > 0 && pairedData.after.length > 0) {
      setBeforeData(pairedData.before.join(', '));
      setAfterData(pairedData.after.join(', '));
    }
  }, [pairedData]);

  const parseData = (dataStr: string): number[] => {
    return dataStr
      .split(/[,\s]+/)
      .filter(s => s.trim() !== '')
      .map(s => {
        const num = parseFloat(s);
        if (isNaN(num)) throw new Error('Invalid data format, please enter numbers');
        return num;
      });
  };

  const handleCalculate = () => {
    try {
      setError('');
      const before = parseData(beforeData);
      const after = parseData(afterData);
      const confidence = parseFloat(confidenceLevel);

      if (before.length === 0 || after.length === 0) {
        throw new Error('Data cannot be empty');
      }

      if (before.length !== after.length) {
        throw new Error('Before and after datasets must have the same length');
      }

      // 验证已知方差的有效性
      if (knownVariance) {
        const variance = parseFloat(populationVariance);
        if (isNaN(variance) || variance <= 0) {
          throw new Error('Population variance must be a positive number');
        }
        
        // 计算差值
        const differences = before.map((x, i) => x - after[i]);
        const meanDiff = differences.reduce((sum, val) => sum + val, 0) / differences.length;
        const standardError = Math.sqrt(variance) / Math.sqrt(differences.length);
        
        // 根据置信区间类型计算临界值
        let criticalValue: number;
        if (intervalType === 'two-sided') {
          criticalValue = getZCriticalValue(confidence);
        } else {
          criticalValue = getZCriticalValue(2 * confidence - 1);
        }
        
        const marginOfError = criticalValue * standardError;
        
        // 根据区间类型计算置信区间
        let lower: number;
        let upper: number;
        
        if (intervalType === 'two-sided') {
          lower = meanDiff - marginOfError;
          upper = meanDiff + marginOfError;
        } else if (intervalType === 'one-sided-lower') {
          lower = -Infinity;
          upper = meanDiff + marginOfError;
        } else { // one-sided-upper
          lower = meanDiff - marginOfError;
          upper = Infinity;
        }
        
        setResult({
          lower,
          upper,
          marginOfError,
          method: '配对样本Z检验（方差已知）',
          criticalValue,
          meanDiff,
          intervalType
        });
      } else {
        // 使用t检验（方差未知）
        const ciResult = calculateTwoSampleConfidenceInterval(
          before,
          after,
          confidence,
          { method: 'paired', intervalType }
        );
        
        // 添加intervalType到结果中
        setResult({ ...ciResult, intervalType });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error');
      setResult(null);
    }
  };

  const differences = result ? beforeData.split(/[,\s]+/).map((_, i) => {
    const before = parseFloat(beforeData.split(/[,\s]+/)[i]);
    const after = parseFloat(afterData.split(/[,\s]+/)[i]);
    return before - after;
  }).filter(n => !isNaN(n)) : [];

  return (
    <Card>
      <CardBody>
        <Text fontSize="xl" fontWeight="bold" mb={6} textAlign="center">
          Paired Samples Mean Difference Confidence Interval
        </Text>

        {error && (
          <Alert status="error" mb={4}>
            {error}
          </Alert>
        )}

        <VStack spacing={4} align="stretch">
          <Box>
            <Text fontWeight="medium" mb={2}>Pre-test Data (comma or space separated)</Text>
            <Textarea
              value={beforeData}
              onChange={(e) => setBeforeData(e.target.value)}
              placeholder="Example: 10.2, 11.5, 9.8, 12.1"
              size="lg"
              rows={3}
            />
          </Box>

          <Box>
            <Text fontWeight="medium" mb={2}>Post-test Data (comma or space separated)</Text>
            <Textarea
              value={afterData}
              onChange={(e) => setAfterData(e.target.value)}
              placeholder="Example: 12.5, 13.2, 11.8, 14.2"
              size="lg"
              rows={3}
            />
          </Box>

          <HStack>
            <Box flex={1}>
              <Text fontWeight="medium" mb={2}>Confidence Level</Text>
              <Select
                value={confidenceLevel}
                onChange={(e) => setConfidenceLevel(e.target.value)}
                size="lg"
              >
                <option value="0.90">90%</option>
                <option value="0.95">95%</option>
                <option value="0.99">99%</option>
                <option value="0.999">99.9%</option>
              </Select>
            </Box>
            <Box flex={1}>
              <Text fontWeight="medium" mb={2}>Confidence Interval Type</Text>
              <Select
                value={intervalType}
                onChange={(e) => setIntervalType(e.target.value as ConfidenceIntervalType)}
                size="lg"
              >
                <option value="two-sided">Two-sided</option>
                <option value="one-sided-lower">One-sided (lower bound)</option>
                <option value="one-sided-upper">One-sided (upper bound)</option>
              </Select>
            </Box>
          </HStack>
          
          <HStack mt={4}>
            <FormControl>
              <FormLabel>Known Population Variance</FormLabel>
              <Switch
                isChecked={knownVariance}
                onChange={(e) => setKnownVariance(e.target.checked)}
              />
            </FormControl>
            
            {knownVariance && (
              <Box flex={1} ml={4}>
                <Text fontWeight="medium" mb={2}>Population Variance Value</Text>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={populationVariance}
                  onChange={(e) => setPopulationVariance(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #cbd5e1',
                    fontSize: '1rem'
                  }}
                  placeholder="Enter population variance"
                />
              </Box>
            )}
            
            <Button onClick={handleCalculate} colorScheme="blue" size="lg" ml={4}>
              Calculate Confidence Interval
            </Button>
          </HStack>
        </VStack>

        {result && (
          <Box mt={6} p={4} borderWidth={1} borderRadius="lg" bg="gray.50">
            <Text fontSize="lg" fontWeight="bold" mb={4}>Calculation Results</Text>
            
            <Table variant="simple" mb={4}>
              <tbody>
                <Tr>
                  <Th>Statistic</Th>
                  <Td>{result.method}</Td>
                </Tr>
                <Tr>
                  <Th>Mean Difference</Th>
                  <Td>{result.meanDiff.toFixed(4)}</Td>
                </Tr>
                <Tr>
                  <Th>Critical Value</Th>
                  <Td>{result.criticalValue.toFixed(4)}</Td>
                </Tr>
                <Tr>
                  <Th>Margin of Error</Th>
                  <Td>{result.marginOfError.toFixed(4)}</Td>
                </Tr>
                <Tr>
                  <Th>Confidence Interval</Th>
                  <Td>
                    {result.intervalType === 'one-sided-lower'
                      ? `[${result.lower.toFixed(4)}, +∞)`
                      : result.intervalType === 'one-sided-upper'
                        ? `(-∞, ${result.upper.toFixed(4)}]`
                        : `[${result.lower.toFixed(4)}, ${result.upper.toFixed(4)}]`
                    }
                  </Td>
                </Tr>
              </tbody>
            </Table>

            <Box mt={4}>
              <Text fontSize="sm">
                {result.intervalType === 'one-sided-lower'
                  ? `We are ${parseFloat(confidenceLevel) * 100}% confident that the true mean difference is at least ${result.lower.toFixed(4)}.`
                  : result.intervalType === 'one-sided-upper'
                    ? `We are ${parseFloat(confidenceLevel) * 100}% confident that the true mean difference is at most ${result.upper.toFixed(4)}.`
                    : `We are ${parseFloat(confidenceLevel) * 100}% confident that the true mean difference lies between [${result.lower.toFixed(4)}, ${result.upper.toFixed(4)}].`
                }
              </Text>
            </Box>
            
            {differences.length > 0 && (
              <Box mt={4}>
                <Text fontWeight="medium" mb={2}>Difference Data Statistics</Text>
                <Table variant="simple">
                  <thead>
                    <Tr>
                      <Th>Index</Th>
                      <Th>Pre-test Value</Th>
                      <Th>Post-test Value</Th>
                      <Th>Difference</Th>
                    </Tr>
                  </thead>
                  <tbody>
                    {differences.slice(0, 10).map((diff, i) => (
                      <Tr key={i}>
                        <Td>{i + 1}</Td>
                        <Td>{parseFloat(beforeData.split(/[,\s]+/)[i]).toFixed(2)}</Td>
                        <Td>{parseFloat(afterData.split(/[,\s]+/)[i]).toFixed(2)}</Td>
                        <Td>{diff.toFixed(2)}</Td>
                      </Tr>
                    ))}
                    {differences.length > 10 && (
                      <Tr>
                        <Td colSpan={4} textAlign="center">...</Td>
                      </Tr>
                    )}
                  </tbody>
                </Table>
              </Box>
            )}
          </Box>
        )}
      </CardBody>
    </Card>
  );
}

export default PairedMeanCI;