console.log('loaded');

const temperature = 0.5;

const today = new Date();
const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log('User Timezone:', userTimeZone);

const formattedToday = today
  .toLocaleString('en-US', { timeZone: userTimeZone })
  .replace(',', '');

// Ensure we always have concrete defaults for the Realtime system prompt,
// even on a brand‑new visit where localStorage is still empty.
const inputLanguage =
  localStorage.getItem('input_language') || 'English';
const outputLanguage =
  localStorage.getItem('output_language') || 'Arabic';

// Persist these defaults so the dropdown UI (onload.js) sees the same values.
localStorage.setItem('input_language', inputLanguage);
localStorage.setItem('output_language', outputLanguage);

const sourceCode =
  !inputLanguage || inputLanguage === 'Auto-detect'
    ? 'AUTO'
    : inputLanguage.slice(0, 2).toUpperCase();
const targetCode = outputLanguage ? outputLanguage.slice(0, 2).toUpperCase() : '';

const reprompt = `Hidden Context (the user is not aware this is part of their message): The users timezone is ${userTimeZone}. The current date/time is ${formattedToday}.`;

const systemPrompt = `
You are the HRSD AI Translator, a real-time AI-powered translation assistant exclusively for the Human Resources and Social Development ministry of Saudi Arabia.
Your sole purpose is to provide immediate and direct translation from ${inputLanguage} to ${outputLanguage} in real-time, maintaining absolute accuracy, consistency, and exclusive adherence to the output language.
Your Rules and Constraints:
Exact Translation Only:
Translate exactly what is spoken without any interpretation, modification, embellishment, or omission.
Preserve the original tone, intent, and context exactly as spoken.
If a phrase has no direct equivalent, provide a literal translation or a phonetic transliteration.
Exclusive Adherence to Output Language:
Exclusively use the output language (${outputLanguage}).
No mixing of languages: Do not use any words or phrases from the input language or any other language besides the output language.
No translanguaging: Maintain linguistic integrity by ensuring all output is strictly in the designated output language.
No Interaction or Explanations:
Do not greet, ask questions, explain translations, or engage in any conversation.
If the user asks a question that seems directed at you, translate the question exactly as it was spoken.
Uninterrupted Flow:
Translate continuously and immediately. Never pause or stop translating unless explicitly instructed to do so.
Behavioral Constraints:
No Opinions, Interpretations, or Contextual Adjustments: Translate words as they are, without considering context or cultural nuances.
No Inference: Do not attempt to understand or infer meaning—translate only the literal words spoken.
No Alterations for Clarity: Do not simplify, rephrase, or enhance the language for understanding.
No Use of Input Language: Under no circumstances should the input language or any language other than the specified output language appear in the translation.
Important Notes:
You are a conduit, not a communicator. Your role is strictly to bridge languages without any personal input or judgment.
The user likely does not know the ${outputLanguage} and relies entirely on your translations, so any form of additional communication or clarification is strictly forbidden.
You must exclusively use the output language. Do not mix languages or use words from the input language.
Example Behavior:
If the user says: "Can you tell me where the office is?"
Output: The exact translation of the question in the ${outputLanguage}.
Not Allowed: Any additional context, explanation, or guidance.
Not Allowed: Mixing words from ${inputLanguage} or any other language.
If the user says: "What does that word mean?"
Output: The exact translation of the question in the ${outputLanguage}.
Not Allowed: An explanation of the word or its meaning.
Not Allowed: Any words from the input language.
Reminder:
Your sole function is to faithfully convert spoken words between languages. Do not add, omit, interpret, engage, or mix languages beyond this task.
`;

let pc; // Declare the peer connection outside the function for broader scope
let dc; // Declare the data channel outside the function for broader scope
let lastMicText = ""; // Last user utterance text captured from the mic

async function init() {
  const tokenResponse = await fetch("/ai/session");
  const data = await tokenResponse.json();
  const EPHEMERAL_KEY = data.client_secret.value;

  pc = new RTCPeerConnection(); // Initialize the peer connection
  // Expose on window so onload.js can inspect connection state
  window.pc = pc;
  const audioEl = document.getElementById("remoteAudio");
  pc.ontrack = e => audioEl.srcObject = e.streams[0]; // Set the audio element's source to the remote stream

  const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
  pc.addTrack(ms.getTracks()[0]);

  dc = pc.createDataChannel("oai-events");
  window.dc = dc;
  dc.addEventListener("open", () => {
    console.log("Data channel is open");
    // Update the system instructions once the data channel is open
    updateInstructions(systemPrompt);
    configureTools();
  });
  dc.addEventListener("message", handleServerEvent);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const baseUrl = "https://api.openai.com/v1/realtime";
  const model = "gpt-4o-realtime-preview-2024-12-17";
  const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
    method: "POST",
    body: offer.sdp,
    headers: {
      Authorization: `Bearer ${EPHEMERAL_KEY}`,
      "Content-Type": "application/sdp"
    },
  });

  const answer = {
    type: "answer",
    sdp: await sdpResponse.text(),
  };
  await pc.setRemoteDescription(answer);
}

function updateInstructions(newInstructions) {
  if (dc && dc.readyState === "open") {
    const event = {
      type: "session.update",
      session: {
        instructions: newInstructions
      }
    };
    dc.send(JSON.stringify(event));
    console.log("Instructions updated:", newInstructions);
  } else {
    console.error("Data channel is not open");
  }
}

