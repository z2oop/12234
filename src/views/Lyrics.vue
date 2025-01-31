<template>
    <div class="lyrics-container">
        <!-- 控制栏 -->
        <div class="controls-overlay">
            <div class="controls-wrapper" :class="{ 'locked-controls': isLocked }">
                <template v-if="!isLocked">
                    <button @click="sendAction('previous-song')">
                        <i class="fas fa-step-backward"></i>
                    </button>
                    <button @click="togglePlay">
                        <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
                    </button>
                    <button @click="sendAction('next-song')">
                        <i class="fas fa-step-forward"></i>
                    </button>
                </template>
                <button @click="toggleLock" class="lock-button">
                    <i :class="isLocked ? 'fas fa-lock' : 'fas fa-lock-open'"></i>
                </button>
                <template v-if="!isLocked">
                    <button @click="sendAction('close-lyrics')">
                        <i class="fas fa-times"></i>
                    </button>
                </template>
            </div>
        </div>
        <!-- 歌词内容 -->
        <div class="lyrics-container" id="lyricsContainer">暂无歌词</div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
const isPlaying = ref(false)
const isLocked = ref(false)
let controlsOverlay = null;
const handleMouseMove = () => setWindowIgnoreMouseEvents(false);
const handleMouseLeave = () => setWindowIgnoreMouseEvents(true);
// 存储状态的对象
const state = {
    lyricsContainer: null,
    lyrics: [],
    currentTime: 0,
    duration: 0,
    currentLineIndex: 0,
    displayedLines: [0, 1]
};

onMounted(() => {
    const savedConfig = JSON.parse(localStorage.getItem('settings'));
    const lyricsFontSize = savedConfig?.lyricsFontSize || '32px';
    document.querySelector('.lyrics-container').style.fontSize = lyricsFontSize;
    isLocked.value = localStorage.getItem('lyrics-lock') === 'true'
    setWindowIgnoreMouseEvents(true);
    controlsOverlay = document.querySelector('.controls-overlay');
    controlsOverlay.addEventListener('mousemove', handleMouseMove);
    controlsOverlay.addEventListener('mouseleave', handleMouseLeave);
})

// 设置歌词数据
function setLyrics(lyricsData) {
    state.lyrics = lyricsData;
    state.duration = Math.max(...state.lyrics.flatMap(line =>
        line.characters.map(char => char.endTime / 1000)
    ));
    renderLyrics();
}

// 渲染歌词
function renderLyrics() {
    state.lyricsContainer.innerHTML = '';
    const currentLine = document.createElement('div');
    currentLine.className = 'lyrics-line current';
    const nextLine = document.createElement('div');
    nextLine.className = 'lyrics-line next';

    updateLineContent(currentLine, state.lyrics[0]);
    if (state.lyrics.length > 1) {
        updateLineContent(nextLine, state.lyrics[1]);
    }

    state.lyricsContainer.appendChild(currentLine);
    state.lyricsContainer.appendChild(nextLine);
}

// 更新行内容
function updateLineContent(lineElement, lyricLine) {
    lineElement.innerHTML = '';
    const contentDiv = document.createElement('div');
    contentDiv.className = 'lyrics-content';

    lyricLine.characters.forEach(char => {
        const span = document.createElement('span');
        span.textContent = char.char;
        span.className = 'character';
        span.dataset.startTime = char.startTime / 1000;
        span.dataset.endTime = char.endTime / 1000;
        contentDiv.appendChild(span);
    });

    lineElement.appendChild(contentDiv);
}

