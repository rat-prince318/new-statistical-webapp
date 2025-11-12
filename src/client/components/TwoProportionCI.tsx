import { useState } from 'react';
import { Box, Text, Input, Button, VStack, HStack, Card, CardBody, Table, Tr, Th, Td, Alert, Select, RadioGroup, Radio, Stack } from '@chakra-ui/react';
import { calculateTwoProportionConfidenceInterval, ConfidenceIntervalType } from '../utils/statistics';

function TwoProportionCI() {
  const [successes1, setSuccesses1] = useState<string>('');
  const [trials1, setTrials1] = useState<string>('');
  const [successes2, setSuccesses2] = useState<string>('');
  const [trials2, setTrials2] = useState<string>('');
  const [confidenceLevel, setConfidenceLevel] = useState<number>(0.95);
  const [method, setMethod] = useState<'wald' | 'continuity'>('wald');
  const [intervalType, setIntervalType] = useState<ConfidenceIntervalType>('two-sided');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleCalculate = () => {
    try {
      setError('');
      
      const s1 = parseInt(successes1, 10);
      const t1 = parseInt(trials1, 10);
      const s2 = parseInt(successes2, 10);
      const t2 = parseInt(trials2, 10);
      const confidence = confidenceLevel;

      // Parameter validation
      if (isNaN(s1) || isNaN(t1) || isNaN(s2) || isNaN(t2)) {
        throw new Error('Please enter valid integers');
      }

      if (t1 <= 0 || t2 <= 0) {
        throw new Error('Number of trials must be greater than 0');
      }

      if (s1 < 0 || s1 > t1 || s2 < 0 || s2 > t2) {
        throw new Error('Number of successes must be between 0 and number of trials');
      }

      const ciResult = calculateTwoProportionConfidenceInterval(
        s1,
        t1,
        s2,
        t2,
        confidence,
        { method, intervalType }
      );

      setResult(ciResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error');
      setResult(null);
    }
  };

  return (
    <Card>
      <CardBody>
        <Text fontSize="xl" fontWeight="bold" mb={6} textAlign="center">
          Two-Proportion Difference Confidence Interval
        </Text>

        {error && (
          <Alert status="error" mb={4}>
            {error}
          </Alert>
        )}

        <VStack spacing={4} align="stretch">
          <Box p={4} borderWidth={1} borderRadius="lg">
            <Text fontWeight="medium" mb={4}>First Group Sample</Text>
            <HStack spacing={4}>
              <Box flex={1}>
                <Text fontSize="sm" mb={1}>Number of Successes</Text>
                <Input
                  value={successes1}
                  onChange={(e) => setSuccesses1(e.target.value)}
                  placeholder="Example: 45"
                  type="number"
                  min="0"
                  size="lg"
                />
              </Box>
              <Box flex={1}>
                <Text fontSize="sm" mb={1}>Total Number of Trials</Text>
                <Input
                  value={trials1}
                  onChange={(e) => setTrials1(e.target.value)}
                  placeholder="Example: 100"
                  type="number"
                  min="1"
                  size="lg"
                />
              </Box>
            </HStack>
          </Box>

          <Box p={4} borderWidth={1} borderRadius="lg">
            <Text fontWeight="medium" mb={4}>Second Group Sample</Text>
            <HStack spacing={4}>
              <Box flex={1}>
                <Text fontSize="sm" mb={1}>Number of Successes</Text>
                <Input
                  value={successes2}
                  onChange={(e) => setSuccesses2(e.target.value)}
                  placeholder="Example: 60"
                  type="number"
                  min="0"
                  size="lg"
                />
              </Box>
              <Box flex={1}>
                <Text fontSize="sm" mb={1}>Total Number of Trials</Text>
                <Input
                  value={trials2}
                  onChange={(e) => setTrials2(e.target.value)}
                  placeholder="Example: 100"
                  type="number"
                  min="1"
                  size="lg"
                />
              </Box>
            </HStack>
          </Box>

          <HStack spacing={4}>
            <Box flex={1}>
              <Text fontWeight="medium" mb={2}>Confidence Level</Text>
              <Select
                value={confidenceLevel.toString()}
                onChange={(e) => setConfidenceLevel(parseFloat(e.target.value))}
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
                <option value="two-sided">Two-Sided</option>
                <option value="one-sided-lower">One-Sided Lower</option>
                <option value="one-sided-upper">One-Sided Upper</option>
              </Select>
            </Box>
          </HStack>
          <HStack spacing={4} mt={4}>
            <Box flex={1}>
              <Text fontWeight="medium" mb={2}>Calculation Method</Text>
              <RadioGroup value={method} onChange={(v) => setMethod(v as 'wald' | 'continuity')}>
                <Stack direction="row">
                  <Radio value="wald">Wald Interval</Radio>
                  <Radio value="continuity">Continuity Correction</Radio>
                </Stack>
              </RadioGroup>
            </Box>
          </HStack>

          <Button onClick={handleCalculate} colorScheme="blue" size="lg">
            Calculate Confidence Interval
          </Button>
        </VStack>

        {result && (
          <Box mt={6} p={4} borderWidth={1} borderRadius="lg" bg="gray.50">
            <Text fontSize="lg" fontWeight="bold" mb={4}>Calculation Results</Text>
            
            <Table variant="simple">
              <tbody>
                <Tr>
                  <Th>Statistic</Th>
                  <Th>Value</Th>
                </Tr>
                <Tr>
                  <Th>Calculation Method</Th>
                  <Td>{result.method}</Td>
                </Tr>
                <Tr>
                  <Th>First Group Proportion</Th>
                  <Td>{(result.proportion1 * 100).toFixed(2)}%</Td>
                </Tr>
                <Tr>
                  <Th>Second Group Proportion</Th>
                  <Td>{(result.proportion2 * 100).toFixed(2)}%</Td>
                </Tr>
                <Tr>
                  <Th>Proportion Difference</Th>
                  <Td>{(result.proportionDiff * 100).toFixed(2)}%</Td>
                </Tr>
                <Tr>
                  <Th>Critical Value</Th>
                  <Td>{result.criticalValue.toFixed(4)}</Td>
                </Tr>
                <Tr>
                  <Th>Margin of Error</Th>
                  <Td>{(result.marginOfError * 100).toFixed(2)}%</Td>
                </Tr>
                <Tr>
                  <Th>Confidence Interval</Th>
                  <Td>
                    {result.intervalType === 'one-sided-lower'
                      ? `[${(result.lower * 100).toFixed(2)}%, +∞)`
                      : result.intervalType === 'one-sided-upper'
                        ? `(-∞, ${(result.upper * 100).toFixed(2)}%]`
                        : `[${(result.lower * 100).toFixed(2)}%, ${(result.upper * 100).toFixed(2)}%]`
                    }
                  </Td>
                </Tr>
              </tbody>
            </Table>

            <Box mt={4} p={3} bg="blue.50" borderRadius="lg">
              <Text fontWeight="medium">Result Interpretation</Text>
              <Text mt={1} fontSize="sm">
                {result.intervalType === 'one-sided-lower'
                  ? `We are ${confidenceLevel * 100}% confident that the difference between the two population proportions is at least ${(result.lower * 100).toFixed(2)}%.`
                  : result.intervalType === 'one-sided-upper'
                    ? `We are ${confidenceLevel * 100}% confident that the difference between the two population proportions is at most ${(result.upper * 100).toFixed(2)}%.`
                    : `We are ${confidenceLevel * 100}% confident that the difference between the two population proportions lies between [${(result.lower * 100).toFixed(2)}%, ${(result.upper * 100).toFixed(2)}%].`
                }
                {result.lower > 0 && " This indicates that the proportion in the first population is significantly higher than in the second population."}
                {result.upper < 0 && " This indicates that the proportion in the first population is significantly lower than in the second population."}
                {result.intervalType === 'two-sided' && result.lower <= 0 && result.upper >= 0 && " The two population proportions may not be significantly different."}
              </Text>
            </Box>
          </Box>
        )}
      </CardBody>
    </Card>
  );
}

export default TwoProportionCI;