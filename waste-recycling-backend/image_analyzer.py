# image_analyzer.py
import sys
import io
import json
import numpy as np
from PIL import Image
import torch
import torchvision.models as models
import torchvision.transforms as transforms
import os # Just in case needed for paths, though not strictly used here now

# --- Configuration ---
MODEL_NAME = 'mobilenet_v2'
NUM_CLASSES = 6 # MUST match the number of classes the model was trained on (TrashNet has 6)
# --- Path to your fine-tuned model weights ---
MODEL_WEIGHTS_PATH = 'mobilenet_v2_finetuned_trashnet.pth' # Ensure this file is in the same directory

# --- Define the TrashNet class names IN THE CORRECT ORDER ---
# This order MUST match the order used by ImageFolder during training
# Check the 'Found classes' output from your training script:
# ['cardboard', 'glass', 'metal', 'paper', 'plastic', 'trash']
TRASHNET_CLASSES = ['cardboard', 'glass', 'metal', 'paper', 'plastic', 'trash']

if len(TRASHNET_CLASSES) != NUM_CLASSES:
     print(json.dumps({"error": True, "message": f"Mismatch: NUM_CLASSES is {NUM_CLASSES} but TRASHNET_CLASSES has {len(TRASHNET_CLASSES)} items."}), file=sys.stdout)
     sys.exit(1)

# --- Image Preprocessing Pipeline (Should match validation transform from training) ---
image_size = 224
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(image_size),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

try:
    # --- Load the Model Architecture ---
    # print(f"Loading PyTorch {MODEL_NAME} model ARCHITECTURE...", file=sys.stderr)
    model_constructor = getattr(models, MODEL_NAME)
    # Load the architecture WITHOUT pre-trained ImageNet weights this time
    model = model_constructor(weights=None) # Use weights=None or pretrained=False

    # --- Modify the Classifier to match NUM_CLASSES ---
    # (This MUST be done BEFORE loading the state_dict)
    if MODEL_NAME == 'mobilenet_v2':
        num_ftrs = model.classifier[-1].in_features
        model.classifier[-1] = torch.nn.Linear(num_ftrs, NUM_CLASSES)
    elif 'resnet' in MODEL_NAME or 'resnext' in MODEL_NAME:
        num_ftrs = model.fc.in_features
        model.fc = torch.nn.Linear(num_ftrs, NUM_CLASSES)
    # Add other model families if needed, ensure this matches the training script's modification
    else:
         print(json.dumps({"error": True, "message": f"Classifier modification logic needed for {MODEL_NAME} in prediction script."}), file=sys.stdout)
         sys.exit(1)


    # --- Load the Fine-Tuned Weights ---
    # print(f"Loading fine-tuned weights from: {MODEL_WEIGHTS_PATH}", file=sys.stderr)
    # Load the state dictionary from the saved .pth file
    # Make sure to map location to CPU if the model was trained on GPU but used on CPU
    map_location = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.load_state_dict(torch.load(MODEL_WEIGHTS_PATH, map_location=map_location))

    # --- Set Model to Evaluation Mode ---
    model.eval()
    # print("Model loaded and set to evaluation mode.", file=sys.stderr)

    # --- Use CPU (or GPU if available) ---
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    # print(f"Using device: {device}", file=sys.stderr)

    # --- Read image data from standard input ---
    image_data = sys.stdin.buffer.read()
    if not image_data:
        raise ValueError("No image data received from stdin.")

    # --- Preprocess the image ---
    img = Image.open(io.BytesIO(image_data)).convert('RGB')
    img_t = preprocess(img)
    batch_t = torch.unsqueeze(img_t, 0)
    batch_t = batch_t.to(device)
    # print("Image preprocessed.", file=sys.stderr)

    # --- Perform prediction ---
    # print("Running prediction...", file=sys.stderr)
    with torch.no_grad():
        out = model(batch_t)
    # print("Prediction complete.", file=sys.stderr)

    # --- Process output ---
    probabilities = torch.nn.functional.softmax(out[0], dim=0)
    top_prob, top_catid = torch.topk(probabilities, 1)

    # Get the corresponding label from OUR TRASHNET_CLASSES list
    predicted_label_idx = top_catid[0].item()
    predicted_label = TRASHNET_CLASSES[predicted_label_idx] # Use our class list
    confidence_score = top_prob[0].item()

    # --- Prepare JSON output ---
    # The Node.js backend will now do the mapping based on these specific labels
    output = {
        "item": predicted_label, # Send the direct class name from TrashNet
        "confidence": confidence_score,
        # Node.js will add recyclable/instructions based on this 'item'
    }

    # --- Print JSON result to standard output ---
    print(json.dumps(output))

except FileNotFoundError:
     print(json.dumps({"error": True, "message": f"Error: Model weights file not found at {MODEL_WEIGHTS_PATH}. Make sure it's in the backend directory."}), file=sys.stdout)
     print(f"Error: Model weights file not found at {MODEL_WEIGHTS_PATH}", file=sys.stderr)
     sys.exit(1)
except Exception as e:
    # --- Print error as JSON to standard output ---
    error_output = {
        "error": True,
        "message": f"Python Error: {type(e).__name__} - {str(e)}"
    }
    print(f"Python Script Error: {type(e).__name__} - {str(e)}", file=sys.stderr)
    print(json.dumps(error_output)) # Send JSON error to stdout
    sys.exit(1)