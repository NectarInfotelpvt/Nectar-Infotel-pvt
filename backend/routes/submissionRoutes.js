const express = require("express");
const router = express.Router();
const Submission = require("../models/Submission");
const multer = require("multer");
const { Parser } = require("json2csv");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const ImageKit = require("imagekit");

// ✅ ImageKit Config
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// ✅ Multer using memoryStorage (no local storage)
const upload = multer({ storage: multer.memoryStorage() });

const formatPhotoArray = (photos) => {
  if (!Array.isArray(photos)) return "";
  return photos.map((photo) => `${photo.label}: ${photo.url}`).join(" | ");
};

// ✅ POST submission with ImageKit upload
router.post("/erp-submission", upload.array("photos", 6), async (req, res) => {
  try {
    // Destructure the new fields: pacsName and branch
    const { erpId, pacsName, dccb, district, state, branch, latitude, longitude, locationName, photoLabels = [] } = req.body;

    // Update validation to include pacsName and branch
    if (!erpId || !pacsName || !dccb || !district || !state || !branch || req.files.length < 6) {
      return res.status(400).json({ message: "All fields (ERP ID, PACS Name, DCCB, District, State, Branch) and 6 photos are required." });
    }

    const photos = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const label = Array.isArray(photoLabels) ? photoLabels[i] : `Photo ${i + 1}`;

      const uploaded = await imagekit.upload({
        file: file.buffer.toString("base64"),
        fileName: file.originalname,
        folder: "erp-submissions",
      });

      photos.push({ url: uploaded.url, label });
    }

    const submission = new Submission({
      erpId,
      pacsName, // Add pacsName here
      dccb,
      district,
      state,
      branch,     // Add branch here
      locationName,
      latitude,
      longitude,
      submittedAt: new Date(),
      photos,
    });

    await submission.save();
    res.status(201).json({ message: "Submission saved successfully." });

  } catch (err) {
    console.error("Submission error:", err);
    res.status(500).json({ message: "Server error during submission.", error: err.message });
  }
});

// ✅ Get all submissions (no change needed here for new fields unless you display them in a list)
router.get("/submissions", async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ submittedAt: -1 });
    res.status(200).json(submissions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch submissions." });
  }
});

// ✅ Get submissions by ERP ID (no change needed here for new fields unless you display them in a list)
router.get("/submissions/:erpId", async (req, res) => {
  try {
    const submissions = await Submission.find({ erpId: req.params.erpId });
    if (!submissions.length) {
      return res.status(404).json({ message: "No submissions found." });
    }
    res.status(200).json(submissions);
  } catch (err) {
    res.status(500).json({ message: "Error fetching ERP submissions." });
  }
});

// ✅ Admin CSV Download (filterable)
router.get("/admin/download-submissions", async (req, res) => {
  try {
    const { district, state, date } = req.query;
    const filter = {};
    if (district) filter.district = district;
    if (state) filter.state = state;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.submittedAt = { $gte: start, $lt: end };
    }

    const submissions = await Submission.find(filter).sort({ submittedAt: -1 });

    const photoLabels = new Set();
    submissions.forEach(sub => {
      sub.photos.forEach((photo, i) =>
        photoLabels.add(photo.label || `Photo ${i + 1}`)
      );
    });

    // Add pacsName and branch to the fields array for CSV headers
    const fields = ["erpId", "pacsName", "dccb", "district", "state", "branch", "locationName", "submittedAt", "latitude", "longitude", ...photoLabels];

    const formatted = submissions.map((sub) => {
      const base = {
        erpId: sub.erpId,
        pacsName: sub.pacsName, // Map the new pacsName field
        dccb: sub.dccb,
        district: sub.district,
        state: sub.state,
        branch: sub.branch,     // Map the new branch field
        locationName: sub.locationName,
        submittedAt: sub.submittedAt,
        latitude: sub.latitude,
        longitude: sub.longitude,
      };

      sub.photos.forEach((photo, i) => {
        const label = photo.label || `Photo ${i + 1}`;
        base[label] = photo.url;
      });

      return base;
    });

    const csv = new Parser({ fields: Array.from(fields) }).parse(formatted);
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    const filePath = path.join(tempDir, `Filtered_ERP_Submissions.csv`);
    fs.writeFileSync(filePath, csv);

    res.setHeader("Content-Disposition", `attachment; filename=Filtered_ERP_Submissions.csv`);
    res.setHeader("Content-Type", "text/csv");
    res.sendFile(filePath, (err) => {
      if (!err) fs.unlinkSync(filePath);
    });

  } catch (err) {
    console.error("Download CSV error:", err);
    res.status(500).json({ message: "Failed to generate CSV." });
  }
});

// ✅ Download by ERP ID
router.get("/admin/download-submissions/:erpId", async (req, res) => {
  try {
    const submissions = await Submission.find({ erpId: req.params.erpId }).sort({ submittedAt: -1 });

    if (!submissions.length) {
      return res.status(404).json({ message: "No submissions found for this ERP ID." });
    }

    const formatted = submissions.map(item => ({
      erpId: item.erpId,
      pacsName: item.pacsName, // Map the new pacsName field
      dccb: item.dccb,
      district: item.district,
      state: item.state,
      branch: item.branch,     // Map the new branch field
      locationName: item.locationName,
      submittedAt: item.submittedAt,
      latitude: item.latitude,
      longitude: item.longitude,
      photos: formatPhotoArray(item.photos),
    }));

    // Add pacsName and branch to the fields array for CSV headers
    const fields = ["erpId", "pacsName", "dccb", "district", "state", "branch", "locationName", "submittedAt", "latitude", "longitude", "photos"];
    const csv = new Parser({ fields }).parse(formatted);

    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    const filePath = path.join(tempDir, `${req.params.erpId}_ERP_Submissions.csv`);
    fs.writeFileSync(filePath, csv);

    res.setHeader("Content-Disposition", `attachment; filename=${req.params.erpId}_ERP_Submissions.csv`);
    res.setHeader("Content-Type", "text/csv");
    res.sendFile(filePath, (err) => {
      if (!err) fs.unlinkSync(filePath);
    });

  } catch (err) {
    console.error("Download ERP CSV error:", err);
    res.status(500).json({ message: "Failed to generate CSV." });
  }
});

// ✅ Optional image download proxy
router.get("/download-image", async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).send("No image URL provided");

  try {
    const response = await axios({
      url: imageUrl,
      method: "GET",
      responseType: "stream",
    });

    const filename = imageUrl.split("/").pop().split("?")[0] || "image.jpg";
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", response.headers["content-type"] || "application/octet-stream");

    response.data.pipe(res);
  } catch (err) {
    console.error("Image Download Proxy Error:", err.message);
    res.status(500).send("Failed to download image");
  }
});

module.exports = router;