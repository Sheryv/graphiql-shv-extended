chrome.action.onClicked.addListener((tab) => {
    // Open index.html in a new browser tab
    chrome.tabs.create({
        url: chrome.runtime.getURL("index.html")
    });
});


const CORS_RULES = [
    {
        id: 1,
        priority: 1,
        action: {
            type: "modifyHeaders",
            responseHeaders: [
                {
                    header: "Access-Control-Allow-Origin",
                    operation: "set",
                    value: "*"
                },
                {
                    header: "Access-Control-Allow-Methods",
                    operation: "set",
                    value: "GET, POST, PUT, DELETE, OPTIONS"
                },
                {
                    header: "Access-Control-Allow-Headers",
                    operation: "set",
                    value: "Content-Type, Authorization"
                }
            ]
        },
        condition: {
            // Applies to all URLs. You can restrict this to specific domains if needed.
            urlFilter: "*",
            // Ensures it only triggers for requests originating from your extension
            initiatorDomains: [chrome.runtime.id]
        }
    }
];

// Register the rules when the extension is installed or initialized
chrome.runtime.onInstalled.addListener(async () => {
    // Clear any existing dynamic rules first to avoid duplicate ID errors
    const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
    const oldRuleIds = oldRules.map(rule => rule.id);

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: oldRuleIds,
        addRules: CORS_RULES
    });

    console.log("CORS bypass rules successfully injected!");
});
