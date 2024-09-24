chrome.action.onClicked.addListener(async (tab) => {

    console.log("Action works!");
    chrome.scripting.executeScript({
        target: { tabId: await getCurrentTab(), allFrames: true },
        files: ["scripts/script.js"],
    }).then(() => console.log("script injected"));

});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'capture') {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, async (image) => {
            console.log("Captured");

            sendResponse({imageData: image, area: message.area});
            
        });

        return true;
    }
});

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    console.log(tab.id);
    return tab.id;
}