import { NextRequest } from 'next/server';
import { POST } from './route';

// Test data for various scenarios
const testImages = {
  goodPosture: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
  poorPosture: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
  noPerson: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
  invalidFormat: 'invalid-base64-data'
};

// Mock Vision API responses
const mockVisionResponses = {
  goodPosture: {
    responses: [{
      labelAnnotations: [
        { description: 'person', score: 0.95 },
        { description: 'human', score: 0.92 },
        { description: 'standing', score: 0.88 },
        { description: 'head', score: 0.85 },
        { description: 'shoulder', score: 0.82 },
        { description: 'spine', score: 0.80 },
        { description: 'hip', score: 0.78 }
      ],
      faceAnnotations: [{
        rollAngle: 2,
        panAngle: 5,
        tiltAngle: 3,
        detectionConfidence: 0.9
      }],
      localizedObjectAnnotations: [
        { name: 'person', score: 0.93 }
      ],
      imagePropertiesAnnotation: {
        dominantColors: {
          colors: [
            { color: { red: 150, green: 150, blue: 150 } }
          ]
        }
      }
    }]
  },
  poorPosture: {
    responses: [{
      labelAnnotations: [
        { description: 'person', score: 0.90 },
        { description: 'slouching', score: 0.85 },
        { description: 'bent', score: 0.80 },
        { description: 'head', score: 0.85 },
        { description: 'shoulder', score: 0.75 },
        { description: 'spine', score: 0.70 },
        { description: 'hip', score: 0.72 }
      ],
      faceAnnotations: [{
        rollAngle: 15,
        panAngle: 25,
        tiltAngle: 20,
        detectionConfidence: 0.8
      }],
      localizedObjectAnnotations: [
        { name: 'person', score: 0.88 }
      ],
      imagePropertiesAnnotation: {
        dominantColors: {
          colors: [
            { color: { red: 100, green: 100, blue: 100 } }
          ]
        }
      }
    }]
  },
  noPerson: {
    responses: [{
      labelAnnotations: [
        { description: 'chair', score: 0.85 },
        { description: 'table', score: 0.80 },
        { description: 'room', score: 0.75 }
      ],
      faceAnnotations: [],
      localizedObjectAnnotations: [],
      imagePropertiesAnnotation: {
        dominantColors: {
          colors: [
            { color: { red: 200, green: 200, blue: 200 } }
          ]
        }
      }
    }]
  }
};

// Unit Tests
export class PostureAnalysisTestSuite {
  
  // Test 1: Person Detection Accuracy
  async testPersonDetectionAccuracy() {
    console.log('🧪 Testing Person Detection Accuracy...');
    
    const testCases = [
      { name: 'Good Posture', image: testImages.goodPosture, expected: true },
      { name: 'Poor Posture', image: testImages.poorPosture, expected: true },
      { name: 'No Person', image: testImages.noPerson, expected: false }
    ];
    
    let passed = 0;
    let total = testCases.length;
    
    for (const testCase of testCases) {
      try {
        const request = new NextRequest('http://localhost:3000/api/posture-analysis', {
          method: 'POST',
          body: JSON.stringify({ image: testCase.image })
        });
        
        const response = await POST(request);
        const data = await response.json();
        
        const personDetected = data.success && data.analysis?.personDetected;
        
        if (personDetected === testCase.expected) {
          console.log(`✅ ${testCase.name}: PASSED`);
          passed++;
        } else {
          console.log(`❌ ${testCase.name}: FAILED - Expected ${testCase.expected}, got ${personDetected}`);
        }
      } catch (error) {
        console.log(`❌ ${testCase.name}: ERROR - ${error}`);
      }
    }
    
    const accuracy = (passed / total) * 100;
    console.log(`📊 Person Detection Accuracy: ${accuracy.toFixed(1)}% (${passed}/${total})`);
    return accuracy >= 90; // Target 90%+ accuracy
  }
  
