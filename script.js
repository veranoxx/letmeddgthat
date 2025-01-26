const customCursor = 'ontouchstart' in window ? document.getElementById('touchscreen-cursor') : document.getElementById('custom-cursor');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const instructions = document.querySelector('.instructions');

const simulatedCursor = document.createElement('span');
simulatedCursor.id = 'cursor';
searchInput.parentNode.appendChild(simulatedCursor);

simulatedCursor.style.display = 'none';

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

function measureTextWidth(text, font) {
    ctx.font = font;
    return ctx.measureText(text).width;
}

function moveSimulatedCursor() {
    const inputStyle = window.getComputedStyle(searchInput);
    const font = `${inputStyle.fontSize} ${inputStyle.fontFamily}`;
    
    const textWidth = measureTextWidth(searchInput.value, font);
    
    const inputRect = searchInput.getBoundingClientRect();
    const cursorPosition = inputRect.left + textWidth + 11;
    
    simulatedCursor.style.position = 'absolute';
    simulatedCursor.style.left = `${cursorPosition}px`;

    simulatedCursor.style.top = `${inputRect.top + parseInt(inputStyle.fontSize) - 2}px`;
}

function initializeCursor() {
    const inputRect = searchInput.getBoundingClientRect();
    simulatedCursor.style.position = 'absolute';
    simulatedCursor.style.left = `${inputRect.left + 8}px`;
    simulatedCursor.style.top = `${inputRect.top + parseInt(window.getComputedStyle(searchInput).fontSize) - 2}px`; // Match vertical position
}

function moveCursor(x, y, delay = 100) {
    return new Promise((resolve) => {
        customCursor.style.display = 'block';
        customCursor.style.transition = `transform ${delay}ms ease-out`;
        customCursor.style.transform = `translate(${x}px, ${y}px)`;
        setTimeout(resolve, delay);
    });
}

function clickCursor() {
    return new Promise((resolve) => {
        customCursor.style.transition = 'transform 0.1s ease-in-out';
        customCursor.style.transform += ' scale(0.8)';

        setTimeout(() => {
            customCursor.style.transform = customCursor.style.transform.replace(' scale(0.8)', '');
            setTimeout(resolve, 100);

            if (simulatedCursor.style.display === 'none') {
                simulatedCursor.style.display = 'inline-block';
                initializeCursor();
            }
        }, 100);
    });
}

function typeInSearch(text) {
    return new Promise((resolve) => {
        searchInput.focus();
        let index = 0;
        const baseTypingSpeed = 100;
        const typingSpeed = text.length > 20 ? baseTypingSpeed * (20 / text.length) : baseTypingSpeed;

        simulatedCursor.style.animation = 'none';

        function typeCharacter() {
            searchInput.value = text.slice(0, index + 1);
            moveSimulatedCursor();

            index++;
            if (index === text.length) {
                simulatedCursor.style.animation = 'blink 1s step-start infinite';
                resolve();
            } else {
                setTimeout(typeCharacter, typingSpeed);
            }
        }

        typeCharacter();
    });
}


function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkProfanity(searchQuery) {
    try {
        const response = await fetch('./profanity.json');
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();

        const lowerCaseText = searchQuery.toLowerCase();

        for (const wordObj of data) {
            const regexPattern = '\\b' + wordObj.match.replace(/\*/g, '\\w*') + '\\b';
            const regex = new RegExp(regexPattern, 'i');

            if (regex.test(lowerCaseText)) {
                if (wordObj.exceptions && wordObj.exceptions.length > 0) {
                    for (const exception of wordObj.exceptions) {
                        const exceptionPattern = '\\b' + exception.replace(/\*/g, '\\w*') + '\\b';
                        const exceptionRegex = new RegExp(exceptionPattern, 'i');

                        if (exceptionRegex.test(lowerCaseText)) {
                            return false;
                        }
                    }
                }
                return true;
            }
        }
        return false; 
    } catch (error) {
        return false;
    }
}


