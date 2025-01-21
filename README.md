# URL Shortener API

## Overview
The URL Shortener API is a scalable web application designed to create and manage short URLs while providing comprehensive analytics. The application includes user authentication through Google Sign-In, rate limiting for secure API usage, and features for grouping links under specific topics. The solution is designed to be Dockerized for cloud hosting scalability.

## Features
- **URL Shortening**: Generate short and custom aliases for URLs.
- **Analytics**: Track clicks, referrers, and geolocation data for each short URL.
- **User Authentication**: Secure login via Google Sign-In.
- **Rate Limiting**: Protect API endpoints from abuse.
- **Grouping**: Organize short URLs by topics for better management.
- **Dockerized Deployment**: Ready for scalable cloud hosting using Docker.

## Prerequisites
- **Node.js** (v16 or later)
- **npm** (v7 or later)
- **Docker** (for containerized deployment)
- A Google OAuth Client ID and Secret
- A MongoDB Atlas database connection string

## Environment Variables
Create a `.env` file in the root directory of the project and configure the following variables:

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
PORT=
JWT_SECRET=
BASE_URL=
GOOGLE_REDIRECT_URL=
MONGODB_CONNECTION_STRING=
```

Replace the placeholders with your actual credentials and configuration values.

## Application Flow

1. **Get Google Sign-In Link**
   - Make a GET request to the endpoint `/auth/google/url`.
   - This will return a Google Sign-In link in the response.

2. **Sign In with Google**
   - Open the Google Sign-In link in a browser and sign in using Google credentials.
   - Upon successful sign-in, a response will be received with a JWT token.
   - Keep the token for accessing protected routes.

3. **Create a Short URL**
   - Make a POST request to `/api/shorten/` with the JWT token in the `Authorization` header.
   - Example request body:
     ```json
     {
       "longUrl": "https://music.example.com/watch?v=jgYl4hZacx0&list=RDADojLoCDpQ",
       "customAlias": "music",
       "topic": "retention"
     }
     ```
   - Response:
     ```json
     {
       "message": "Short url created successfully",
       "shortUrl": "music",
       "createdAt": "2025-01-20T12:34:56Z"
     }
     ```

4. **Redirect to Original URL**
   - Make a GET request to `/api/shorten/:alias`.
   - This route does not require authentication and redirects to the original long URL.

5. **Get URL Analytics**
   - Make a GET request to `/api/analytics/:alias` to retrieve detailed analytics for a specific URL.
   - Example request with authorization:
     ```javascript
     get('/api/analytics/:alias', { headers: { "Authorization": token } });
     ```
   - Response:
     ```json
     {
       "totalClicks": 42,
       "uniqueUsers": 25,
       "clicksByDate": [
         {"date": "2025-01-13", "clicks": 10},
         {"date": "2025-01-14", "clicks": 12}
       ],
       "osType": [
         {"osName": "Windows", "uniqueClicks": 20, "uniqueUsers": 15},
         {"osName": "Android", "uniqueClicks": 22, "uniqueUsers": 18}
       ],
       "deviceType": [
         {"deviceName": "mobile", "uniqueClicks": 30, "uniqueUsers": 22},
         {"deviceName": "desktop", "uniqueClicks": 12, "uniqueUsers": 8}
       ]
     }
     ```

6. **Get Topic-Based Analytics**
   - Make a GET request to `/api/analytics/topic/:topic` to retrieve analytics for URLs under a specific topic created by the user.
   - Example request with authorization:
     ```javascript
     get('/api/analytics/topic/:topic', { headers: { "Authorization": token } });
     ```
   - Response:
     ```json
     {
       "totalClicks": 120,
       "uniqueUsers": 80,
       "clicksByDate": [
         {"date": "2025-01-13", "clicks": 30},
         {"date": "2025-01-14", "clicks": 50}
       ],
       "urls": [
         {
           "shortUrl": "http://short.ly/music",
           "totalClicks": 70,
           "uniqueUsers": 40
         },
         {
           "shortUrl": "http://short.ly/video",
           "totalClicks": 50,
           "uniqueUsers": 40
         }
       ]
     }
     ```

7. **Get Overall Analytics**
   - Make a GET request to `/api/analytics/overall` to retrieve analytics for all URLs created by the user.
   - Example request with authorization:
     ```javascript
     get('/api/analytics/overall', { headers: { "Authorization": token } });
     ```
   - Response:
     ```json
     {
       "totalUrls": 10,
       "totalClicks": 420,
       "uniqueUsers": 300,
       "clicksByDate": [
         {"date": "2025-01-13", "clicks": 120},
         {"date": "2025-01-14", "clicks": 150}
       ],
       "osType": [
         {"osName": "Windows", "uniqueClicks": 200, "uniqueUsers": 150},
         {"osName": "iOS", "uniqueClicks": 220, "uniqueUsers": 180}
       ],
       "deviceType": [
         {"deviceName": "mobile", "uniqueClicks": 300, "uniqueUsers": 220},
         {"deviceName": "desktop", "uniqueClicks": 120, "uniqueUsers": 80}
       ]
     }
     ```

## Using Docker

1. **Build the Docker Image**
   ```bash
   docker build -t urlshortener .
   ```

2. **Start the Container**
   ```bash
   docker-compose up
   ```

3. **Access the Application**
   - Visit [http://localhost:3000](http://localhost:3000).

## Deployment

### Live Application
- URL: *(Coming soon)*

#### Deployment Steps

1. **Set up an EC2 Instance**:
   - Launch an EC2 instance and SSH into the server.
   - Install Docker on the instance.

2. **Deploy the Application**:
   - Clone the repository to the EC2 instance.
   - Set up the `.env` file with the appropriate environment variables.

3. **Start the Server**:
   - Use Docker to build and run the application: `docker-compose up -d`.

4. **Configure NGINX**:
   - Set up a reverse proxy for the application.
   - Restart NGINX to apply the changes.

## Project Structure
```
URLShortener/
├── controllers/     # Route controllers
├── middleware/      # Authentication and rate-limiting middleware
├── models/          # Mongoose models (User, URL, Analytics)
├── routes/          # Route definitions
├── app.js           # Main application file
├── Dockerfile       # Docker configuration
├── docker-compose.yml # Docker configuration
├── package.json     # Project metadata and dependencies
├── README.md        # Project documentation
```

---
**Author**: Subhankar Sharma
