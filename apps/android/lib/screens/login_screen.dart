import 'package:flutter/material.dart';

import '../src/api.dart';
import '../src/session.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({
    super.key,
    required this.session,
    required this.onSignedIn,
  });
  final Session session;
  final VoidCallback onSignedIn;
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _name = TextEditingController();
  final _code = TextEditingController();
  bool _register = false;
  bool _needsCode = false;
  bool _busy = false;
  String? _error;

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      if (_register) {
        await widget.session.api.register(
          _email.text.trim(),
          _password.text,
          _name.text.trim(),
        );
      }
      await widget.session.signIn(
        _email.text.trim(),
        _password.text,
        totp: _needsCode ? _code.text : null,
      );
      widget.onSignedIn();
    } on ApiException catch (e) {
      setState(() {
        _error = e.detail;
        _needsCode = _needsCode || e.title == 'Second factor required';
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_register ? 'Buat akun' : 'Masuk')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_error != null)
            Semantics(
              liveRegion: true,
              child: Text(
                _error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ),
          if (_register)
            TextField(
              controller: _name,
              decoration: const InputDecoration(labelText: 'Nama'),
              autofillHints: const [AutofillHints.name],
            ),
          TextField(
            controller: _email,
            decoration: const InputDecoration(labelText: 'Email'),
            keyboardType: TextInputType.emailAddress,
            autofillHints: const [AutofillHints.email],
          ),
          TextField(
            controller: _password,
            decoration: InputDecoration(
              labelText: 'Kata sandi',
              helperText: _register ? '12 sampai 128 karakter' : null,
            ),
            obscureText: true,
            autofillHints: [
              _register ? AutofillHints.newPassword : AutofillHints.password,
            ],
          ),
          if (_needsCode)
            TextField(
              controller: _code,
              decoration: const InputDecoration(
                labelText: 'Kode 6 digit autentikator',
              ),
              keyboardType: TextInputType.number,
              autofillHints: const [AutofillHints.oneTimeCode],
            ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _busy ? null : _submit,
            child: Text(_register ? 'Buat akun dan masuk' : 'Masuk'),
          ),
          TextButton(
            onPressed: () => setState(() {
              _register = !_register;
              _error = null;
            }),
            child: Text(
              _register
                  ? 'Sudah punya akun? Masuk'
                  : 'Belum punya akun? Daftar',
            ),
          ),
        ],
      ),
    );
  }
}
