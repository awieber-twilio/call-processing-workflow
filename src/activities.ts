// activities.ts
import fs from "fs";
import axios from "axios";
import { createClient } from "@deepgram/sdk";
import twilio from "twilio";
import OpenAI from "openai";


import dotenv from 'dotenv';
dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID , process.env.TWILIO_AUTH_TOKEN);
const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Get the media URL 
export async function downloadAudio(recordingSid:string): Promise<string> {
  const recordingUrl = 'https://api.twilio.com/2010-04-01/Accounts/' + process.env.TWILIO_ACCOUNT_SID + '/Recordings/' + recordingSid + '.mp3';
  console.log(recordingUrl);

  const response = await axios.get(recordingUrl, {
    responseType: "arraybuffer",
    auth: {
      username: process.env.TWILIO_ACCOUNT_SID!,
      password: process.env.TWILIO_AUTH_TOKEN!,
    },
  });
  console.log(response);
  try {
    const filePath = `./tmp/${recordingUrl.split("/").pop()}`;
    fs.writeFileSync(filePath, Buffer.from(response.data));
    return filePath;
  }
  catch (error) {
    throw new Error(`Failed to download audio: ${error}`);
  }
}

// Use Deepgram to transcribe the recorded call 
export async function transcribeCall(filePath: string): Promise<string> {

    const response = await deepgram.listen.prerecorded.transcribeFile(
      fs.readFileSync(filePath),
      {
        model: "nova-2", // Deepgram’s high-accuracy model
        language: "en-US",
        punctuate: true,
        smart_format: true,
      }
    );
    return response.result?.results?.channels[0]?.alternatives[0]?.transcript ?? "";

}

// Summarize Transcript
export async function summarizeTranscript(transcript: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "user", content: `Summarize this call into key points and describe the customer sentiment:\n\n${transcript}` },
    ],
  });
  return response.choices[0].message?.content?.trim() ?? "";
}

// Store Results
export async function storeResults(summary: string): Promise<string> {
  // For demo purposes, we just log the summary to the console.
  // In a real application, you might store this in a database or customer data platform such as Segment.
  console.log("Call Summary:\n", summary);
  return "Summary stored successfully";
}