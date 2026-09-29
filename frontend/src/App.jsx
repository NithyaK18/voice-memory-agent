import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Brain,
  AlertTriangle,
  Workflow,
  Activity,
  Database,
  ArrowRight,
  CheckCircle2,
  Send,
  RefreshCcw,
  Zap,
  GitBranch,
  History,
} from "lucide-react";
import "./App.css";

function App() {
  const [isListening, setIsListening] = useState(false);
  const [input, setInput] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const recognitionRef = useRef(null);

  const [businessState, setBusinessState] = useState({
    issue: "Waiting for business event",
    severity: "LOW",
    workflow: "Waiting for business event",
    action: "Monitor incoming events",
    reason: "Waiting for business signals",
  });

  const [events, setEvents] = useState([]);
  const [decisionHistory, setDecisionHistory] = useState([]);


  // =====================================
  // SEND EVENT
  // =====================================

  const sendEvent = async (eventText = input) => {

    if (!eventText.trim()) return;

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/memory",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            text: eventText,
          }),
        }
      );

      const data = await response.json();

      setBusinessState(data.state);

      // Execute resulting business action
      setActionStatus(
        "Executing business action..."
      );

      try {

        const actionResponse = await fetch(
          "http://127.0.0.1:8000/execute",
          {
            method: "POST",
          }
        );

        const actionData =
          await actionResponse.json();

        setActionStatus(
          actionData.result
        );

      } catch (error) {

        console.error(
          "Action execution error:",
          error
        );

        setActionStatus(
          "Action execution failed"
        );

      }


      const timestamp =
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });


      setEvents((previous) => [
        ...previous,

        {
          text: eventText,
          workflow: data.state.workflow,
          severity: data.state.severity,
          reason: data.state.reason,
          timestamp,
        },
      ]);


      setDecisionHistory((previous) => [
        ...previous,

        {
          event: eventText,
          workflow: data.state.workflow,
          severity: data.state.severity,
          timestamp,
        },
      ]);


      setInput("");

    } catch (error) {

      console.error(
        "Backend error:",
        error
      );

    }
  };


  // =====================================
  // VOICE INPUT
  // =====================================

  const toggleVoice = () => {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

      alert(
        "Voice input is not supported in this browser. Please use Google Chrome."
      );

      return;
    }


    if (isListening) {

      recognitionRef.current?.stop();

      setIsListening(false);

      return;
    }


    const recognition =
      new SpeechRecognition();

    recognition.lang = "en-US";

    recognition.continuous = false;

    recognition.interimResults = false;


    recognition.onstart = () => {

      setIsListening(true);

    };


    recognition.onresult = (event) => {

      const spokenText =
        event.results[0][0].transcript;

      setInput(spokenText);

      setIsListening(false);

      sendEvent(spokenText);

    };


    recognition.onerror = (event) => {

      console.error(
        "Voice recognition error:",
        event.error
      );

      setIsListening(false);

    };


    recognition.onend = () => {

      setIsListening(false);

    };


    recognitionRef.current =
      recognition;

    recognition.start();

  };


  // =====================================
  // RESET
  // =====================================

  const resetMemory = async () => {

    try {

      await fetch(
        "http://127.0.0.1:8000/reset",
        {
          method: "POST",
        }
      );

      setEvents([]);

      setDecisionHistory([]);

      setActionStatus("");

      setBusinessState({
        issue:
          "Waiting for business event",

        severity:
          "LOW",

        workflow:
          "Waiting for business event",

        action:
          "Monitor incoming events",

        reason:
          "Waiting for business signals",
      });

    } catch (error) {

      console.error(
        "Reset error:",
        error
      );

    }
  };


  // =====================================
  // EXAMPLES
  // =====================================

  const exampleEvents = [
    "Payment failed",
    "Customer is angry",
    "This is urgent",
    "Delivery is delayed",
    "Server is down",
  ];


  // =====================================
  // PIPELINE
  // =====================================

  const getPipelineStage = () => {

    if (events.length === 0) {
      return "idle";
    }

    if (events.length === 1) {
      return "retain";
    }

    if (events.length === 2) {
      return "remember";
    }

    if (
      businessState.severity === "CRITICAL" ||
      events.length >= 3
    ) {
      return "reroute";
    }

    return "reevaluate";
  };


  const pipelineStage =
    getPipelineStage();


  return (

    <div className="app">


      {/* TOP BAR */}

      <header className="topbar">

        <div className="brand">

          <div className="brand-icon">

            <Brain size={22} />

          </div>

          <div>

            <h1>
              HINDSIGHT
            </h1>

            <span>
              DYNAMIC BUSINESS DECISION ENGINE
            </span>

          </div>

        </div>


        <div className="live-status">

          <span className="live-dot"></span>

          ENGINE LIVE

        </div>

      </header>



      {/* DASHBOARD */}

      <main className="dashboard">


        {/* EVENT STREAM */}

        <motion.section
          className="panel conversation-panel"

          initial={{
            opacity: 0,
            x: -30,
          }}

          animate={{
            opacity: 1,
            x: 0,
          }}
        >

          <div className="panel-header">

            <div>

              <span className="section-label">
                REAL-TIME INPUT
              </span>

              <h2>
                Business Event Stream
              </h2>

            </div>


            <motion.div

              className={`mic-button ${
                isListening
                  ? "listening"
                  : ""
              }`}

              whileTap={{
                scale: 0.9,
              }}

              onClick={toggleVoice}

            >

              <Mic size={20} />

            </motion.div>

          </div>



          <div className="conversation">

            {events.length === 0 ? (

              <div className="empty-state">

                <Brain size={28} />

                <span>

                  {isListening
                    ? "Listening..."
                    : "Waiting for business events..."}

                </span>

              </div>

            ) : (

              <AnimatePresence>

                {events.map(
                  (event, index) => (

                    <motion.div

                      key={index}

                      className="message user"

                      initial={{
                        opacity: 0,
                        x: -20,
                      }}

                      animate={{
                        opacity: 1,
                        x: 0,
                      }}

                    >

                      <div className="event-number">

                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}

                      </div>


                      <div className="event-content">

                        <div className="message-label">

                          NEW BUSINESS SIGNAL

                          <span>
                            {event.timestamp}
                          </span>

                        </div>


                        <div className="message-bubble">

                          {event.text}

                        </div>


                        <div className="event-route">

                          <ArrowRight
                            size={13}
                          />

                          Context updated →

                          {event.workflow}

                        </div>

                      </div>

                    </motion.div>

                  )
                )}

              </AnimatePresence>

            )}

          </div>



          {/* INPUT */}

          <div className="voice-input">

            <input

              type="text"

              placeholder={
                isListening
                  ? "Listening..."
                  : "Describe a new business event..."
              }

              value={input}

              onChange={(e) =>
                setInput(e.target.value)
              }

              onKeyDown={(e) => {

                if (
                  e.key === "Enter"
                ) {

                  sendEvent();

                }

              }}

            />


            <button
              onClick={() =>
                sendEvent()
              }
            >

              <Send size={17} />

            </button>

          </div>

        </motion.section>



        {/* CURRENT STATE */}

        <motion.section

          className="panel state-panel"

          initial={{
            opacity: 0,
            x: 30,
          }}

          animate={{
            opacity: 1,
            x: 0,
          }}

        >

          <div className="panel-header">

            <div>

              <span className="section-label">
                HINDSIGHT MEMORY
              </span>

              <h2>
                Current Business State
              </h2>

            </div>


            <Activity
              size={20}
              className="green-icon"
            />

          </div>



          <div className="state-grid">

            <StateCard

              icon={
                <AlertTriangle
                  size={19}
                />
              }

              label="ACCUMULATED ISSUES"

              value={
                businessState.issue
              }

            />


            <StateCard

              icon={
                <Activity
                  size={19}
                />
              }

              label="CURRENT SEVERITY"

              value={
                businessState.severity
              }

              severity={
                businessState.severity
              }

            />


            <StateCard

              icon={
                <Workflow
                  size={19}
                />
              }

              label="ACTIVE WORKFLOW"

              value={
                businessState.workflow
              }

            />


            <div className="status-card">

              <div className="status-title">

                <Zap size={17} />

                ACTION EXECUTION

              </div>


              <strong>

                {actionStatus ||
                  businessState.action}

              </strong>


              <div className="status-line"></div>

            </div>

          </div>

        </motion.section>



        {/* DECISION ENGINE */}

        <motion.section

          className="panel memory-panel"

          initial={{
            opacity: 0,
            y: 30,
          }}

          animate={{
            opacity: 1,
            y: 0,
          }}

        >

          <div className="panel-header">

            <div>

              <span className="section-label">
                DECISION ENGINE
              </span>

              <h2>
                Context → Reasoning → Action
              </h2>

            </div>


            <Database size={20} />

          </div>



          {/* PIPELINE */}

          <div className="pipeline">

            <PipelineNode
              icon={
                <ArrowRight
                  size={19}
                />
              }
              title="RETAIN"
              subtitle="Capture signals"
              active={
                pipelineStage ===
                "retain"
              }
              completed={
                events.length > 1
              }
            />


            <Connector
              active={
                events.length > 0
              }
            />


            <PipelineNode
              icon={
                <Brain size={19} />
              }
              title="REMEMBER"
              subtitle="Build context"
              active={
                pipelineStage ===
                "remember"
              }
              completed={
                events.length > 2
              }
            />


            <Connector
              active={
                events.length > 1
              }
            />


            <PipelineNode
              icon={
                <Activity
                  size={19}
                />
              }
              title="RE-EVALUATE"
              subtitle="Update situation"
              active={
                pipelineStage ===
                "reevaluate"
              }
              completed={
                events.length >= 3
              }
            />


            <Connector
              active={
                events.length > 2
              }
            />


            <PipelineNode
              icon={
                <Workflow
                  size={19}
                />
              }
              title="REROUTE"
              subtitle="Choose action"
              active={
                pipelineStage ===
                "reroute"
              }
            />

          </div>



          {/* DECISION TRACE */}

          <div className="decision-trace">

            <div className="trace-header">

              <div>

                <span className="section-label">
                  DECISION TRACE
                </span>

                <h3>
                  Why did the workflow change?
                </h3>

              </div>


              <GitBranch size={18} />

            </div>


            <div className="trace-content">

              <div className="trace-reason">

                <div className="trace-icon">

                  <Brain size={17} />

                </div>


                <div>

                  <span>
                    CURRENT REASONING
                  </span>

                  <strong>
                    {businessState.reason}
                  </strong>

                </div>

              </div>


              <div className="trace-arrow">

                <ArrowRight
                  size={18}
                />

              </div>


              <div className="trace-result">

                <span>
                  REROUTED WORKFLOW
                </span>

                <strong>
                  {businessState.workflow}
                </strong>

              </div>

            </div>

          </div>



          {/* DECISION HISTORY */}

          <div className="decision-history">

            <div className="history-header">

              <div>

                <span className="section-label">
                  DECISION HISTORY
                </span>

                <h3>
                  How the workflow evolved
                </h3>

              </div>


              <History size={18} />

            </div>


            <div className="history-list">

              {decisionHistory.length === 0 ? (

                <div className="history-empty">

                  <History size={18} />

                  <span>
                    No decisions recorded yet
                  </span>

                </div>

              ) : (

                decisionHistory.map(
                  (item, index) => (

                    <motion.div

                      className="history-item"

                      key={index}

                      initial={{
                        opacity: 0,
                        x: -15,
                      }}

                      animate={{
                        opacity: 1,
                        x: 0,
                      }}

                    >

                      <div className="history-index">

                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}

                      </div>


                      <div className="history-event">

                        <span>
                          {item.timestamp}
                        </span>

                        <strong>
                          {item.event}
                        </strong>

                      </div>


                      <ArrowRight
                        size={15}
                        className="history-arrow"
                      />


                      <div className="history-workflow">

                        <span>
                          {item.severity}
                        </span>

                        <strong>
                          {item.workflow}
                        </strong>

                      </div>

                    </motion.div>

                  )
                )

              )}

            </div>

          </div>



          {/* MEMORY TIMELINE */}

          <div className="timeline-title">

            LIVE MEMORY TIMELINE

          </div>


          <div className="memory-events">

            {events.length === 0 ? (

              <div className="memory-event">

                <span className="event-dot"></span>

                <strong>
                  Hindsight memory is empty
                </strong>

                <span className="event-status">
                  WAITING
                </span>

              </div>

            ) : (

              events.map(
                (event, index) => (

                  <motion.div
                    className="memory-event"
                    key={index}
                    initial={{
                      opacity: 0,
                      scale: 0.95,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                  >

                    <span className="event-dot active"></span>

                    <strong>
                      {event.text}
                    </strong>

                    <span className="event-status">
                      RETAINED
                    </span>

                  </motion.div>

                )
              )

            )}

          </div>

        </motion.section>



        {/* DEMO CONTROLS */}

        <section className="panel examples-panel">

          <div className="panel-header">

            <div>

              <span className="section-label">
                DEMO CONTROLS
              </span>

              <h2>
                Inject Business Signals
              </h2>

            </div>


            <button

              className="reset-button"

              onClick={resetMemory}

            >

              <RefreshCcw size={14} />

              RESET MEMORY

            </button>

          </div>


          <div className="example-buttons">

            {exampleEvents.map(
              (example, index) => (

                <motion.button

                  key={index}

                  whileHover={{
                    y: -3,
                  }}

                  whileTap={{
                    scale: 0.97,
                  }}

                  onClick={() =>
                    setInput(
                      example
                    )
                  }

                >

                  {example}

                </motion.button>

              )
            )}

          </div>

        </section>



        {/* METRICS */}

        <section className="metrics">

          <Metric
            title="EVENTS RETAINED"
            value={
              events.length
            }
          />

          <Metric
            title="DECISIONS"
            value={
              decisionHistory.length
            }
          />

          <Metric
            title="DECISION MODE"
            value="DYNAMIC"
          />

          <Metric
            title="ENGINE"
            value="ONLINE"
            highlight
          />

        </section>

      </main>

    </div>

  );
}


