class TokenPatrolVision {
    static ID = 'token-patrol';
    
    static initialize() {
        this.visionCheckInterval = setInterval(() => this.checkAllPatrolVision(), 1000);
    }

    static async checkAllPatrolVision() {
        if(canvas?.tokens?.placeables){
            const patrollingTokens = canvas.tokens.placeables.filter(t => 
                t.document.getFlag(this.ID, 'isPatrolling')
            );

            for (const token of patrollingTokens) {
                if (this._checkVision(token)) {
                    this._handleDetection(token);
                }
            }
        }
    }

    static _checkVision(token) {
        // Basic validation checks
        if (!token?.document?.sight?.enabled) {
            console.debug(`${token.name} has sight disabled or invalid configuration`);
            return false;
        }

        // Look for player character tokens that are not hidden
        const players = canvas.tokens.placeables.filter(t => 
            t.actor?.hasPlayerOwner && 
            t.document.disposition !== token.document.disposition &&
            !t.document.hidden
        );
        console.debug(`${token.name} checking ${players.length} player tokens`);

        // Force perception update to ensure vision is current
        canvas.perception.update({refreshVision: true, refreshLighting: true});
        
        // Check if any players are visible
        const spotted = players.some(player => {
            // Check if player is within sight range
            const distance = canvas.grid.measureDistance(token.center, player.center, {gridSpaces: true});
            if (distance > token.document.sight.range) {
                console.debug(`${token.name}: ${player.name} out of range (${distance})`);
                return false;
            }

            // Use Foundry's built-in token-to-token visibility check
            const canSee = canvas.visibility.testVisibility(player, {object: token})

            console.debug(`${token.name} vision check for ${player.name}:`, {
                distance,
                canSee,
                playerPos: `${player.x},${player.y}`,
                tokenPos: `${token.x},${token.y}`
            });

            return canSee;
        });
        
        return spotted;
    }

    static async _handleDetection(token) {
        ui.notifications.warn(`${token.name} has spotted something!`);
        
        // Only pause if we're not in combat
        if (PatrolSettings.getSetting('pauseOnDetection') && !game.combat?.started) {
            game.togglePause(true);
        }
        
        // Always notify GM during combat
        if (game.combat?.started) {
            ChatMessage.create({
                content: `${token.name} has spotted something during patrol!`,
                whisper: game.users.filter(u => u.isGM).map(u => u.id),
                type: CONST.CHAT_MESSAGE_TYPES.OTHER
            });
        }
        
        if (PatrolSettings.getSetting('speakOnDetection')) {
            const speaker = ChatMessage.getSpeaker({ token: token });
            const message = PatrolSettings.getSetting("speechText", token);
            const content = `${message}<br><br>
                <span style="font-style: italic;">A player needs to make a Stealth check!</span>`;
            
            const whisperTo = PatrolSettings.getSetting('speechVisibility') === 'gmOnly' 
                ? game.users.filter(u => u.isGM).map(u => u.id) 
                : [];
            
            ChatMessage.create({
                speaker,
                content,
                type: CONST.CHAT_MESSAGE_TYPES.OTHER,
                whisper: whisperTo
            });
        }
    }

    static cleanup() {
        if (this.visionCheckInterval) {
            clearInterval(this.visionCheckInterval);
            this.visionCheckInterval = null;
        }
    }
}