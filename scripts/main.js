async function startCapture() {

    chrome.scripting
        .executeScript({
            target: { tabId: await getActiveTabId()},
            files: ["script.js"],
        })
        .then(() => console.log("script injected"));
}

async function getActiveTabId() {
    const queryOptions = { active: true, currentWindow: true };
    const [tab] = await chrome.tabs.query(queryOptions);
    return tab.id;
}