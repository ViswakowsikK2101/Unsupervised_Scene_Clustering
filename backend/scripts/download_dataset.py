"""
Dataset Download Script for Unsupervised Scene Clustering.

Downloads open-source video datasets for training the scene clustering model.
Uses Creative Commons / Public Domain videos from multiple sources.
"""

import os
import sys
import json
import hashlib
import logging
import urllib.request
import urllib.error
import requests
import zipfile
import tarfile
from pathlib import Path
from typing import List, Dict, Optional

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

# =============================================================================
# Dataset Registry
# =============================================================================
# We use freely available Creative Commons / Public Domain videos
# from the Internet Archive and other open sources.
# These cover diverse scene types: nature, urban, indoor, action, etc.

DATASET_VIDEOS: List[Dict[str, str]] = [
    # Nature / Landscape scenes
    {
        "name": "big_buck_bunny",
        "url": "https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4",
        "description": "Animated short film with distinct outdoor scenes (forest, meadow, sky)",
        "license": "Creative Commons Attribution 3.0",
        "category": "animation"
    },
    {
        "name": "sintel_trailer",
        "url": "https://download.blender.org/demo/movies/Sintel.2010.720p.mkv",
        "description": "Animated short with diverse scenes: desert, cave, snow, village, dragon fight",
        "license": "Creative Commons Attribution 3.0",
        "category": "animation"
    },
    {
        "name": "tears_of_steel",
        "url": "https://download.blender.org/demo/movies/ToS/tears_of_steel_720p.mov",
        "description": "Sci-fi short film with indoor/outdoor/VFX scenes",
        "license": "Creative Commons Attribution 3.0",
        "category": "live_action"
    },
    {
        "name": "elephants_dream",
        "url": "https://download.blender.org/ED/ED_HD.avi",
        "description": "Animated short with surreal mechanical environments",
        "license": "Creative Commons Attribution 2.5",
        "category": "animation"
    },
    # Shorter test clips from archive.org (public domain)
    {
        "name": "cosmos_laundromat",
        "url": "https://download.blender.org/demo/movies/CL/CL-trailer_720p.mov",
        "description": "Animated short - surreal comedy with sheep and washing machines",
        "license": "Creative Commons Attribution 4.0",
        "category": "animation"
    },
]

# Lighter fallback set if full downloads are too large
LITE_DATASET_VIDEOS: List[Dict[str, str]] = [
    {
        "name": "sintel_trailer",
        "url": "https://media.w3.org/2010/05/sintel/trailer.mp4",
        "description": "Sintel trailer - desert, cave, snow, village, dragon scenes",
        "license": "Creative Commons Attribution 3.0",
        "category": "animation"
    },
    {
        "name": "video_sample",
        "url": "https://media.w3.org/2010/05/video/movie_300.mp4",
        "description": "W3C sample video - diverse scene test",
        "license": "W3C",
        "category": "test"
    },
    {
        "name": "bunny_trailer",
        "url": "https://media.w3.org/2010/05/bunny/trailer.mp4",
        "description": "Big Buck Bunny trailer - outdoor forest and meadow scenes",
        "license": "Creative Commons Attribution 3.0",
        "category": "animation"
    },
    {
        "name": "bunny_movie",
        "url": "https://media.w3.org/2010/05/bunny/movie.mp4",
        "description": "Big Buck Bunny full movie - extended outdoor/nature scenes",
        "license": "Creative Commons Attribution 3.0",
        "category": "animation"
    },
]


