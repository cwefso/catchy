# Music Recognition App

This is a music recognition app that uses the Shazam API for song detection and Spotify for playlist integration. To get started, you'll need to set up the required environment variables.

---

## Prerequisites

Before running the app, ensure you have the following:

1. **Node.js** installed (v16 or higher recommended).
2. **npm** or **yarn** installed.
3. A **Spotify Developer Account** to obtain `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` and `NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET`.
4. A **RapidAPI Account** to obtain `NEXT_PUBLIC_RAPIDAPI_KEY`.

---

## Setting Up Environment Variables

To run this app, you need to set up the following environment variables:

| Variable Name                       | Description                                                      |
| ----------------------------------- | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_SPOTIFY_CLIENT_ID`     | Your Spotify App's Client ID.                                    |
| `NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET` | Your Spotify App's Client Secret.                                |
| `NEXT_PUBLIC_SPOTIFY_REDIRECT_URI`  | The redirect URI configured in your Spotify Developer Dashboard. |
| `NEXT_PUBLIC_RAPIDAPI_KEY`          | Your RapidAPI key for accessing the Shazam API.                  |

### Step 1: Obtain Spotify Credentials

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications).
2. Log in or create a new account if you don’t have one.
3. Click **Create an App** and fill in the required details.
4. Once the app is created, you’ll see the **Client ID** and **Client Secret** on the app’s dashboard.
5. Set the **Redirect URI** to `http://localhost:3000/callback/spotify/` in the app settings.

### Step 2: Obtain RapidAPI Key

1. Go to the [Shazam API on RapidAPI](https://rapidapi.com/apidojo/api/shazam/).
2. Sign up or log in to your RapidAPI account.
3. Subscribe to the Shazam API (free tier available).
4. After subscribing, you’ll find your API key (`X-RapidAPI-Key`) in the **Code Snippets** section.

### Step 3: Set Up Environment Variables

Create a `.env.local` file in the root of your project and add the following variables:

# Music Recognition App

This is a music recognition app that uses the Shazam API for song detection and Spotify for playlist integration. To get started, you'll need to set up the required environment variables.

---

## Prerequisites

Before running the app, ensure you have the following:

1. **Node.js** installed (v16 or higher recommended).
2. **npm** or **yarn** installed.
3. A **Spotify Developer Account** to obtain `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` and `NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET`.
4. A **RapidAPI Account** to obtain `NEXT_PUBLIC_RAPIDAPI_KEY`.

---

## Setting Up Environment Variables

To run this app, you need to set up the following environment variables:

| Variable Name                       | Description                                                      |
| ----------------------------------- | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_SPOTIFY_CLIENT_ID`     | Your Spotify App's Client ID.                                    |
| `NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET` | Your Spotify App's Client Secret.                                |
| `NEXT_PUBLIC_SPOTIFY_REDIRECT_URI`  | The redirect URI configured in your Spotify Developer Dashboard. |
| `NEXT_PUBLIC_RAPIDAPI_KEY`          | Your RapidAPI key for accessing the Shazam API.                  |

### Step 1: Obtain Spotify Credentials

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications).
2. Log in or create a new account if you don’t have one.
3. Click **Create an App** and fill in the required details.
4. Once the app is created, you’ll see the **Client ID** and **Client Secret** on the app’s dashboard.
5. Set the **Redirect URI** to `http://localhost:3000/callback/spotify/` in the app settings.

### Step 2: Obtain RapidAPI Key

1. Go to the [Shazam API on RapidAPI](https://rapidapi.com/apidojo/api/shazam/).
2. Sign up or log in to your RapidAPI account.
3. Subscribe to the Shazam API (free tier available).
4. After subscribing, you’ll find your API key (`X-RapidAPI-Key`) in the **Code Snippets** section.

### Step 3: Set Up Environment Variables

Create a `.env.local` file in the root of your project and add the following variables:

```env
NEXT_PUBLIC_SPOTIFY_CLIENT_ID
NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI
NEXT_PUBLIC_RAPIDAPI_KEY
```

---

## Running the App

1. 1. Install dependencies:

```bash
npm install
# or
yarn install
```

2. Start the development server:

```bash
npm run dev
# or
yarn dev
```

3. Open your browser and navigate to `http://localhost:3000`.

---

## Best Practices for Environment Variables

- **Never commit `.env.local` to version control:** Add `.env.local` to your `.gitignore` file to avoid exposing sensitive credentials.
- **Use environment variables in production:** For production deployments, configure environment variables directly in your hosting provider (e.g., Vercel, Netlify, AWS).
- **Rotate credentials regularly:** If you suspect your credentials are compromised, regenerate them in the respective developer dashboards.

---

## Troubleshooting

- **Invalid Spotify Redirect URI:** Ensure the redirect URI in your `.env.local` file matches exactly with the one configured in the Spotify Developer Dashboard.
- **RapidAPI Key Not Working:** Verify that your RapidAPI subscription is active and the key is correctly copied.
- **Environment Variables Not Loaded:** Restart your development server after adding or modifying environment variables.

---

## Contributing

If you’d like to contribute to this project, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Submit a pull request with a detailed description of your changes.

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.
