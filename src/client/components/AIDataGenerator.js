import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button, Box, Text, VStack, Alert, AlertIcon, AlertDescription, Textarea, Input } from '@chakra-ui/react';
function AIDataGenerator(_a) {
    var onDataChange = _a.onDataChange;
    var _b = useState(1000), sampleSize = _b[0], setSampleSize = _b[1];
    var _c = useState('Generate random data following normal distribution'), dataDescription = _c[0], setDataDescription = _c[1];
    var _d = useState(false), isGenerating = _d[0], setIsGenerating = _d[1];
    var _e = useState(''), errorMessage = _e[0], setErrorMessage = _e[1];
    var handleGenerate = function () {
        if (!dataDescription.trim()) {
            setErrorMessage('Please enter data description');
            return;
        }
        setIsGenerating(true);
        setErrorMessage('');
        
        // Use safe sample size (minimum 1 if empty/0)
        var safeSampleSize = sampleSize === 0 || sampleSize === '' || sampleSize === null || sampleSize === undefined ? 1 : sampleSize;
        
        // Simulate AI data generation process
        // Note: In a real application, this should call an actual AI API
        setTimeout(function () {
            try {
                // Since there's no actual AI API, we'll generate mock data based on description
                var data = generateMockDataBasedOnDescription(dataDescription, safeSampleSize);
                onDataChange(data, {
                    type: 'ai',
                    name: 'AI Generated Data',
                    parameters: {
                        sampleSize: safeSampleSize,
                        // Convert description to string length as numeric parameter to avoid type errors
                        descriptionLength: dataDescription.length
                    }
                });
            } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : 'An error occurred while generating data');
            } finally {
                setIsGenerating(false);
            }
        }, 2000); // Simulate 2 seconds generation time
    };
    var generateMockDataBasedOnDescription = function (description, size) {
        var data = [];
        var lowerCaseDescription = description.toLowerCase();
        // Generate data according to keywords in the description
        if (lowerCaseDescription.includes('normal')) {
            // Normal distribution data
            var mean = 0;
            var std = 1;
            for (var i = 0; i < size; i++) {
                var u1 = Math.random();
                var u2 = Math.random();
                var z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                data.push(mean + std * z);
            }
        }
        else if (lowerCaseDescription.includes('uniform')) {
            // Uniform distribution data
            var a = 0;
            var b = 1;
            for (var i = 0; i < size; i++) {
                data.push(a + Math.random() * (b - a));
            }
        }
        else if (lowerCaseDescription.includes('exponential')) {
            // Exponential distribution data
            var lambda = 1;
            for (var i = 0; i < size; i++) {
                data.push(-Math.log(Math.random()) / lambda);
            }
        }
        else if (lowerCaseDescription.includes('binomial')) {
            // Binomial distribution data
            var n = 10;
            var p = 0.5;
            for (var i = 0; i < size; i++) {
                var successes = 0;
                for (var j = 0; j < n; j++) {
                    if (Math.random() < p) {
                        successes++;
                    }
                }
                data.push(successes);
            }
        }
        else {
            // Default to normal distribution data
            var mean = 0;
            var std = 1;
            for (var i = 0; i < size; i++) {
                var u1 = Math.random();
                var u2 = Math.random();
                var z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                data.push(mean + std * z);
            }
        }
        return data;
    };
    return (_jsx(Box, { p: 4, children: _jsxs(VStack, { align: "stretch", spacing: 4, children: [_jsxs(Box, { children: [_jsx(Text, { mb: 2, fontWeight: "bold", children: "Data Description" }), _jsx(Textarea, { value: dataDescription, onChange: function (e) { return setDataDescription(e.target.value); }, placeholder: "Describe the data features you want to generate, e.g., Generate random data following normal distribution", rows: 4 })] }), _jsxs(Box, { children: [_jsx(Text, { mb: 2, fontWeight: "bold", children: "Sample Size" }), _jsx(Input, { type: "number", value: sampleSize || '', onChange: function (e) { var val = e.target.value === '' ? '' : parseInt(e.target.value); if (val === '' || !isNaN(val)) { setSampleSize(val === '' ? 0 : val); } } })] }), _jsx(Button, { onClick: handleGenerate, colorScheme: "blue", variant: "solid", size: "lg", isLoading: isGenerating, loadingText: "Generating...", children: "Generate Data with AI" }), errorMessage && (_jsxs(Alert, { status: "error", children: [_jsx(AlertIcon, {}), _jsx(AlertDescription, { children: errorMessage })] })), _jsxs(Box, { mt: 6, p: 4, bg: "gray.50", borderRadius: "md", children: [_jsx(Text, { fontWeight: "bold", mb: 2, children: "Instructions:" }), _jsxs("ul", { style: { listStyleType: 'disc', paddingLeft: '20px' }, children: [_jsx("li", { style: { fontSize: 'sm', marginBottom: '4px' }, children: "Describe the data features you want to generate in the text box" }), _jsx("li", { style: { fontSize: 'sm', marginBottom: '4px' }, children: "Adjust the sample size" }), _jsx("li", { style: { fontSize: 'sm', marginBottom: '4px' }, children: "Click the \"Generate Data with AI\" button" }), _jsx("li", { style: { fontSize: 'sm', marginBottom: '4px' }, children: "Wait for the AI to generate data matching your description" })] }), _jsx(Text, { mt: 4, fontWeight: "bold", mb: 2, children: "Example Descriptions:" }), _jsxs("ul", { style: { listStyleType: 'none', paddingLeft: '0' }, children: [_jsx("li", { style: { fontSize: 'sm', marginBottom: '4px' }, children: "\u2022 Generate random data following normal distribution" }), _jsx("li", { style: { fontSize: 'sm', marginBottom: '4px' }, children: "\u2022 Generate uniformly distributed data between 0 and 1" }), _jsx("li", { style: { fontSize: 'sm', marginBottom: '4px' }, children: "\u2022 Generate exponentially distributed waiting time data" })] })] })] }) }));
}
export default AIDataGenerator;
