# NoteSpace Backend

Express & Mongoose backend connected to MongoDB.

## MongoDB Compass Connection

1. Open **MongoDB Compass**.
2. Connect using the URI:
   ```
   mongodb://127.0.0.1:27017
   ```
3. Once connected, your database `notespace` and collection `notes` will appear in the left sidebar as soon as you start the server and create a note.

## Running the Backend

```bash
# Start development server
npm run dev

# Or start in production
npm start
```

The server runs on `http://localhost:5000`.

## API Endpoints

- `GET  /api/health` - Check API and DB status
- `GET  /api/notes` - Get all notes
- `GET  /api/notes/:id` - Get note by ID
- `POST /api/notes` - Create note (`{ "title": "...", "content": "..." }`)
- `PUT  /api/notes/:id` - Update note (`{ "title": "...", "content": "..." }`)
- `DELETE /api/notes/:id` - Delete note
