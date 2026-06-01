# Contributing to Log Viewer Agent

We welcome contributions from the community! Whether you are fixing a bug, adding a new feature, or improving documentation, your help is appreciated.

## Technical Considerations

If you are planning to contribute code, please review the following architectural considerations that we aim to maintain or improve:

### 1. Authentication
- **Current State:** The Agent and the NestJS Backend use a shared UUID (`agent_secret`). The Dashboard passes this secret as a header (`X-Agent-Secret`) which the Agent verifies before returning any log data.
- **Expectation:** We do not want to rely on basic auth or unauthenticated endpoints. Any new API routes added to the Python agent must use the `verify_token` dependency.

### 2. Log Streaming & Data Transfer
- **Current State:** Log files are read into memory, parsed, and paginated via standard HTTP GET requests. This works great for small to medium logs.
- **Future Goal:** Reading massive (e.g., 5GB+) log files over standard HTTP can crash the agent or cause timeouts. A priority feature for the community is implementing **WebSockets** or **Server-Sent Events (SSE)** to stream logs chunk-by-chunk (similar to `tail -f`).

### 3. Resource Usage
- **Current State:** The agent relies on endpoints being actively polled by the dashboard when a user is viewing logs.
- **Future Goal:** The Windows Service should be as lightweight as possible to avoid consuming CPU/RAM on the target machine. We encourage contributions that implement file system watchers (e.g., Python's `watchdog` library) rather than continuous polling loops, so the agent only processes data when actual file modifications occur.

## How to Contribute

1. **Fork the Repository:** Create your own fork and branch off `master`.
2. **Make your Changes:** Keep your commits clean and descriptive.
3. **Test:** Ensure the dashboard builds (`npm run dev`) and the Python agent tests locally.
4. **Submit a Pull Request:** Explain *why* you made the change and what issue it resolves.

Thank you for helping make remote log management easier for everyone!
