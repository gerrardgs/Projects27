import KeuanganCore
import SwiftUI

/// Quick capture of one income, expense or transfer. Speaking (or typing a sentence) fills the form;
/// the person checks it and presses Simpan.
struct CaptureView: View {
    @Environment(AppModel.self) private var model
    let onSaved: () -> Void

    @State private var kind = "expense"
    @State private var amount = ""
    @State private var date = Date()
    @State private var accountId = ""
    @State private var fundingAccountId = ""
    @State private var detail = ""
    @State private var counterparty = ""
    @State private var sentence = ""
    @State private var key = UUID().uuidString
    @State private var status: String?
    @State private var listening = false
    @State private var recordingSince: Date?
    @State private var level: Float = 0
    @State private var draft: CaptureDraft?
    @State private var qualityRound = 0
    @State private var processing = false
    @State private var speech = SpeechInput()
    @FocusState private var focus: Field?

    enum Field { case amount, save }

    private var categories: [Account] {
        let types = kind == "transfer" ? ["asset", "liability"] : [kind]
        return model.accounts.filter { types.contains($0.type) }
    }
    private var fundingAccounts: [Account] { model.accounts.filter { ["asset", "liability"].contains($0.type) } }

    var body: some View {
        Form {
            Section {
                Text("Contoh: “beli nasi padang 35 ribu pakai GoPay kemarin”. Formulir diisi otomatis; periksa, lalu tekan Simpan.")
                    .font(.footnote)
                if listening {
                    Button("Selesai bicara", systemImage: "stop.circle") { speech.stop() }
                } else {
                    Button("Bicara", systemImage: "mic") { startListening() }.disabled(processing)
                }
                if listening { RecordingIndicator(since: recordingSince, level: level) }
                if let status {
                    Text(status).accessibilityIdentifier("capture-status")
                }
                TextField("Atau ketik kalimatnya", text: $sentence).onSubmit { Task { await fill(sentence) } }
                Button("Isi otomatis") { Task { await fill(sentence) } }.disabled(processing || listening)
            } header: {
                Text("Isi dengan suara atau kalimat")
            } footer: {
                QualityNote(round: qualityRound)
            }
            Section {
                Picker("Jenis", selection: $kind) {
                    Text("Pengeluaran").tag("expense")
                    Text("Pemasukan").tag("income")
                    Text("Pindah").tag("transfer")
                }
                .pickerStyle(.segmented)
                TextField("Jumlah (Rp)", text: $amount).keyboardType(.decimalPad).focused($focus, equals: .amount)
                    .accessibilityIdentifier("amount")
                DatePicker("Tanggal", selection: $date, displayedComponents: .date)
                Picker(kind == "transfer" ? "Ke akun" : "Kategori", selection: $accountId) {
                    ForEach(categories, id: \.id) { Text("\($0.code) \($0.name)").tag($0.id) }
                }
                Picker(kind == "income" ? "Masuk ke" : "Dari", selection: $fundingAccountId) {
                    ForEach(fundingAccounts, id: \.id) { Text("\($0.code) \($0.name)").tag($0.id) }
                }
                TextField("Keterangan", text: $detail).accessibilityIdentifier("description")
                TextField("Pihak lain (opsional)", text: $counterparty).accessibilityIdentifier("counterparty")
                Button("Simpan") { Task { await save() } }.focused($focus, equals: .save)
            }
        }
        .onAppear(perform: resetSelections)
        .onChange(of: kind) { if !categories.contains(where: { $0.id == accountId }) { accountId = categories.first?.id ?? "" } }
    }

    private func resetSelections() {
        if accountId.isEmpty { accountId = categories.first?.id ?? "" }
        if fundingAccountId.isEmpty { fundingAccountId = fundingAccounts.first?.id ?? "" }
    }

    private func announce(_ text: String) {
        status = text
        AccessibilityNotification.Announcement(text).post()
    }

    private func startListening() {
        listening = true
        recordingSince = nil
        level = 0
        announce("Meminta izin dan menyalakan mikrofon…")
        speech.start(
            onRecording: {
                recordingSince = Date()
                announce("Mendengarkan… silakan bicara.")
            },
            onLevel: { level = $0 },
            onPartial: { status = "Mendengarkan… “\($0)”" },
            onFinal: { text in
                listening = false
                Task { await fill(text) }
            },
            onError: { message in
                listening = false
                announce(message)
            }
        )
    }

