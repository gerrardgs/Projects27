// Transcribes audio files with Apple's on-device dictation model (Speech framework, DictationTranscriber,
// macOS 26 or later), the engine family behind Safari's and iOS's Indonesian dictation. Reads one audio
// path per line on standard input, optionally followed by a tab and a signal-to-noise ratio in dB; for
// that case it adds seeded white Gaussian noise first, so runs are repeatable. Writes one JSON object
// per line: {"path", "text", "audioSeconds", "processingSeconds", "snr"}.
import AVFoundation
import Foundation
import Speech

struct SplitMix64: RandomNumberGenerator {
    var state: UInt64
    mutating func next() -> UInt64 {
        state &+= 0x9E37_79B9_7F4A_7C15
        var z = state
        z = (z ^ (z >> 30)) &* 0xBF58_476D_1CE4_E5B9
        z = (z ^ (z >> 27)) &* 0x94D0_49BB_1331_11EB
        return z ^ (z >> 31)
    }
}

func gaussian(_ rng: inout SplitMix64) -> Float {
    let u1 = max(Double.ulpOfOne, Double(rng.next() >> 11) / Double(1 << 53))
    let u2 = Double(rng.next() >> 11) / Double(1 << 53)
    return Float((-2 * log(u1)).squareRoot() * cos(2 * .pi * u2))
}

/** Writes a copy of `url` with white noise at `snr` dB below the signal's RMS level. */
func withNoise(_ url: URL, snr: Double, seed: UInt64) throws -> URL {
    let file = try AVAudioFile(forReading: url)
    let format = file.processingFormat
    guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: AVAudioFrameCount(file.length)) else {
        throw CocoaError(.fileReadCorruptFile)
    }
    try file.read(into: buffer)
    var rng = SplitMix64(state: seed)
    for channel in 0..<Int(format.channelCount) {
        guard let samples = buffer.floatChannelData?[channel] else { continue }
        let count = Int(buffer.frameLength)
        var power: Float = 0
        for i in 0..<count { power += samples[i] * samples[i] }
        let rms = (power / Float(max(1, count))).squareRoot()
        let noiseRms = rms / Float(pow(10, snr / 20))
        for i in 0..<count { samples[i] += noiseRms * gaussian(&rng) }
    }
    let out = FileManager.default.temporaryDirectory.appendingPathComponent("\(UUID().uuidString).caf")
    let writer = try AVAudioFile(forWriting: out, settings: format.settings)
    try writer.write(from: buffer)
    return out
}

func transcribe(_ url: URL, locale: Locale) async throws -> String {
    let transcriber = DictationTranscriber(locale: locale, preset: .longDictation)
    if let request = try await AssetInventory.assetInstallationRequest(supporting: [transcriber]) {
        try await request.downloadAndInstall()
    }
    let file = try AVAudioFile(forReading: url)
    let collect = Task {
        var text = ""
        for try await result in transcriber.results where result.isFinal { text += String(result.text.characters) }
        return text
    }
    let analyzer = SpeechAnalyzer(modules: [transcriber])
    if let end = try await analyzer.analyzeSequence(from: file) {
        try await analyzer.finalizeAndFinish(through: end)
    } else {
        await analyzer.cancelAndFinishNow()
    }
    return try await collect.value.trimmingCharacters(in: .whitespaces)
}

setvbuf(stdout, nil, _IONBF, 0)
guard let locale = await DictationTranscriber.supportedLocale(equivalentTo: Locale(identifier: "id-ID")) else {
    FileHandle.standardError.write(Data("Indonesian dictation is not available on this Mac.\n".utf8))
    exit(2)
}
var seed: UInt64 = 20_261_028
while let line = readLine(), !line.isEmpty {
    let parts = line.split(separator: "\t").map(String.init)
    let source = URL(fileURLWithPath: parts[0])
    let snr = parts.count > 1 ? Double(parts[1]) : nil
    do {
        seed &+= 1
        let input = try snr.map { try withNoise(source, snr: $0, seed: seed) } ?? source
        let audio = try AVAudioFile(forReading: input)
        let seconds = Double(audio.length) / audio.processingFormat.sampleRate
        let started = Date()
        let text = try await transcribe(input, locale: locale)
        let elapsed = Date().timeIntervalSince(started)
        if input != source { try? FileManager.default.removeItem(at: input) }
        let row: [String: Any] = [
            "path": parts[0], "text": text, "audioSeconds": seconds, "processingSeconds": elapsed,
            "snr": snr.map { $0 as Any } ?? NSNull(),
        ]
        print(String(decoding: try JSONSerialization.data(withJSONObject: row, options: [.sortedKeys]), as: UTF8.self))
    } catch {
        FileHandle.standardError.write(Data("\(parts[0]): \(error.localizedDescription)\n".utf8))
        exit(1)
    }
}
