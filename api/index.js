const express = require("express");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const cors = require("cors"); // Import module cors
const cloudinary = require("cloudinary").v2;
const app = express();
const PORT = 5000;

cloudinary.config({
  cloud_name: "deagedifh", // Ganti dengan nama cloud Anda
  api_key: "543764665613214", // Ganti dengan API key Anda
  api_secret: "djK4TF7rXxY4k1FKL0Sio6l5ht8", // Ganti dengan API secret Anda
});

app.use(express.json());
app.use(cors());

app.post("/convert", async (req, res) => {
  try {
    const { url } = req.body;

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    const videoInfo = await ytdl.getInfo(url);
    const title = videoInfo.videoDetails.title.replace(/[\/\\?%*:|"<>]/g, "-");
    const outputPath = path.join(__dirname, `${title}.mp3`);

    const videoStream = ytdl(url, { filter: "audioonly" });

    ffmpeg(videoStream)
      .audioBitrate(128)
      .save(outputPath)
      .on("end", async () => {
        try {
          const result = await cloudinary.uploader.upload(outputPath, {
            resource_type: "video", // Gunakan video untuk mengunggah file audio
            public_id: `audio/${title}`,
          });

          fs.unlinkSync(outputPath); // Hapus file lokal setelah diunggah
          res.json({ audioUrl: result.secure_url });
        } catch (uploadError) {
          console.error(uploadError);
          res.status(500).json({ error: "Upload to Cloudinary failed" });
        }
      })
      .on("error", (err) => {
        console.error(err);
        res.status(500).json({ error: "Conversion failed" });
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Conversion failed" });
  }
});

app.get("/", async (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
