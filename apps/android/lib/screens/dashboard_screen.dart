import 'package:flutter/material.dart';

import '../src/api.dart';
import '../src/dates.dart';
import '../src/models.dart';
import '../src/money.dart';

class DashboardData {
  DashboardData(this.recap, this.trend);
  final MonthlyRecap recap;
  final List<TrendPoint> trend;
}

Future<DashboardData> loadDashboard(
  ApiClient api,
  String entityId,
  int year,
  int month,
) async {
  final results = await Future.wait([
    api.monthlyRecap(entityId, year, month),
    api.trend(entityId, year, month),
  ]);
  return DashboardData(
    results[0] as MonthlyRecap,
    results[1] as List<TrendPoint>,
  );
}

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({
    super.key,
    required this.data,
    required this.year,
    required this.month,
  });
  final DashboardData data;
  final int year;
  final int month;

  @override
  Widget build(BuildContext context) {
    final recap = data.recap;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          monthLabel(year, month),
          style: Theme.of(context).textTheme.titleLarge,
        ),
        if (!recap.checksPassed)
          Text(
            'Pemeriksaan laporan gagal',
            style: TextStyle(color: Theme.of(context).colorScheme.error),
          ),
        _Kpi(label: 'Pemasukan', amount: recap.totalIncome),
        _Kpi(label: 'Pengeluaran', amount: recap.totalExpenses),
        _Kpi(label: 'Selisih', amount: recap.net),
        Card(
          child: ListTile(
            title: const Text('Tingkat tabungan'),
            trailing: Text('${recap.savingsRate.replaceFirst('.', ',')}%'),
          ),
        ),
        const SizedBox(height: 16),
        Text('Tren 6 bulan', style: Theme.of(context).textTheme.titleMedium),
        TrendBars(points: data.trend),
        const SizedBox(height: 16),
        Text(
          'Pengeluaran per kategori',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        for (final row in recap.expenses.where((r) => r.month != '0.00'))
          ListTile(
            title: Text(row.name),
            subtitle: Text(
              '${row.shareOfTotal.replaceFirst('.', ',')}% dari pengeluaran',
            ),
            trailing: Text(formatRupiah(row.month)),
          ),
      ],
    );
  }
}

class _Kpi extends StatelessWidget {
  const _Kpi({required this.label, required this.amount});
  final String label;
  final String amount;
  @override
  Widget build(BuildContext context) => Card(
    child: ListTile(
      title: Text(label),
      trailing: Text(
        formatRupiah(amount),
        style: Theme.of(context).textTheme.titleMedium,
      ),
    ),
  );
}

/// Pairs of bars per month. The whole chart is one semantics node that reads every value aloud.
class TrendBars extends StatelessWidget {
  const TrendBars({super.key, required this.points});
  final List<TrendPoint> points;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final max = points
        .expand((p) => [amountForChart(p.income), amountForChart(p.expenses)])
        .fold<double>(1, (a, b) => b > a ? b : a);
    final description = points
        .map(
          (p) =>
              '${monthLabel(p.year, p.month)}: pemasukan ${formatRupiah(p.income)}, pengeluaran ${formatRupiah(p.expenses)}',
        )
        .join('; ');
    return Semantics(
      label: 'Grafik tren. $description',
      excludeSemantics: true,
      child: SizedBox(
        height: 160,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            for (final p in points)
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Container(
                          width: 10,
                          height: 120 * amountForChart(p.income) / max,
                          color: scheme.primary,
                        ),
                        const SizedBox(width: 2),
                        Container(
                          width: 10,
                          height: 120 * amountForChart(p.expenses) / max,
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: scheme.tertiary,
                              width: 2,
                            ),
                          ),
                        ),
                      ],
                    ),
                    Text(monthLabel(p.year, p.month).substring(0, 3)),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