  // Test 2: Scoring Consistency
  async testScoringConsistency() {
    console.log('🧪 Testing Scoring Consistency...');
    
    const testCases = [
      { name: 'Good Posture', image: testImages.goodPosture, expectedRange: [70, 100] },
      { name: 'Poor Posture', image: testImages.poorPosture, expectedRange: [0, 50] }
    ];
    
    let passed = 0;
    let total = testCases.length;
    
    for (const testCase of testCases) {
      try {
        const request = new NextRequest('http://localhost:3000/api/posture-analysis', {
          method: 'POST',
          body: JSON.stringify({ image: testCase.image })
        });
        
        const response = await POST(request);
        const data = await response.json();
        
        if (data.success && data.analysis?.score !== undefined) {
          const score = data.analysis.score;
          const [min, max] = testCase.expectedRange;
          
          if (score >= min && score <= max) {
            console.log(`✅ ${testCase.name}: PASSED (Score: ${score})`);
            passed++;
          } else {
            console.log(`❌ ${testCase.name}: FAILED - Score ${score} not in range [${min}, ${max}]`);
          }
        } else {
          console.log(`❌ ${testCase.name}: FAILED - No score returned`);
        }
      } catch (error) {
        console.log(`❌ ${testCase.name}: ERROR - ${error}`);
      }
    }
    
    const consistency = (passed / total) * 100;
    console.log(`📊 Scoring Consistency: ${consistency.toFixed(1)}% (${passed}/${total})`);
    return consistency >= 80; // Target 80%+ consistency
  }
  
  // Test 3: Response Time Performance
  async testResponseTimePerformance() {
    console.log('🧪 Testing Response Time Performance...');
    
    const maxResponseTime = 3000; // 3 seconds
    const testRuns = 5;
    const responseTimes: number[] = [];
    
    for (let i = 0; i < testRuns; i++) {
      try {
        const startTime = Date.now();
        
        const request = new NextRequest('http://localhost:3000/api/posture-analysis', {
          method: 'POST',
          body: JSON.stringify({ image: testImages.goodPosture })
        });
        
        const response = await POST(request);
        await response.json();
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);
        
        console.log(`⏱️ Run ${i + 1}: ${responseTime}ms`);
      } catch (error) {
        console.log(`❌ Run ${i + 1}: ERROR - ${error}`);
      }
    }
    
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxTime = Math.max(...responseTimes);
    
