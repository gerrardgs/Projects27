// Models for the parts of packages/contract/openapi.json that the Android app uses.

typedef Json = Map<String, dynamic>;

class Account {
  Account({
    required this.id,
    required this.code,
    required this.name,
    required this.type,
  });
  factory Account.fromJson(Json j) => Account(
    id: j['id'] as String,
    code: j['code'] as String,
    name: j['name'] as String,
    type: j['type'] as String,
  );
  final String id;
  final String code;
  final String name;
  final String type;
}

class Entity {
  Entity({required this.id, required this.name, required this.currency});
  factory Entity.fromJson(Json j) => Entity(
    id: j['id'] as String,
    name: j['name'] as String,
    currency: j['currency'] as String,
  );
  final String id;
  final String name;
  final String currency;
}

class Me {
  Me({required this.displayName, required this.entities});
  factory Me.fromJson(Json j) => Me(
    displayName: j['displayName'] as String,
    entities: (j['entities'] as List)
        .map((e) => Entity.fromJson(e as Json))
        .toList(),
  );
  final String displayName;
  final List<Entity> entities;
}

class Entry {
  Entry({
    required this.id,
    required this.date,
    required this.description,
    required this.status,
    required this.total,
  });
  factory Entry.fromJson(Json j) => Entry(
    id: j['id'] as String,
    date: j['date'] as String,
    description: j['description'] as String,
    status: j['status'] as String,
    total: j['total'] as String,
  );
  final String id;
  final String date;
  final String description;
  final String status;
  final String total;
}

class RecapRow {
  RecapRow({
    required this.code,
    required this.name,
    required this.month,
    required this.shareOfTotal,
  });
  factory RecapRow.fromJson(Json j) => RecapRow(
    code: j['code'] as String,
    name: j['name'] as String,
    month: j['month'] as String,
    shareOfTotal: j['shareOfTotal'] as String,
  );
  final String code;
  final String name;
  final String month;
  final String shareOfTotal;
}

class MonthlyRecap {
  MonthlyRecap({
    required this.income,
    required this.expenses,
    required this.totalIncome,
    required this.totalExpenses,
    required this.net,
    required this.savingsRate,
    required this.checksPassed,
  });
  factory MonthlyRecap.fromJson(Json j) => MonthlyRecap(
    income: (j['income'] as List)
        .map((r) => RecapRow.fromJson(r as Json))
        .toList(),
    expenses: (j['expenses'] as List)
        .map((r) => RecapRow.fromJson(r as Json))
        .toList(),
    totalIncome: j['totalIncome'] as String,
    totalExpenses: j['totalExpenses'] as String,
    net: j['net'] as String,
    savingsRate: j['savingsRate'] as String,
    checksPassed: (j['checks'] as List).every(
      (c) => (c as Json)['passed'] == true,
    ),
  );
  final List<RecapRow> income;
  final List<RecapRow> expenses;
  final String totalIncome;
  final String totalExpenses;
  final String net;
  final String savingsRate;
  final bool checksPassed;
}

class TrendPoint {
  TrendPoint({
    required this.year,
    required this.month,
    required this.income,
    required this.expenses,
  });
  factory TrendPoint.fromJson(Json j) => TrendPoint(
    year: j['year'] as int,
    month: j['month'] as int,
    income: j['income'] as String,
    expenses: j['expenses'] as String,
  );
  final int year;
  final int month;
  final String income;
  final String expenses;
}

/// A filled-in, unsaved transaction form from POST /capture/parse.
class CaptureDraft {
  CaptureDraft({
    required this.draftId,
    required this.kind,
    required this.amount,
    required this.date,
    required this.accountId,
    required this.fundingAccountId,
    required this.description,
    required this.counterparty,
    required this.source,
    required this.missing,
    required this.note,
  });
  factory CaptureDraft.fromJson(Json j) => CaptureDraft(
    draftId: j['draftId'] as String,
    kind: j['kind'] as String,
    amount: j['amount'] as String?,
    date: j['date'] as String,
    accountId: j['accountId'] as String?,
    fundingAccountId: j['fundingAccountId'] as String?,
    description: j['description'] as String?,
    counterparty: j['counterparty'] as String?,
    source: j['source'] as String,
    missing: (j['missing'] as List).cast<String>(),
    note: j['note'] as String?,
  );
  final String draftId;
  final String kind;
  final String? amount;
  final String date;
  final String? accountId;
  final String? fundingAccountId;
  final String? description;
  final String? counterparty;
  final String source;
  final List<String> missing;
  final String? note;
}

class QualityRate {
  QualityRate(this.count, this.of, this.rate, this.low, this.high);
  factory QualityRate.fromJson(Json j) {
    final ci = (j['ci95'] as List).cast<num>();
    return QualityRate(
      j['count'] as int,
      j['of'] as int,
      (j['rate'] as num?)?.toDouble(),
      ci[0].toDouble(),
      ci[1].toDouble(),
    );
  }
  final int count;
  final int of;
  final double? rate;
  final double low;
  final double high;
}

/// Real-use quality of capture: saved forms the person did not correct, with a 95% Wilson interval.
class CaptureQuality {
  CaptureQuality(this.days, this.saved, this.savedWithoutChanges);
  factory CaptureQuality.fromJson(Json j) => CaptureQuality(
    j['days'] as int,
    j['saved'] as int,
    QualityRate.fromJson(j['savedWithoutChanges'] as Json),
  );
  final int days;
  final int saved;
  final QualityRate savedWithoutChanges;
}
