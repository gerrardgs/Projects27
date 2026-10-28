import AVFoundation
import Foundation
import Speech

/// Speech to text with Apple's Speech framework in Indonesian (id-ID). Recognition runs on the device
/// when the recogniser supports it, and stops after two seconds of silence.
@MainActor
final class SpeechInput {
    private let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "id-ID"))
    private let engine = AVAudioEngine()
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private var silence: Task<Void, Never>?
    private var transcript = ""
    private var finished = false

    /// For UI tests on a simulator without a microphone: a launch argument supplies the spoken sentence.
    private var scripted: String? {
        let arguments = ProcessInfo.processInfo.arguments
        guard let index = arguments.firstIndex(of: "-UITestSpeech"), index + 1 < arguments.count else { return nil }
        return arguments[index + 1]
    }

    typealias Handler = @MainActor @Sendable (String) -> Void
    typealias Signal = @MainActor @Sendable () -> Void
    /// Input level from 0 (silence) to 1 (loud).
    typealias LevelHandler = @MainActor @Sendable (Float) -> Void

    func start(
        onRecording: @escaping Signal,
        onLevel: @escaping LevelHandler,
        onPartial: @escaping Handler,
        onFinal: @escaping Handler,
        onError: @escaping Handler
    ) {
        if let scripted {
            onRecording()
            onLevel(0.5)
            onPartial(scripted)
            Task { @MainActor in
                // Long enough for a UI test to see the recording indicator.
                try? await Task.sleep(for: .milliseconds(1500))
                onFinal(scripted)
            }
            return
        }
        Task { @MainActor in
            let speechAllowed = await withCheckedContinuation { continuation in
                SFSpeechRecognizer.requestAuthorization { continuation.resume(returning: $0 == .authorized) }
            }
            guard speechAllowed else {
                onError("Izin pengenalan suara ditolak. Izinkan di Pengaturan > Privasi > Pengenalan Ucapan, lalu coba lagi.")
                return
            }
            guard await AVAudioApplication.requestRecordPermission() else {
                onError("Izin mikrofon ditolak. Izinkan di Pengaturan > Privasi > Mikrofon, lalu coba lagi.")
                return
            }
            begin(onRecording: onRecording, onLevel: onLevel, onPartial: onPartial, onFinal: onFinal, onError: onError)
        }
    }

    private func begin(
        onRecording: @escaping Signal,
        onLevel: @escaping LevelHandler,
        onPartial: @escaping Handler,
        onFinal: @escaping Handler,
        onError: @escaping Handler
    ) {
        guard let recognizer, recognizer.isAvailable else {
            onError("Pengenal suara bahasa Indonesia tidak tersedia saat ini. Ketik kalimatnya.")
            return
        }
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.record, mode: .measurement, options: .duckOthers)
            try session.setActive(true, options: .notifyOthersOnDeactivation)
            let request = SFSpeechAudioBufferRecognitionRequest()
            request.shouldReportPartialResults = true
            request.requiresOnDeviceRecognition = recognizer.supportsOnDeviceRecognition
            self.request = request
            transcript = ""
            finished = false
            let input = engine.inputNode
            input.installTap(onBus: 0, bufferSize: 1024, format: input.outputFormat(forBus: 0)) { buffer, _ in
                request.append(buffer)
                let level = Self.level(buffer)
                Task { @MainActor in onLevel(level) }
            }
            engine.prepare()
            try engine.start()
            onRecording()
            task = recognizer.recognitionTask(with: request) { result, error in
                Task { @MainActor in
                    if let result {
                        self.transcript = result.bestTranscription.formattedString
                        onPartial(self.transcript)
                        self.restartSilenceTimer(onFinal: onFinal)
                        if result.isFinal { self.finish(onFinal: onFinal) }
                    } else if error != nil, !self.finished {
                        self.stopAudio()
                        self.transcript.isEmpty ? onError("Tidak terdengar kalimat yang jelas. Coba lagi.") : self.finish(onFinal: onFinal)
                    }
                }
            }
        } catch {
            stopAudio()
            onError("Mikrofon tidak dapat dipakai: \(error.localizedDescription)")
        }
    }

    private func restartSilenceTimer(onFinal: @escaping Handler) {
        silence?.cancel()
        silence = Task {
            try? await Task.sleep(for: .seconds(2))
            if !Task.isCancelled { finish(onFinal: onFinal) }
        }
    }

    private func finish(onFinal: Handler) {
        guard !finished else { return }
        finished = true
        stopAudio()
        onFinal(transcript)
    }

    func stop() { request?.endAudio() }

    /// RMS of the first channel in dBFS, mapped from -50 dB (silence) to 0 dB (full scale) onto 0...1.
    nonisolated private static func level(_ buffer: AVAudioPCMBuffer) -> Float {
        guard let samples = buffer.floatChannelData?[0], buffer.frameLength > 0 else { return 0 }
        var sum: Float = 0
        for i in 0..<Int(buffer.frameLength) { sum += samples[i] * samples[i] }
        let decibels = 20 * log10(max(1e-7, (sum / Float(buffer.frameLength)).squareRoot()))
        return min(1, max(0, (decibels + 50) / 50))
    }

    private func stopAudio() {
        silence?.cancel()
        if engine.isRunning {
            engine.stop()
            engine.inputNode.removeTap(onBus: 0)
        }
        request?.endAudio()
        task?.cancel()
        request = nil
        task = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
}
