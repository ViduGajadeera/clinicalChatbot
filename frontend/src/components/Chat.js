import { useState } from "react";
import { sendMessage, evaluateAnswer } from "../api";
import MediaRenderer from "./MediaRenderer";
import "./chat.css";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [expected, setExpected] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;

    const res = await sendMessage(input);
    const botText =
      res.data.reply ?? res.data.question ?? "No response from bot.";

    setMessages((prev) => [
      ...prev,
      { type: "user", text: input, time: new Date().toLocaleTimeString() },
      {
        type: "bot",
        text: botText,
        media: res.data.media,
        time: new Date().toLocaleTimeString()
      }
    ]);

    setExpected(res.data.expected_answer ?? "");
    setInput("");
  };

  const handleEvaluate = async () => {
    const res = await evaluateAnswer(input, expected);

    setMessages((prev) => [
      ...prev,
      {
        type: "bot",
        text: res.data.evaluation,
        time: new Date().toLocaleTimeString()
      }
    ]);
  };

  return (
    <div className="chat-container">
      <h2 className="chat-title">AI Clinical Chatbot by Eleven Fifteen AI</h2>

      <div className="chat-box">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`message-row ${
              m.type === "user" ? "user-row" : "bot-row"
            }`}
          >
            <div className={`bubble ${m.type}`}>
              <p>{m.text}</p>
              <span className="time">{m.time}</span>
              <MediaRenderer media={m.media} />
            </div>
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
  value={input}
  onChange={(e) => setInput(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // prevent newline / form submit
      handleSend();
    }
  }}
  placeholder="Type your message..."
/>
        <button onClick={handleSend}>Send</button>
        <button onClick={handleEvaluate}>Evaluate</button>
      </div>
    </div>
  );
}

export default Chat;