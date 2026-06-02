---
sidebar_position: 1
---

# Agent Overview

The Log Viewer Agent is a lightweight Python FastAPI application designed to run persistently on Windows machines.

![Agent Logo](image-4.png)

## Core Responsibilities
- Securely read local `.log` files from a configured directory.
- Expose a REST API to query log metadata and stream log lines.
- Require API key (`X-API-Key`) authentication for every request.
- Automatically establish an Ngrok tunnel to expose the local server securely to the internet.
- Sync its dynamically generated public URL back to the central NestJS backend.
