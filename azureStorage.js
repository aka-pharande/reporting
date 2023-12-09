// azureStorage.js
const streamifier = require('streamifier');
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
require('dotenv').config();

// Retrieve Azure Storage account credentials from environment variables
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

if (!accountName || !accountKey) {
  console.error('Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

// Initialize the BlobServiceClient with shared key authentication
const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, sharedKeyCredential);

// Function to fetch PDF from Azure Storage
async function fetchPdfFromStorage(report) {
  try {
    // Create container name based on clientId
    const containerName = `client-${report.clientId}`;

    // Get a reference to the container
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Get a reference to the blob (report)
    const blobClient = containerClient.getBlobClient(report.fileName);

    // Generate a SAS token for the blob with public access (modify permissions as needed)
    const blobUrlWithSas = await generateSasToken(blobClient);

    // Fetch the PDF content using the generated URL
    const response = await fetch(blobUrlWithSas);
    
    // Check the HTTP status code
    if (!response.ok) {
      console.error(`Error fetching PDF from Azure Storage. Status Code: ${response.status}`);
      throw new Error('Failed to fetch PDF from Azure Storage');
    }

    const pdfBuffer = await response.arrayBuffer();

    return pdfBuffer;
  } catch (error) {
    console.error('Error fetching PDF from Azure Storage:', error.message);
    throw error;
  }
}

// Function to upload PDF to Azure Storage
async function uploadPdfToStorage(report) {
  try {
    // Create container name based on clientId
    const containerName = `client-${report.clientId}`;

    // Get a reference to the container
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const readableStream = streamifier.createReadStream(report.file.buffer);

    // Get a reference to the blob (report)
    const blockBlobClient = containerClient.getBlockBlobClient(report.fileName);

    await blockBlobClient.upload(report.file.buffer, report.file.size, {
      blobHTTPHeaders: { blobContentType: 'application/pdf' }
    });

  } catch (error) {
    console.error('Error uploading PDF to Azure Storage:', error.message);
    throw error;
  }
}


// Generate a shared access signature (SAS) token for the blob
function generateSasToken(blobClient) {
  const expiryDate = new Date();
  expiryDate.setMinutes(expiryDate.getMinutes() + 15); // Set expiry to 15 minutes from now

  const sasToken = blobClient.generateSasUrl({
    permissions: 'r', // Modify permissions as needed
    startsOn: new Date(),
    expiresOn: expiryDate,
  });

  return sasToken;
}

module.exports = { fetchPdfFromStorage };
module.exports = { uploadPdfToStorage };
