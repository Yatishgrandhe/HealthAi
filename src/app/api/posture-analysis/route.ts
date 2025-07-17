import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from @/utils/apiConfig;
interface PostureAnalysis[object Object]
  score: number;
  status:good | fairpoor";
  feedback: string[];
  recommendations: string[];
  confidence: number;
  personDetected: boolean;
  faceDetected: boolean;
  detailedAnalysis?:[object Object] headNeck: { score: number; issues: string[] };
    shoulders: { score: number; issues: string    spine: { score: number; issues: string[] };
    hips: { score: number; issues: string };
    overall: { score: number; issues: string[] };
  };
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message:Posture analysis API is running",
    config: [object Object]     hasApiKey: !!API_CONFIG.CLOUD_VISION.API_KEY,
      features:LABEL_DETECTION,FACE_DETECTION', 'OBJECT_LOCALIZATION', 'SAFE_SEARCH_DETECTION',IMAGE_PROPERTIES] }
  });
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { success: false, error: No image provided" },
        { status: 400}
      );
    }

    if (!API_CONFIG.CLOUD_VISION.API_KEY) {
      console.error('Cloud Vision API key not configured');
      return NextResponse.json(
        { success: false, error:Cloud Vision API key not configured" },
        { status: 500}
      );
    }

    console.log(Starting advanced posture analysis with enhanced person detection...');

    // Enhanced Cloud Vision API request with comprehensive features
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1mages:annotate?key=${API_CONFIG.CLOUD_VISION.API_KEY}`,
     [object Object]
        method: 'POST,
        headers: {
         Content-Type':application/json',
        },
        body: JSON.stringify({
          requests: [
         [object Object]             image:[object Object]           content: image
              },
              features:[object Object]
                  type: 'LABEL_DETECTION',
                  maxResults: 50               },
[object Object]
                  type: FACE_DETECTION
                  maxResults: 10               },
[object Object]
                  type: 'OBJECT_LOCALIZATION',
                  maxResults: 20               },
[object Object]
                  type: 'SAFE_SEARCH_DETECTION',
                  maxResults:1               },
[object Object]
                  type:IMAGE_PROPERTIES',
                  maxResults:1               },
[object Object]
                  type: TEXT_DETECTION
                  maxResults:1                }
              ]
            }
          ]
        })
      }
    );

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('Vision API error:', visionResponse.status, errorText);
      throw new Error(`Vision API error: ${visionResponse.status} - ${errorText}`);
    }

    const visionData = await visionResponse.json();
    console.log('Vision API response received successfully');
    
    // Advanced posture analysis with enhanced person detection
    const analysis = performAdvancedPostureAnalysis(visionData);

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error: any) {
    console.error('Posture analysis error:', error);
    return NextResponse.json(
      [object Object] 
        success: false, 
        error: error.message || Failedto analyze posture' 
      },
    [object Object] status:500);
  }
}

function performAdvancedPostureAnalysis(visionData: any): PostureAnalysis {
  try [object Object]    const labels = visionData.responses?.[0]?.labelAnnotations || [];
    const faces = visionData.responses?.[0]?.faceAnnotations || [];
    const objects = visionData.responses?.[0]?.localizedObjectAnnotations || [];
    const imageProperties = visionData.responses?.[0]?.imagePropertiesAnnotation;

    console.log('Advanced Vision API Response:, {    labels: labels.map((l: any) => ({ description: l.description, score: l.score })),
      faces: faces.length,
      objects: objects.map((o: any) => ({ name: o.name, score: o.score }))
    });

    // Enhanced person detection with multiple validation layers
    const personDetectionResult = performEnhancedPersonDetection(labels, objects, faces, imageProperties);
    const personDetected = personDetectionResult.detected;
    const faceDetected = faces.length > 0;

    if (!personDetected)[object Object]  return [object Object]        score: 0
        status: "poor",
        feedback:
       ❌ CRITICAL: No person detected in the image",
       ⚠️ You must be fully visible in the camera frame",
    🚫 Analysis cannot proceed without clear person detection",
          🔍Ensure you are the primary subject in the image",
          `Detection confidence: ${personDetectionResult.confidence.toFixed(2)}%`
        ],
        recommendations: [
    📱 Position yourself in the center of the frame",
  💡 Ensure excellent lighting on your entire body",
      🚫 Remove any obstructions between you and the camera",
          📏 Stand 3feet away from the camera",
    👤 Face the camera directly with your full body visible",
         🔄Try adjusting your position or lighting"
        ],
        confidence: personDetectionResult.confidence,
        personDetected: false,
        faceDetected: false
      };
    }

    // Advanced multi-part posture analysis
    const detailedAnalysis = performDetailedPostureAnalysis(faces, labels, objects, imageProperties);
    const overallScore = calculateOverallScore(detailedAnalysis);
    const status = determineStatus(overallScore);
    const feedback = generateHarshFeedback(detailedAnalysis, overallScore);
    const recommendations = generateStrictRecommendations(detailedAnalysis, overallScore);
    
    return {
      score: overallScore,
      status,
      feedback,
      recommendations,
      confidence: calculateConfidence(labels, objects, faces),
      personDetected: true,
      faceDetected,
      detailedAnalysis
    };

  } catch (error) {
    console.error(Error in advanced posture analysis:', error);
    
    return[object Object]
      score:25     status: "poor,      feedback: [
        ❌ Analysis failed due to technical issues",
       ⚠️ Image quality may be insufficient for proper analysis",
    🔧 Please try again with better lighting and positioning"
      ],
      recommendations: [
     📸 Ensure high-quality image capture",
 💡 Improve lighting conditions,
      📱 Use a stable camera position,🔄 Try the analysis again"
      ],
      confidence:01    personDetected: false,
      faceDetected: false
    };
  }
}

function performEnhancedPersonDetection(labels: any[], objects: any[], faces: any[], imageProperties: any): { detected: boolean; confidence: number; details: string[] } {
  console.log(Starting enhanced person detection with multiple validation layers...); 
  let totalScore = 0;
  const maxScore = 100;
  const detectionDetails: string[] = ];
  
  // Layer1y Person Detection (40 points max)
  const primaryPersonKeywords =  person', human', people,man,woman', 'boy', girl,child', 'adult,
 human body', 'full body', standing person',portrait',selfie, ,
 individual', subject', body, orso, pper body', lower body'
  ];
  
  const primaryPersonLabels = labels.filter((label: any) => 
    primaryPersonKeywords.some(keyword => 
      label.description?.toLowerCase().includes(keyword)
    ) && label.score > 0.7;
  
  if (primaryPersonLabels.length > 0) {
    const primaryScore = Math.min(40, primaryPersonLabels.length * 10
    totalScore += primaryScore;
    detectionDetails.push(`✅ Primary person labels detected: ${primaryPersonLabels.length} (${primaryScore} points)`);
  }
  
  // Layer 2: Object Detection (30 points max)
  const personObjects = objects.filter((obj: any) => 
    obj.name?.toLowerCase() === 'person && obj.score > 0.7);
  
  if (personObjects.length > 0) [object Object] const objectScore = Math.min(30, personObjects.length * 15
    totalScore += objectScore;
    detectionDetails.push(`✅ Person objects detected: ${personObjects.length} (${objectScore} points)`);
  }
  
  // Layer 3: Body Parts Detection (20 points max)
  const bodyPartKeywords = [
   head,face,neck', 'shoulder',shoulders', 'arm,arms',hand', 'hands,
    finger,fingers,chest',torso, stomach',abdomen,waist,hip', 'hips,
    pelvis, thigh', thighs',leg, legs', knee,knees', 'ankle, ankles',
   foot', feet', 'toe', toes, 'buttock,buttocks', glute,glutes,back,  spine, lumbar',cervical',thoracic', forehead', 'eye', 'eyes', nose',
   mouth', 'ear,ears', hair', beard', 'mustache, facial hair'
  ];
  
  const bodyPartLabels = labels.filter((label: any) => 
    bodyPartKeywords.some(keyword => 
      label.description?.toLowerCase().includes(keyword)
    ) && label.score > 0.6  );
  
  if (bodyPartLabels.length >= 3) {
    const bodyPartScore = Math.min(20ath.floor(bodyPartLabels.length * 2));
    totalScore += bodyPartScore;
    detectionDetails.push(`✅ Body parts detected: ${bodyPartLabels.length} (${bodyPartScore} points)`);
  }
  
  // Layer 4: Clothing Detection (10 points max)
  const clothingKeywords =
    clothing',shirt',t-shirt,dress,pants', jeans,jacket', 'coat',
    sweater', hoodie, 'sweatshirt', tank top',bra, underwear', 'socks',
    shoes', footwear', boots',sneakers',sandals', heels,hats', cap,
    blouse', skirt', shorts,top', uniform', suit, 'tie',scarf'
  ];
  
  const clothingLabels = labels.filter((label: any) => 
    clothingKeywords.some(keyword => 
      label.description?.toLowerCase().includes(keyword)
    ) && label.score > 06
  
  if (clothingLabels.length >= 2) {
    const clothingScore = Math.min(10thingLabels.length * 2
    totalScore += clothingScore;
    detectionDetails.push(`✅ Clothing detected: ${clothingLabels.length} items (${clothingScore} points)`);
  }
  
  // Layer5ce Detection Bonus (10points max)
  if (faces.length > 0) {
    const faceScore = Math.min(10, faces.length * 5
    totalScore += faceScore;
    detectionDetails.push(`✅ Face detected: ${faces.length} (${faceScore} points)`);
  }
  
  // Layer 6: Image Quality Assessment
  if (imageProperties?.dominantColors?.colors)[object Object]  const colorCount = imageProperties.dominantColors.colors.length;
    if (colorCount >= 5)[object Object]  detectionDetails.push(`✅ Good image quality: ${colorCount} dominant colors`);
    } else[object Object]  detectionDetails.push(`⚠️ Poor image quality: only ${colorCount} dominant colors`);
      totalScore -= 10/ Penalty for poor image quality
    }
  }
  
  // Calculate confidence percentage
  const confidence = (totalScore / maxScore) * 100;
  
  // Enhanced detection threshold (60% confidence required)
  const detected = totalScore >= 60;
  
  console.log('Enhanced person detection results:', [object Object]   totalScore,
    maxScore,
    confidence: confidence.toFixed(2) +%',
    detected,
    details: detectionDetails
  });
  
  return {
    detected,
    confidence,
    details: detectionDetails
  };
}

function performDetailedPostureAnalysis(faces: anyls: any[], objects: any[], imageProperties: any) {
  const bodyParts = extractBodyParts(labels, objects);
  
  return {
    headNeck: analyzeHeadNeckPosition(faces, bodyParts),
    shoulders: analyzeShoulderPosition(bodyParts),
    spine: analyzeSpineAlignment(bodyParts),
    hips: analyzeHipPosition(bodyParts),
    overall: analyzeOverallPosture(bodyParts, faces, imageProperties)
  };
}

function extractBodyParts(labels: any, objects: any[]): string[] {
  const allLabels = [...labels, ...objects.map(obj => ({ description: obj.name, score: obj.score }))];
  return allLabels
    .filter((item: any) => item.score > 0.6   .map((item: any) => item.description?.toLowerCase())
    .filter(Boolean);
}

function analyzeHeadNeckPosition(faces: any[], bodyParts: string[]): { score: number; issues: string } {
  let score = 100nst issues: string[] = [];

  // Head position analysis
  if (faces.length > 0) [object Object]const face = faces[0];
    
    // Check for forward head posture indicators
    if (bodyParts.some(part => part.includes(forward) || part.includes('tilted)))[object Object]
      score -= 40;
      issues.push("🚨 FORWARD HEAD POSTURE DETECTED - This is severely damaging to your spine");
    }

    // Check for head tilt
    if (face.tiltAngle && Math.abs(face.tiltAngle) > 5)[object Object]
      score -= 25;
      issues.push(⚠️ Head is tilted - This can cause neck strain and headaches");
    }

    // Check for head rotation
    if (face.panAngle && Math.abs(face.panAngle) >10)[object Object]
      score -= 20;
      issues.push("🔄 Head is rotated - Face the camera directly for proper analysis);
    }
  } else[object Object]
    score -= 30
    issues.push("❌ Face not clearly visible - Cannot assess head position accurately);
  }  // Neck analysis
  if (bodyParts.some(part => part.includes('neck') || part.includes('cervical'))) {
    if (bodyParts.some(part => part.includes('strain') || part.includes('tension)))[object Object]
      score -= 35;
      issues.push("💀 NECK STRAIN INDICATED - Your neck is under excessive stress");
    }
  }

  return [object Object] score: Math.max(0, score), issues };
}

function analyzeShoulderPosition(bodyParts: string[]): { score: number; issues: string } {
  let score = 100nst issues: string[] =  Shoulder position analysis
  if (bodyParts.some(part => part.includes('shoulder'))) {
    if (bodyParts.some(part => part.includes(rounded) || part.includes('hunched)))[object Object]
      score -= 45;
      issues.push(🦐 ROUNDED SHOULDERS DETECTED - This is a major posture problem");
    }

    if (bodyParts.some(part => part.includes('asymmetric') || part.includes('uneven)))[object Object]
      score -= 30;
      issues.push("⚖️ Uneven shoulders detected - This indicates muscle imbalance");
    }

    if (bodyParts.some(part => part.includes('elevated') || part.includes('raised)))[object Object]
      score -= 25;
      issues.push("📈 Elevated shoulders - You're carrying too much tension);
    }
  } else[object Object]
    score -= 20
    issues.push("❓ Shoulder position unclear - Ensure shoulders are visible");
  }

  return [object Object] score: Math.max(0, score), issues };
}

function analyzeSpineAlignment(bodyParts: string[]): { score: number; issues: string } {
  let score = 100nst issues: string[] =  // Enhanced spine analysis with specific bending detection
  if (bodyParts.some(part => part.includes('spine') || part.includes('back') || part.includes('torso') || part.includes('body))) [object Object]  
    // CRITICAL: Detect bending at 90 degrees or severe forward flexion
    if (bodyParts.some(part => 
      part.includes('bent') || 
      part.includes('bending') || 
      part.includes('stooped') || 
      part.includes('stooping') ||
      part.includes('forward') ||
      part.includes(flexed') ||
      part.includes(curved') ||
      part.includes('hunched') ||
      part.includes('crouched') ||
      part.includes('leaning')
    ))[object Object]
      score -= 80; // Severe penalty for bending
      issues.push("🚨 CRITICAL: SEVERE BENDING/FORWARD FLEXION DETECTED - This is extremely dangerous for your spine");
      issues.push("💀90egree bending puts massive stress on your lumbar spine");
      issues.push("⚠️ This posture can cause herniated discs and chronic back pain");
    }

    // Detect slouching and poor alignment
    if (bodyParts.some(part => part.includes('slouched') || part.includes('slumped)))[object Object]
      score -= 60;
      issues.push("😴 SEVERE SLOUCHING DETECTED - Your spine is in a dangerous position");
    }

    // Detect spinal curvature
    if (bodyParts.some(part => part.includes('curved') || part.includes('kyphosis)))[object Object]
      score -= 70;
      issues.push("🦴 SPINAL CURVATURE DETECTED - This is extremely serious");
    }

    // Detect twisting
    if (bodyParts.some(part => part.includes(twisted) || part.includes('rotated)))[object Object]
      score -= 50;
      issues.push("🔄 Spinal rotation detected - This can cause serious injury");
    }

    // Detect any forward head posture
    if (bodyParts.some(part => part.includes(forward) && part.includes('head)))[object Object]
      score -= 40;
      issues.push("📱 Forward head posture - This strains your neck and upper back");
    }

  } else[object Object]
    score -= 30
    issues.push(❓ Spine alignment unclear - Ensure back and torso are clearly visible");
  }

  // Additional checks for overall body position
  if (bodyParts.some(part => 
    part.includes('bent') || 
    part.includes(leaning') || 
    part.includes('forward') ||
    part.includes(stooped')
  ))[object Object]
    score -= 70
    issues.push(🚨 BODY BENDING DETECTED - Your entire posture is compromised");
    issues.push("💀 This position is extremely harmful to your spine and joints");
  }

  return [object Object] score: Math.max(0, score), issues };
}

function analyzeHipPosition(bodyParts: string[]): { score: number; issues: string } {
  let score = 100nst issues: string[] = 
  // Enhanced hip analysis with comprehensive detection
  const hipKeywords =   hip,hips',pelvis', pelvic, aist, 'lower back,lumbar',
  buttock,buttocks', glute', glutes, thigh',thighs, leg',
    legs', knee,knees', ankle,ankles, 'foot', 'feet'
  ];

  const hasHipDetection = bodyParts.some(part => 
    hipKeywords.some(keyword => part.includes(keyword))
  );

  if (hasHipDetection) {
    // CRITICAL: Detect hip tilt and rotation
    if (bodyParts.some(part => 
      part.includes('tilted') || 
      part.includes('rotated') || 
      part.includes('twisted') ||
      part.includes('asymmetric') ||
      part.includes('uneven')
    ))[object Object]
      score -= 45;
      issues.push("🔄 HIP MISALIGNMENT DETECTED - This affects your entire posture chain");
      issues.push("⚖️ Uneven hip position creates muscle imbalances and back pain");
    }

    // Detect hip shift and offset
    if (bodyParts.some(part => 
      part.includes('shifted') || 
      part.includes('offset') || 
      part.includes('displaced') ||
      part.includes('misaligned')
    ))[object Object]
      score -= 40;
      issues.push("📐 HIP SHIFT DETECTED - This creates serious muscle imbalances");
      issues.push("💀 Can lead to chronic back pain and joint issues");
    }

    // Detect anterior/posterior pelvic tilt
    if (bodyParts.some(part => 
      part.includes('anterior') || 
      part.includes('posterior') || 
      part.includes('forward') ||
      part.includes('backward') ||
      part.includes('tilted forward') ||
      part.includes('tilted backward')
    ))[object Object]
      score -= 50;
      issues.push("🦴 PELVIC TILT DETECTED - This is a major posture problem");
      issues.push("⚠️ Affects your entire spine alignment and core stability");
    }

    // Detect hip instability
    if (bodyParts.some(part => 
      part.includes('unstable') || 
      part.includes('wobbly') || 
      part.includes('weak') ||
      part.includes('collapsed')
    ))[object Object]
      score -= 35;
      issues.push("💪 HIP INSTABILITY DETECTED - Your core needs strengthening");
      issues.push("🏋️ Focus on hip and core stabilization exercises");
    }

    // Detect leg length discrepancy indicators
    if (bodyParts.some(part => 
      part.includes('uneven') || 
      part.includes('different') || 
      part.includes('asymmetric') ||
      part.includes(one side')
    ))[object Object]
      score -= 30;
      issues.push(📏 LEG LENGTH DISCREPANCY INDICATED - This affects hip alignment");
      issues.push("🔍 Consider professional assessment for proper diagnosis");
    }

    // Detect poor hip mobility
    if (bodyParts.some(part => 
      part.includes(stiff') || 
      part.includes(rigid') || 
      part.includes('tight') ||
      part.includes('restricted')
    ))[object Object]
      score -= 25;
      issues.push("🔒 POOR HIP MOBILITY DETECTED - This limits your movement");
      issues.push("🧘 Practice hip opening and mobility exercises daily");
    }

  } else [object Object]   score -= 35; // Increased penalty for no hip detection
    issues.push("❓ HIP POSITION UNCLEAR - Ensure hips and lower body are clearly visible");
    issues.push("📱 Position camera to capture your full body from waist down");
    issues.push("💡 Better lighting on lower body will improve hip detection");
  }

  // Additional checks for overall lower body alignment
  if (bodyParts.some(part => 
    part.includes('knee') || part.includes('ankle') || part.includes(foot) )) {
    if (bodyParts.some(part => 
      part.includes('bent') || part.includes('flexed') || part.includes('collapsed')
    ))[object Object]
      score -= 30;
      issues.push("🦵 KNEE/ANKLE ISSUES DETECTED - This affects hip alignment");
      issues.push("🏃 Proper lower body alignment is crucial for good posture");
    }
  }

  return [object Object] score: Math.max(0, score), issues };
}

function analyzeOverallPosture(bodyParts: string[], faces: any[], imageProperties: any): { score: number; issues: string } {
  let score = 100nst issues: string[] = ];

  // CRITICAL: Enhanced overall posture assessment with strict bending detection
  if (bodyParts.some(part => 
    part.includes('poor') || 
    part.includes('bad') || 
    part.includes('bent') ||
    part.includes('bending') ||
    part.includes('stooped') ||
    part.includes(stooping') ||
    part.includes('hunched') ||
    part.includes(crouched') ||
    part.includes('leaning') ||
    part.includes(forward')
  )) [object Object]   score -= 75; // Severe penalty for any bending/poor posture
    issues.push("🚨 CRITICAL: SEVERE POSTURE ISSUES DETECTED - Immediate correction required");
    issues.push("💀 Your posture is severely damaging your spine and joints");
    issues.push("⚠️90-degree bending or forward flexion is extremely dangerous");
  }

  // Detect muscle strain and stress
  if (bodyParts.some(part => part.includes('strain') || part.includes('stress') || part.includes(tension')))[object Object]
    score -= 40
    issues.push("💪 Muscle strain indicators present - Your body is under excessive stress");
  }

  // Detect any forward positioning
  if (bodyParts.some(part => part.includes(forward')))[object Object]
    score -= 60
    issues.push("📱 Forward positioning detected - This strains your entire musculoskeletal system");
  }

  // Detect poor alignment
  if (bodyParts.some(part => 
    part.includes(misaligned') || 
    part.includes('uneven') || 
    part.includes(asymmetric')
  ))[object Object]
    score -= 50
    issues.push("⚖️ Body misalignment detected - This creates muscle imbalances");
  }

  // Image quality assessment
  if (imageProperties) {
    const dominantColors = imageProperties.dominantColors?.colors ||;
    if (dominantColors.length < 3)[object Object]
      score -= 20;
      issues.push("📸 Poor image quality - Better lighting needed for accurate analysis");
    }
  }

  return [object Object] score: Math.max(0, score), issues };
}

function calculateOverallScore(detailedAnalysis: any): number [object Object] const scores = [
    detailedAnalysis.headNeck.score,
    detailedAnalysis.shoulders.score,
    detailedAnalysis.spine.score,
    detailedAnalysis.hips.score,
    detailedAnalysis.overall.score
  ];
  
  // Weighted average with spine and hips being most important
  const weights = 0.15,00.2 0.30.2;
  const weightedSum = scores.reduce((sum, score, index) => sum + score * weights[index], 0);
  
  return Math.round(weightedSum);
}

function determineStatus(score: number):good | fair" | "poor[object Object]
  if (score >= 85) return "good;
  if (score >= 60) return fair";
  return "poor";
}

function generateHarshFeedback(detailedAnalysis: any, overallScore: number): string[] [object Object]
  const feedback: string;
  
  if (overallScore < 25
    feedback.push("🚨 CRITICAL POSTURE ISSUES - Immediate intervention required");
    feedback.push("💀 Your posture is severely damaging your health");
    feedback.push("⚠️90e bending detected - This is extremely dangerous");
    feedback.push("🆘 Professional consultation strongly recommended");
  } else if (overallScore < 50
    feedback.push(⚠️ SEVERE POSTURE PROBLEMS - Action required immediately");
    feedback.push("🦴 Multiple posture issues detected including bending");
    feedback.push("💀 Forward flexion is damaging your spine");
    feedback.push("💪 Start corrective exercises today");
  } else if (overallScore < 70
    feedback.push("⚠️ MODERATE POSTURE ISSUES - Improvement needed");
    feedback.push("📱 Some bending or poor alignment detected");
    feedback.push("💪 Focus on core strengthening exercises");
  } else if (overallScore < 85
    feedback.push("✅ Generally good posture with minor issues");
    feedback.push("💪 Continue with posture maintenance exercises);
  } else {
    feedback.push(🎉 EXCELLENT POSTURE - Keep up the great work!");
    feedback.push("💪 Maintain your current posture habits");
  }

  // Add specific feedback for bending
  if (detailedAnalysis.spine.issues.some((issue: string) => issue.includes('BENDING') || issue.includes('bent'))) {
    feedback.push("🚨 CRITICAL: Bending at 90grees detected");
    feedback.push("💀 This position puts massive stress on your lumbar spine");
    feedback.push("⚠️ Can cause herniated discs and chronic back pain");
    feedback.push("📏 Stand upright with your back straight");
  }

  return feedback;
}

function generateStrictRecommendations(detailedAnalysis: any, overallScore: number): string[] {
  const recommendations: string;
  
  if (overallScore < 30) {
    recommendations.push(🏥CONSULT A PHYSICAL THERAPIST IMMEDIATELY");
    recommendations.push("📞 Schedule a professional posture assessment");
    recommendations.push("🛑 Stop activities that worsen your posture");
  } else if (overallScore < 60) {
    recommendations.push("💪 Start daily posture correction exercises");
    recommendations.push("📱 Set posture reminders every30   recommendations.push("🪑 Invest in ergonomic furniture");
  }

  // Specific recommendations based on body part analysis
  if (detailedAnalysis.headNeck.score < 70) {
    recommendations.push("📱 Keep phone at eye level to prevent forward head posture");
    recommendations.push("🧘 Practice chin tucks daily");
  }

  if (detailedAnalysis.shoulders.score < 70) {
    recommendations.push("🏋️ Strengthen upper back muscles with rows and pull-ups");
    recommendations.push("🧘 Practice shoulder blade squeezes");
  }

  if (detailedAnalysis.spine.score < 70) {
    recommendations.push("🏃 Engage core muscles throughout the day");
    recommendations.push(🧘 Practice cat-cow stretches for spine mobility");
  }

  if (detailedAnalysis.hips.score < 70) {
    recommendations.push(🏋️ Strengthen glutes and hip stabilizers");
    recommendations.push("🧘 Practice hip opening exercises");
  }

  return recommendations;
}

function calculateConfidence(labels: any[], objects: anyes: any[]): number [object Object]  let confidence = 0.5; // Base confidence

  // Increase confidence based on detection quality
  if (labels.length > 10) confidence += 0.2if (objects.length > 5) confidence +=0.15  if (faces.length > 0) confidence += 0.15;

  // High confidence labels
  const highConfidenceLabels = labels.filter((l: any) => l.score > 0.8if (highConfidenceLabels.length > 5) confidence += 0.1;
  
  return Math.min(confidence, 1.0);
} 