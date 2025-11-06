# AI Regulatory Compliance Course Demo

## Demo Overview

This interactive demo showcases an enterprise-level course design system with the specific structure you requested:

**Course: "AI Regulatory Compliance"**

### Course Structure

#### Topic 1: Regulations on Privacy (8 slides across 4 areas)

**1. GDPR Compliance for AI Systems (3 slides)**
   - Slide 1: GDPR Fundamentals for AI
   - Slide 2: Data Subject Rights in AI Systems  
   - Slide 3: Implementing GDPR-Compliant AI

**2. California Consumer Privacy Act (CCPA) (1 slide)**
   - Slide 1: CCPA Overview for AI Systems

**3. International Privacy Frameworks (1 slide)**
   - Slide 1: Global Privacy Landscape for AI

**4. Emerging Privacy Technologies (1 slide)**
   - Slide 1: Privacy-Enhancing Technologies for AI

#### Topic 2: AI Service Product Safety (2 slides in 1 area)

**1. AI Safety Standards and Compliance (2 slides)**
   - Slide 1: AI Product Safety Framework
   - Slide 2: Implementing AI Safety Measures

### Interactive Demo Features

#### Content Movement Functionality
- **Move to AI Enhancement Component**: Click the "Move to AI Enhancement" button on any slide
- **View Full Content**: Click "View" to see complete slide details including:
  - Full content paragraphs
  - Key points
  - Relevant regulations
  - Real-world examples
- **Track Moved Content**: The "AI Service Enhancements" tab shows all moved slides with success indicators

#### Sample Content Detail (GDPR Fundamentals for AI)

**Content:**
- The General Data Protection Regulation (GDPR) significantly impacts AI systems that process personal data
- AI systems must comply with principles of lawfulness, fairness, and transparency
- Data minimization principle requires AI to use only necessary personal data
- Purpose limitation ensures AI processes data only for specified, explicit purposes

**Key Points:**
- GDPR applies to all AI systems processing EU residents' data
- Legal basis required for each AI processing activity
- Data subjects have rights regarding automated decision-making

**Relevant Regulations:**
- GDPR Article 6, GDPR Article 22, GDPR Recital 71

**Examples:**
- AI hiring systems requiring explicit consent
- Recommendation engines with opt-out mechanisms
- Automated credit scoring with human oversight

## How to Access the Demo

1. **Frontend**: Navigate to `http://localhost:3002/course-demo`
2. **From Homepage**: Click "Course Design Demo" button on the main page

## Demo Workflow

1. **Start on "Regulations on Privacy" tab** - Shows 4 areas with detailed slide structure
2. **View individual slides** - Click "View" buttons to see full content
3. **Move content to AI Enhancement** - Click "Move to AI Enhancement" buttons
4. **Navigate to AI Service Enhancements tab** - See moved content with success indicators
5. **Check Topic 2** - Switch to "AI Service Product Safety" tab to see the single area structure

## Technical Implementation

- **React Components**: Full Material-UI implementation with responsive design
- **Tab Navigation**: Three-tab interface for easy content organization
- **Dialog Systems**: Modal dialogs for content viewing and move confirmation
- **State Management**: React hooks for tracking moved content and user interactions
- **Responsive Design**: Works on desktop and mobile devices

## Key Enterprise Features Demonstrated

1. **Structured Content Organization**: Clear topic → area → slide hierarchy
2. **Content Mobility**: Slides can be moved between course components
3. **Rich Content Format**: Each slide includes content, key points, regulations, and examples
4. **Interactive UI**: Hover effects, confirmation dialogs, success notifications
5. **Progress Tracking**: Dynamic slide counts and moved content indicators

This demo effectively showcases how enterprise course design systems can manage complex regulatory content with flexible content movement capabilities.