    private func fill(_ text: String) async {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, let entityId = model.entityId else {
            announce("Tidak ada kalimat yang terdengar. Coba lagi.")
            return
        }
        processing = true
        announce("Memproses “\(trimmed)”…")
        defer { processing = false }
        do {
            let draft = try await model.api.parseCapture(entityId: entityId, text: trimmed)
            self.draft = draft
            kind = draft.kind
            if let value = draft.amount { amount = Money.toInput(value) }
            date = Jakarta.date(draft.date)
            if let id = draft.accountId { accountId = id }
            if let id = draft.fundingAccountId { fundingAccountId = id }
            if let value = draft.description { detail = value }
            if let value = draft.counterparty { counterparty = value }
            let how = draft.source == "ai" ? "AI" : "aturan bawaan"
            announce("Formulir terisi otomatis dari “\(trimmed)” (\(how)).\(draft.missing.isEmpty ? "" : " Lengkapi kolom yang kosong.") Periksa lalu tekan Simpan.")
            focus = draft.amount == nil ? .amount : .save
        } catch {
            announce("\(error)")
        }
    }

    private func save() async {
        guard let entityId = model.entityId, let value = Money.parseInput(amount) else {
            announce("Tulis jumlah seperti 35.000 atau 1.250.000,50.")
            return
        }
        let body = [
            "kind": kind, "date": Jakarta.isoDate(date), "amount": value, "accountId": accountId,
            "fundingAccountId": fundingAccountId, "description": detail, "counterparty": counterparty, "idempotencyKey": key,
        ]
        let review = draft.map { CaptureReview(draftId: $0.draftId, changed: Self.changedFields($0, body)) }
        do {
            switch try await model.api.saveTransaction(entityId: entityId, body, review: review) {
            case .saved(let entry):
                announce("Tersimpan: \(entry.description), \((try? Money.format(entry.total)) ?? entry.total)")
            case .queued:
                announce("Server tidak dapat dihubungi. Transaksi disimpan di perangkat ini dan dikirim otomatis saat server tersedia.")
            }
            key = UUID().uuidString
            draft = nil
            qualityRound += 1
            amount = ""
            detail = ""
            counterparty = ""
            sentence = ""
            // A fresh form: the kind and date of the last entry do not carry over.
            kind = "expense"
            date = Date()
            onSaved()
        } catch {
            announce("\(error)")
        }
    }
}

extension CaptureView {
    /// The fields the draft filled that the person changed before Simpan; what the quality report counts.
    static func changedFields(_ draft: CaptureDraft, _ saved: [String: String]) -> [String] {
        let pairs: [(String, String?)] = [
            ("kind", draft.kind), ("amount", draft.amount), ("date", draft.date), ("accountId", draft.accountId),
            ("fundingAccountId", draft.fundingAccountId), ("description", draft.description), ("counterparty", draft.counterparty),
        ]
        return pairs.compactMap { field, filled in
            guard let filled, !filled.isEmpty, filled != saved[field] else { return nil }
            return field
        }
    }
}

/// A visible sign that the microphone records: a red dot, the word, the elapsed time and the input level.
struct RecordingIndicator: View {
    let since: Date?
    let level: Float

    var body: some View {
        if let since {
            TimelineView(.periodic(from: since, by: 0.5)) { context in
                let seconds = max(0, Int(context.date.timeIntervalSince(since)))
                HStack(spacing: 8) {
                    Circle().fill(.red).frame(width: 14, height: 14).accessibilityHidden(true)
                    Text("Merekam").bold()
                    Text(String(format: "%d:%02d", seconds / 60, seconds % 60)).monospacedDigit().accessibilityHidden(true)
                    ProgressView(value: Double(level)).tint(.red).accessibilityHidden(true)
                }
                .accessibilityElement(children: .combine)
                .accessibilityIdentifier("recording-indicator")
            }
        } else {
            Text("Menyalakan mikrofon…")
        }
    }
}

/// How often filled forms were saved without correction, from this person's own use.
struct QualityNote: View {
    @Environment(AppModel.self) private var model
    let round: Int
    @State private var quality: CaptureQuality?

    var body: some View {
        Group {
            if let quality, quality.saved > 0 {
                let rate = quality.savedWithoutChanges
                let range = rate.ci95.count == 2 ? "; rentang 95%: \(Self.percent(rate.ci95[0]))–\(Self.percent(rate.ci95[1]))" : ""
                Text("Ketepatan isi otomatis (\(quality.days) hari terakhir): \(rate.count) dari \(rate.of) formulir disimpan tanpa koreksi\(rate.rate.map { " (\(Self.percent($0))\(range))" } ?? "").")
                    .accessibilityIdentifier("capture-quality")
            }
        }
        .task(id: round) {
            guard let entityId = model.entityId else { return }
            quality = try? await model.api.captureQuality(entityId: entityId)
        }
    }

    static func percent(_ value: Double) -> String { "\(Int((value * 100).rounded()))%" }
}
