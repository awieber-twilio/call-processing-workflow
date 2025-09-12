import express from "express";
import bodyParser from "body-parser";
import { Connection, Client } from '@temporalio/client';
import { processCall } from './workflows.ts';

import dotenv from 'dotenv';
dotenv.config();


const app = express()
const port = 3000

// Parse Twilio’s form-encoded body
app.use(bodyParser.urlencoded({ extended: false }));

// (Optional) also support JSON
app.use(bodyParser.json());


app.post('/recording-updated', async (req, res) => {
    console.log("Callback Received");
 
    console.log(req.body);
    const recordingSid = req.body.RecordingSid;
    const callSid = req.body.CallSid;

    // const connection = await Connection.connect({
    //     address: "us-east-2.aws.api.temporal.io:7233",
    //     tls: true,
    //     apiKey: process.env.TEMPORAL_API_KEY,
    // });
  //   const client = new Client({
  //     connection,
  //     namespace: "call-processing.h9il8",
  // });

    const connection = await Connection.connect({ address: 'localhost:7233' });
    const client = new Client({ connection });
  
    await client.workflow.start(processCall, {
      args: [recordingSid],
      taskQueue: "call-processing",
      workflowId: "call-" + callSid,
    });
  
})

app.listen(port, () => {
  console.log(`Callbacks app listening on port ${port}`)
})