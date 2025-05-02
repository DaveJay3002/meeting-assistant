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
    
    console.log(`Starting processing for audio file: ${filePath}`);

    // First, find the meeting record associated with this audio file
    const meetingSnapshot = await db.collection("moms")
      .where("userId", "==", userId)
      .where("audioPath", "==", filePath)
      .get();
    
    if (meetingSnapshot.empty) {
      console.error(`No meeting record found for audioPath: ${filePath}`);
      return;
    }
    
    // Check if we have multiple records with the same audio path (duplicate issue)
    if (meetingSnapshot.size > 1) {
      console.warn(`Found ${meetingSnapshot.size} records with same audioPath. Using the first one and cleaning up duplicates.`);
      
      // Get all meeting IDs
      const meetingIds = [];
      meetingSnapshot.forEach(doc => {
        meetingIds.push(doc.id);
      });
      
      // Keep the first meeting, mark others for removal
      const keepMeetingId = meetingIds[0];
      const duplicatesToRemove = meetingIds.slice(1);
      
      // Delete duplicate meetings
      for (const dupId of duplicatesToRemove) {
        console.log(`Removing duplicate meeting record: ${dupId}`);
        await db.collection("moms").doc(dupId).delete();
      }
    }
    
    // Proceed with the first meeting only
    const meetingDoc = meetingSnapshot.docs[0];
    const meetingId = meetingDoc.id;
    console.log(`Found meeting record with ID: ${meetingId} (after duplicate cleanup if needed)`);

    // Check if this meeting is already completed or in error state
    const meetingData = meetingDoc.data();
    if (meetingData.status === "completed") {
      console.log(`Meeting ${meetingId} is already completed. Skipping processing.`);
      return;
    }
    
    if (meetingData.status === "error") {
      console.log(`Meeting ${meetingId} had errors. Reprocessing...`);
      // Continue with processing to attempt recovery
    }

    // Download
    await bucket.file(filePath).download({ destination: tempAudioPath });
    console.log("Downloaded audio file");

    // Update meeting status to show we've started processing
    await db.collection("moms").doc(meetingId).update({
      status: "processing",
      updatedAt: FieldValue.serverTimestamp()
    });

    // Transcribe
    console.log("Starting transcription with Whisper API");
    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: fs.createReadStream(tempAudioPath)
    });

    const transcriptText = transcription.text;
    console.log("Transcription complete");
    
    // Save the transcript to the database first in case later steps fail
    await db.collection("moms").doc(meetingId).update({
      transcript: transcriptText,
      updatedAt: FieldValue.serverTimestamp()
    });
    console.log("Saved transcript to database");

    // Summarize
    console.log("Starting summary generation with GPT-4");
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Summarize this meeting in bullet points." },
        { role: "user", content: transcriptText }
      ]
    });

    const summary = summaryResponse.choices[0].message.content;
    console.log("Summary generation complete");
    
    // Save the summary to the database
    await db.collection("moms").doc(meetingId).update({
      summary: summary,
      updatedAt: FieldValue.serverTimestamp()
    });
    console.log("Saved summary to database");

    // PDF Generation
    console.log("Starting PDF generation");
    const pdfFileName = `summary-${meetingId}.pdf`;
    const tempPdfPath = path.join(os.tmpdir(), pdfFileName);
    const doc = new pdfkit();
    doc.pipe(fs.createWriteStream(tempPdfPath));
    
    // Title
    doc.fontSize(20).text("Minutes of Meeting", { align: "center" });
    doc.moveDown();
    
    // Summary section with clear marker
    doc.fontSize(16).text("=== Summary ===", { align: "center" });
    doc.moveDown().fontSize(12).text(summary);
    doc.moveDown(2);
    
    // Transcript section with clear marker
    doc.fontSize(16).text("=== Full Transcript ===", { align: "center" });
    doc.moveDown().fontSize(10).text(transcriptText);
    doc.end();
    
    // Wait for PDF generation to complete
    await new Promise((resolve) => {
      doc.on('end', () => {
        resolve();
      });
    });
    console.log("PDF generation complete");

    // Upload PDF
    const pdfUploadPath = `pdfs/${userId}/${pdfFileName}`;
    await bucket.upload(tempPdfPath, { destination: pdfUploadPath });
    console.log(`Uploaded PDF to: ${pdfUploadPath}`);

    // Update Firestore Record with all information and status
    await db.collection("moms").doc(meetingId).update({
      pdfPath: pdfUploadPath,
      status: "completed",
      transcript: transcriptText,
      summary: summary,
      updatedAt: FieldValue.serverTimestamp()
    });
    console.log("Updated meeting record with all information");

    // Clean up temporary files
    fs.unlinkSync(tempAudioPath);
    fs.unlinkSync(tempPdfPath);
    console.log(`Successfully processed and summarized ${filePath}`);
  } catch (err) {
    console.error("Function failed:", err);
    
    // Try to find the meeting record to update its status
    try {
      const filePath = event.data.name;
      const userId = filePath.split("/")[1];
      
      const meetingSnapshot = await db.collection("moms")
        .where("userId", "==", userId)
        .where("audioPath", "==", filePath)
        .get();
      
      if (!meetingSnapshot.empty) {
        const meetingDoc = meetingSnapshot.docs[0];
        await db.collection("moms").doc(meetingDoc.id).update({
          status: "error",
          errorMessage: err.message,
          updatedAt: FieldValue.serverTimestamp()
        });
        console.log(`Updated meeting with ID ${meetingDoc.id} to error status`);
      }
    } catch (updateErr) {
      console.error("Failed to update meeting status to error:", updateErr);
    }
  }
});
