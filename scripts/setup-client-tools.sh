#!/bin/bash
# Setup all 9 client tools for Ballot Badger ElevenAgents agent
# Usage: ./scripts/setup-client-tools.sh

set -e

AGENT_ID="agent_6501km5k809ef86v15e653shcmf7"
API_KEY=$(grep "ELEVENLABS_API_KEY=" .env.local | cut -d= -f2)

if [ -z "$API_KEY" ]; then
  echo "Error: ELEVENLABS_API_KEY not found in .env.local"
  exit 1
fi

create_tool() {
  local name="$1"
  local description="$2"
  local properties="$3"

  echo "Creating tool: $name..."

  local body=$(cat <<ENDJSON
{
  "name": "$name",
  "description": "$description",
  "type": "client",
  "expects_response": false,
  "properties": $properties
}
ENDJSON
)

  response=$(curl -s -X POST "https://api.elevenlabs.io/v1/convai/agents/tools" \
    -H "xi-api-key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$body")

  tool_id=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_id','ERROR'))" 2>/dev/null || echo "ERROR")

  if [ "$tool_id" = "ERROR" ]; then
    echo "  Failed: $response"
  else
    echo "  Created: $tool_id"
    # Attach tool to agent
    curl -s -X PATCH "https://api.elevenlabs.io/v1/convai/agents/$AGENT_ID" \
      -H "xi-api-key: $API_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"prompt\": {\"tool_ids\": [\"$tool_id\"]}}" > /dev/null
    echo "  Attached to agent"
  fi
}

echo "=== Setting up client tools for Ballot Badger ==="
echo ""

# 1. show_candidate
create_tool "show_candidate" \
  "Display a candidate profile card in the UI. Call this when you first mention a candidate in your narration." \
  '{
    "name": {"type": "string", "description": "The candidate full name from the pull_receipts results"},
    "party": {"type": "string", "description": "Political party: Republican, Democrat, Independent, or Nonpartisan"},
    "office": {"type": "string", "description": "The office they are running for"},
    "currentRole": {"type": "string", "description": "Their current position"},
    "keyFact": {"type": "string", "description": "The single most notable fact about this candidate"},
    "findingsCount": {"type": "number", "description": "How many findings were returned from the search"},
    "severity": {"type": "string", "description": "high if major controversies, medium if notable, low if routine"}
  }'

# 2. show_vote
create_tool "show_vote" \
  "Display a voting record card. Call this when you mention a specific vote or bill." \
  '{
    "bill": {"type": "string", "description": "Name or number of the bill from the search results"},
    "vote": {"type": "string", "description": "How they voted: Yea, Nay, Objected, Abstain, Sponsored, Co-sponsored"},
    "context": {"type": "string", "description": "2-3 sentence explanation of what this vote means and why it matters"},
    "date": {"type": "string", "description": "Date of the vote if found. Leave empty if unknown."},
    "source": {"type": "string", "description": "Source name e.g. Congress.gov, VoteSmart"},
    "sourceUrl": {"type": "string", "description": "The URL where this data was found"},
    "candidate": {"type": "string", "description": "The candidate who cast this vote"}
  }'

# 3. show_donors
create_tool "show_donors" \
  "Display a campaign finance table. Call this when you discuss donors, fundraising, or money." \
  '{
    "candidate": {"type": "string", "description": "The candidate whose donors are being shown"},
    "donors": {"type": "array", "description": "Array of donor objects with name, amount, type, and cycle"},
    "totalRaised": {"type": "string", "description": "Total amount raised if found. Leave empty if unknown."},
    "source": {"type": "string", "description": "Source name e.g. OpenSecrets, FEC"},
    "sourceUrl": {"type": "string", "description": "The URL where this data was found"}
  }'

# 4. show_fact_check
create_tool "show_fact_check" \
  "Display a fact-check badge. Call this when you cite a PolitiFact or other fact-check rating." \
  '{
    "claim": {"type": "string", "description": "The exact claim that was fact-checked"},
    "rating": {"type": "string", "description": "The rating: True, Mostly True, Half True, Mostly False, False, Pants on Fire"},
    "source": {"type": "string", "description": "Who did the fact check e.g. PolitiFact, FactCheck.org"},
    "sourceUrl": {"type": "string", "description": "The URL to the fact check article"},
    "year": {"type": "string", "description": "The year the fact check was published"},
    "candidate": {"type": "string", "description": "The candidate associated with the claim"}
  }'

# 5. show_endorsement
create_tool "show_endorsement" \
  "Display an endorsement card. Call this when you mention who has endorsed a candidate." \
  '{
    "endorser": {"type": "string", "description": "Name of the person or organization giving the endorsement"},
    "type": {"type": "string", "description": "Type of endorser: Organization, Individual, Union, Newspaper, Elected Official"},
    "context": {"type": "string", "description": "Why this endorsement matters or what was said"},
    "sourceUrl": {"type": "string", "description": "The URL where this endorsement was reported"},
    "candidate": {"type": "string", "description": "The candidate who was endorsed"}
  }'

# 6. show_measure
create_tool "show_measure" \
  "Display a ballot measure card with for/against arguments. Call this for constitutional amendments." \
  '{
    "title": {"type": "string", "description": "The official or common name of the ballot measure"},
    "summary": {"type": "string", "description": "Plain language summary of what the measure does"},
    "forArguments": {"type": "array", "description": "Array of arguments in favor of the measure"},
    "againstArguments": {"type": "array", "description": "Array of arguments against the measure"},
    "sponsors": {"type": "string", "description": "Who sponsored this measure. Leave empty if unknown."},
    "funding": {"type": "string", "description": "Key funding sources. Leave empty if unknown."}
  }'

# 7. select_candidate
create_tool "select_candidate" \
  "Select and highlight a candidate in the directory sidebar. Call this when switching to a new candidate." \
  '{
    "candidate_id": {"type": "string", "description": "The candidate ID to highlight: tiffany, barnes, rodriguez, roys, hong, crowley, vanorden, cooke, steil, taylor, lazar, kaul, toney, dei-amend, worship-amend, veto-amend"}
  }'

# 8. set_filter
create_tool "set_filter" \
  "Change the race category filter in the directory. Call this when the user asks about a specific type of race." \
  '{
    "filter": {"type": "string", "description": "The race category: all, governor, supreme_court, attorney_general, house, senate, ballot"}
  }'

# 9. clear_results
create_tool "clear_results" \
  "Clear the findings panel before showing new results. Call this before switching to a new candidate." \
  '{}'

echo ""
echo "=== Done! 9 client tools created and attached to agent ==="
echo "Agent ID: $AGENT_ID"
