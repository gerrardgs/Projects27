import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:keuangan/screens/dashboard_screen.dart';
import 'package:keuangan/src/models.dart';

MonthlyRecap recap() => MonthlyRecap.fromJson({
  'income': [
    {
      'code': '4100',
      'name': 'Gaji',
      'month': '12000000.00',
      'shareOfTotal': '100.00',
    },
  ],
  'expenses': [
    {
      'code': '5400',
      'name': 'Listrik, Air dan Internet',
      'month': '725350.50',
      'shareOfTotal': '100.00',
    },
  ],
  'totalIncome': '12000000.00',
  'totalExpenses': '725350.50',
  'net': '11274649.50',
  'savingsRate': '93.95',
  'checks': [
    {'name': 'recap_matches_income_statement', 'passed': true, 'detail': ''},
  ],
});

void main() {
  testWidgets(
    'the dashboard shows exact amounts and a chart that reads its values aloud',
    (tester) async {
      final semantics = tester.ensureSemantics();
      final points = [
        TrendPoint(
          year: 2026,
          month: 10,
          income: '12000000.00',
          expenses: '725350.50',
        ),
      ];
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: DashboardScreen(
              data: DashboardData(recap(), points),
              year: 2026,
              month: 10,
            ),
          ),
        ),
      );
      expect(find.text('Rp 12.000.000'), findsWidgets);
      expect(find.text('Rp 725.350,50'), findsWidgets);
      expect(find.text('93,95%'), findsOneWidget);
      expect(
        find.bySemanticsLabel(
          RegExp(
            'Grafik tren.*Okt 2026: pemasukan Rp 12.000.000, pengeluaran Rp 725.350,50',
          ),
        ),
        findsOneWidget,
      );
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      semantics.dispose();
    },
  );
}
