class VisionCone {
    // Default vision settings
    static get VISION_RANGE() {
        return game.settings.get('token-patrol', 'visionRange');
    }
    
    static get CONE_ANGLE() {
        return game.settings.get('token-patrol', 'coneAngle');
    }
    
    static calculateVisionCone(token) {
        const rotation = token.document.rotation || 0;
        const tokenCenter = {
            x: token.document.x + (token.w / 2),
            y: token.document.y + (token.h / 2)
        };
        
        return {
            origin: tokenCenter,
            angle: rotation,
            range: this.VISION_RANGE,
            coneAngle: this.CONE_ANGLE
        };
    }

    static isTokenInCone(sourceToken, targetToken) {
        // Check if vision system is enabled
        if (!game.settings.get('token-patrol', 'enableVisionSystem')) {
            return false;
        }
        const cone = this.calculateVisionCone(sourceToken);
        const targetCenter = {
            x: targetToken.document.x + (targetToken.w / 2),
            y: targetToken.document.y + (targetToken.h / 2)
        };

        // Calculate distance
        const distance = Math.sqrt(
            Math.pow(targetCenter.x - cone.origin.x, 2) + 
            Math.pow(targetCenter.y - cone.origin.y, 2)
        );
        
        if (distance > cone.range) return false;

        // Calculate angle to target
        const angleToTarget = Math.atan2(
            targetCenter.y - cone.origin.y,
            targetCenter.x - cone.origin.x
        ) * (180 / Math.PI);

        // Normalize angles
        const normalizedConeAngle = ((cone.angle % 360) + 360) % 360;
        const normalizedTargetAngle = ((angleToTarget % 360) + 360) % 360;

        // Check if target is within cone
        const halfCone = cone.coneAngle / 2;
        const minAngle = normalizedConeAngle - halfCone;
        const maxAngle = normalizedConeAngle + halfCone;

        if (!(normalizedTargetAngle >= minAngle && normalizedTargetAngle <= maxAngle)) {
            return false;
        }

        // Check for walls between source and target
        const ray = new Ray(cone.origin, targetCenter);
        const collisions = canvas.walls.raycast(ray);
        return collisions.length === 0;
    }
}