// Helper: try to pull a human‑readable text string out of a Realtime item,
// regardless of the exact shape OpenAI uses.
function extractReadableTextFromItem(item) {
  if (!item || typeof item !== "object") return "";

  // Common direct fields
  if (typeof item.text === "string") return item.text;
  if (item.text && typeof item.text.value === "string") return item.text.value;
  if (typeof item.transcript === "string") return item.transcript;

  // Messages with nested content arrays
  if (Array.isArray(item.content)) {
    for (const part of item.content) {
      const t = extractReadableTextFromItem(part);
      if (t) return t;
    }
  }

  // Generic scan: look for any reasonably long string with spaces
  for (const value of Object.values(item)) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 10 && trimmed.includes(" ")) {
        return trimmed;
      }
    }
  }

  return "";
}

async function handleServerEvent(e) {
  const serverEvent = JSON.parse(e.data);
  console.log("Realtime event received:", serverEvent.type, serverEvent);

   // Log what the mic / user side is sending into the conversation.
  if (serverEvent.type === "conversation.item.created") {
    const micText = extractReadableTextFromItem(serverEvent.item);
    if (micText) {
      console.log("MIC text (user input):", micText);
      lastMicText = micText;
    }
  }

  if (serverEvent.type === "response.done") {
    // Log high‑level status to understand why the model might be failing
    if (serverEvent.response) {
      console.log(
        "Response status:",
        serverEvent.response.status,
        "details:",
        serverEvent.response.status_details
      );
    }

    const outputItems = serverEvent.response?.output || [];
    const primaryItem = outputItems[0];
    const displayText = extractReadableTextFromItem(primaryItem) || "";

    console.log("Parsed display text from response:", displayText, "raw item:", primaryItem);

    // Build combined display string: "<mic> (SRC) - <translation> (TGT)"
    let combinedText = displayText;
    if (displayText) {
      if (lastMicText) {
        combinedText = `${lastMicText} (${sourceCode}) - ${displayText} (${targetCode})`;
      } else {
        // Fallback if we don't have mic text (e.g. typed input)
        combinedText = `${displayText} (${targetCode})`;
      }
    }

    const subtitleEl = document.getElementById('subtitleText');
    if (subtitleEl && combinedText) {
      subtitleEl.textContent = combinedText;
    }

    // Also append to the conversation log panel if available
    if (combinedText) {
      appendTranscriptToConversation(combinedText);
    }

    if (primaryItem && primaryItem.type === "function_call") {
      const { name, arguments, call_id } = primaryItem;
      console.log('its a tool call');
      let args = JSON.parse(arguments);
      let result;

      switch (name) {
        case 'open_google':
          console.log('its open google');
          result = await open_google(args.query);
          break;
        case 'generateProfile':
          result = await generateProfile(args.taskDescription, args.industry, args.additionalRequirements, args.model);
          break;
        case 'getCalendarEvents':
          result = await getCalendarEvents(args.timePeriod, args.query);
          break;
        case 'saveEvent':
          result = await saveEvent(args.summary, args.location, args.description, args.start, args.end);
          break;
        case 'listGmailMessages':
          result = await listGmailMessages(args.maxResults, args.query);
          break;
        case 'getGmailMessage':
          result = await getGmailMessage(args.messageId);
          break;
        case 'sendGmailMessage':
          result = await sendGmailMessage(args.to, args.subject, args.body, args.cc, args.bcc, args.isHtml);
          break;
        case 'performGoogleSearch':
          result = await performGoogleSearch(args.query);
          break;
        case 'usePerplexity':
          result = await usePerplexity(args.query);
          break;
        case 'checkKnowledgeBase':
          result = await checkKnowledgeBase(args.query);
          break;
        case 'scrapeWeb':
          result = await scrapeWeb(args.url);
          break;
        case 'executeComputerCommand':
          result = await executeComputerCommand(args.command);
          break;
        default:
          console.warn(`Unhandled function name: ${name}`);
          return;
      }

      // Send the result back to the model
      const resultEvent = {
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: call_id,
          output: JSON.stringify(result)
        }
      };
      dc.send(JSON.stringify(resultEvent));
      console.log("Function result sent:", result);
    }

  }
}

function appendTranscriptToConversation(text) {
  const body = document.getElementById("conversation-body");
  if (!body || !text) return;

  const wrapper = document.createElement("div");
  wrapper.className = "bubble bubble--inmate";

  const p = document.createElement("p");
  p.className = "bubble-text--primary";
  p.textContent = text;

  wrapper.appendChild(p);
  body.appendChild(wrapper);
  body.scrollTop = body.scrollHeight;
}

function displayTextResponse(text) {
  // Fallback handler for explicit text responses from the model
  console.log("Text response:", text);
  if (typeof text === "string") {
    appendTranscriptToConversation(text);
  }
}

function playAudioStream(audioStream) {
  const audioEl = document.getElementById("remoteAudio");
  audioEl.srcObject = audioStream;
  audioEl.play();
  console.log("Playing audio stream");
}

function stopSession() {
  if (pc) {
    pc.close(); // Close the peer connection
    pc = null; // Reset the peer connection variable
    window.pc = null;
    console.log("Session stopped");
  }
}


const messageInputEl = document.getElementById("messageInput");
if (messageInputEl) {
  messageInputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      console.log("input event");
      const message = messageInputEl.value;
      console.log(message);
      const dcEvent = {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_text",
              text: message,
            }
          ]
        },
      };

      if (dc && dc.readyState === "open") {
        dc.send(JSON.stringify(dcEvent));
      }

      if (typeof close_input_box === "function") {
        close_input_box();
      }
    }
  });
}

function configureTools() {
    if (dc && dc.readyState === "open") {
        const event = {
          type: "session.update",
          session: {
            tools: tools,
            tool_choice: "auto",
          }
        };
        dc.send(JSON.stringify(event));
        console.log("Tools configured:", event.session.tools);
      } else {
        console.error("Data channel is not open");
      }
}
