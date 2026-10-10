# University Research Opportunity Portal

A web application where faculty members can post, view, update, close and delete research opportunities in one place.


## Technologies

- Backend: Node.js with Express
- Database: MySQL
- Frontend: HTML, CSS and JavaScript
- API testing: Postman

## Project Structure

```
Research-Opportunity-Portal/
├── server.js            (Express server and the 5 API endpoints)
├── db.js                (MySQL connection)
├── schema.sql           (database setup)
├── package.json
├── .env.example         (example settings, copy to .env)
├── public/
│   ├── index.html       (page)
│   ├── styles.css       (design)
│   └── script.js        (calls the API)
└── portal.postman_collection.json   (exported Postman collection)
```

## Setup and Run Instructions

### 1. Requirements
Install Node.js (LTS version) and MySQL Server.

### 2. Get the project
```
git clone https://github.com/<your-username>/Research-Opportunity-Portal.git
cd Research-Opportunity-Portal
```
If you received a ZIP file instead, unzip it and open the folder in a terminal.

### 3. Install packages
```
npm install
```

### 4. Create the database
Open MySQL Workbench (or the MySQL command line) and run the whole file `schema.sql`. It creates the `research_portal` database and the `opportunities` table.

### 5. Add your settings
Copy `.env.example` and rename the copy to `.env`. Open it and put your own MySQL password:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=research_portal
PORT=3000
```

### 6. Start the server
```
npm start
```
The terminal should show `Server running on port 3000` and `Database connected OK`.

### 7. Open the application
Go to http://localhost:3000 in your browser.

## API Endpoints

| Method | URL | Description | Success | Errors |
|---|---|---|---|---|
| POST | /api/opportunities | Create an opportunity | 201 | 400, 500 |
| GET | /api/opportunities | Get all opportunities | 200 | 500 |
| GET | /api/opportunities/:id | Get one opportunity | 200 | 404, 500 |
| PUT | /api/opportunities/:id | Update an opportunity (also used to close it) | 200 | 400, 404, 500 |
| DELETE | /api/opportunities/:id | Delete an opportunity | 200 | 404, 500 |

### Example request body (POST)
```json
{
  "title": "AI for Healthcare",
  "description": "Using machine learning to detect diseases early.",
  "research_area": "Machine Learning",
  "faculty_name": "Dr. Ahmed",
  "department": "Computer Science",
  "required_skills": "Python, Statistics",
  "positions": 2,
  "deadline": "2026-12-30"
}
```

### Status codes used
- 200 OK: request worked
- 201 Created: new opportunity was saved
- 400 Bad Request: missing or invalid data
- 404 Not Found: the ID does not exist
- 500 Internal Server Error: a server or database problem

## Testing with Postman

Import the exported collection file from this repository into Postman. With the server running, run the requests in order: create three opportunities, get all, get one, update, close, delete, request the deleted one (404), and send one request with missing data (400).

## Frontend Features

- Side menu with filters (All, Open, Closed) and counts
- Cards showing every opportunity, with Open/Closed badges
- View details, add, edit, close and delete
- Form validation for required fields
- Popup messages showing the HTTP status code of every request

## Notes

- All data is stored in MySQL. No data is hard-coded in the frontend.
- The `.env` file contains private settings and is not uploaded to GitHub.
