const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});



app.get("/api/classify", async (req, res) => {
  const { name } = req.query;

  if (name === undefined || name === null) {
    return res.status(400).json({ status: "error", message: "Missing or empty name parameter" });
  }

  if (typeof name !== "string" || Array.isArray(name)) {
    return res.status(422).json({ status: "error", message: "Name must be a string" });
  }

  if (name.trim() === "") {
    return res.status(400).json({ status: "error", message: "Missing or empty name parameter" });
  }

  let apiRes;
  try {
    apiRes = await fetch(`https://api.genderize.io/?name=${encodeURIComponent(name)}`);
  } catch (err) {
    return res.status(502).json({ status: "error", message: "Failed to reach Genderize API" });
  }

  if (!apiRes.ok) {
    return res.status(502).json({ status: "error", message: "Genderize API returned an error" });
  }

  let data;
  try {
    data = await apiRes.json();
  } catch (err) {
    return res.status(502).json({ status: "error", message: "Invalid response from Genderize API" });
  }

  if (!data.gender || !data.count) {
    return res.status(200).json({ status: "error", message: "No prediction available for the provided name" });
  }

  const gender = data.gender;
  const probability = data.probability;
  const sample_size = data.count;
  const is_confident = probability >= 0.7 && sample_size >= 100;
  const processed_at = new Date().toISOString();

  return res.status(200).json({
    status: "success",
    data: {
      name,
      gender,
      probability,
      sample_size,
      is_confident,
      processed_at,
    },
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
