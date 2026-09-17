"""
Module for extracting frames from videos.
"""
import os
import cv2
import logging
import numpy as np
from typing import Tuple, List, Optional

logger = logging.getLogger(__name__)

class FrameExtractor:
    """
    Extracts frames from video files at a specified sample rate.
    """
    
    def extract_frames(self, video_path: str, sample_rate: int = 1, output_dir: Optional[str] = None) -> Tuple[List[np.ndarray], List[float]]:
        """
        Extract frames from a video file.
        
        Args:
            video_path: Path to the input video file.
            sample_rate: Extract 1 frame every `sample_rate` seconds.
            output_dir: Optional directory to save the extracted frames as JPEGs.
            
        Returns:
            Tuple containing:
                - List of extracted frames as numpy arrays (BGR format).
                - List of timestamps in seconds corresponding to each frame.
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")
            
        logger.info(f"Extracting frames from {video_path} (sample rate: {sample_rate} fps)")
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Failed to open video: {video_path}")
            
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0:
            logger.warning(f"Invalid FPS ({fps}) detected, falling back to 30.0")
            fps = 30.0
            
        frame_interval = int(round(fps / sample_rate)) if sample_rate > 0 else int(round(fps))
        if frame_interval < 1:
            frame_interval = 1
            
        frames = []
        timestamps = []
        
        frame_idx = 0
        extracted_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            if frame_idx % frame_interval == 0:
                frames.append(frame)
                timestamp = frame_idx / fps
                timestamps.append(timestamp)
                extracted_count += 1
                
                if extracted_count % 100 == 0:
                    logger.debug(f"Extracted {extracted_count} frames so far...")
                    
            frame_idx += 1
            
        cap.release()
        logger.info(f"Extracted a total of {len(frames)} frames.")
        
        if output_dir:
            self.save_frames(frames, timestamps, output_dir)
            
        return frames, timestamps
        
    def save_frames(self, frames: List[np.ndarray], timestamps: List[float], output_dir: str) -> None:
        """
        Save extracted frames as JPEG images.
        
        Args:
            frames: List of frames as numpy arrays.
            timestamps: List of corresponding timestamps.
            output_dir: Directory to save the frames.
        """
        os.makedirs(output_dir, exist_ok=True)
        logger.info(f"Saving {len(frames)} frames to {output_dir}")
        
        for i, (frame, ts) in enumerate(zip(frames, timestamps)):
            filename = os.path.join(output_dir, f"frame_{i:05d}_ts_{ts:.3f}.jpg")
            cv2.imwrite(filename, frame)
            
        logger.info("Finished saving frames.")
