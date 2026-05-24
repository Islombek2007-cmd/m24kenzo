const express = require("express");
const multer  = require("multer");
const fetch   = require("node-fetch");
const FormData = require("form-data");
const cors    = require("cors");

const app    = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());

app.post("/upload", upload.single("fileToUpload"), async (req, res) => {
  try {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", req.file.buffer, {
      filename:    req.file.originalname,
      contentType: req.file.mimetype,
    });

    const response = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body:   form,
      headers: form.getHeaders(),
    });

    const text = await response.text();
    if (text.startsWith("https://")) {
      res.json({ url: text.trim() });
    } else {
      res.status(500).json({ error: text });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3001, () => console.log("Proxy running on http://localhost:3001"));