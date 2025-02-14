let errorMessage = document.getElementById('errorMessage');
let playButton = document.getElementById('playButton');
let pauseButton = document.getElementById('pauseButton');
let trackbar = document.getElementById('trackbar');
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let audio = new Audio();
let audioContext, analyser, source, dataArray, bufferLength;
let isPlaying = false;

canvas.width = window.innerWidth * 0.8;
canvas.height = 300;

audio.addEventListener('timeupdate', updateTrackbar);
audio.addEventListener('ended', onAudioEnded);

document.getElementById("audioFile").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);

        if (isPlaying) {
            audio.pause();
            isPlaying = false;
            playButton.textContent = "Play";
            pauseButton.disabled = true;
            trackbar.disabled = true;
        }
        
        if (source) {
            source.disconnect();
            analyser.disconnect();
        }
        
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
        
        audio.pause();
        audio = new Audio();
        audio.addEventListener('timeupdate', updateTrackbar);
        audio.addEventListener('ended', onAudioEnded);
        audio.src = url;
        
        errorMessage.style.display = 'none';
    } else {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Please Select an Audio File';
    }
});

function setupAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        analyser.fftSize = 256;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
    }
}

function playAudio() {
    if(!audio.src) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = "No audio file selected.";
        return;
    }
    
    if (!audioContext) {
        setupAudioContext();
    }
    
    if (audioContext && audioContext.state === "suspended") {
        audioContext.resume();
    }

    if (isPlaying) {
        audio.currentTime = 0;
        audio.pause();
        playButton.textContent = "Play";
        pauseButton.disabled = true;
        trackbar.disabled = true;
    } else {
        audio.play();
        playButton.textContent = "Stop";
        pauseButton.disabled = false;
        trackbar.disabled = false; 
    }

    isPlaying = !isPlaying;
}

function pauseAudio() {
    audio.pause();
    playButton.textContent = "Play";
    pauseButton.disabled = true;
    trackbar.disabled = true;
    isPlaying = false;
}

function updateTrackbar() {
    let progress = (audio.currentTime / audio.duration) * 100;
    trackbar.value = progress;
}

function seekAudio(event) {
    let position = (event.target.value / 100) * audio.duration;
    audio.currentTime = position;
}

function onAudioEnded() {
    playButton.textContent = "Play";
    pauseButton.disabled = true;
    trackbar.disabled = true;
    isPlaying = false;
}

let particles = [];

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    
    if (!analyser) return;
    
    try {
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i];

            ctx.fillStyle = `rgb(${barHeight + 50}, ${barHeight / 2}, 255)`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            if (barHeight > 150) {
                particles.push({ x: x, y: canvas.height - barHeight, alpha: 1.0 });
            }

            x += barWidth + 2;
        }

        particles.forEach((p, index) => {
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
            p.y -= 2;
            p.alpha -= 0.02;
            if (p.alpha <= 0) particles.splice(index, 1);
        });
    } catch (e) {
        console.error("Error in visualizer:", e);
    }
}

drawVisualizer();