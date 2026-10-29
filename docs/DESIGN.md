# Design

## Design direction

Calm, dense enough for numbers, and fast to use with one hand. Every screen has one main action (Simpan on Catat). Amounts are aligned and use tabular figures, and income and expense colours are never the only signal: the text says "Pemasukan" or "Pengeluaran". Each client follows its own platform: plain HTML forms on the web, Material 3 on Android, and SwiftUI forms on iOS.

## Users and key flows

The first user is an individual keeping personal books in IDR ([PRD.md](PRD.md#users-and-scenarios)). Key flows:

1. **Catat by voice**: Bicara → recording sign (red dot, "Merekam", timer) → "Memproses …" → form filled → check → Simpan.
2. **Catat by hand**: Jenis, Jumlah, Tanggal, Kategori, Dari, Keterangan, Pihak lain → Simpan.
3. **Check the month**: Dasbor (income, expenses, net, savings rate, trend, spending by category) → Laporan → Unduh Excel.
4. **Fix a mistake**: Jurnal → Balik transaksi with a reason.
5. **Import**: choose a file → map columns → preview → import.
6. **Offline**: a notice shows when the data was saved; transactions wait and are sent later.

## Screens

| Screen | Web | Android | iOS |
| :--- | :--- | :--- | :--- |
| Masuk / Daftar | Yes | Yes | Yes |
| Dasbor | Yes, with 12-month trend chart and data table | Yes, 6-month trend | Yes, Swift Charts |
| Catat (voice, sentence, form, quality note) | Yes | Yes | Yes |
| Jurnal (with reversal on the web) | Yes | Yes (read) | Yes (read) |
| Laporan, Impor, Keamanan (TOTP) | Yes | Not yet | Not yet |

## Content and tone

Indonesian, short and direct, in the second person without formality ("Periksa lalu tekan Simpan."). Labels say what happens ("Isi otomatis", "Kirim sekarang", "Balik transaksi"). Errors say what went wrong and what to do ("Izin mikrofon ditolak. Izinkan mikrofon untuk situs ini di pengaturan browser, lalu coba lagi."). Amounts are written as "Rp 35.000" and dates as the platform formats them for `id-ID`.

## Accessibility targets

WCAG 2.2 AA ([10-accessibility](../.agents/rules/10-accessibility.md)). Every web journey is checked with axe-core in light and dark themes, at 320 CSS pixels without horizontal scrolling, and with the keyboard (skip link, focus moved to Simpan or to the missing field after filling). Status messages are live regions; the recording sign has a text label besides the red dot. The Android widget tests check Flutter's text-contrast and tap-target guidelines; the iOS app posts VoiceOver announcements for each capture step. Screen-reader passes with real users are still to do.

## Decisions and rationale

- **No UI or chart library on the web**: fewer dependencies, full control over accessibility; the trend chart is SVG with a data table.
- **Fill, never save**: voice and AI fill the form; the person presses Simpan, because a wrong amount saved silently is the costliest error ([EVALUATION.md](EVALUATION.md)).
- **Visible recording state**: added after a user could not tell that the microphone was recording (2026-10-28).
- **Offline notice instead of a blank error page**: the data on screen is labelled with the time it was saved.
