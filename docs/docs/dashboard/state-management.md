---
sidebar_position: 3
---

# State Management

The dashboard uses modern React patterns to manage state efficiently without prop-drilling or bulky Redux setups.

## React Query
We use `@tanstack/react-query` for all asynchronous data fetching. This provides out-of-the-box caching, background refetching, and error handling.

## Context API
Global UI states and Authentication are managed using standard React Contexts:
- `AuthContext`: Stores the JWT token and user profile. Automatically logs the user out if a 401 Unauthorized response is detected.
- `ThemeContext`: Toggles between the Light and Dark modes.

