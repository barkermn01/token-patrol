class PatrolSettings {
    static initialize() {
        this.registerSettings();
    }
    
    static MODULE_NAME = 'token-patrol';

    static registerSettings() {
        game.settings.register(this.MODULE_NAME, 'pauseOnDetection', {
            name: 'Pause on Detection',
            hint: 'Automatically pause the game when an NPC detects a player',
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });

        game.settings.register(this.MODULE_NAME, 'speakOnDetection', {
            name: 'Speak on Detection',
            hint: 'NPCs will speak when they detect a player',
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });

        game.settings.register(this.MODULE_NAME, 'speechVisibility', {
            name: 'Speech Visibility',
            hint: 'Who can see detection messages',
            scope: 'world',
            config: true,
            type: String,
            choices: {
                'gmOnly': 'GM Only',
                'public': 'Public'
            },
            default: 'gmOnly'
        });

        game.settings.register(this.MODULE_NAME, 'speechText', {
            name: 'Speech Text',
            hint: 'What NPCs say when they detect a player',
            scope: 'world',
            config: true,
            type: String,
            default: 'Who goes there!'
        });
    }

    static getSetting(key, token = null) {
        return game.settings.get(this.MODULE_NAME, key);
    }
}

Hooks.once('init', () => {
    PatrolSettings.initialize();
});