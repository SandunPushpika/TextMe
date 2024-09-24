var isClicked = false;
var isCaptureAllowed = true;

var startingX = 0, startingY = 0;

document.body.style.userSelect = "none";

document.body.addEventListener("mousedown", (event) => {
    console.log(event);
    isClicked = true;
    if (isClicked && isCaptureAllowed) {
        startingX = event.clientX;
        startingY = event.clientY;
        document.body.style.cursor = 'crosshair';

        if (document.getElementById('selection-box') != null) {
            document.removeChild("selection-box");
        }

        createSelectionBox(startingX, startingY);
    }
});

document.body.addEventListener("mousemove", (event) => {
    if (isClicked) {
        console.log("X " + event.clientX);
        console.log("Y " + event.clientY);
        updateSelectionArea(event.clientX, event.clientY);
    }
});

document.body.addEventListener("mouseup", async (event) => {

    isClicked = false;
    if (!isClicked) {
        document.body.style.cursor = 'initial';
        finalizeCapture();
    }
});

async function getActiveTabId() {
    const queryOptions = { active: true, currentWindow: true };
    const [tab] = await chrome.tabs.query(queryOptions);
    return tab.id;
}

function createSelectionBox(x, y) {
    const box = document.createElement("div");
    box.id = 'selection-box';
    box.style.position = 'absolute';
    box.style.border = '2px dashed blue';
    box.style.left = `${x}px`;
    box.style.top = `${y}px`;
    document.body.appendChild(box);
}

function updateSelectionArea(x, y) {
    const box = document.getElementById("selection-box");
    box.style.width = `${Math.abs(x - startingX)}px`;
    box.style.height = `${Math.abs(y - startingY)}px`;
    box.style.left = `${Math.min(x, startingX)}px`;
    box.style.top = `${Math.min(y, startingY)}px`;
}

function finalizeCapture() {
    const box = document.getElementById('selection-box');
    if (box) {
        const rect = box.getBoundingClientRect();
        box.style.border = "0px";
        box.remove();

        chrome.runtime.sendMessage({
            action: 'capture',
            area: {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height
            }
        }, processResponse);
    }
}

function processResponse(response) {

    const image = response.imageData;

    const { x, y, width, height } = response.area;

    console.log(image);
    console.log(typeof (image));

    const img = new Image();
    img.src = image;

    img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

        const croppedImage = canvas.toDataURL('image/png');

        downloadImage(croppedImage, 'screenshot.png');

        canvas.toBlob(async (blob) => {
            console.log();
            await sendPostRequestToOCR(blob, "s.png");
        }, "image/png")

        isCaptureAllowed = false;
    };
}

function downloadImage(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
}

async function sendPostRequestToOCR(file){
    
    var formData = new FormData();
    formData.append("file",file);
    formData.append("apikey","K86024030188957");
    formData.append("filetype","png");
    
    var res = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData
    })

    var res = await res.json();
    if(res == null)
        return;

    let texts = "";
    res.ParsedResults.forEach(element => {
        texts = texts + element.ParsedText;
    });

    console.log(texts);
    navigator.clipboard.writeText(texts);
}
