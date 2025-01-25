class TokenPatrol {
    static ID = 'token-patrol';

    static TEMPLATES = {
        patrolConfig: `modules/${this.ID}/templates/patrol-config.html`
    }

    static initialize() {
        this.registerHooks();
        TokenPatrolVision.initialize();
    }

    static isLicensed() {
        return true;
    }

    static registerHooks() {
        Hooks.on('ready', this.onReady.bind(this));
        Hooks.on('renderTokenHUD', (hud, buttons) => {
            console.log("Token HUD Buttons hook called", { hud, buttons });
            return this.getTokenHUDButtons(hud, buttons);
        });
        Hooks.on('getSceneControlButtons', this.getSceneControlButtons.bind(this));
    }

    static onReady() {
        game.tokenPatrol = this;
    }

    static getSceneControlButtons(controls) {
        const isLicensed = this.isLicensed();

        // Find the tokens control group
        const tokenTools = controls[0];

        if (!tokenTools) return;

        // Add a separator first
        tokenTools.tools.push(
            {
                name: "start-all",
                title: (!isLicensed ? "Premium Only: " : "") + "Start All Patrols",
                icon: "fas fa-play-circle",
                button: true,
                disabled: !isLicensed,
                visible: true,
                onClick: () => this.startAllPatrols()
            },
            {
                name: "stop-all",
                title: (!isLicensed ? "Premium Only: " : "") + "Stop All Patrols",
                icon: "fas fa-stop-circle",
                button: true,
                disabled: !isLicensed,
                visible: true,
                onClick: () => this.confirmStopAllPatrols()
            }
        );
    }


    static getTokenHUDButtons(app, html, data) {
        const isLicensed = this.isLicensed();

        const buttonContainer = html.find('.col.middle');
        if (!buttonContainer.length || !game.user.isGM) return;

        // Only show patrol buttons for NPC tokens
        if (app.object.actor?.type === 'character') return;

        const buttons = [
            {
                name: "stopPatrol",
                label: "Stop Patrol",
                icon: "fas fa-stop",
                onClick: () => {
                    const token = app.object;
                    this.stopPatrol(token);
                }
            },
            {
                name: "startPatrol",
                label: "Start Patrol",
                icon: "fas fa-play",
                onClick: () => this._startPatrol(app.object)
            },
            {
                name: "patrol",
                label: "Create Patrol",
                icon: "fas fa-route",
                toggle: true,
                onClick: () => this.activatePatrolTool(app.object)
            }];

        buttonContainer.prepend(`<span style="clear:both"></span>`);
        buttonContainer.prepend(`<div class="patrol-buttons"></div>`);
        const patrolContainer = html.find('.col.middle .patrol-buttons');

        buttons.forEach(button => {
            const $button = $(`<span class="control-icon" style="float:left;margin-top:8px;" data-action="${button.name}">
                <i class="${button.icon}" title="${button.label}"></i>
            </span>`);

            $button.click(button.onClick);
            patrolContainer.prepend($button);
        });
    }

    static activatePatrolTool(token) {
        if (!canvas.ready) return;

        // Toggle patrol creation mode
        canvas.stage.interactive = true;
        const layer = canvas.tokens;

        // Create or edit patrol path drawing mode
        if (!this.patrolPoints) {
            this.patrolPoints = [];

            // Check for existing patrol path
            const existingPath = token.document.getFlag(this.ID, 'patrolPath');
            if (existingPath) {
                this.patrolPoints = [...existingPath];
            }

            this.patrolGraphics = new PIXI.Graphics();
            this.activeToken = token;
            layer.addChild(this.patrolGraphics);

            // Draw existing path if any
            if (this.patrolPoints.length > 0) {
                this._redrawPath();
            }

            // Add click listener
            layer.on('pointerdown', this._onPatrolClick.bind(this));
        } else {
            // End patrol creation mode
            this._finalizePatrol();
        }
    }

    static _onPatrolClick(event) {
        const pos = event.data.getLocalPosition(canvas.app.stage);

        // Handle right click - check if clicking near an existing point
        if (event.data.button === 2) { // Right click
            const clickRadius = 10; // Distance threshold for clicking points
            for (let i = 0; i < this.patrolPoints.length; i++) {
                const point = this.patrolPoints[i];
                const distance = Math.sqrt(Math.pow(pos.x - point.x, 2) + Math.pow(pos.y - point.y, 2));
                if (distance < clickRadius) {
                    // Remove the point and redraw
                    this.patrolPoints.splice(i, 1);
                    this._redrawPath();
                    return;
                }
            }
            return;
        }

        // Left click - add new point
        this.patrolPoints.push({ x: pos.x, y: pos.y });
        this._redrawPath();
    }

    static _redrawPath() {
        this.patrolGraphics.clear();

        // Draw the path lines
        if (this.patrolPoints.length > 1) {
            this.patrolGraphics.lineStyle(2, 0xff0000, 0.8);
            this.patrolGraphics.moveTo(this.patrolPoints[0].x, this.patrolPoints[0].y);
            for (let i = 1; i < this.patrolPoints.length; i++) {
                this.patrolGraphics.lineTo(this.patrolPoints[i].x, this.patrolPoints[i].y);
            }
            // Connect back to start for a complete loop
            this.patrolGraphics.lineTo(this.patrolPoints[0].x, this.patrolPoints[0].y);
        }

        // Draw squares at each point
        this.patrolGraphics.lineStyle(1, 0xff0000, 1);
        for (const point of this.patrolPoints) {
            const squareSize = 6;
            this.patrolGraphics.beginFill(0xff0000, 0.5);
            this.patrolGraphics.drawRect(
                point.x - squareSize / 2,
                point.y - squareSize / 2,
                squareSize,
                squareSize
            );
            this.patrolGraphics.endFill();
        }
    }

    static _finalizePatrol() {
        if (!this.patrolPoints || this.patrolPoints.length < 2) return;

        // Use the active token from the HUD
        if (!this.activeToken) {
            ui.notifications.warn("No token selected for patrol path.");
            return;
        }

        // Store patrol path data on the token and start patrol
        this.activeToken.document.setFlag(this.ID, 'patrolPath', this.patrolPoints);
        ui.notifications.info("Patrol path saved successfully.");
        this.activeToken = null;

        // Clean up
        this.patrolGraphics.clear();
        canvas.tokens.removeChild(this.patrolGraphics);
        this.patrolGraphics.destroy();
        this.patrolGraphics = null;
        this.patrolPoints = null;
        canvas.tokens.off('pointerdown');
    }

    static _startPatrol(token) {
        // Start both movement and enable vision checking
        TokenPatrolMovement.startPatrol(token);
        token.document.update({ "flags.token-patrol.isPatrolling": true });
    }

    static stopPatrol(token) {
        TokenPatrolMovement.stopPatrol(token);
        token.document.update({ "flags.token-patrol.isPatrolling": false });
    }

    static async confirmStopAllPatrols() {
        const isLisenced = this.isLicensed();
        const confirm = await Dialog.confirm({
            title: "Stop All Patrols",
            content: "<p>Are you sure you want to stop all active patrols?</p>",
            yes: () => this.stopAllPatrols(),
            no: () => { },
            defaultYes: false
        });
    }

    static stopAllPatrols() {
        const patrollingTokens = canvas.tokens.placeables.filter(t =>
            t.document.getFlag(this.ID, 'isPatrolling')
        );
        patrollingTokens.forEach(token => this.stopPatrol(token));
    }

    static startAllPatrols() {
        const patrollingTokens = canvas.tokens.placeables.filter(t =>
            t.document.getFlag(this.ID, 'patrolPath')?.length >= 2
        );
        patrollingTokens.forEach(token => this._startPatrol(token));
    }
}

Hooks.once('init', () => {
    TokenPatrol.initialize();
});

Hooks.once('closeGame', () => {
    TokenPatrolVision.cleanup();
});