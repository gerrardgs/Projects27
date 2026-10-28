# Language-specific security

Concrete pitfalls per language, following the [OpenSSF Security-Focused Guide for AI Code Assistant Instructions](https://best.openssf.org/Security-Focused-Guide-for-AI-Code-Assistant-Instructions) and the official documentation linked below (checked 2026-10-16). Apply the general rules of [06-security](../../../rules/06-security.md) first.

## C and C++

- Prefer safer types and APIs: `std::vector`, `std::string`, `std::span` and bounds-checked functions over raw arrays and unchecked copies; never use `gets`; define buffer sizes as named constants.
- Build with hardening flags. The [OpenSSF Compiler Options Hardening Guide for C and C++](https://best.openssf.org/Compiler-Hardening-Guides/Compiler-Options-Hardening-Guide-for-C-and-C++) recommends this GCC/Clang baseline:

  ```text
  -O2 -Wall -Wformat -Wformat=2 -Wconversion -Wimplicit-fallthrough
  -Werror=format-security
  -U_FORTIFY_SOURCE -D_FORTIFY_SOURCE=3
  -D_GLIBCXX_ASSERTIONS
  -D_LIBCPP_HARDENING_MODE=_LIBCPP_HARDENING_MODE_FAST
  -fstrict-flex-arrays=3
  -fstack-clash-protection -fstack-protector-strong
  -Wl,-z,nodlopen -Wl,-z,noexecstack
  -Wl,-z,relro -Wl,-z,now
  -Wl,--as-needed -Wl,--no-copy-dt-needed-entries
  ```

  Add `-fcf-protection=full -fzero-call-used-regs=used-gpr` on x86_64 and `-fPIE -pie` for executables (not shared libraries). Check each flag against your compiler version, as the guide explains.
- Run tests under AddressSanitizer and UndefinedBehaviorSanitizer, and fuzz parsers of untrusted input.

## Rust

- Avoid `unsafe`; when it is unavoidable, keep the block small and document the invariants it relies on in a `// SAFETY:` comment.
- Audit dependencies with `cargo audit` and `cargo deny`.

## Go

- Run tests with the race detector (`go test -race ./...`) and scan with `govulncheck ./...`.
- Use `html/template` (contextual escaping) rather than `text/template` for HTML; `os.CreateTemp` for temporary files; `crypto/rand` for secrets.

## Python

- Never call `eval` or `exec` on input. Run processes with `subprocess.run([...], shell=False)` and an argument list.
- Load YAML with `yaml.safe_load`; parse untrusted XML with `defusedxml`; never unpickle untrusted data.
- Create temporary files with `tempfile.mkstemp` or `tempfile.NamedTemporaryFile`, not hand-built names.
- Use `secrets` for tokens and `hmac.compare_digest` for comparisons; Bandit finds many of these issues automatically.

## JavaScript and TypeScript

- No `eval`, `new Function` or string arguments to `setTimeout` with untrusted data; use parameterized queries or the ORM's bound parameters.
- Encode output for its HTML context, and avoid `innerHTML` with untrusted strings ([web-frontend-engineering](../../web-frontend-engineering/SKILL.md)).
- Validate and freeze configuration objects built from input to avoid prototype pollution; use `Object.create(null)` or `Map` for dictionaries keyed by user input.
- Pass child-process arguments as an array (`execFile`, `spawn`) instead of a shell string.

## Java and Kotlin

- Use the framework's security features (for example Spring Security), password encoders such as `BCryptPasswordEncoder` or Argon2, and prepared statements.
- Do not deserialize untrusted data with Java native serialization; configure XML parsers to disable external entities.

## C# and .NET

- Use the .NET cryptography and ASP.NET Core Identity libraries instead of custom code.
- Do not use `BinaryFormatter`: starting with .NET 9 the in-box implementation always throws, and it "is insecure and can't be made secure" ([Microsoft](https://learn.microsoft.com/en-us/dotnet/standard/serialization/binaryformatter-security-guide)). Use `System.Text.Json`, `XmlSerializer` or `DataContractSerializer`.

## Most dangerous weaknesses to check first

The [2025 CWE Top 25](https://cwe.mitre.org/top25/archive/2025/2025_cwe_top25.html) is led by cross-site scripting (CWE-79), SQL injection (CWE-89), cross-site request forgery (CWE-352), missing authorization (CWE-862), out-of-bounds write (CWE-787), path traversal (CWE-22), use after free (CWE-416), out-of-bounds read (CWE-125), OS command injection (CWE-78) and code injection (CWE-94). Language-specific secure coding standards such as the SEI CERT coding standards go deeper.
