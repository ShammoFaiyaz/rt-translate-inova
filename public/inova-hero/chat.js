console.log('loaded');

const temperature = 0.5;

const today = new Date();
const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log('User Timezone:', userTimeZone);

const formattedToday = today.toLocaleString('en-US', { timeZone: userTimeZone }).replace(',', '');  

const inputLanguage = localStorage.getItem('input_language');
const outputLanguage = localStorage.getItem('output_language');

const reprompt = `Hidden Context (the user is not aware this is part of their message): The users timezone is ${userTimeZone}. The current date/time is ${formattedToday}.`;

const systemPrompt = `
You are Inova's Voice AI, a real-time AI-powered assistant.
Your sole purpose is to provide immediate and direct assistance to the user.

Inova provides Comprehensive AI solutions designed to transform how enterprises operate, innovate, and compete in the digital age.

BLDR:
BLDR: No-Code Enterprise AI Agent Creation & Automation
Empower your teams to build, deploy, and automate AI agents—no code required. Developers? Go deeper with full developer access.


Book a BLDR Demo

Try BLDR Now
No-Code Builder
Drag & drop interface
Enterprise Ready
Security & compliance built-in
Developer Access
Full API & SDK support
Build AI Agents. Automate Anything. No Code Needed.
BLDR lets business users drag, drop, and deploy powerful AI agents and automations in minutes. No technical expertise required, but developers can go deeper with full API access.

Key Benefits
No-Code workflow builder
Pre-built AI agent templates
Seamless integration
Enterprise-grade security


CUSTOM AI:
Healthcare: Humanizing Care with AI
Automate patient intake, personalize care, and ensure compliance with Inova's AI agents. Empower clinicians to build and customize workflows—no code needed, with full developer access.

Key Features
AI-powered patient concierge
Automated scheduling
HIPAA and GDPR compliance

See Healthcare Case Study
Animated hospital dashboard
98%
Accuracy
40%
Time Saved
Financial Sector
Finance: Securing Trust with Intelligent AI
Transform financial services with AI agents that handle complex queries, automate compliance reporting, and provide personalized investment insights while maintaining the highest security standards.

Key Features
Regulatory compliance automation
Fraud detection and prevention
Personalized financial advisory

Explore Finance Solutions
Financial dashboard
98%
Accuracy
40%
Time Saved
Telecom
Telecom: Connecting Customers with AI Excellence
Enhance customer experience and operational efficiency with AI agents that provide 24/7 support, optimize network performance, and predict customer needs before they arise.

Key Features
Intelligent network optimization
Predictive maintenance
Multilingual customer support

View Telecom Success Story
Telecom operations dashboard
98%
Accuracy
40%
Time Saved
Ecommerce
Ecommerce: Personalizing Every Customer Journey
Drive sales and customer satisfaction with AI agents that provide personalized shopping experiences, intelligent product recommendations, and seamless order management.

Key Features
Personalized product recommendations
Intelligent inventory management
Automated customer service

HELP USERS IN ANY WAY YOU CAN
`;

let pc; // Declare the peer connection outside the function for broader scope
let dc; // Declare the data channel outside the function for broader scope

async function init() {
  const tokenResponse = await fetch("/ai/session");
  const data = await tokenResponse.json();
  const EPHEMERAL_KEY = data.client_secret.value;

  pc = new RTCPeerConnection(); // Initialize the peer connection
  const audioEl = document.getElementById("remoteAudio");
  pc.ontrack = e => audioEl.srcObject = e.streams[0]; // Set the audio element's source to the remote stream

  const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
  pc.addTrack(ms.getTracks()[0]);

  dc = pc.createDataChannel("oai-events");
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

async function handleServerEvent(e) {
  const serverEvent = JSON.parse(e.data);
  if (serverEvent.type === "response.done") {
    console.log("Response received:", serverEvent.response.output[0]);
    const transcript = serverEvent.response.output[0].content[0].transcript;
    console.log('transcript', transcript);
    document.getElementById('subtitleText').innerHTML = transcript;

    if (serverEvent.response.output[0].type === "function_call") {
      const { name, arguments, call_id } = serverEvent.response.output[0];
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

    // Handle the response, e.g., display text or process audio
    if (serverEvent.response.output[0].type === "text") {
      const textResponse = serverEvent.response.output[0].content;
      displayTextResponse(textResponse);
    } else if (serverEvent.response.output[0].type === "audio") {
      const audioStream = serverEvent.response.output[0].content;
      console.log("Audio stream received", serverEvent.response.output[0]);
      playAudioStream(audioStream);
    }
  }
}

function displayTextResponse(text) {
  // Implement logic to display text response to the user
  console.log("Text response:", text);
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
    console.log("Session stopped");
  }
}


document.getElementById("messageInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    console.log("input event");
    const message = document.getElementById("messageInput").value;
    console.log(message);
    const event = {
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
    
    // WebRTC data channel and WebSocket both have .send()
    dc.send(JSON.stringify(event));
    
    close_input_box();
  }
});

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
        animation.play();
        document.getElementById("mainText").innerHTML = "AI Agent is listening...";
        document.getElementById("subText").innerHTML = "Just speak and I will help you...";
      } else {
        console.error("Data channel is not open");
      }
}

document.getElementById("talkButton").addEventListener("click", () => {
  if (pc && pc.connectionState === "connected") {
    stopSession();
    animation.stop();
    document.getElementById("mainText").innerHTML = "AI Voice Agent is paused...";
    document.getElementById("subText").innerHTML = "Click the talk button to start again...";
  } else {
    init();
    document.getElementById("mainText").innerHTML = "AI Voice Agent is loading...";
    document.getElementById("subText").innerHTML = "Please wait while the agent initializes";
  }
});
