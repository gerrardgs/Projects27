import KeuanganCore
import SwiftUI

struct LoginView: View {
    @Environment(AppModel.self) private var model
    @State private var register = false
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var code = ""
    @State private var needsCode = false
    @State private var error: String?
    @State private var busy = false

    var body: some View {
        NavigationStack {
            Form {
                if let error {
                    Text(error).foregroundStyle(.red).accessibilityIdentifier("login-error")
                }
                if register {
                    TextField("Nama", text: $name).textContentType(.name)
                }
                TextField("Email", text: $email)
                    .textContentType(.username).keyboardType(.emailAddress).textInputAutocapitalization(.never).autocorrectionDisabled()
                SecureField("Kata sandi", text: $password).textContentType(register ? .newPassword : .password)
                if register { Text("12 sampai 128 karakter").font(.footnote).foregroundStyle(.secondary) }
                if needsCode {
                    TextField("Kode 6 digit autentikator", text: $code).textContentType(.oneTimeCode).keyboardType(.numberPad)
                }
                Button(register ? "Buat akun dan masuk" : "Masuk") { Task { await submit() } }.disabled(busy)
                Button(register ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar") {
                    register.toggle()
                    error = nil
                }
            }
            .navigationTitle(register ? "Buat akun" : "Masuk")
        }
    }

    private func submit() async {
        busy = true
        defer { busy = false }
        do {
            if register {
                try await model.register(email: email.trimmingCharacters(in: .whitespaces), password: password, displayName: name)
            } else {
                try await model.signIn(email: email.trimmingCharacters(in: .whitespaces), password: password, totp: needsCode ? code : nil)
            }
        } catch let failure as APIError {
            if failure.title == "Second factor required" { needsCode = true }
            error = failure.detail
        } catch let failure as KeychainError {
            self.error = "Token masuk tidak dapat disimpan di Keychain (kode \(failure.status))."
        } catch is URLError {
            self.error = "Server tidak dapat dihubungi. Pastikan API berjalan."
        } catch {
            self.error = "Gagal masuk: \(error.localizedDescription)"
        }
    }
}
