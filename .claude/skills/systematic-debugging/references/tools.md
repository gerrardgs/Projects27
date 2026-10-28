# Debugging and profiling tools by language

Node.js flags were checked against the Node.js API docs, and package names against their registries, on 2026-10-14. Run `<tool> --help` to confirm flags for the installed version.

## Any language: Git bisect

```sh
git bisect start
git bisect bad                 # the current commit is broken
git bisect good v1.4.0         # a commit or tag known to work
git bisect run ./repro.sh      # exit 0 = good, 125 = skip, 1-127 otherwise = bad
git bisect reset               # return to the original branch when done
```

`repro.sh` should build the project and run the smallest test that shows the bug.

## JavaScript / TypeScript (Node.js)

| Task | Tool |
| :--- | :--- |
| Interactive debugger | `node --inspect-brk app.js`, then attach Chrome DevTools (`chrome://inspect`) or the VS Code built-in JavaScript debugger |
| Debug a test | `node --inspect-brk --test file.test.ts` (Node runs test files one at a time while the inspector is active, and the test process waits for a debugger to attach) |
| CPU profile | `node --cpu-prof app.js` writes a `.cpuprofile` file; open it in Chrome DevTools (stable since Node 22.4) |
| Heap profile | `node --heap-prof app.js` (stable since Node 22.4); heap snapshots on demand with `--heapsnapshot-signal=SIGUSR2` |
| Async stack traces | Enabled by default; keep `await` (not bare promise chains) for readable traces |
| Source maps | `node --enable-source-maps` for compiled output |

## Python

| Task | Tool |
| :--- | :--- |
| Breakpoint in code | `breakpoint()` (Python 3.7+), then `pdb` commands (`n`, `s`, `c`, `p expr`, `w`) |
| Run under the debugger | `python -m pdb script.py`; for tests, `pytest --pdb` stops at the first failure |
| Editor debugging | `debugpy` (VS Code extension `ms-python.debugpy`) |
| CPU profile | `python -m cProfile -o out.prof script.py`, inspect with `pstats`; sampling a running process: `py-spy record -o profile.svg --pid <PID>` |
| Memory | `tracemalloc` (standard library); `memray run script.py` |
| Slow imports | `python -X importtime -c "import package"` |
| Hangs and crashes | `faulthandler` (`python -X faulthandler`) dumps tracebacks on fatal errors |

## Go

| Task | Tool |
| :--- | :--- |
| Debugger | Delve: `dlv debug`, `dlv test`, `dlv attach <PID>`; integrated in the VS Code Go extension (`golang.go`) |
| Race detector | `go test -race`, `go run -race` |
| CPU and memory profiles | `go test -cpuprofile cpu.out -memprofile mem.out -bench .`, then `go tool pprof -http=:8080 cpu.out`; live services: import `net/http/pprof` on an internal-only port |
| Execution trace | `go test -trace trace.out`, then `go tool trace trace.out` |

## Rust

| Task | Tool |
| :--- | :--- |
| Backtraces | `RUST_BACKTRACE=1` (or `full`) |
| Debugger | `rust-lldb` / `rust-gdb`; VS Code: CodeLLDB (`vadimcn.vscode-lldb`) |
| Flame graphs | `cargo flamegraph` (crate `flamegraph`) |
| Benchmarks | `criterion` |
| Undefined behaviour in `unsafe` code | Miri: `cargo +nightly miri test` |

## Java / .NET

- Java: IDE debugger (JDWP), `jcmd <PID> Thread.print` for thread dumps, Java Flight Recorder plus JDK Mission Control for profiling, heap dumps with `jcmd <PID> GC.heap_dump`.
- .NET: IDE debugger, `dotnet-trace`, `dotnet-counters`, `dotnet-dump`.

## System level

- HTTP: `curl -v` (headers and TLS), the browser's network panel.
- Processes: `top`/`htop`, `lsof -p <PID>` (open files and sockets), `strace -f -p <PID>` on Linux.
- Containers: `docker logs`, `docker exec -it <container> sh`, `kubectl logs`, `kubectl describe pod`, `kubectl get events`.
