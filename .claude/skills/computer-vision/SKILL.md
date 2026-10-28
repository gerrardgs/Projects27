---
name: computer-vision
description: Build, evaluate and deploy computer vision systems - image classification, object detection, segmentation, OCR, tracking and video analytics - covering dataset collection and labelling, augmentation, training or fine-tuning, metrics such as mAP and IoU, model optimization and export (ONNX, TensorRT, OpenVINO, Core ML, LiteRT), real-time video pipelines, edge deployment, licensing and privacy. Use for any task that processes images, camera streams or video with classical vision (OpenCV) or deep learning.
license: MIT
metadata:
  version: "1.0.0"
---

# Computer Vision

General ML practice from [machine-learning](../machine-learning/SKILL.md) applies (leakage-free splits, baselines, reproducibility). Serving and latency are covered in [ml-inference-serving](../ml-inference-serving/SKILL.md). Names and licences checked on PyPI and GitHub on 2026-10-15.

## 1. Frame the task and the conditions

- Pick the task type: classification, detection (boxes), instance or semantic segmentation, keypoints, OCR, tracking, or anomaly detection. The metric and labelling cost follow from it.
- Specify operating conditions: cameras and resolutions, lighting, viewpoints, motion, occlusion, object sizes, frame rate, and latency budget. Collect evaluation data that represents all of them, including night, weather and edge cases.
- Try classical methods (OpenCV thresholds, colour spaces, contours, template matching) when the scene is controlled; they are cheaper and easier to explain.

## 2. Data and labels

- Write a labelling guide with examples of edge cases (truncated, occluded, ambiguous objects) and measure agreement between annotators on a sample.
- Annotation tools: CVAT (`cvat-sdk`), Label Studio (`label-studio`). Keep labels in a standard format (for example COCO JSON or YOLO text files) under version control with the data version (DVC).
- **Split by scene, camera, video or session, not by frame.** Neighbouring frames from one video in both train and test sets inflate scores (leakage).
- Augment to match real variation (Albumentations, torchvision transforms): flips only when the semantics allow, colour and blur for lighting, and geometry consistent with the camera.
- Check class balance and small-object frequency; review a sample of labels for errors before training.

## 3. Models

- Start from pretrained models and fine-tune: torchvision models, `timm` backbones, Detectron2, MMDetection (`mmdet`), Ultralytics YOLO, Hugging Face `transformers` vision models.
- **Check licences before shipping.** The `ultralytics` package is licensed AGPL-3.0 (PyPI metadata, checked 2026-10-15), which has obligations for networked and distributed use; some pretrained weights also carry their own licences or non-commercial terms.
- Match input preprocessing (resize method, normalization, colour order RGB versus BGR, which OpenCV uses by default) exactly between training and inference. Mismatches here are a frequent silent bug.

## 4. Evaluate

| Task | Metrics |
| :--- | :--- |
| Classification | Accuracy only if balanced; precision, recall, F1 per class; confusion matrix |
| Detection | mAP at IoU thresholds (COCO-style mAP@[.50:.95] and mAP@.50, with `pycocotools`), per-class AP, recall at the operating threshold |
| Segmentation | Mean IoU, Dice coefficient, boundary quality where it matters |
| OCR | Character and word error rate |
| Tracking | Identity-aware metrics such as HOTA, MOTA or IDF1 |

Also measure per-condition slices (night, small objects, each camera) and the latency on the target hardware. Inspect false positives and false negatives visually; `supervision` helps with visualization and video utilities.

## 5. Optimize and deploy

- Export to the runtime of the target: ONNX with ONNX Runtime (portable), TensorRT (NVIDIA GPUs), OpenVINO (Intel hardware), Core ML via `coremltools` (Apple devices), LiteRT (`ai-edge-litert`, Google's on-device runtime built on TensorFlow Lite) for Android and embedded devices.
- Quantize (FP16, INT8) and prune only with a re-evaluation on the same test set; calibrate INT8 with representative data.
- Verify numerical parity between the original and the exported model on sample inputs before deploying.

## 6. Real-time video pipelines

- Budget latency per stage: capture, decode, preprocess, inference, postprocess (non-maximum suppression, tracking), and output.
- Decode with hardware acceleration where available (for example GStreamer or NVIDIA DeepStream pipelines); batch frames across streams when throughput matters more than per-frame latency.
- Drop or skip frames under load instead of building an ever-growing queue; report dropped-frame counts.
- Handle stream failures: reconnect cameras with backoff, detect frozen or black frames.

## 7. Privacy and ethics

- Images of people are personal data: minimize collection and retention, blur faces or plates where identity is not needed, secure storage and access, and follow applicable law. Biometric identification is regulated strictly in many jurisdictions (for example the EU AI Act); confirm legal review before building it.
- Evaluate performance across demographic groups when the system analyses people.

## Done when

- [ ] Evaluation data covers the real operating conditions; splits are by scene or video, not by frame
- [ ] Task-appropriate metrics reported overall and per condition, against a baseline
- [ ] Preprocessing parity and exported-model parity verified
- [ ] Latency and throughput measured on the target hardware
- [ ] Licences of code and weights checked; privacy measures in place
