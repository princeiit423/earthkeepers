const express = require('express');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const pdf = require('html-pdf');
const ejs = require('ejs');
const { Buffer } = require('buffer');
require('dotenv').config();

const app = express();
const port = process.env.PORT ||3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const getISO8601DateTime = () => {
    const now = new Date();
    return now.toISOString();  // This should return the correct ISO 8601 format
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const API_KEY = 'MG4dGiD0I8LtCPOAA3OR8WJX047Jqg36zbHF9gRECz2Ugm6ABl';
const BASE_URL = 'https://plant.id/api/v3';

let lastResult = null; 

app.get("/",(req,res)=>{
  res.render('index');
})

// Route to display the identification form
app.get('/identify', (req, res) => {
    //console.log(getISO8601DateTime());
  res.render('identify');
});

// Route to handle identification
app.post('/identify', upload.single('image'), async (req, res) => {
  try {
    const imageBuffer = req.file.buffer;
    const base64Image = imageBuffer.toString('base64');

    
    const response = await axios.post(
      `${BASE_URL}/identification?details=common_names,url,description,taxonomy,rank,gbif_id,inaturalist_id,image,synonyms,edible_parts,watering,best_light_condition,best_soil_type,common_uses,cultural_significance,toxicity,best_watering&language=en`,
      {
        images: [base64Image],
        similar_images: true,
      },
      {
        headers: {
          'Api-Key': API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    lastResult = response.data; 
    res.render('identifyResult', { result: response.data });
  } catch (error) {
    console.error('Error identifying plant:', error);
    res.status(500).send('An error occurred while processing the identification.');
  }
});

app.get('/download-pdf', async (req, res) => {
  if (!lastResult) {
    return res.status(400).send('No valid result available to generate PDF.');
  }

  const templatePath = path.join(__dirname, 'views', 'identifyResult.ejs');

  // Render the EJS template to HTML
  ejs.renderFile(templatePath, { result: lastResult }, (err, html) => {
    if (err) {
      console.error('Error rendering EJS:', err);
      return res.status(500).send('Error rendering EJS: ' + err.message);
    }

    // Generate PDF from HTML
    pdf.create(html, { format: 'A4' }).toBuffer((err, buffer) => {
      if (err) {
        console.error('Error generating PDF:', err);
        return res.status(500).send('Error generating PDF: ' + err.message);
      }

      // Send PDF as a response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="Plant_Identification_Result.pdf"');
      res.send(buffer);
    });
  });
});



// Route to display the health check form
app.get('/health', (req, res) => {
  res.render('health');
});

// Route to handle health check
app.post('/health', upload.single('image'), async (req, res) => {
  try {
    const imageBuffer = req.file.buffer;
    const base64Image = imageBuffer.toString('base64');
    
    const response = await axios.post(
      `${BASE_URL}/health_assessment?details=local_name,description,url,treatment,classification,common_names,cause&language=en`,
      {
        images: [base64Image],
        similar_images: true,
      },
      {
        headers: {
          'Api-Key': API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    lastResult = response.data;
    res.render('result', { result: response.data });
  } catch (error) {
    console.error('Error checking plant health:', error);
    res.status(500).send('An error occurred while processing the health check.');
  }
});

app.get('/download-health', async (req, res) => {
  if (!lastResult) {
    return res.status(400).send('No valid result available to generate PDF.');
  }

  const templatePath = path.join(__dirname, 'views', 'result.ejs');

  // Render the EJS template to HTML
  ejs.renderFile(templatePath, { result: lastResult }, (err, html) => {
    if (err) {
      console.error('Error rendering EJS:', err);
      return res.status(500).send('Error rendering EJS: ' + err.message);
    }

    // Generate PDF from HTML
    pdf.create(html, { format: 'A4' }).toBuffer((err, buffer) => {
      if (err) {
        console.error('Error generating PDF:', err);
        return res.status(500).send('Error generating PDF: ' + err.message);
      }

      // Send PDF as a response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="Plant_Health_Result.pdf"');
      res.send(buffer);
    });
  });
});




app.listen(port, () => {
  console.log(`Server running at ${port}`);
});
