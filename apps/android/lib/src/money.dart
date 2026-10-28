// Exact rupiah. The API sends decimal strings such as "725350.50"; they are formatted as text and
// never parsed into a double, so no sen is ever rounded away.

final _apiAmount = RegExp(r'^(-?)(0|[1-9]\d*)\.(\d{2})$');
final _thousands = RegExp(r'\B(?=(\d{3})+(?!\d))');
final _typed = RegExp(r'^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$');

/// "725350.50" -> "Rp 725.350,50"; "35000.00" -> "Rp 35.000" (sen only when there are any).
String formatRupiah(String amount) {
  final match = _apiAmount.firstMatch(amount);
  if (match == null) throw FormatException('not an API amount: $amount');
  final sign = match.group(1)!;
  final whole = match.group(2)!.replaceAllMapped(_thousands, (_) => '.');
  final sen = match.group(3)!;
  return '${sign}Rp $whole${sen == '00' ? '' : ',$sen'}';
}

/// Reads an amount typed the Indonesian way ("35.000", "1.250.000,50", "Rp 35000") and returns the
/// API decimal string, or null when it is not a valid positive amount.
String? parseRupiahInput(String input) {
  final text = input
      .trim()
      .replaceFirst(RegExp(r'^rp\.?\s*', caseSensitive: false), '')
      .replaceAll(RegExp(r'\s'), '');
  final match = _typed.firstMatch(text);
  if (match == null) return null;
  final whole = match
      .group(1)!
      .replaceAll('.', '')
      .replaceFirst(RegExp(r'^0+(?=\d)'), '');
  final sen = (match.group(2) ?? '').padRight(2, '0');
  if (whole.length > 15 || (whole == '0' && sen == '00')) return null;
  return '$whole.$sen';
}

/// Only for drawing charts; never use the result in arithmetic on money.
double amountForChart(String amount) => double.parse(amount);

/// "1250000.50" -> "1.250.000,50", "35000.00" -> "35.000": an API amount written the way the amount field expects it.
String toInputAmount(String amount) {
  final parts = amount.split('.');
  final whole = parts[0].replaceAllMapped(_thousands, (_) => '.');
  final sen = parts.length > 1 ? parts[1] : '00';
  return sen == '00' ? whole : '$whole,$sen';
}
