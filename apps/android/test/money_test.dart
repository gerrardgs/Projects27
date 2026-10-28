import 'package:flutter_test/flutter_test.dart';
import 'package:keuangan/src/money.dart';

void main() {
  test('formats API amounts exactly, sen only when present', () {
    expect(formatRupiah('725350.50'), 'Rp 725.350,50');
    expect(formatRupiah('35000.00'), 'Rp 35.000');
    expect(formatRupiah('-186000.00'), '-Rp 186.000');
    expect(formatRupiah('999999999999999.99'), 'Rp 999.999.999.999.999,99');
    expect(() => formatRupiah('35000'), throwsFormatException);
  });

  test('reads amounts typed the Indonesian way', () {
    expect(parseRupiahInput('35.000'), '35000.00');
    expect(parseRupiahInput('Rp 1.250.000,50'), '1250000.50');
    expect(parseRupiahInput('0,5'), '0.50');
    for (final bad in ['', 'abc', '-5', '1,234', '12.34', '0']) {
      expect(parseRupiahInput(bad), isNull, reason: bad);
    }
  });
}
