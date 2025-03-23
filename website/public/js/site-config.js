/**
 * Site-wide configuration
 * Centralized settings for the entire website
 */
const SITE_CONFIG = {
    // Site information
    siteName: "Enderfall",
    serverIP: "play.enderfall.com",
    discordInvite: "https://discord.gg/ellrijord",
    
    // URLs
    urls: {
        shop: "/shop.html",
        home: "/index.html",
    },
    
    // Payment goal
    paymentGoal: {
        current: 15, // percentage
        target: 100
    },
    
    // Ranks information (can be expanded)
    ranks: {
        serverwide: [
            { id: "shadow-enchanter", name: "Shadow Enchanter" },
            { id: "void-walker", name: "Void Walker" },
            { id: "ethereal-warden", name: "Ethereal Warden" },
            { id: "astral-guardian", name: "Astral Guardian" }
        ],
        towny: [
            { id: "citizen", name: "Citizen" },
            { id: "merchant", name: "Merchant" },
            { id: "councilor", name: "Councilor" },
            { id: "mayor", name: "Mayor" },
            { id: "governor", name: "Governor" },
            { id: "noble", name: "Noble" },
            { id: "duke", name: "Duke" },
            { id: "king", name: "King" },
            { id: "divine-ruler", name: "Divine Ruler" }
        ]
    }
};
