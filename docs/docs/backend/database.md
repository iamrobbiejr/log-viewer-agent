---
sidebar_position: 2
---

# Database

The backend utilizes **TypeORM** for object-relational mapping.

## Supported Databases
Out of the box, the system uses a local **SQLite** database (`database.sqlite`) for frictionless setup and local development.

For production deployments, the system automatically switches to **PostgreSQL** if a `DATABASE_URL` environment variable is provided in the `.env` file. TypeORM abstracts away the differences, ensuring seamless migrations.

## Key Entities
- `User`: Stores dashboard administrators and users, along with their hashed passwords and roles.
- `Machine`: Stores registered agents, their authentication keys, groups, and the dynamically synced Ngrok URLs.
- `Setting`: A generic key-value store used for global configurations (e.g., allowed email domains).
