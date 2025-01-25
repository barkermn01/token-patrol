class TokenPatrolMovement {
    static ID = 'token-patrol';

    static async startPatrol(token) {
        const path = token.document.getFlag(this.ID, 'patrolPath');
        if (!path || path.length < 2) return;

        // Stop any existing patrol on this token
        this.stopPatrol(token);
        
        // Don't start patrol if not the token's turn in combat
        if (game.combat?.started) {
            const combatant = game.combat.getCombatantByToken(token.id);
            if (!combatant || game.combat.current.combatantId !== combatant.id) {
                return;
            }
        }

        let currentPointIndex = 0;
        let isPatrolling = true;
        
        // Store the timeout ID and hook ID on the token
        token.patrolTimeout = null;
        token.patrolHookId = null;

        const moveToNextPoint = async () => {
            if (!isPatrolling) return;
            if (game.paused) {
                token.patrolTimeout = setTimeout(moveToNextPoint, 6000);
                return;
            }

            // If in combat, prompt GM for movement confirmation
            if (game.combat?.started) {
                const shouldMove = await TokenPatrolDialog.confirmMovement(token);
                if (!shouldMove) {
                    this.stopPatrol(token);
                    return;
                }
            }
        
            const nextPoint = path[currentPointIndex];
            
            // Calculate the current center of the token
            const currentCenterX = token.document.x + (token.w / 2);
            const currentCenterY = token.document.y + (token.h / 2);
            
            // Calculate rotation from current position to the next point
            const dx = nextPoint.x - currentCenterX;
            const dy = nextPoint.y - currentCenterY;
            // Foundry VTT uses 0 degrees as east, -90 to align with token's forward direction
            const rotation = (Math.atan2(dy, dx) * (180 / Math.PI)) - 90;
            
            // First rotate the token
            await token.document.update({
                rotation: rotation,
                _patrol: true
            }, {_patrol: true});
            
            // Wait a moment for the rotation to complete
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Calculate the target position for movement
            const targetCenterX = nextPoint.x - (token.w / 2);
            const targetCenterY = nextPoint.y - (token.h / 2);

            // Then move to the next position
            await token.document.update({
                x: targetCenterX,
                y: targetCenterY,
                _patrol: true
            }, {_patrol: true});
            
            currentPointIndex = (currentPointIndex + 1) % path.length;
            // Schedule next movement
            token.patrolTimeout = setTimeout(moveToNextPoint, 6000);
        };        

        // Start the patrol loop
        moveToNextPoint();
    }

    static stopPatrol(token) {
        if (token.patrolTimeout) {
            clearTimeout(token.patrolTimeout);
            token.patrolTimeout = null;
        }
        if (token.patrolHookId) {
            Hooks.off('updateCombat', token.patrolHookId);
            token.patrolHookId = null;
        }
        token.document.update({"flags.token-patrol.isPatrolling": false});
    }
}