import Charts
import KeuanganCore
import SwiftUI

struct DashboardView: View {
    @Environment(AppModel.self) private var model
    let reload: Int
    @State private var recap: MonthlyRecap?
    @State private var trend: [TrendPoint] = []
    @State private var error: String?

    private static let months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

    var body: some View {
        List {
            if let error { Text(error).foregroundStyle(.red) }
            if let recap {
                Section("Bulan ini") {
                    row("Pemasukan", recap.totalIncome)
                    row("Pengeluaran", recap.totalExpenses)
                    row("Selisih", recap.net)
                    LabeledContent("Tingkat tabungan", value: "\(recap.savingsRate.replacingOccurrences(of: ".", with: ","))%")
                }
                Section("Tren 6 bulan") {
                    Chart(trend, id: \.month) { point in
                        BarMark(x: .value("Bulan", Self.months[point.month - 1]), y: .value("Pemasukan", Money.forChart(point.income)))
                            .foregroundStyle(by: .value("Jenis", "Pemasukan"))
                            .position(by: .value("Jenis", "Pemasukan"))
                            .accessibilityLabel("\(Self.months[point.month - 1]) pemasukan")
                            .accessibilityValue((try? Money.format(point.income)) ?? point.income)
                        BarMark(x: .value("Bulan", Self.months[point.month - 1]), y: .value("Pengeluaran", Money.forChart(point.expenses)))
                            .foregroundStyle(by: .value("Jenis", "Pengeluaran"))
                            .position(by: .value("Jenis", "Pengeluaran"))
                            .accessibilityLabel("\(Self.months[point.month - 1]) pengeluaran")
                            .accessibilityValue((try? Money.format(point.expenses)) ?? point.expenses)
                    }
                    .frame(height: 180)
                }
                Section("Pengeluaran per kategori") {
                    ForEach(recap.expenses.filter { $0.month != "0.00" }, id: \.code) { item in
                        row("\(item.name) (\(item.shareOfTotal.replacingOccurrences(of: ".", with: ","))%)", item.month)
                    }
                }
            } else if error == nil {
                ProgressView("Memuat dasbor")
            }
        }
        .task(id: reload) { await load() }
        .refreshable { await load() }
    }

    private func row(_ title: String, _ amount: String) -> some View {
        LabeledContent(title, value: (try? Money.format(amount)) ?? amount)
    }

    private func load() async {
        guard let entityId = model.entityId else { return }
        let today = Jakarta.isoDate()
        let year = Int(today.prefix(4)) ?? 2026
        let month = Int(today.dropFirst(5).prefix(2)) ?? 1
        do {
            recap = try await model.api.monthlyRecap(entityId: entityId, year: year, month: month)
            trend = try await model.api.trend(entityId: entityId, year: year, month: month, months: 6)
            error = nil
        } catch {
            self.error = "\(error)"
        }
    }
}

struct JournalView: View {
    @Environment(AppModel.self) private var model
    let reload: Int
    @State private var entries: [Entry] = []
    private static let status = ["posted": "Diposting", "reversed": "Dibalik", "submitted": "Menunggu persetujuan", "rejected": "Ditolak"]

    var body: some View {
        List {
            if entries.isEmpty { Text("Belum ada transaksi pada bulan ini.") }
            ForEach(entries, id: \.id) { entry in
                LabeledContent {
                    Text((try? Money.format(entry.total)) ?? entry.total)
                } label: {
                    Text(entry.description)
                    Text("\(entry.date) · \(Self.status[entry.status] ?? entry.status)").font(.footnote)
                }
            }
        }
        .task(id: reload) {
            guard let entityId = model.entityId else { return }
            let today = Jakarta.isoDate()
            entries = (try? await model.api.entries(entityId: entityId, from: "\(today.prefix(7))-01", to: today)) ?? []
        }
    }
}
