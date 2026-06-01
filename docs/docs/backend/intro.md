---
sidebar_position: 1
---

# Backend Overview

The Log Viewer backend is a robust RESTful API built using the [NestJS](https://nestjs.com/) framework.

![Backend Logo](https://i.postimg.cc/SN4R6HBX/light-logo.png)

## Core Responsibilities
- **Authentication & Authorization:** Issues JSON Web Tokens (JWT) to secure the dashboard. Manages user roles (Admin vs User).
- **Machine Registry:** Maintains a database of all registered remote agents, including their dynamic Ngrok URLs and API keys.
- **Global Settings:** Allows administrators to configure application-wide settings (like allowed email registration domains) dynamically.

The backend acts as the central directory. When a user requests logs via the Dashboard, the Dashboard queries the Backend to get the target Agent's URL and API key, and then streams the logs directly from the Agent.
