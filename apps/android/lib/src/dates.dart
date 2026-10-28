/// Today in Asia/Jakarta (UTC+7, no daylight saving time), as YYYY-MM-DD.
String todayJakarta([DateTime? now]) {
  final t = (now ?? DateTime.now()).toUtc().add(const Duration(hours: 7));
  return '${t.year.toString().padLeft(4, '0')}-${t.month.toString().padLeft(2, '0')}-${t.day.toString().padLeft(2, '0')}';
}

const _months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];
String monthLabel(int year, int month) => '${_months[month - 1]} $year';

({String from, String to}) monthBounds(int year, int month) {
  final last = DateTime.utc(year, month + 1, 0).day;
  final mm = month.toString().padLeft(2, '0');
  return (
    from: '$year-$mm-01',
    to: '$year-$mm-${last.toString().padLeft(2, '0')}',
  );
}

/// A moment as Asia/Jakarta date and time, for example "28 Okt 2026 16.29".
String formatLocalTime(DateTime moment) {
  final t = moment.toUtc().add(const Duration(hours: 7));
  String two(int n) => n.toString().padLeft(2, '0');
  return '${t.day} ${_months[t.month - 1]} ${t.year} ${two(t.hour)}.${two(t.minute)}';
}