def download_file(url: str, dest_path: str, chunk_size: int = 8192) -> bool:
    """Download a file from URL with progress reporting using requests library."""
    try:
        import warnings
        warnings.filterwarnings("ignore", message="Unverified HTTPS request")
        
        logger.info(f"Downloading: {url}")
        logger.info(f"Destination: {dest_path}")

        response = requests.get(url, stream=True, timeout=120, verify=False)
        response.raise_for_status()
        
        total_size = response.headers.get("Content-Length")
        total_size = int(total_size) if total_size else None

        downloaded = 0
        with open(dest_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if not chunk:
                    continue
                f.write(chunk)
                downloaded += len(chunk)

                if total_size:
                    pct = (downloaded / total_size) * 100
                    mb_down = downloaded / (1024 * 1024)
                    mb_total = total_size / (1024 * 1024)
                    print(
                        f"\r  Progress: {mb_down:.1f}/{mb_total:.1f} MB ({pct:.1f}%)",
                        end="", flush=True
                    )
                else:
                    mb_down = downloaded / (1024 * 1024)
                    print(
                        f"\r  Downloaded: {mb_down:.1f} MB",
                        end="", flush=True
                    )
        print()  # newline after progress

        file_size = os.path.getsize(dest_path)
        logger.info(f"Download complete: {file_size / (1024*1024):.1f} MB")
        return True

    except Exception as e:
        logger.error(f"Failed to download {url}: {e}")
        if os.path.exists(dest_path):
            os.remove(dest_path)
        return False


def verify_video(file_path: str) -> bool:
    """Verify that a downloaded file is a valid video."""
    try:
        import cv2
        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            logger.warning(f"Cannot open video: {file_path}")
            return False

        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        cap.release()

        if frame_count < 10:
            logger.warning(f"Video too short ({frame_count} frames): {file_path}")
            return False

        logger.info(
            f"  Verified: {frame_count} frames, {fps:.1f} FPS, "
            f"{width}x{height}, duration: {frame_count/fps:.1f}s"
        )
        return True

    except ImportError:
        logger.warning("OpenCV not installed — skipping video verification")
        return os.path.getsize(file_path) > 1024  # at least 1KB


def download_dataset(
    output_dir: str = None,
    lite: bool = False,
    force: bool = False
) -> Dict[str, str]:
    """
    Download the scene clustering training dataset.

    Args:
        output_dir: Directory to save videos. Defaults to backend/datasets/
        lite: If True, download only the lightweight subset
        force: If True, re-download even if files exist

    Returns:
        Dictionary mapping video names to their local file paths
    """
    if output_dir is None:
        output_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "datasets"
        )

    os.makedirs(output_dir, exist_ok=True)

    videos = LITE_DATASET_VIDEOS if lite else DATASET_VIDEOS
    downloaded_videos: Dict[str, str] = {}

    logger.info("=" * 60)
    logger.info("Scene Clustering Dataset Downloader")
    logger.info(f"Mode: {'LITE' if lite else 'FULL'}")
    logger.info(f"Output directory: {output_dir}")
    logger.info(f"Videos to download: {len(videos)}")
    logger.info("=" * 60)

    for i, video_info in enumerate(videos, 1):
        name = video_info["name"]
        url = video_info["url"]
        ext = os.path.splitext(url.split("?")[0])[-1] or ".mp4"
        dest_path = os.path.join(output_dir, f"{name}{ext}")

        logger.info(f"\n[{i}/{len(videos)}] {name}")
        logger.info(f"  Description: {video_info['description']}")
        logger.info(f"  License: {video_info['license']}")

        # Skip if already downloaded
        if os.path.exists(dest_path) and not force:
            if verify_video(dest_path):
                logger.info(f"  Already exists and valid — skipping")
                downloaded_videos[name] = dest_path
                continue
            else:
                logger.info(f"  Exists but invalid — re-downloading")

        # Download
        success = download_file(url, dest_path)
        if success and verify_video(dest_path):
            downloaded_videos[name] = dest_path
        else:
            logger.warning(f"  Skipping {name} — download or verification failed")

    # Save manifest
    manifest = {
        "dataset_name": "scene_clustering_training",
        "mode": "lite" if lite else "full",
        "videos": {
            name: {
                "path": path,
                "info": next(
                    (v for v in videos if v["name"] == name), {}
                )
            }
            for name, path in downloaded_videos.items()
        },
        "total_videos": len(downloaded_videos)
    }

    manifest_path = os.path.join(output_dir, "manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    logger.info("\n" + "=" * 60)
    logger.info(f"Download complete!")
    logger.info(f"Successfully downloaded: {len(downloaded_videos)}/{len(videos)} videos")
    logger.info(f"Manifest saved to: {manifest_path}")
    logger.info("=" * 60)

    return downloaded_videos


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Download datasets for scene clustering training"
    )
    parser.add_argument(
        "--output", "-o",
        type=str,
        default=None,
        help="Output directory for downloaded videos"
    )
    parser.add_argument(
        "--lite",
        action="store_true",
        help="Download only the lightweight subset (faster, smaller)"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-download even if files already exist"
    )

    args = parser.parse_args()
    download_dataset(
        output_dir=args.output,
        lite=args.lite,
        force=args.force
    )
