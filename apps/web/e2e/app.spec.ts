import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { readXlsx } from "../../api/src/xlsx.ts";

// Dates in the current month in Asia/Jakarta, so the dashboard's default month shows them.
const now = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const [year, month] = now.split("-");
const day = (d: number) => `${String(d).padStart(2, "0")}/${month}/${year}`;

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

async function signUp(page: Page) {
  const email = `e2e-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Masuk" })).toBeVisible();
  await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "Belum punya akun? Daftar" }).click();
  await page.getByLabel("Nama").fill("Penguji");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi").fill("correct horse battery staple");
  await page.getByRole("button", { name: "Buat akun dan masuk" }).click();
  await expect(page.getByRole("heading", { name: "Dasbor" })).toBeVisible();
  return email;
}

test("sign up, record an expense by keyboard and see it on the dashboard", async ({ page }) => {
  await signUp(page);
  await expectNoAxeViolations(page);
  await page.getByRole("link", { name: "Catat" }).click();
  await expect(page.getByRole("heading", { name: "Catat transaksi" })).toBeVisible();
  await expectNoAxeViolations(page);
  await page.getByLabel("Jumlah (Rp)").fill("35.000");
  await page.getByLabel("Kategori").selectOption({ label: "5100 Makan dan Minum" });
  await page.getByLabel("Dari").selectOption({ label: "1100 Kas Tunai" });
  await page.getByLabel("Keterangan").fill("Nasi padang");
  await page.getByLabel("Keterangan").press("Enter");
  await expect(page.getByRole("status")).toContainText("Tersimpan: Nasi padang");
  await page.getByRole("link", { name: "Dasbor" }).click();
  await expect(page.locator(".kpi-value").nth(1)).toHaveText(/Rp\s35\.000/);
  await expect(page.getByRole("img", { name: /Tren 12 bulan/ })).toBeVisible();
});

test("import a CSV twice: rows post once, duplicates are recognised", async ({ page }, info) => {
  await signUp(page);
  await page.getByRole("link", { name: "Impor" }).click();
  await expectNoAxeViolations(page);
  const csv = [
    "Tanggal;Keterangan;Nominal;Jenis;Kategori",
    `${day(1)};Gaji;12.000.000,00;CR;4100`,
    `${day(1)};Listrik dan internet;725.350,50;DB;5400`,
    `${day(1)};Akun tidak ada;1.000;DB;9999`,
  ].join("\n");
  const path = info.outputPath("mutasi.csv");
  await import("node:fs").then((fs) => fs.writeFileSync(path, csv));
  await page.getByLabel("File CSV atau Excel").setInputFiles(path);
  await expect(page.getByLabel("Tanggal (wajib)")).toHaveValue("Tanggal");
  await page.getByRole("button", { name: "Pratinjau" }).click();
  await expect(page.getByRole("alert")).toContainText("3 baris: 2 siap, 0 sudah ada, 1 galat");
  await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "Impor 2 baris" }).click();
  await expect(page.getByRole("heading", { name: "Hasil impor" })).toBeVisible();
  await page.getByRole("button", { name: "Pratinjau" }).click();
  await expect(page.getByRole("alert")).toContainText("2 sudah ada");
  await page.getByRole("link", { name: "Dasbor" }).click();
  await expect(page.locator(".kpi-value").first()).toHaveText(/Rp\s12\.000\.000/);
  await expect(page.locator(".kpi-value").nth(1)).toHaveText(/Rp\s725\.350,50/);
});

test("reports render, export to Excel with the same totals, and the journal reverses an entry", async ({ page }) => {
  await signUp(page);
  await page.getByRole("link", { name: "Catat" }).click();
  await page.getByRole("radio", { name: "Pemasukan" }).check();
  await page.getByLabel("Jumlah (Rp)").fill("1.250.000,50");
  await page.getByLabel("Kategori").selectOption({ label: "4300 Usaha dan Freelance" });
  await page.getByLabel("Masuk ke").selectOption({ label: "1200 Rekening Bank" });
  await page.getByLabel("Keterangan").fill("Proyek desain");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page.getByRole("status")).toContainText("Tersimpan");

  await page.getByRole("link", { name: "Laporan" }).click();
  await expect(page.getByRole("table", { name: /Rekap bulanan/ })).toContainText("Usaha dan Freelance");
  await expectNoAxeViolations(page);
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Unduh Excel" }).click();
  const file = await (await download).path();
  const rows = readXlsx(readFileSync(file));
  expect(rows.find((r) => r[1] === "Total pemasukan")?.[2]).toBe("1250000.50");

  await page.getByRole("link", { name: "Jurnal" }).click();
  await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "Balik transaksi Proyek desain" }).click();
  await expect(page.getByRole("dialog", { name: "Balik transaksi" })).toBeVisible();
  await page.getByLabel("Alasan").fill("Salah catat");
  await page.getByRole("dialog").getByRole("button", { name: "Balik" }).click();
  await expect(page.getByRole("status")).toContainText("dibalik");
  await expect(page.getByRole("cell", { name: "Dibalik" })).toBeVisible();
  await page.getByRole("link", { name: "Keamanan" }).click();
  await expectNoAxeViolations(page);
});

test("the layout reflows without horizontal scrolling at 320 CSS pixels", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await signUp(page);
  for (const name of ["Dasbor", "Catat", "Laporan", "Impor"]) {
    await page.getByRole("link", { name }).click();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, name).toBeLessThanOrEqual(0);
  }
});

test("keyboard: the skip link moves focus to the page content, and the console stays clean", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await signUp(page);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Langsung ke isi" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
  // The only expected error is the browser's log line for the signed-out session probe (GET /v1/me returns 401).
  expect(errors.filter((text) => !text.includes("status of 401"))).toEqual([]);
});

test("dark theme passes the same accessibility checks", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await signUp(page);
  await expectNoAxeViolations(page);
  await page.getByRole("link", { name: "Laporan" }).click();
  await expectNoAxeViolations(page);
});

test("when the API is down the page says so in plain language", async ({ page }) => {
  await page.route("**/v1/me", (route) => route.fulfill({ status: 502, body: "" }));
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("Server API tidak dapat dihubungi");
});

/**
 * Replaces the browser's speech recogniser with one that "hears" the given sentence, or fails with an error code.
 * `final: false` behaves like Safari, which can end without ever marking the result as final.
 */
async function fakeSpeech(page: Page, outcome: { heard: string; final?: boolean } | { error: string }) {
  await page.addInitScript((result) => {
    class FakeRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      maxAlternatives = 1;
      onaudiostart: (() => void) | null = null;
      onresult: ((event: unknown) => void) | null = null;
      onerror: ((event: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start() {
        (window as unknown as { lastSpeechLang: string }).lastSpeechLang = this.lang;
        setTimeout(() => this.onaudiostart?.(), 50);
        setTimeout(() => {
          if ("error" in result) {
            this.onerror?.({ error: result.error });
            this.onend?.();
            return;
          }
          const words = result.heard.split(" ");
          const half = words.slice(0, Math.ceil(words.length / 2)).join(" ");
          this.onresult?.({ resultIndex: 0, results: [Object.assign([{ transcript: half }], { isFinal: false })] });
          this.onresult?.({
            resultIndex: 0,
            results: [Object.assign([{ transcript: result.heard }], { isFinal: result.final ?? true })],
          });
        }, 600);
      }
      stop() {
        setTimeout(() => this.onend?.(), 10);
      }
      abort() {}
    }
    Object.assign(window, { SpeechRecognition: FakeRecognition, webkitSpeechRecognition: FakeRecognition });
  }, outcome);
}

test("speaking fills the capture form in Indonesian; nothing is saved until Simpan is pressed", async ({ page }) => {
  await fakeSpeech(page, { heard: "beli nasi padang di warung sederhana 35 ribu pakai gopay" });
  await signUp(page);
  await page.getByRole("link", { name: "Catat" }).click();
  await page.getByRole("button", { name: "Bicara" }).click();
  await expect(page.getByTestId("recording-indicator")).toContainText("Merekam");
  await expect(page.getByRole("button", { name: "Selesai bicara" })).toBeVisible();
  await expect(page.getByLabel("Jumlah (Rp)")).toHaveValue("35.000");
  expect(await page.evaluate(() => (window as unknown as { lastSpeechLang: string }).lastSpeechLang)).toBe("id-ID");
  await expect(page.getByLabel("Kategori")).toHaveValue(
    (await page.getByRole("option", { name: "5100 Makan dan Minum" }).getAttribute("value")) ?? "",
  );
  await expect(page.getByLabel("Dari")).toHaveValue(
    (await page.getByRole("option", { name: "1300 Dompet Digital" }).getAttribute("value")) ?? "",
  );
  await expect(page.getByLabel("Keterangan", { exact: true })).toHaveValue("Beli nasi padang di warung sederhana");
  await expect(page.getByLabel("Pihak lain (opsional)")).toHaveValue("Warung Sederhana");
  await expect(page.getByText(/Formulir terisi otomatis dari/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Simpan" })).toBeFocused();
  await expectNoAxeViolations(page);

  await page.getByRole("link", { name: "Jurnal" }).click();
  await expect(page.getByText("Belum ada transaksi pada bulan ini.")).toBeVisible();
  await page.getByRole("link", { name: "Catat" }).click();
  await page.getByLabel("Atau ketik kalimatnya").fill("terima gaji 12,5 juta dari PT Maju Jaya");
  await page.getByRole("button", { name: "Isi otomatis" }).click();
  await expect(page.getByLabel("Jumlah (Rp)")).toHaveValue("12.500.000");
  await expect(page.getByRole("radio", { name: "Pemasukan" })).toBeChecked();
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page.getByText(/Tersimpan: Terima gaji/)).toBeVisible();
  // The saved form was not corrected, which the real-use quality note reports.
  await expect(page.getByText(/1 dari 1 formulir disimpan tanpa koreksi/)).toBeVisible();
});

test("Safari-style results that never become final still fill the form", async ({ page }) => {
  await fakeSpeech(page, {
    heard: "Saya beli barang buat modif motor 400.000 pakai internet banking Danamon",
    final: false,
  });
  await signUp(page);
  await page.getByRole("link", { name: "Catat" }).click();
  await page.getByRole("button", { name: "Bicara" }).click();
  await expect(page.getByTestId("recording-indicator")).toBeVisible();
  await expect(page.getByText(/Mendengarkan… “Saya beli barang .* Danamon”/)).toBeVisible();
  await page.getByRole("button", { name: "Selesai bicara" }).click();
  await expect(page.getByLabel("Jumlah (Rp)")).toHaveValue("400.000");
  await expect(page.getByLabel("Dari")).toHaveValue(
    (await page.getByRole("option", { name: "1200 Rekening Bank" }).getAttribute("value")) ?? "",
  );
  await expect(page.getByText("Tidak ada kalimat yang terdengar")).toHaveCount(0);
});

test("speech errors are explained, and typing still works", async ({ page }) => {
  await fakeSpeech(page, { error: "not-allowed" });
  await signUp(page);
  await page.getByRole("link", { name: "Catat" }).click();
  await page.getByRole("button", { name: "Bicara" }).click();
  await expect(page.getByRole("alert")).toContainText("Izin mikrofon ditolak");
  await expect(page.getByRole("button", { name: "Bicara" })).toBeEnabled();
});

test("with the API down, saved data stays visible and a new transaction waits on the device until it is back", async ({
  page,
}) => {
  await signUp(page);
  await page.getByRole("link", { name: "Catat" }).click();
  await page.getByLabel("Jumlah (Rp)").fill("50.000");
  await page.getByLabel("Keterangan").fill("Makan siang");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Tersimpan: Makan siang" })).toBeVisible();
  await page.getByRole("link", { name: "Jurnal" }).click();
  await expect(page.getByRole("cell", { name: "Makan siang", exact: true })).toBeVisible();

  await page.route("**/v1/**", (route) => route.abort("connectionrefused"));
  await page.reload();
  await expect(
    page.getByText(/Server tidak dapat dihubungi. Data yang tampil tersimpan di perangkat ini/),
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: "Makan siang", exact: true })).toBeVisible();
  await expectNoAxeViolations(page);

  await page.getByRole("link", { name: "Catat" }).click();
  await page.getByLabel("Jumlah (Rp)").fill("12.000");
  await page.getByLabel("Keterangan").fill("Parkir saat offline");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page.getByText(/Transaksi disimpan di perangkat ini dan dikirim otomatis/)).toBeVisible();
  await expect(page.getByText("1 transaksi tersimpan di perangkat, menunggu dikirim")).toBeVisible();
  await page.reload();
  await expect(page.getByText("1 transaksi tersimpan di perangkat, menunggu dikirim")).toBeVisible();

  await page.unroute("**/v1/**");
  await page.getByText("1 transaksi tersimpan di perangkat, menunggu dikirim").click();
  await page.getByRole("button", { name: "Kirim sekarang" }).click();
  await expect(page.getByText(/menunggu dikirim/)).toHaveCount(0);
  await page.getByRole("link", { name: "Jurnal" }).click();
  await expect(page.getByRole("cell", { name: "Parkir saat offline", exact: true })).toBeVisible();
  // Sending the same queued transaction again cannot post it twice: the idempotency key matches.
  await expect(page.getByRole("cell", { name: "Parkir saat offline", exact: true })).toHaveCount(1);
});