/* =====================================
   STATE CARD
===================================== */

function StateCard({
  icon,
  label,
  value,
  severity,
}) {

  return (

    <motion.div

      className={`state-card ${
        severity === "CRITICAL"
          ? "critical-card"
          : ""
      }`}

      layout

    >

      <div className="card-icon">

        {icon}

      </div>


      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>


      <CheckCircle2
        className="check"
        size={16}
      />

    </motion.div>

  );
}


/* =====================================
   PIPELINE NODE
===================================== */

function PipelineNode({
  icon,
  title,
  subtitle,
  active,
  completed,
}) {

  return (

    <motion.div

      className={`pipeline-node ${
        active
          ? "active"
          : ""
      } ${
        completed
          ? "completed"
          : ""
      }`}

      animate={
        active
          ? {
              scale: [
                1,
                1.04,
                1,
              ],
            }
          : {}
      }

      transition={{
        duration: 1.8,
        repeat: Infinity,
      }}

    >

      <div className="pipeline-icon">

        {completed ? (

          <CheckCircle2
            size={19}
          />

        ) : (

          icon

        )}

      </div>


      <strong>
        {title}
      </strong>


      <span>
        {subtitle}
      </span>


      {active && (

        <motion.div
          className="active-stage"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
        >

          ACTIVE

        </motion.div>

      )}

    </motion.div>

  );
}


/* =====================================
   CONNECTOR
===================================== */

function Connector({
  active,
}) {

  return (

    <div

      className={`connector ${
        active
          ? "connector-active"
          : ""
      }`}

    >

      <motion.div

        className="particle"

        animate={{
          x: [
            -10,
            90,
          ],
        }}

        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: "linear",
        }}

      />

    </div>

  );
}


/* =====================================
   METRIC
===================================== */

function Metric({
  title,
  value,
  highlight,
}) {

  return (

    <motion.div

      className={`metric ${
        highlight
          ? "highlight"
          : ""
      }`}

      whileHover={{
        scale: 1.03,
      }}

    >

      <span>
        {title}
      </span>

      <strong>
        {value}
      </strong>

    </motion.div>

  );
}


export default App;