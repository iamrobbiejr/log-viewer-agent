---
sidebar_position: 2
---

# Architecture & Tunnels

The Log Viewer Agent employs a dual-service architecture managed by NSSM (Non-Sucking Service Manager).

## 1. The FastAPI Service
This is the core Python application. It runs locally (typically on port 8000). It reads files from the designated directory and processes API requests. It does **not** bind to public network interfaces by default for security reasons.

## 2. The Ngrok Tunnel Service
Because machines sit behind corporate firewalls or NATs, we cannot easily port-forward port 8000 to the public internet. 
To solve this, the installation script automatically installs and configures a secondary Windows Service running Ngrok.

Ngrok creates a reverse tunnel, exposing the local FastAPI service to a randomly generated, secure `https://*.ngrok-free.app` URL.

## Automatic URL Synchronization
When the FastAPI service starts, it runs a background thread that interrogates the local Ngrok API (`http://127.0.0.1:4040/api/tunnels`) to discover its public URL.
Once discovered, it makes a POST request to your central NestJS backend, informing the system:
> *"I am Agent X. My secret key is Y. My new public IP is Z."*

This allows the Dashboard to seamlessly route requests to the correct remote machine without you ever needing to know its IP address!

> [Screenshot/s needed] - Add an architecture diagram showing the Agent, Ngrok, Backend, and Dashboard flow.