// 更新高亮
function updateHighlight() {
    const allChars = document.querySelectorAll('.character');
    const currentTime = state.currentTime * 1000;
    let currentChar = null;

    for (let i = 0; i < state.lyrics.length; i++) {
        const line = state.lyrics[i];
        const lineStartTime = line.characters[0].startTime;
        const lineEndTime = line.characters[line.characters.length - 1].endTime;

        if (currentTime >= lineStartTime && currentTime <= lineEndTime) {
            if (state.currentLineIndex !== i) {
                state.currentLineIndex = i;
                updateDisplayedLines();
            }
            break;
        }
    }

    allChars.forEach(char => {
        const startTime = parseFloat(char.dataset.startTime);
        const endTime = parseFloat(char.dataset.endTime);
        const progress = (state.currentTime - startTime) / (endTime - startTime);

        if (state.currentTime < startTime) {
            char.style.backgroundImage = `linear-gradient(to right, #FF69B4 0%, #FF69B4 0%, #999 0%)`;
        } else if (state.currentTime >= endTime) {
            char.style.backgroundImage = `linear-gradient(to right, #FF69B4 0%, #FF69B4 100%, #999 100%)`;
        } else {
            const fillPercent = Math.max(0, Math.min(100, progress * 100));
            char.style.backgroundImage = `linear-gradient(to right, #FF69B4 0%, #FF69B4 ${fillPercent}%, #999 ${fillPercent}%)`;
            currentChar = char;
        }
    });

    // 处理滚动
    if (currentChar) {
        const line = currentChar.closest('.lyrics-line');
        const content = currentChar.closest('.lyrics-content');
        const charRect = currentChar.getBoundingClientRect();
        const lineRect = line.getBoundingClientRect();

        const contentWidth = content.offsetWidth;
        const lineWidth = line.offsetWidth;

        if (contentWidth > lineWidth) {
            const charLeft = charRect.left - lineRect.left;
            const targetPosition = lineWidth * 0.3;
            const scrollAmount = -(charLeft - targetPosition);

            const maxScroll = 0;
            const minScroll = -(contentWidth - lineWidth);
            const finalScroll = Math.min(maxScroll, Math.max(minScroll, scrollAmount));

            content.style.transform = `translateX(${finalScroll}px)`;
        }
    }
}

// 更新显示的行
function updateDisplayedLines() {
    const currentLine = document.querySelector('.lyrics-line.current');
    const nextLine = document.querySelector('.lyrics-line.next');

    if (state.currentLineIndex > state.displayedLines[1]) {
        const oldContent = currentLine.querySelector('.lyrics-content');
        if (oldContent) {
            oldContent.style.transform = 'translateX(0)';
        }

        state.displayedLines = [state.currentLineIndex, state.currentLineIndex + 1];

        if (state.currentLineIndex < state.lyrics.length) {
            updateLineContent(currentLine, state.lyrics[state.currentLineIndex]);
        }
        if (state.currentLineIndex + 1 < state.lyrics.length) {
            updateLineContent(nextLine, state.lyrics[state.currentLineIndex + 1]);
        }
    }
}

window.electron.ipcRenderer.on('lyrics-data', (newLyrics) => {
    state.lyricsContainer = state.lyricsContainer ? state.lyricsContainer : document.getElementById('lyricsContainer');
    setLyrics(newLyrics);
});


window.electron.ipcRenderer.on('update-current-time', (time) => {
    state.currentTime = time;
    updateHighlight();
});

window.electron.ipcRenderer.on('lyrics-font-size', (fontSize) => {
    document.querySelector('.lyrics-content').style.fontSize = fontSize;
});

const sendAction = (action) => {
    window.electron.ipcRenderer.send('desktop-lyrics-action', action);
}

const setWindowIgnoreMouseEvents = (ignore) => {
    window.electron.ipcRenderer.send('set-ignore-mouse-events', ignore);
};

const togglePlay = () => {
    isPlaying.value = !isPlaying.value
    sendAction('toggle-play');
}

const toggleLock = () => {
    isLocked.value = !isLocked.value
    localStorage.setItem('lyrics-lock', isLocked.value)
}

onBeforeUnmount(() => {
    controlsOverlay.removeEventListener('mousemove', handleMouseMove);
    controlsOverlay.removeEventListener('mouseleave', handleMouseLeave);
})
</script>

<style>
body,
html {
    background-color: rgba(0, 0, 0, 0);
}

.character {
    display: inline-block;
    color: transparent;
    position: relative;
    margin: 0 2px;
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    font-weight: bold;
}

.lyrics-container {
    backdrop-filter: blur(8px);
    border-radius: 8px;
    user-select: none;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: inherit;
    width: 100%;
}

.controls-overlay {
    opacity: 0;
    transition: opacity 0.3s ease;
    margin-top: 10px;
}

.controls-overlay:hover {
    opacity: 1;
}

.controls-wrapper {
    display: flex;
    gap: 15px;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    padding: 6px;
    border-radius: 20px;
    backdrop-filter: blur(4px);
    transition: all 0.3s ease;
    width: 430px;
}

.lock-button {
    position: relative;
    z-index: 3;
}

.lock-button i {
    font-size: 13px !important;
}

.controls-wrapper.locked-controls {
    background: none;
    padding: 0;
    width: auto;
}

.controls-wrapper button {
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.controls-wrapper i {
    font-size: 16px;
}

.lyrics-line {
    overflow: hidden;
    position: relative;
}

.lyrics-line.current {
    text-align: left;
}

.lyrics-line.next {
    text-align: right;
}

.lyrics-content {
    display: inline-block;
    white-space: nowrap;
    transition: transform 0.3s ease-out;
}
</style>