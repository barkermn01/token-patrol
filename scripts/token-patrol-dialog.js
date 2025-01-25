class TokenPatrolDialog extends Dialog {
    static async confirmMovement(token) {
        return new Promise((resolve) => {
            new Dialog({
                title: "Patrol Movement",
                content: `<p>Complete patrol movement for ${token.name}?</p>`,
                buttons: {
                    yes: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Yes",
                        callback: () => resolve(true)
                    },
                    no: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "No",
                        callback: () => resolve(false)
                    }
                },
                default: "yes"
            }).render(true);
        });
    }
}