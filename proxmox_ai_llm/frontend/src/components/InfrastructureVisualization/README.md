# Infrastructure Visualization Module

This module provides a sophisticated visualization for infrastructure resources with multiple view modes and real-time data display capabilities.

## Directory Structure

```
proxmox_ai_llm/frontend/src/components/InfrastructureVisualization/
├── index.jsx                     # Main component (exports InfrastructureVisualization)
├── components/
│   ├── ResourceCard.jsx          # Grid view card component
│   ├── ResourceDetails.jsx       # Sidebar for selected resource details
│   ├── NetworkGraph.jsx          # Network graph view
│   ├── ThreeDView.jsx            # 3D isometric view
│   ├── AnalyticsSummary.jsx      # Summary statistics dashboard
│   ├── Legend.jsx                # Color coding legend
│   └── ViewControls.jsx          # View mode and color controls
├── hooks/
│   └── useInfrastructureData.js  # Custom hook for data processing
└── utils/
    ├── colorUtils.js             # Color and style utility functions
    ├── iconUtils.js              # Icon selection utilities
    └── layoutUtils.js            # Layout calculation utilities
```

## Usage

```jsx
import InfrastructureVisualization from './components/InfrastructureVisualization';

// In your component
<InfrastructureVisualization 
  workflowData={workflowData} 
  securityIssues={securityIssues} 
/>
```

## Features

- **Multiple Visualization Modes**:
  - **Grid View**: Card-based layout showing resources in a grid
  - **Network Graph**: Interactive graph showing connections between resources
  - **3D View**: Isometric visualization with depth perception

- **Interactive Elements**:
  - Resource selection with detailed sidebar
  - Hover tooltips
  - Zoom controls for graph and 3D views
  - Color coding by security, cost, or architecture scores

- **Real-time Data Indicators**:
  - Resource status indicators
  - Performance metrics (CPU, memory)
  - Security issue badges
  - Animated data flows

- **Analytics Dashboard**:
  - Overall security score
  - Issue statistics
  - Resource health status
  - System performance metrics

## Component Integration

This visualization is designed to work as part of the multi-agent infrastructure analysis system. It consumes data from the following sources:

- `workflowData`: Contains the analyzed resources, costs, and architecture details
- `securityIssues`: Contains security findings for each resource

## Customization

The visualization supports the following customization options:

- **Color Mode**: Security, Cost, or Architecture
- **View Mode**: Grid, Network Graph, or 3D
- **Real-time Data**: Toggle real-time data updates

## Performance Considerations

- The modular design improves performance by only rendering components that are needed
- The custom data processing hook efficiently handles resource data transformations
- SVG-based visualizations offer better compatibility than 3D WebGL approaches