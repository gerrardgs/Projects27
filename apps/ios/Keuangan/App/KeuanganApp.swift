import KeuanganCore
import SwiftUI

@main
struct KeuanganApp: App {
    @State private var model = AppModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(model)
                .environment(\.locale, Locale(identifier: "id_ID"))
        }
    }
}

struct RootView: View {
    @Environment(AppModel.self) private var model
    @State private var restored = false

    var body: some View {
        Group {
            if !restored {
                ProgressView("Memuat")
            } else if model.signedIn {
                HomeView()
            } else {
                LoginView()
            }
        }
        .task {
            await model.restore()
            restored = true
        }
    }
}

struct HomeView: View {
    @Environment(AppModel.self) private var model
    @State private var tab = 0
    @State private var reload = 0
    @State private var confirmSignOut = false

    var body: some View {
        TabView(selection: $tab) {
            NavigationStack { DashboardView(reload: reload).navigationTitle("Dasbor").toolbar { signOutButton }.safeAreaInset(edge: .top) { banner } }
                .tabItem { Label("Dasbor", systemImage: "chart.bar") }.tag(0)
            NavigationStack { CaptureView(onSaved: { reload += 1 }).navigationTitle("Catat").toolbar { signOutButton }.safeAreaInset(edge: .top) { banner } }
                .tabItem { Label("Catat", systemImage: "plus.circle") }.tag(1)
            NavigationStack { JournalView(reload: reload).navigationTitle("Jurnal").toolbar { signOutButton }.safeAreaInset(edge: .top) { banner } }
                .tabItem { Label("Jurnal", systemImage: "list.bullet") }.tag(2)
        }
        // Queued transactions go out when the server is back: now, then every 30 seconds.
        .task {
            while !Task.isCancelled {
                if await model.sync() { reload += 1 }
                try? await Task.sleep(for: .seconds(30))
            }
        }
        .confirmationDialog("Keluar?", isPresented: $confirmSignOut) {
            Button("Tetap keluar", role: .destructive) { Task { await model.signOut() } }
        } message: {
            Text("\(model.queue.count) transaksi belum terkirim dan akan dihapus dari perangkat ini.")
        }
    }

    private var banner: some View {
        DeviceBanner { if await model.sync() { reload += 1 } }
    }

    private var signOutButton: some View {
        Button("Keluar") {
            // Signing out clears this device's copy, so it first asks before dropping unsent transactions.
            if model.queue.isEmpty { Task { await model.signOut() } } else { confirmSignOut = true }
        }
    }
}

/// Says when the screen shows data saved on this device because the server is unreachable, and lists
/// transactions waiting to be sent or refused by the server.
struct DeviceBanner: View {
    @Environment(AppModel.self) private var model
    let send: () async -> Void

    var body: some View {
        let pending = model.queue.filter { $0.status == "pending" }
        let failed = model.queue.filter { $0.status == "failed" }
        if model.offlineSince != nil || !model.queue.isEmpty {
            VStack(alignment: .leading, spacing: 4) {
                if let since = model.offlineSince {
                    Text("Server tidak dapat dihubungi. Data yang tampil tersimpan di perangkat ini pada \(since.formatted(date: .abbreviated, time: .shortened)).")
                }
                if !pending.isEmpty {
                    Text("\(pending.count) transaksi tersimpan di perangkat, menunggu dikirim").bold()
                    ForEach(pending, id: \.key) { item in
                        Text("\(item.body["date"] ?? "") · \(item.body["description"].flatMap { $0.isEmpty ? nil : $0 } ?? "(tanpa keterangan)") · \((try? Money.format(item.body["amount"] ?? "0")) ?? "")")
                    }
                    Button("Kirim sekarang") { Task { await send() } }
                }
                ForEach(failed, id: \.key) { item in
                    HStack {
                        Text("Ditolak server: \(item.body["description"] ?? "") (\(item.error ?? ""))").foregroundStyle(.red)
                        Button("Hapus") { model.api.discardQueued(item.key) }
                    }
                }
            }
            .font(.footnote)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
            .background(.yellow.opacity(0.2))
            .accessibilityIdentifier("device-banner")
        }
    }
}
