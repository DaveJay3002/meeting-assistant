const { onObjectFinalized } = require("firebase-functions/v2/storage");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

const { OpenAI } = require("openai");
const { Storage } = require("@google-cloud/storage");
const pdfkit = require("pdfkit");
const fs = require("fs");
const os = require("os");
const path = require("path");
require("dotenv").config();

initializeApp();
const db = getFirestore();
const storage = new Storage();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.processAudio = onObjectFinalized({ region: "asia-south1" }, async (event) => {
  try {
    const object = event.data;

    if (!object) {
      console.error("No event data received.");
      return;
    }

    const filePath = object.name;
    const contentType = object.contentType;

    if (!filePath) {
      console.error("No file path found in event data.");
      return;
    }

    const validExtensions = [".mp3", ".wav", ".m4a"];
    const ext = path.extname(filePath).toLowerCase();

    if ((!contentType || !contentType.startsWith("audio/")) && !validExtensions.includes(ext)) {
      console.log("Skipping unsupported file type:", contentType, ext);
      return;
    }

    const fileName = path.basename(filePath);
    const bucket = getStorage().bucket(object.bucket);
    const tempAudioPath = path.join(os.tmpdir(), fileName);
    const userId = filePath.split("/")[1];

    // Download
    await bucket.file(filePath).download({ destination: tempAudioPath });

    // Transcribe
    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: fs.createReadStream(tempAudioPath)
    });

    const transcriptText = transcription.text;

    // Summarize
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Summarize this meeting in bullet points." },
        { role: "user", content: transcriptText }
      ]
    });

    const summary = summaryResponse.choices[0].message.content;

    // PDF Generation
    const pdfFileName = `summary-${Date.now()}.pdf`;
    const tempPdfPath = path.join(os.tmpdir(), pdfFileName);
    const doc = new pdfkit();
    doc.pipe(fs.createWriteStream(tempPdfPath));
    doc.fontSize(20).text("Minutes of Meeting", { align: "center" });
    doc.moveDown().fontSize(12).text(`Summary:\n${summary}`);
    doc.end();

    // Upload PDF
    const pdfUploadPath = `pdfs/${userId}/${pdfFileName}`;
    await bucket.upload(tempPdfPath, { destination: pdfUploadPath });

    // Save Firestore Record
    await db.collection("moms").add({
      userId,
      audioPath: filePath,
      pdfPath: pdfUploadPath,
      summary,
      createdAt: FieldValue.serverTimestamp()
    });

    fs.unlinkSync(tempAudioPath);
    fs.unlinkSync(tempPdfPath);
    console.log(`Successfully processed and summarized ${filePath}`);
  } catch (err) {
    console.error("Function failed:", err);
  }
});
