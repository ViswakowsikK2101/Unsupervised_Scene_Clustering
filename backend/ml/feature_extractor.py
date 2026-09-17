"""
Module for extracting features from video frames.
"""
import abc
import cv2
import logging
import numpy as np
from typing import List

try:
    import torch
    import torchvision.transforms as transforms
    import torchvision.models as models
    from PIL import Image
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

logger = logging.getLogger(__name__)

class FeatureExtractor(abc.ABC):
    """
    Abstract base class for feature extraction strategies.
    """
    
    @abc.abstractmethod
    def extract(self, frames: List[np.ndarray]) -> np.ndarray:
        """
        Extract features from a list of frames.
        
        Args:
            frames: List of numpy arrays representing frames (BGR format).
            
        Returns:
            Numpy array of features (N_frames, feature_dim).
        """
        pass

class HistogramFeatureExtractor(FeatureExtractor):
    """
    Extracts color histogram features.
    """
    
    def extract(self, frames: List[np.ndarray]) -> np.ndarray:
        logger.info(f"Extracting histogram features for {len(frames)} frames")
        features = []
        
        for i, frame in enumerate(frames):
            # Convert BGR to HSV
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            
            # Calculate 2D histogram for Hue (50 bins) and Saturation (60 bins)
            hist = cv2.calcHist(
                [hsv], [0, 1], None, [50, 60], [0, 180, 0, 256]
            )
            
            # Normalize histogram
            cv2.normalize(hist, hist, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
            
            # Flatten to 3000-dim vector
            features.append(hist.flatten())
            
            if (i + 1) % 100 == 0:
                logger.debug(f"Processed {i + 1}/{len(frames)} frames")
                
        return np.array(features)

class CNNFeatureExtractor(FeatureExtractor):
    """
    Extracts features using a pre-trained ResNet-50 model.
    """
    
    def __init__(self, batch_size: int = 32):
        if not TORCH_AVAILABLE:
            raise ImportError("PyTorch and torchvision are required for CNNFeatureExtractor.")
            
        self.batch_size = batch_size
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Initializing CNNFeatureExtractor using device: {self.device}")
        
        # Load pre-trained ResNet-50
        model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)
        
        # Remove the final fully connected layer to get 2048-dim features from avgpool
        self.model = torch.nn.Sequential(*list(model.children())[:-1])
        self.model.to(self.device)
        self.model.eval()
        
        # Preprocessing pipeline
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def extract(self, frames: List[np.ndarray]) -> np.ndarray:
        logger.info(f"Extracting CNN features for {len(frames)} frames")
        
        features_list = []
        
        with torch.no_grad():
            for i in range(0, len(frames), self.batch_size):
                batch_frames = frames[i:i + self.batch_size]
                batch_tensors = []
                
                for frame in batch_frames:
                    # Convert BGR to RGB
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    pil_img = Image.fromarray(frame_rgb)
                    tensor = self.transform(pil_img)
                    batch_tensors.append(tensor)
                    
                batch_tensor = torch.stack(batch_tensors).to(self.device)
                
                # Forward pass
                outputs = self.model(batch_tensor)
                
                # outputs shape is (batch_size, 2048, 1, 1), flatten to (batch_size, 2048)
                outputs = outputs.view(outputs.size(0), -1)
                
                features_list.append(outputs.cpu().numpy())
                
                logger.debug(f"Processed batch {i // self.batch_size + 1}, frames {i + 1} to {min(i + self.batch_size, len(frames))}")
                
        if not features_list:
            return np.array([])
            
        return np.vstack(features_list)

def get_feature_extractor(method: str, **kwargs) -> FeatureExtractor:
    """
    Factory function to get a feature extractor.
    
    Args:
        method: 'histogram' or 'cnn'
        **kwargs: Additional arguments for the extractor.
        
    Returns:
        FeatureExtractor instance.
    """
    if method.lower() == 'histogram':
        return HistogramFeatureExtractor()
    elif method.lower() == 'cnn':
        return CNNFeatureExtractor(**kwargs)
    else:
        raise ValueError(f"Unknown feature extraction method: {method}")
