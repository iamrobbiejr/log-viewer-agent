---
sidebar_position: 3
---

# Authentication & Security

Security is critical when exposing log data. The NestJS backend implements several layers of security.

## JSON Web Tokens (JWT)
All requests to protected routes must include an `Authorization: Bearer <token>` header. The token is generated upon successful login and contains the user's ID and Role.

## Registration Security
By default, registration can be locked down to specific email domains.
- The `SettingsService` allows administrators to configure `allowed_email_domains` (e.g., `company.com`).
- If this setting is populated, the `AuthService` will reject any registration request from an email address outside those domains.

## Role-Based Access Control (RBAC)
We employ a simple RBAC system using NestJS Guards.
- **Admin**: Full access. Can add/remove machines, manage global settings, and manage user accounts.
- **User**: Can manage machines, view logs, and manage user accounts, but cannot modify configurations.

