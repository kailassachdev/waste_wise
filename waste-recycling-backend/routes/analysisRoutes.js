// routes/analysisRoutes.js
const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');

// --- Define Waste Mapping Data (Using TrashNet Classes) ---
const wasteMapping = {
    'cardboard': { item: 'Cardboard', recyclable: true, instructions: 'Flatten box. Keep clean and dry. Recycle with paper/cardboard.' },
    'glass': { item: 'Glass Container', recyclable: true, instructions: 'Empty and rinse. Check local rules for color sorting or if caps should be on/off.' },
    'metal': { item: 'Metal (Aluminum/Steel Can)', recyclable: true, instructions: 'Empty and rinse (optional). Recycle with metal containers.' },
    'paper': { item: 'Paper', recyclable: true, instructions: 'Keep clean and dry. Recycle with paper. Excludes shredded paper unless specifically allowed.' },
    'plastic': { item: 'Plastic Container (Check Type)', recyclable: true, instructions: 'Empty, rinse, check recycling number (#1-7). Recycle if accepted locally. Caps often okay.' },
    'trash': { item: 'General Trash', recyclable: false, instructions: 'Dispose of in regular trash bin. Not recyclable.' }
};
const defaultResult = {
    item: 'Unknown Item',
    recyclable: null,
    instructions: 'Analysis failed or item could not be classified.',
    confidence: 0
};
// --- End Waste Mapping Data ---

const router = express.Router();

// --- Configure Multer ---
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images are allowed.'), false);
        }
    }
});
// --- End Multer Configuration ---


// Define the POST Endpoint
router.post('/', upload.single('image'), (req, res) => { // <<< Handler starts here

    // ---vvv *** THIS PART WAS MISSING/INCORRECT in your last paste *** vvv---

    console.log('Received image analysis request...');

    // Check if a file was actually uploaded
    if (!req.file) {
        console.error('No file uploaded.');
        return res.status(400).json({ message: 'No image file uploaded.' });
    }

    // Log details of the uploaded file
    console.log('Uploaded File Details:');
    console.log('Original Name:', req.file.originalname);
    console.log('MIME Type:', req.file.mimetype);
    console.log('Size:', req.file.size, 'bytes');

    // --- Execute Python Script ---
    console.log('Spawning Python script: image_analyzer.py');
    const pythonProcess = spawn('python', ['image_analyzer.py']); // <<< pythonProcess DEFINED HERE
    let pythonOutput = ''; // Variable to store stdout
    let pythonError = '';  // Variable to store stderr

    // Handle potential errors during script spawning itself
    pythonProcess.on('error', (err) => {
       console.error('Failed to start Python subprocess.', err);
       // Ensure response is sent only once
       if (!res.headersSent) {
           res.status(500).json({ message: 'Analysis service failed to start.', details: err.message });
       }
    });

    // Send the image data from the buffer to the Python script's standard input
    pythonProcess.stdin.write(req.file.buffer);
    pythonProcess.stdin.end(); // Signal that we've finished sending data

    // Listen for data coming from the Python script's standard output
    pythonProcess.stdout.on('data', (data) => {
        pythonOutput += data.toString();
    });

    // Listen for error messages from the Python script's standard error
    pythonProcess.stderr.on('data', (data) => {
        pythonError += data.toString();
        console.error(`Python stderr: ${data}`); // Log Python errors immediately
    });

    // ---^^^ *** End of the previously missing/incorrect part *** ^^^---


    // ---vvv *** Event listener for when the Python script finishes *** vvv---
    pythonProcess.on('close', (code) => {
        console.log(`Python script exited with code ${code}`);

        // Check if the script exited with an error code
        if (code !== 0) {
             console.error(`Python script failed. Stderr: ${pythonError || '(empty)'}, Stdout: ${pythonOutput || '(empty)'}`);
             try {
                 // Attempt to parse the output as JSON, maybe Python sent an error object
                 const errorResult = JSON.parse(pythonOutput);
                  if (errorResult && errorResult.error) {
                      // Send Python's specific error message if available
                      if (!res.headersSent) {
                        res.status(500).json({ message: errorResult.message || 'Analysis failed in Python script (unknown reason).' });
                      }
                  } else {
                      // If Python didn't output error JSON, send generic message
                      if (!res.headersSent) {
                        res.status(500).json({ message: 'Analysis failed in Python script.', details: pythonError || pythonOutput });
                      }
                  }
             } catch(e) {
                  // If parsing pythonOutput fails, send generic message based on stderr or stdout
                  if (!res.headersSent) {
                    res.status(500).json({ message: 'Analysis failed in Python script and could not parse output.', details: pythonError || pythonOutput });
                  }
             }
             return; // Stop further processing if script failed
        }

        // --- Process Successful Python Output ---
        // Only proceed if exit code was 0 (success)
        try {
            const pythonResult = JSON.parse(pythonOutput);
            console.log('Received analysis result from FINE-TUNED Python:', pythonResult);

            // --- Apply Mapping Logic ---
            let finalResult;
            const pythonLabel = pythonResult.item; // e.g., 'glass'

            if (pythonLabel && wasteMapping[pythonLabel]) {
                // Found direct match using TrashNet class name
                finalResult = {
                    ...wasteMapping[pythonLabel],
                    confidence: pythonResult.confidence
                };
                console.log(`Mapped fine-tuned label '${pythonLabel}' to:`, finalResult);
            } else {
                // Handle cases where the label might be missing or not in our map
                finalResult = {
                    ...defaultResult,
                    item: `Unknown (${pythonResult.item || 'N/A'})`,
                    confidence: pythonResult.confidence || 0
                };
                 console.log(`No mapping found for fine-tuned label '${pythonLabel || '(empty)'}'. Using default.`);
            }
            // --- End Mapping Logic ---

            if (!res.headersSent) {
              res.status(200).json(finalResult); // Send the final mapped result to frontend
            }

        } catch (e) {
           // Handle errors during JSON parsing or mapping
           console.error('Error parsing JSON or mapping result from Python script:', e);
           console.error('Raw Python output:', pythonOutput);
           if (!res.headersSent) {
             res.status(500).json({ message: 'Failed to parse result from analysis script.', details: pythonOutput });
           }
        }
    }); // ---^^^ End of '.on('close', ...)' listener ^^^---

}); // ---^^^ End of 'router.post(...)' handler ^^^---


// Error Handling Middleware for Multer errors (Keep this as is)
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        console.error("Multer Error:", error);
        return res.status(400).json({ message: `Upload Error: ${error.message}` });
    } else if (error) {
        console.error("File Filter or General Upload Error:", error);
        return res.status(400).json({ message: error.message || 'File upload failed.' });
    }
    next();
});

module.exports = router;