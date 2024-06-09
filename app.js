//Para arrancar la API usar -----> npm start

const express = require('express');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, getDoc, setDoc, addDoc, doc } = require('firebase/firestore');
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } = require('firebase/auth');

const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Initialize Firebase app
const firebaseConfig = {
  //Firebase Config
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);



//----------------------------- Firebase Authentication -----------------------------
app.post('/api/login', express.json(), async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Invalid request payload' });
      return;
    }

    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // If login is successful, you can customize the response accordingly
    const user = userCredential.user;
    res.json({ success: true, userId: user.uid, message: 'Login successful' });
  } catch (error) {
    console.error('Error during login:', error);

    // If login fails, provide an appropriate error response
    res.status(401).json({ error: 'Invalid username or password' });
  }
});


//--------------------------- CHANGE PASSWORD ------------------------
const admin = require('firebase-admin');
const serviceAccount = require('./f1fans-aa206-firebase-adminsdk-en8aj-23f796e2d0.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


// --------------------------- Check AUTH ---------------------------
// API endpoint to check if a user ID exists in Firebase Authentication
app.get('/api/checkAuth/:userID', (req, res) => {
  const requestedUserID = req.params.userID;

  admin.auth().getUser(requestedUserID)
    .then(userRecord => {
      // User exists
      res.status(200).json({ exists: true, userRecord: userRecord.toJSON() });
    })
    .catch(error => {
      if (error.code === 'auth/user-not-found') {
        // User does not exist
        res.status(404).json({ exists: false, error: 'User not found' });
      } else {
        // Other errors
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
});

// --------------------------- GET Tables ---------------------------
app.get('/api/getTables/:tableName', async (req, res) => {
  const tableName = req.params.tableName;
  try {
      const response = await fetch(`http://localhost/F1API/api.php?table=${tableName}`);
      const data = await response.json();
      res.json(data);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --------------------------- UPDATE Tables --------------------------- 
app.put('/api/updateTable/:tableName/:idName/:rowId', async (req, res) => {
  const tableName = req.params.tableName;
  const idName = req.params.idName;
  const rowId = req.params.rowId;
  const requestData = req.body; // Assuming the JSON data is sent in the request body
  try {
      const response = await fetch(`http://localhost/F1API/api.php/${tableName}/${idName}/${rowId}`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
      });
      const data = await response.json();
      res.json(data);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --------------------------- ADD Tables --------------------------- 
app.post('/api/addRecord/:tableName', async (req, res) => {
  const tableName = req.params.tableName;
  const requestData = req.body; // Assuming the JSON data is sent in the request body
  try {
      const response = await fetch(`http://localhost/F1API/api.php/addRecord/${tableName}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
      });
      const data = await response.json();
      res.json(data);
  } catch (error) {
      console.error(error);
      console.error(requestData);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

//----------- DELETE Table ---------
app.delete('/api/deleteRecord/:tableName/:idName/:rowId', async (req, res) => {
  const tableName = req.params.tableName;
  const idName = req.params.idName;
  const rowId = req.params.rowId;
  try {
      const response = await fetch(`http://localhost/F1API/api.php?table=${tableName}&idName=${idName}&id=${rowId}`, {
          method: 'DELETE'
      });
      const data = await response.json();
      res.json(data);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});



//----------------------------- Firebase Storage -----------------------------

const storage = new Storage({
  projectId: firebaseConfig.projectId,
  keyFilename: './f1fans-aa206-firebase-adminsdk-en8aj-23f796e2d0.json', // Replace with the path to your Firebase key file
});

const bucket = storage.bucket(firebaseConfig.storageBucket);

// Set up Multer for handling file uploads
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

app.get('/api/getCollectionList/:collectionName', async (req, res) => {
  try {
    const { collectionName } = req.params; // Get collection name from query parameter

    if (!collectionName) {
      return res.status(400).json({ error: 'Missing collection name parameter' });
    }

    const files = [];

    // List all files in the collection (modify path as needed)
    const [allFiles] = await bucket.getFiles({ prefix: `${collectionName}/` }); // List files with prefix

    for (const file of allFiles) {
      const [metadata] = await file.getMetadata();
      const downloadURL = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 1000, // Link expires in 1 minute
      });

      // Extract file name without the collection prefix
      const fileName = file.name.split(`${collectionName}/`)[1];

      const fileData = {
        fileName: fileName,
        size: metadata.size,
        type: metadata.contentType,
      };

      files.push(fileData);
    }

    res.json(files); // Return list of files with details
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/api/getImage/:collectionName/:imageName', async (req, res) => {
  try {
    const { collectionName, imageName } = req.params

    // Construct the file path in the Firebase Storage bucket
    let filePath = `${collectionName}/${imageName}`;

    // Get a reference to the file
    const file = bucket.file(filePath);

    // Check if the file exists
    const [metadata] = await file.getMetadata();
    if (!metadata) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }

    // Get the content type (mime type) of the file
    const contentType = metadata.contentType;

    // Generate a signed URL for the file
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 1000, // Link expires in 1 minute
    });

    res.json({ imageUrl: url, imageType: contentType });
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Define an API endpoint to delete a file from Firebase Storage
app.delete('/api/deleteFile/:collectionName/:fileName', async (req, res) => {
  try {
    const { collectionName, fileName } = req.params;

    // Construct the file path in the Firebase Storage bucket
    let filePath = `${collectionName}/${fileName}`;

    // Get a reference to the file
    const file = bucket.file(filePath);

    // Check if the file exists
    const [exists] = await file.exists();
    if (!exists) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    // Delete the file
    await file.delete();

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});





// POST endpoint to upload an image with the name as the current date and time
app.post('/api/uploadFile/:collectionName', upload.single('file'), async (req, res) => {
  const { collectionName } = req.params;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { collectionName } = req.params; // Get collection name from URL parameter

    // Use the original filename (without modification)
    const fileName = req.file.originalname;

    // Construct the file path within the collection
    const filePath = `${collectionName}/${fileName}`; // Modify path if needed

    const file = bucket.file(filePath);
    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
      resumable: false,
    });

    stream.end(req.file.buffer);

    // Wait for the file to be uploaded to Firebase Storage
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    res.json({ success: true, fileUrl, fileName });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});





//----------------------------- Main API Server -----------------------------
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
