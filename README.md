# Mongo File Upload

This is a simple project to upload files to MongoDB using GridFS.

## Screenshots

### Upload Files
![Upload Files](https://github.com/meskv/mongo-file-upload/blob/master/screenshots/upload_file.png?raw=true)

### Uploaded Files
![Uploaded Files](https://github.com/meskv/mongo-file-upload/blob/master/screenshots/uploaded_file.png?raw=true)

## Installation

### clone repository
```bash
git clone https://github.com/meskv/mongo-file-upload.git
```

*  Note: Include following env variables in .env file
  
```
PORT=8000
MONGO_URI= YHOUR_MONGO_URI
DB_NAME= YOUR_DB_NAME
COLLECTION_NAME= YOUR_COLLECTION_NAME
```

### installing modules/requirements
```bash
npm install
```

### Run app
```bash
npm start
```