async function simulateActions() {
    const urlParams = new URLSearchParams(window.location.search);
    let searchQuery = urlParams.get('q') || 'Default search query';
    const isProfane = await checkProfanity(searchQuery);

    function isBase64(str) {
        try {
            return btoa(atob(str)) === str;
        } catch (err) {
            return false;
        }
    }

    if (isBase64(searchQuery)) {
        searchQuery = atob(searchQuery);
    }

    if (isProfane) {
        alert('We cannot process your search due to our guidelines.');
        window.location.replace('https://duckduckgo.com/');
    } else {
        const userLang = navigator.language || navigator.userLanguage;
        const isGerman = userLang.startsWith('de');

        const instructionsText = {
            step1: isGerman ? 'Schritt 1: Klicke auf die Suchleiste' : 'Step 1: Click the search bar',
            step2: isGerman ? 'Schritt 2: Gib deine Frage ein' : 'Step 2: Type in your question',
            step3: isGerman ? 'Schritt 3: Klicke auf Suchen' : 'Step 3: Click the search button',
            final: isGerman ? 'Komm schon, versuche es das nächste Mal selbst!' : 'Come on, try it yourself next time!'
        };

        instructions.innerHTML = instructionsText.step1;
        instructions.style.display = 'block';
        initializeCursor();
        const isTouchscreen = 'ontouchstart' in window;
        let isMobile = window.innerWidth < 768;

        await moveCursor(50, 100 - (isTouchscreen ? 15 : 0), 500);
        await moveCursor(-20, 0 - (isTouchscreen ? 15 : 0), 700);
        await clickCursor();
        await timeout(300);
        instructions.innerHTML = instructionsText.step2;

        await typeInSearch(searchQuery);
        await timeout(200);

        isMobile = window.innerWidth < 768;
        await moveCursor(290 - (isMobile ? 152 : 0), 0 - (isTouchscreen ? 15 : 0), 600);
        instructions.innerHTML = instructionsText.step3;
        await timeout(400);
        await clickCursor();
        await timeout(1000);
        instructions.innerHTML = instructionsText.final;
        await timeout(1500);
        if (!isBase64(searchQuery)) {
            searchQuery = encodeURIComponent(searchQuery);
        }
        window.location.replace(`https://duckduckgo.com/?q=${searchQuery}`);
    }
}

async function initializeCreation() {
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('q')) {
        document.body.style.cursor = 'default';
        document.querySelectorAll('*').forEach(element => {
            element.style.cursor = 'default';
        });

        searchInput.removeAttribute('readonly');
        searchInput.placeholder = 'Type in your search query';
        document.querySelector('.submitsearch').style.display = 'none';
        searchInput.focus();
        document.querySelector('.title').style.display = 'block';
        document.querySelector('.create').style.display = 'block';

        document.querySelector('.create-link').addEventListener('click', async () => {
            handleCreateLink();
        });

        searchInput.addEventListener('keypress', async (event) => {
            if (event.key === 'Enter') {
            event.preventDefault();
            await handleCreateLink();
            }
        });

        async function handleCreateLink() {
            const hideQuery = document.getElementById('hide-query').checked;
            let query = searchInput.value.trim();
            const isProfane = await checkProfanity(query);

            if (query) {
                if (isProfane) {
                    alert('We cannot process your search due to our guidelines.');
                    return;
                }

                if (hideQuery) {
                    query = btoa(query);
                }
                const link = `${window.location.origin}${window.location.pathname}?q=${encodeURIComponent(query)}`;
                const outputDiv = document.querySelector('.output');
                outputDiv.style.display = 'block';
                outputDiv.innerHTML = `<a href="${link}" target="_blank">${link}</a>`;
                const copyButton = document.querySelector('.copy-output');
                const previewButton = document.querySelector('.preview-link');
                const buttons = document.querySelector('.buttons');

                buttons.style.display = 'block';

                copyButton.addEventListener('click', () => {
                    const outputLink = document.querySelector('.output a');
                    if (outputLink) {
                        navigator.clipboard.writeText(outputLink.href);
                    }
                });

                previewButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    const outputLink = document.querySelector('.output a');
                    if (outputLink) {
                        if (!previewButton.clicked) {
                            window.open(outputLink.href, '_blank');
                            previewButton.clicked = true;
                            setTimeout(() => {
                                previewButton.clicked = false;
                            }, 1000);
                        }
                    }
                });


                document.querySelectorAll('*').forEach(element => {
                    element.style.cursor = 'default';
                });
            } else {
                alert('Please enter a search query.');
            }
        };
    } else {
        simulateActions();
    }
};

initializeCreation();