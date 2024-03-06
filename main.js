function openCvReady() {
    cv['onRuntimeInitialized'] = () => {

        console.log("OpenCV is ready!");

        const videoElement = document.getElementById('video');
        const canvasElement = document.getElementById('main-canvas');
        const canvasCtx = canvasElement.getContext('2d');
        const drawingUtils = window;  // en liens avec le liens Https dans le fichier Html index.html. on l'utilisera pas pour l'instant. Mais plus tard dans la formation

        const canvasDraw = document.getElementById('draw-canvas');
        const drawCtx = canvasDraw.getContext('2d');

        const counterDiv = document.getElementById('counter');

        const chartCtx = document.getElementById('line-chart');
        const slider = document.getElementById('input-slider');
        const adjustSlider = document.getElementById('adjustSlider');

        var cropx = 120;
        var cropy = 0;
        var cropwidth = 720;
        var cropheight = 720;

        blinkCounter = 0  // total number of counts
        isBlinking = false // current state of blink in the current frame
        isBlinkingPre = false // previous frame status of blink
        sensitivity = 38 // less is harder to blink

        var frameCounter = 0;
        var audio1; // Declare audio1 outside the if-else block
        var audio2; // Declare audio2 outside the if-else block
        // var repsCounter = 0;

        drowCounter = 0  // total number of counts of drowsiness

        function onResults(results) {
            // Draw the overlays.
            canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

            if (results.multiFaceLandmarks) {


                for (const landmarks of results.multiFaceLandmarks) {

                    leftUp = landmarks[159]
                    leftDown = landmarks[23]
                    leftLeft = landmarks[130]
                    leftRight = landmarks[243]

                    lengthVer = findDistance(leftUp, leftDown)
                    lengthHor = findDistance(leftLeft, leftRight)
                    // console.log(lengthVer, lengthHor)

                    ratio = (lengthVer / lengthHor) * 100
                    addData(lineChart, frameCounter, ratio)

                    adjustSlider.innerHTML = parseInt(slider.value) + " %";
                    // console.log(repsCounter)

                    if (frameCounter > 75) {
                        removeData(lineChart)
                    }

                    if (drowCounter == 0) {
                        counterDiv.style = "background-color: rgba(55, 201, 239, 0.2);" // default color
                    }
                    if (drowCounter > 0 && drowCounter < 30) {
                        counterDiv.style = "background-color: rgba(255, 123, 0, 0.2);"  // orange
                        if (!audio1) {
                            audio1 = new Audio("../../Resources/Sound/1650.mp3");
                            audio1.volume = 0.2
                            audio1.playbackRate = 2
                        }
                        if (drowCounter >= 8 && drowCounter <= 28) {
                            audio1.play();
                        } else {
                            audio1.pause();
                        }
                    }


                    if (ratio < slider.value) {
                        isBlinking = true
                        drowCounter += 1
                        // console.log(slider.value)
                    } else {
                        drowCounter = 0
                        isBlinking = false
                    }

                    if (isBlinking == false && isBlinkingPre == true) {
                        blinkCounter += 1
                    }

                    isBlinkingPre = isBlinking

                    if (drowCounter > 30) {
                        counterDiv.innerHTML = "Wake UP !!!"
                        counterDiv.style = "background-color: rgba(255, 0, 0, 0.2);"  // red
                        if (!audio2) {
                            audio2 = new Audio("../../Resources/Sound/1649.mp3");
                            audio2.volume = 0.3
                            audio2.playbackRate = 2
                        }
                        document.body.classList.add('flash'); // Start flashing
                        audio2.play();
                    } else {
                        counterDiv.innerHTML = drowCounter
                        if (audio2) {
                            audio2.pause();
                            audio2.src = ""; // Unload the audio file
                            document.body.classList.remove('flash'); // Stop flashing
                            audio2 = null; // Reset audio2
                        }
                    }

                    frameCounter += 1

                    // ********************** Draw using MediaPipe ********************** //

                    // drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, { color: '#FF3030' });

                    // drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, { color: '#30FF30' });

                }
            }

            drawCtx.drawImage(canvasElement, cropx, cropy, cropwidth, cropheight, 0, 0, cropwidth, cropheight);
        }


        // ********************** Initializations ********************** //
        const faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });
        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        faceMesh.onResults(onResults);

        const camera = new Camera(videoElement, {
            onFrame: async () => {
                await faceMesh.send({ image: videoElement });
            },
            width: 640,
            height: 480
        });
        camera.start();

        // ********************** Chart ********************** //

        var xValues = []
        var yValues = []

        lineChart = new Chart(chartCtx, {
            type: 'line',
            data: {
                labels: xValues,
                datasets: [{
                    label: 'Ratio of Vertical and Horizontal distance',
                    data: yValues,
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    };
}


// function to add data to the chart/plot
function addData(chart, x, y) {
    chart.data.labels.push(x);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(y);
    });
    chart.update();
}

// function to remove data from the chart/plot
function removeData(chart) {
    chart.data.labels.shift();
    chart.data.datasets.forEach((dataset) => {
        dataset.data.shift();
    });
    chart.update();
}

// Function to find the distance between 2 landmarks

function findDistance(p1, p2) {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y)
}