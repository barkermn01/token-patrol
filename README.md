# Token Patrol

A Foundry VTT module that enables Game Masters to create sophisticated patrol paths for NPC tokens with advanced vision mechanics and detection systems.

## Features

- Create patrol paths for NPC tokens by clicking points on the map
- Tokens automatically move along defined patrol paths with smooth animations and rotation
- Integrated with Foundry's native vision and detection system
- Token-specific configuration options available in token settings
- Patrol controls integrated directly into token HUD for easy access
- Start/Stop individual token patrols
- Start/Stop all patrols simultaneously
- Automatic pause handling - patrols respect game pause state
- Configurable detection alerts (GM only or Public)
- Customizable detection messages per token
- Visual feedback during patrol operation

## Installation

1. Inside Foundry VTT, select the Game Modules tab in the Configuration and Setup menu
2. Click the Install Module button and enter the following URL: https://github.com/barkermn01/token-patrol/releases/latest/download/module.json
3. Click Install to download and install the module

## Usage

### Setting Up a Patrol
1. Select an NPC token you want to create a patrol path for
2. Click the play button in the token HUD to start creating a patrol path
3. Click points on the map to create waypoints for the patrol path
4. The token will automatically begin patrolling between these points

### Token Configuration
Each patrolling token can be configured with:
- Custom detection message
- Vision range
- Other token-specific settings

Access these settings through the token configuration menu (right-click token → Configure).

### Controls
- Token HUD buttons for individual patrol control
- Start/Stop buttons in token controls for managing all patrols
- Patrols automatically pause when game is paused

### Vision System
- Utilizes Foundry VTT's built-in vision system
- Tokens actively check for player characters within their vision range
- Configurable alert system for when players are detected
- GM can choose between private or public alerts

## Compatibility

- Minimum Foundry VTT version: 10
- Verified compatible with version: 12
- Maximum tested version: 12

## License

Protected - All rights reserved

## Support

For issues, suggestions, or support, please visit the [GitHub repository](https://github.com/barkermn01/token-patrol)
