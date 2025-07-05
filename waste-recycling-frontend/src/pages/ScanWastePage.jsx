// src/pages/ScanWastePage.jsx
import React, { useState, useRef, useEffect } from 'react'; // Import necessary hooks
import styles from './ScanWastePage.module.css';
import { useAuth } from '../context/AuthContext'; // To get user for API calls

// --- Configuration ---
const POINTS_PER_RECYCLABLE = 10; // Points awarded for recyclable items scanned
const POINTS_FOR_CALL = 50;       // Points awarded for clicking 'call' button

function ScanWastePage() {
    // --- State Variables ---
    const [selectedImage, setSelectedImage] = useState(null);       // Holds the File/Blob object to be analyzed
    const [imagePreview, setImagePreview] = useState('');           // Data URL for the <img> preview tag
    const [analysisResult, setAnalysisResult] = useState(null);     // Stores result or error from backend analysis
    const [isLoading, setIsLoading] = useState(false);              // Tracks analysis loading state
    const [pointsAwarded, setPointsAwarded] = useState(0);          // Stores points value for notification display
    const [showPointsNotification, setShowPointsNotification] = useState(false); // Controls visibility of points notification
    const [isCameraOpen, setIsCameraOpen] = useState(false);        // Tracks if the camera view is active
    const [videoStream, setVideoStream] = useState(null);           // Holds the active MediaStream from the camera
    const [cameraError, setCameraError] = useState('');             // Stores camera-specific error messages

    // --- Refs ---
    const fileInputRef = useRef(null); // Ref to the hidden file input element
    const videoRef = useRef(null);     // Ref to the <video> element for camera stream
    const canvasRef = useRef(null);    // Ref to the hidden <canvas> for capturing frames

    // --- Hooks ---
    const { currentUser } = useAuth(); // Get the currently logged-in user object

    // --- Effect for Cleanup ---
    // Ensures the camera stream is stopped if the component unmounts
    useEffect(() => {
        // Return the cleanup function
        return () => {
            stopVideoStream();
        };
    }, []); // Empty dependency array means this cleanup runs only on unmount

    // --- Effect to Attach MediaStream to Video Element ---
    // This runs when the videoStream state changes
    useEffect(() => {
        if (videoRef.current && videoStream) {
            console.log("[Stream Effect] Attaching stream to video element.");
            videoRef.current.srcObject = videoStream;
        } else {
            // This might log initially before refs are ready or if stream is null
            console.log("[Stream Effect] videoRef or videoStream not ready.", { hasRef: !!videoRef.current, hasStream: !!videoStream });
        }
    }, [videoStream]); // Dependency array: re-run ONLY when videoStream changes


    // --- Logging for Debugging ---
    // Log state on every render to track changes
    // console.log("[ScanWastePage Render] State:", {
    //     isCameraOpen,
    //     selectedImage: selectedImage ? `File: ${selectedImage.name}` : null,
    //     imagePreview: imagePreview ? 'Preview Set' : 'No Preview',
    //     isLoading,
    //     analysisResult: analysisResult ? 'Result/Error Set' : null
    // });


    // --- Camera & Stream Handling Functions ---

    // Stops the tracks of the current video stream
    const stopVideoStream = () => {
        if (videoStream) {
            console.log("[stopVideoStream] Stopping video stream tracks.");
            videoStream.getTracks().forEach(track => track.stop());
            setVideoStream(null); // Clear the stream state
        }
    };

    // Opens the camera and displays the stream
    const openCamera = async () => {
        console.log("[openCamera] Attempting to open camera...");
        // Stop previous stream and clear related states
        stopVideoStream();
        setCameraError('');
        setImagePreview('');
        setSelectedImage(null); // Ensure no previous image is selected
        setAnalysisResult(null);

        // Define camera constraints
        const constraints = { video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } };

        try {
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log("[openCamera] Camera access granted.");
            // Set state to trigger the useEffect for attaching the stream
            setVideoStream(stream);
            setIsCameraOpen(true); // Show the camera UI

        } catch (err) {
            console.error("[openCamera] Error accessing camera:", err.name, err.message);
            let userMessage = 'Could not access camera.';
            // Provide more specific error messages
            if (err.name === "NotAllowedError") userMessage = 'Permission denied. Please allow camera access.';
            else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") userMessage = 'No camera found.';
            else if (err.name === "NotReadableError" || err.name === "TrackStartError") userMessage = 'Camera might be already in use.';
            else if (err.name === "OverconstrainedError" || err.name === "ConstraintNotSatisfiedError") {
                 userMessage = 'Camera constraints failed. Trying default...';
                 try { // Attempt fallback with default constraints
                     console.log("[openCamera] Retrying with default video constraints...");
                     const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
                     console.log("[openCamera] Fallback camera access granted.");
                     setVideoStream(fallbackStream); // Set state to trigger useEffect
                     setIsCameraOpen(true);
                     return; // Exit after successful fallback
                 } catch (fallbackErr) {
                     console.error("[openCamera] Fallback camera access error:", fallbackErr);
                     userMessage = 'Could not access camera (fallback failed).';
                 }
            }
            // Update state on error
            setCameraError(userMessage);
            setIsCameraOpen(false); // Hide camera UI
            stopVideoStream(); // Ensure stream is stopped
        }
    };

    // Closes the camera view and stops the stream
    const closeCamera = () => {
        console.log("[closeCamera] Closing camera view and stopping stream.");
        stopVideoStream();
        setIsCameraOpen(false);
        setCameraError('');
    };

    // Captures a photo from the video stream using the canvas
    const takePhoto = () => {
        console.log("[takePhoto] Attempting to capture photo...");
        // Check if video element is ready and has dimensions
        if (!videoRef.current || !canvasRef.current || !videoRef.current.videoWidth || !videoRef.current.videoHeight || videoRef.current.videoWidth === 0) {
            console.error("[takePhoto] Refs or video dimensions not ready.", { vw: videoRef?.current?.videoWidth, vh: videoRef?.current?.videoHeight });
            setCameraError("Capture error: Video stream not ready or sized.");
            setSelectedImage(null); // Make sure no image is selected if capture fails early
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Match canvas size to video's actual resolution
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Use a small delay before drawing, helps ensure frame is rendered
        setTimeout(() => {
            try {
                // Draw video frame to canvas
                console.log(`[takePhoto Timeout] Drawing video frame (${canvas.width}x${canvas.height}) to canvas.`);
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Get Data URL for preview
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                setImagePreview(dataUrl); // Update preview state
                console.log("[takePhoto Timeout] Preview set from Data URL.");

                // Convert canvas to Blob -> File for analysis state
                canvas.toBlob(blob => {
                    console.log("[takePhoto Callback] Entered toBlob callback.");
                    if (blob) {
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                        const fileName = `capture-${timestamp}.jpg`;
                        const imageFile = new File([blob], fileName, { type: 'image/jpeg' });
                        console.log("[takePhoto Callback] Preparing to set selectedImage state:", imageFile);
                        setSelectedImage(imageFile); // <<<<< SET STATE for analysis button
                    } else {
                        console.error("[takePhoto Callback] Canvas toBlob failed to create Blob.");
                        setCameraError("Failed to create image file from capture.");
                        setSelectedImage(null); // Ensure no image selected on failure
                    }
                }, 'image/jpeg', 0.9); // Specify type and quality

            } catch (drawError) {
                 console.error("[takePhoto Timeout] Error during drawImage or toBlob:", drawError);
                 setCameraError("Failed to process captured image.");
                 setSelectedImage(null); // Ensure no image selected on error
            }
        }, 50); // 50ms delay

        // Close the camera UI after initiating the capture process
        closeCamera();
    };


    // --- File Upload Handling ---

    // Handles selecting a file via the input element
    const handleImageChange = (event) => {
         console.log("[handleImageChange] File input changed.");
         setIsCameraOpen(false); stopVideoStream(); // Close camera if it was open
         const file = event.target.files[0];
         if (file && file.type.startsWith('image/')) {
             setSelectedImage(file);
             const reader = new FileReader();
             reader.onloadend = () => setImagePreview(reader.result);
             reader.readAsDataURL(file);
             setAnalysisResult(null); setShowPointsNotification(false);
             console.log("[handleImageChange] Image file selected and preview set.");
         } else {
             setSelectedImage(null); setImagePreview(''); setAnalysisResult(null);
             if (file) alert("Please select a valid image file.");
             console.log("[handleImageChange] No valid image file selected.");
         }
     };

    // Handles clicking the "Upload Image" or "Change File" button
    const handleUploadButtonClick = () => {
        console.log("[handleUploadButtonClick] Upload/Change File button clicked.");
        setIsCameraOpen(false); stopVideoStream(); // Ensure camera is closed
        fileInputRef.current.click(); // Trigger the hidden file input
    };


    // --- Points and Analysis Logic ---

    // Function to call the backend API to award points
    const handleAwardPoints = async (points) => {
        if (!currentUser) {
            console.warn("[handleAwardPoints] User not logged in. Cannot award points.");
            return;
        }
        console.log(`[handleAwardPoints] Attempting award: ${points} pts for ${currentUser.uid}`);
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch('http://localhost:5000/api/users/me/score', { // Verify URL/Port
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ points: points })
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || `API Error ${response.status}`);
            }
            const result = await response.json();
            console.log("[handleAwardPoints] API Success:", result.message);
            // Show UI notification only on success
            setPointsAwarded(points);
            setShowPointsNotification(true);
            setTimeout(() => setShowPointsNotification(false), 3000);
        } catch (error) {
            console.error("[handleAwardPoints] Error updating score:", error);
            // Optionally show error to user
        }
    };

    // Function to send the selected image (File/Blob) to the backend for analysis
    const handleAnalyzeClick = async () => {
        if (!selectedImage) {
            alert('Please select an image first!');
            return;
        }
        // Reset state for analysis
        setIsLoading(true);
        setAnalysisResult(null);
        setShowPointsNotification(false);
        const formData = new FormData();
        formData.append('image', selectedImage); // Append the File or Blob object

        console.log(`[handleAnalyzeClick] Sending image (${selectedImage.name}, ${selectedImage.size} bytes) to backend...`);
        try {
            const backendUrl = 'http://localhost:5000/api/analyze'; // Verify URL/Port
            const response = await fetch(backendUrl, { method: 'POST', body: formData });

            // Handle analysis API errors
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                console.error('[handleAnalyzeClick] Backend Analysis Error Response:', errData);
                throw new Error(errData.message || `Analysis HTTP error ${response.status}`);
            }

            // Process successful analysis result
            const result = await response.json();
            console.log('[handleAnalyzeClick] Analysis result received:', result);
            setAnalysisResult(result); // Update state to display results

            // Award points if the item is recyclable
            if (result && result.recyclable === true && !result.error) {
                console.log('[handleAnalyzeClick] Item is recyclable. Calling handleAwardPoints...');
                handleAwardPoints(POINTS_PER_RECYCLABLE);
            } else {
                console.log('[handleAnalyzeClick] Item not recyclable or result error. No points for scan.');
            }
        } catch (error) {
            console.error('[handleAnalyzeClick] Error during analysis process:', error);
            // Set error state for display
            setAnalysisResult({ error: true, message: `Analysis Failed: ${error.message}` });
        } finally {
            setIsLoading(false); // Stop loading indicator
        }
    };

    // Handler for the "Call Waste Management" button
    const handleCallWasteManagementClick = () => {
         console.log("[handleCallWasteManagementClick] 'Call' button clicked, awarding points...");
         handleAwardPoints(POINTS_FOR_CALL);
         // Consider adding logic to disable button after click if needed
    };


    // --- Component JSX Rendering ---
    return (
        <div className={styles.container}>
            <h2>Scan Waste Item</h2>

            {/* Render EITHER Camera UI OR File/Preview UI */}
            {isCameraOpen ? (
                // --- Camera View ---
                <div className={styles.cameraView}>
                    {cameraError && <div className={styles.errorBanner}>{cameraError}</div>}
                    <video ref={videoRef} autoPlay playsInline muted className={styles.videoFeed}></video>
                    {/* Canvas for frame capture (hidden) */}
                    <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                    <div className={styles.cameraControls}>
                        <button onClick={takePhoto} className={styles.captureButton}>📸 Take Photo</button>
                        <button onClick={closeCamera} className={styles.cancelButton}>Cancel Camera</button>
                    </div>
                </div>
            ) : (
                // --- File Upload / Preview View ---
                <>
                    <p>Upload an image or use your camera.</p>
                    {/* Hidden input for file selection */}
                    <input type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} style={{ display: 'none' }} id="imageUpload" />

                    {/* Show Initial Choice Buttons OR Preview with Change Buttons */}
                    {!imagePreview ? (
                        <div className={styles.choiceButtons}>
                            <button onClick={handleUploadButtonClick} className={styles.uploadButton}>Upload Image File</button>
                            <button onClick={openCamera} className={styles.cameraButton}>Use Camera</button>
                        </div>
                    ) : (
                        <div className={styles.previewContainer}>
                            <img src={imagePreview} alt="Selected waste item" className={styles.imagePreview} />
                            <button onClick={handleUploadButtonClick} className={`${styles.uploadButton} ${styles.changeButton}`}>Change File</button>
                            <button onClick={openCamera} className={styles.cameraButton} style={{ marginLeft: '10px' }}>Use Camera Instead</button>
                        </div>
                    )}

                    {/* Analyze Button - Rendered conditionally */}
                    {/* Debug Log for Analyze Button Condition */}
                    {/* {console.log("[Render Check] Analyze Button Condition:", { hasSelectedImage: !!selectedImage, isLoading: isLoading })} */}
                    {selectedImage && !isLoading && (
                        <button onClick={handleAnalyzeClick} className={styles.analyzeButton}>Analyze Image</button>
                    )}
                </>
            )}

            {/* Common elements shown below either Camera or File UI */}

            {/* Points Notification */}
            {showPointsNotification && (
                <div className={styles.pointsNotification}>
                    +{pointsAwarded} Points! ✨
                </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
                <div className={styles.loadingIndicator}>Analyzing... Please wait.</div>
            )}

            {/* Analysis Results Area */}
            {!isLoading && analysisResult && (
                <div className={`${styles.resultsContainer} ${analysisResult.error ? styles.errorResult : ''}`}>
                    <h3>Analysis Results</h3>
                    {analysisResult.error ? (
                        <p><strong>Error:</strong> {analysisResult.message}</p>
                    ) : (
                        <>
                            <p><strong>Item:</strong> {analysisResult.item}</p>
                            <p><strong>Recyclable:</strong> {analysisResult.recyclable === true ? 'Yes' : analysisResult.recyclable === false ? 'No (Curbside)' : 'Check Locally'}</p>
                            <p><strong>Instructions:</strong> {analysisResult.instructions}</p>
                            <p><strong>Confidence:</strong> {(analysisResult.confidence * 100).toFixed(1)}%</p>
                            {/* Call Waste Management Button - Rendered conditionally */}
                            {!analysisResult.error && analysisResult.recyclable !== true && (
                                <div className={styles.callButtonContainer}>
                                    <button onClick={handleCallWasteManagementClick} className={styles.callButton}>
                                        📞 Call Waste Management (Get {POINTS_FOR_CALL} Points)
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div> // End container
    ); // End return
} // End ScanWastePage component

export default ScanWastePage;