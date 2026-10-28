---
name: ml-inference-serving
description: Serve machine learning and LLM models in production for online, batch, streaming and edge inference with real-time latency targets - model packaging, inference servers (vLLM, SGLang, Triton, KServe, BentoML, Ray Serve, ONNX Runtime, llama.cpp), GPU utilization, batching, quantization, autoscaling, streaming responses, feature consistency, monitoring and safe model rollout. Use when deploying a model behind an API, building a real-time AI feature, reducing inference latency or cost, self-hosting an open-weight LLM, or running inference on devices.
license: MIT
metadata:
  version: "1.0.0"
---

# ML Inference Serving and Real-Time AI

Names checked on PyPI and GitHub on 2026-10-15. TorchServe (`pytorch/serve`) was archived on 7 August 2025 and is no longer maintained: do not choose it for new work, and plan a migration if you depend on it.

## 1. Choose the serving mode from the requirement

| Mode | Use when | Typical latency target | Notes |
| :--- | :--- | :--- | :--- |
| Batch | Predictions can be precomputed (daily scores, recommendations) | Minutes to hours | Cheapest; store results for lookup |
| Online (request/response) | A user or service waits for the answer | Tens to hundreds of milliseconds | Budget latency per component; p95/p99, not averages |
| Streaming | Events arrive continuously (fraud, IoT, monitoring) | Sub-second to seconds | Inference inside the stream processor or a sidecar service; handle backpressure |
| Edge / on-device | Offline operation, privacy, or no network round trip | Device-dependent | Model size and power limits; see export targets in [computer-vision](../computer-vision/SKILL.md) |
| Interactive generative (LLM) | Chat, assistants, code generation | Time to first token and tokens per second | Stream tokens; manage the KV cache and concurrency |

## 2. Serving stack options

| Need | Options |
| :--- | :--- |
| Self-hosted LLM, high throughput | vLLM, SGLang (continuous batching, paged attention, OpenAI-compatible APIs) |
| LLM on CPU or small devices | llama.cpp, Ollama (local and development use) |
| Multi-framework models on GPUs | NVIDIA Triton Inference Server (`tritonclient` for clients) |
| Kubernetes-native model serving | KServe |
| Python-first model services | BentoML, Ray Serve, or a plain FastAPI service around ONNX Runtime or the framework |
| Portable optimized inference | ONNX Runtime, TensorRT, OpenVINO |

Prefer the simplest option that meets the latency, throughput and cost targets, measured with a load test.

## 3. Performance engineering

- **Measure**: p50, p95, p99 latency, throughput, error rate, GPU or CPU utilization and memory, under realistic payloads and concurrency ([quality-assurance](../quality-assurance/SKILL.md) for load testing).
- **Batching**: dynamic or continuous batching raises GPU throughput; cap the batching delay to protect tail latency.
- **Model optimization**: half precision or quantization (INT8, 4-bit for LLMs), smaller or distilled models, compilation or graph optimization, and caching of repeated requests. Re-evaluate quality after every optimization.
- **Warm-up**: load models and run warm-up requests before marking an instance ready; cold starts belong in the readiness probe, not in user requests.
- **Autoscaling** on a signal that reflects load (queue depth, concurrent requests, GPU utilization), with a minimum warm capacity for latency-sensitive services.

## 4. Correctness in production

- **Training/serving consistency**: the same preprocessing code and feature definitions in training and serving (a shared library, or a feature store such as Feast), validated by comparing predictions on sample inputs.
- **Input validation** against the training schema, with explicit behaviour for missing or out-of-range values.
- **Timeouts and fallbacks**: a default prediction, a simpler model, or a graceful error when the model is slow or down.
- **Versioning**: every prediction logs the model version; models are immutable artefacts from a registry.

## 5. Rollout and monitoring

- Shadow deployment (new model sees real traffic, results not used), then canary or A/B rollout with automatic rollback on error-rate, latency or quality regressions.
- Monitor operational metrics (latency, errors, saturation), data and prediction drift, and business or quality metrics once labels or feedback arrive.
- For LLM services, also track tokens per request, time to first token, cost, and safety-filter triggers ([llm-applications](../llm-applications/SKILL.md)).

## 6. Security

- Authenticate and rate-limit inference APIs; limit input size (tokens, image dimensions, batch size) to prevent resource exhaustion.
- Load model files only from trusted, verified sources; prefer formats that cannot execute code on load (for example `safetensors` instead of pickle-based checkpoints).
- Isolate GPU workloads per tenant where data sensitivity requires it.

## Done when

- [ ] Serving mode and latency/throughput targets written down and met under a load test
- [ ] Preprocessing parity between training and serving verified
- [ ] Input limits, timeouts, fallbacks and autoscaling in place
- [ ] Model version logged with every prediction; rollback tested
- [ ] Operational, drift and quality monitoring with alerts