    console.log(`📊 Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`📊 Maximum Response Time: ${maxTime}ms`);
    
    const performancePassed = avgResponseTime <= maxResponseTime && maxTime <= maxResponseTime * 1.5;
    console.log(`📊 Performance Test: ${performancePassed ? 'PASSED' : 'FAILED'}`);
    
    return performancePassed;
  }
  
  // Test 4: Error Handling
  async testErrorHandling() {
    console.log('🧪 Testing Error Handling...');
    
    const testCases = [
      { name: 'Missing Image', body: {}, expectedError: 'MISSING_IMAGE' },
      { name: 'Invalid Image Format', body: { image: testImages.invalidFormat }, expectedError: 'IMAGE_QUALITY' },
      { name: 'Empty Request', body: null, expectedError: 'PROCESSING_ERROR' }
    ];
    
    let passed = 0;
    let total = testCases.length;
    
    for (const testCase of testCases) {
      try {
        const request = new NextRequest('http://localhost:3000/api/posture-analysis', {
          method: 'POST',
          body: testCase.body ? JSON.stringify(testCase.body) : undefined
        });
        
        const response = await POST(request);
        const data = await response.json();
        
        if (!data.success && data.errorCode?.includes(testCase.expectedError)) {
          console.log(`✅ ${testCase.name}: PASSED`);
          passed++;
        } else {
          console.log(`❌ ${testCase.name}: FAILED - Expected ${testCase.expectedError}, got ${data.errorCode}`);
        }
      } catch (error) {
        console.log(`❌ ${testCase.name}: ERROR - ${error}`);
      }
    }
    
    const errorHandlingScore = (passed / total) * 100;
    console.log(`📊 Error Handling Score: ${errorHandlingScore.toFixed(1)}% (${passed}/${total})`);
    return errorHandlingScore >= 80; // Target 80%+ error handling
  }
  
  // Test 5: Body Part Analysis
  async testBodyPartAnalysis() {
    console.log('🧪 Testing Body Part Analysis...');
    
    const testCases = [
      { name: 'Good Posture', image: testImages.goodPosture, expectedParts: ['head', 'shoulder', 'spine', 'hip'] },
      { name: 'Poor Posture', image: testImages.poorPosture, expectedParts: ['head', 'shoulder', 'spine', 'hip'] }
    ];
    
    let passed = 0;
    let total = testCases.length;
    
    for (const testCase of testCases) {
      try {
        const request = new NextRequest('http://localhost:3000/api/posture-analysis', {
          method: 'POST',
          body: JSON.stringify({ image: testCase.image })
        });
        
        const response = await POST(request);
        const data = await response.json();
        
        if (data.success && data.analysis?.detailedAnalysis) {
          const analysis = data.analysis.detailedAnalysis;
          const hasAllParts = testCase.expectedParts.every(part => 
            analysis[part] && analysis[part].score !== undefined
          );
          
          if (hasAllParts) {
            console.log(`✅ ${testCase.name}: PASSED`);
            passed++;
          } else {
            console.log(`❌ ${testCase.name}: FAILED - Missing body part analysis`);
          }
        } else {
          console.log(`❌ ${testCase.name}: FAILED - No detailed analysis returned`);
        }
      } catch (error) {
        console.log(`❌ ${testCase.name}: ERROR - ${error}`);
      }
    }
    
    const analysisScore = (passed / total) * 100;
    console.log(`📊 Body Part Analysis Score: ${analysisScore.toFixed(1)}% (${passed}/${total})`);
    return analysisScore >= 90; // Target 90%+ analysis completeness
  }
  
  // Test 6: Feedback Generation
  async testFeedbackGeneration() {
    console.log('🧪 Testing Feedback Generation...');
    
    const testCases = [
      { name: 'Good Posture', image: testImages.goodPosture, expectedFeedback: true },
      { name: 'Poor Posture', image: testImages.poorPosture, expectedFeedback: true }
    ];
    
    let passed = 0;
    let total = testCases.length;
    
    for (const testCase of testCases) {
      try {
        const request = new NextRequest('http://localhost:3000/api/posture-analysis', {
          method: 'POST',
          body: JSON.stringify({ image: testCase.image })
        });
        
        const response = await POST(request);
        const data = await response.json();
        
        if (data.success && data.analysis) {
          const hasFeedback = data.analysis.feedback && data.analysis.feedback.length > 0;
          const hasRecommendations = data.analysis.recommendations && data.analysis.recommendations.length > 0;
          
          if (hasFeedback && hasRecommendations) {
            console.log(`✅ ${testCase.name}: PASSED`);
            passed++;
          } else {
            console.log(`❌ ${testCase.name}: FAILED - Missing feedback or recommendations`);
          }
        } else {
          console.log(`❌ ${testCase.name}: FAILED - No analysis returned`);
        }
      } catch (error) {
        console.log(`❌ ${testCase.name}: ERROR - ${error}`);
      }
    }
    
    const feedbackScore = (passed / total) * 100;
    console.log(`📊 Feedback Generation Score: ${feedbackScore.toFixed(1)}% (${passed}/${total})`);
    return feedbackScore >= 95; // Target 95%+ feedback generation
  }
  
  // Run All Tests
  async runAllTests() {
    console.log('🚀 Starting Enhanced Posture Analysis Test Suite...\n');
    
    const startTime = Date.now();
    
    const results = {
      personDetection: await this.testPersonDetectionAccuracy(),
      scoringConsistency: await this.testScoringConsistency(),
      responseTime: await this.testResponseTimePerformance(),
      errorHandling: await this.testErrorHandling(),
      bodyPartAnalysis: await this.testBodyPartAnalysis(),
      feedbackGeneration: await this.testFeedbackGeneration()
    };
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log('\n📊 Test Suite Results:');
    console.log('=====================');
    console.log(`Person Detection Accuracy: ${results.personDetection ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Scoring Consistency: ${results.scoringConsistency ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Response Time Performance: ${results.responseTime ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Error Handling: ${results.errorHandling ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Body Part Analysis: ${results.bodyPartAnalysis ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Feedback Generation: ${results.feedbackGeneration ? '✅ PASSED' : '❌ FAILED'}`);
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    const overallScore = (passedTests / totalTests) * 100;
    
    console.log(`\n🎯 Overall Test Score: ${overallScore.toFixed(1)}% (${passedTests}/${totalTests})`);
    console.log(`⏱️ Total Test Time: ${totalTime}ms`);
    
    if (overallScore >= 90) {
      console.log('🏆 EXCELLENT: All critical tests passed!');
    } else if (overallScore >= 80) {
      console.log('✅ GOOD: Most tests passed, minor improvements needed');
    } else if (overallScore >= 70) {
      console.log('⚠️ FAIR: Several tests failed, significant improvements needed');
    } else {
      console.log('❌ POOR: Many tests failed, major improvements required');
    }
    
    return {
      overallScore,
      passedTests,
      totalTests,
      results,
      totalTime
    };
  }
}

// Export test suite for external use
export default PostureAnalysisTestSuite; 