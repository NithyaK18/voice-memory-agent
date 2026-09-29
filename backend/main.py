from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# EVENT MODEL
# ==========================================

class BusinessEvent(BaseModel):
    text: str


# ==========================================
# HINDSIGHT MEMORY
# ==========================================

business_context = {
    "issues": [],
    "severity": "LOW",
    "workflow": "Waiting for business event",
    "action": "Monitor incoming events",
    "reason": "Waiting for business signals",
    "customer_impact": False,
    "payment_problem": False,
    "delivery_problem": False,
    "technical_problem": False,
    "urgent": False,
}


# ==========================================
# UPDATE CONTEXT
# ==========================================

def update_context(text):

    text = text.lower()

    # Customer problem
    if "customer" in text and (
        "angry" in text
        or "complaint" in text
        or "unhappy" in text
    ):
        business_context["customer_impact"] = True

        if "Customer complaint" not in business_context["issues"]:
            business_context["issues"].append(
                "Customer complaint"
            )

    # Payment problem
    if "payment" in text and (
        "failed" in text
        or "failure" in text
        or "problem" in text
    ):
        business_context["payment_problem"] = True

        if "Payment failure" not in business_context["issues"]:
            business_context["issues"].append(
                "Payment failure"
            )

    # Delivery problem
    if "delivery" in text and (
        "delay" in text
        or "delayed" in text
        or "late" in text
    ):
        business_context["delivery_problem"] = True

        if "Delivery delay" not in business_context["issues"]:
            business_context["issues"].append(
                "Delivery delay"
            )

    # Technical problem
    if (
        "server" in text
        or "system" in text
        or "database" in text
    ):
        business_context["technical_problem"] = True

        if "Technical issue" not in business_context["issues"]:
            business_context["issues"].append(
                "Technical issue"
            )

    # Urgent / critical situation
    if (
        "urgent" in text
        or "critical" in text
        or "emergency" in text
    ):
        business_context["urgent"] = True


# ==========================================
# DECISION ENGINE
# ==========================================

def decide_workflow():

    # Critical customer situation
    if (
        business_context["urgent"]
        and business_context["customer_impact"]
    ):
        business_context["severity"] = "CRITICAL"

        business_context["workflow"] = (
            "Emergency Customer Escalation"
        )

        business_context["action"] = (
            "Escalate immediately and prioritize customer"
        )

        business_context["reason"] = (
            "Urgent signal + existing customer complaint"
        )

    # Payment + customer impact
    elif (
        business_context["payment_problem"]
        and business_context["customer_impact"]
    ):
        business_context["severity"] = "HIGH"

        business_context["workflow"] = (
            "Payment + Customer Escalation"
        )

        business_context["action"] = (
            "Investigate payment and contact customer"
        )

        business_context["reason"] = (
            "Payment failure + customer complaint"
        )

    # Payment problem
    elif business_context["payment_problem"]:

        business_context["severity"] = "HIGH"

        business_context["workflow"] = (
            "Payment Investigation"
        )

        business_context["action"] = (
            "Check payment service"
        )

        business_context["reason"] = (
            "Payment failure detected"
        )

    # Delivery + customer impact
    elif (
        business_context["delivery_problem"]
        and business_context["customer_impact"]
    ):
        business_context["severity"] = "HIGH"

        business_context["workflow"] = (
            "Priority Logistics Escalation"
        )

        business_context["action"] = (
            "Find alternative delivery and notify customer"
        )

        business_context["reason"] = (
            "Delivery delay + customer complaint"
        )

    # Delivery problem
    elif business_context["delivery_problem"]:

        business_context["severity"] = "MEDIUM"

        business_context["workflow"] = (
            "Logistics Investigation"
        )

        business_context["action"] = (
            "Find alternative delivery route"
        )

        business_context["reason"] = (
            "Delivery delay detected"
        )

    # Technical + customer impact
    elif (
        business_context["technical_problem"]
        and business_context["customer_impact"]
    ):
        business_context["severity"] = "CRITICAL"

        business_context["workflow"] = (
            "Technical Incident Escalation"
        )

        business_context["action"] = (
            "Investigate system and protect customer impact"
        )

        business_context["reason"] = (
            "Technical issue + customer impact"
        )

    # Technical problem
    elif business_context["technical_problem"]:

        business_context["severity"] = "HIGH"

        business_context["workflow"] = (
            "Technical Investigation"
        )

        business_context["action"] = (
            "Check infrastructure"
        )

        business_context["reason"] = (
            "Technical issue detected"
        )

    # Customer problem
    elif business_context["customer_impact"]:

        business_context["severity"] = "HIGH"

        business_context["workflow"] = (
            "Customer Support Escalation"
        )

        business_context["action"] = (
            "Escalate customer issue"
        )

        business_context["reason"] = (
            "Customer complaint detected"
        )

    # Nothing detected
    else:

        business_context["severity"] = "LOW"

        business_context["workflow"] = (
            "Initial Investigation"
        )

        business_context["action"] = (
            "Analyze situation"
        )

        business_context["reason"] = (
            "No critical business condition detected"
        )


# ==========================================
# API ROUTES
# ==========================================

@app.get("/")
def home():

    return {
        "message": "Hindsight Business Decision Engine is running"
    }


@app.get("/health")
def health():

    return {
        "status": "ok"
    }


@app.get("/context")
def get_context():

    decide_workflow()

    return {
        "context": business_context
    }


@app.post("/memory")
def process_event(event: BusinessEvent):

    update_context(event.text)

    decide_workflow()

    return {
        "message": "Context updated",

        "event": event.text,

        "state": {
            "issue": (
                ", ".join(business_context["issues"])
                if business_context["issues"]
                else "No issue detected"
            ),

            "severity": business_context["severity"],

            "workflow": business_context["workflow"],

            "action": business_context["action"],

            "reason": business_context["reason"],
        }
    }


# ==========================================
# ACTION EXECUTION
# ==========================================

# ==========================================
# ACTION EXECUTION
# ==========================================

@app.post("/execute")
def execute_action():

    workflow = business_context["workflow"]
    action = business_context["action"]

    # Check most specific workflows FIRST

    if workflow == "Emergency Customer Escalation":

        result = "Emergency escalation triggered"

    elif workflow == "Payment + Customer Escalation":

        result = "Payment investigation and customer escalation initiated"

    elif workflow == "Technical Incident Escalation":

        result = "Technical incident escalation triggered"

    elif workflow == "Priority Logistics Escalation":

        result = "Priority delivery workflow triggered"

    elif workflow == "Payment Investigation":

        result = "Payment investigation ticket created"

    elif workflow == "Customer Support Escalation":

        result = "Customer escalation initiated"

    elif workflow == "Logistics Investigation":

        result = "Logistics investigation started"

    elif workflow == "Technical Investigation":

        result = "Technical incident ticket created"

    else:

        result = "Business situation queued for investigation"

    return {
        "status": "EXECUTED",
        "workflow": workflow,
        "action": action,
        "result": result,
    }

# ==========================================
# RESET MEMORY
# ==========================================

@app.post("/reset")
def reset_context():

    business_context["issues"] = []

    business_context["severity"] = "LOW"

    business_context["workflow"] = (
        "Waiting for business event"
    )

    business_context["action"] = (
        "Monitor incoming events"
    )

    business_context["reason"] = (
        "Waiting for business signals"
    )

    business_context["customer_impact"] = False

    business_context["payment_problem"] = False

    business_context["delivery_problem"] = False

    business_context["technical_problem"] = False

    business_context["urgent"] = False

    return {
        "message": "Hindsight memory cleared"
    }