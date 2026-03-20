# ElevenLab Basic Election Info KB

# Skill: Wisconsin Elections 2026 – Dates & Voting Rules

## Purpose

This document gives Wisconsin-focused election dates and core voting rules for 2026 so the agent can answer voting questions accurately.  
For current details, the agent must confirm with official Wisconsin sources (MyVote Wisconsin, Wisconsin Elections Commission).

Official sources to rely on:
- MyVote Wisconsin: https://myvote.wi.gov
- MyVote voter deadlines: https://myvote.wi.gov/en-us/Voter-Deadlines
- Wisconsin Elections Commission election calendar (2025–2026 PDF)
- Local municipal clerk websites

---

## 1. Statewide Election Dates (2026)

Use these as default statewide dates.  
Local special, school board, or referendum elections may exist on other dates and must be looked up by municipality.

- **Spring Primary**  
  - Date: Tuesday, February 17, 2026  
  - Typical races: Nonpartisan primaries (local offices, judicial races).

- **Spring General / Judicial Election**  
  - Date: Tuesday, April 7, 2026  
  - Typical races: Wisconsin Supreme Court, Court of Appeals, circuit courts, nonpartisan local offices, local referenda.

- **Partisan Primary**  
  - Date: Tuesday, August 11, 2026  
  - Races: Primaries for U.S. House, U.S. Senate (if up), Governor and statewide executive offices, State Senate (cycle-specific), State Assembly, partisan county offices.

- **Fall General Election (2026 midterm-equivalent for state offices)**  
  - Date: Tuesday, November 3, 2026  
  - Races: General elections for the above offices plus applicable state and local referenda.

2025 statewide note:
- After the 2025 spring elections, there are no regularly scheduled statewide elections in November 2025.  
- Only special or recall elections may be held, and they are local/jurisdiction-specific.

---

## 2. How the Agent Should Resolve “Next Election” Questions

The agent must **not** hardcode “next election” answers.  
It should always compute them dynamically from live data.

When a user asks “When is the next election?”:

1. Use the current date.  
2. Use the user’s location or address (city, village, town, county, school district).  
3. Query MyVote Wisconsin, WEC-powered APIs, or an internal elections service to return:
   - Next election date  
   - Election type (spring, partisan primary, general, special)  
   - What’s on the ballot, if available

When a user asks “What are the elections before the midterms?” for Wisconsin 2026:

- List upcoming elections from “today” up to:
  - The Partisan Primary (August 11, 2026)  
  - The Fall General Election (November 3, 2026)  
- Include any known special elections returned by the live data source.

---

## 3. Voter Eligibility in Wisconsin

Core eligibility rules (simplified):

A person is **eligible to vote in Wisconsin** if they:

- Are a **U.S. citizen**.  
- Are **18 years or older** on or before Election Day.  
- Have **lived at a Wisconsin address for at least 28 consecutive days** before the election in the municipality where they register.  
- Are **not currently serving a felony sentence** (including prison, probation, parole, or extended supervision) for a felony conviction.  
- Have **not been adjudicated incompetent to vote** by a court.

Important behaviors for the agent:

- Never definitively say a user **is** or **is not** eligible.  
- Instead:
  - Explain the rules in plain language.  
  - Direct the user to:
    - MyVote “My Voter Info” to check registration status.  
    - Their municipal clerk for legal edge cases (name changes, court orders, complex felony situations).

---

## 4. Registration Methods and Deadlines

Wisconsin supports multiple registration methods.

### 4.1 Registration Methods

- **Online registration**
  - Available if the voter has a Wisconsin driver license or state ID, and DMV data matches their name, date of birth, and address.

- **By mail**
  - Voter fills out a registration form and mails it with proof of residence.

- **In person at the municipal clerk’s office**
  - Voter registers directly with the clerk or staff.

- **Election Day registration at the polling place**
  - Voter can register at their polling place on Election Day with acceptable proof of residence.

### 4.2 Typical Registration Deadlines (Approximate)

Exact dates vary by election and must be taken from MyVote “Voter Deadlines”.

General patterns:

- **Online / by mail registration**
  - Closes about 20 days before Election Day.

- **In-person at the clerk’s office**
  - Open until the Friday before Election Day, usually 5:00 p.m. local time (check local clerk hours).

- **Election Day**
  - Registration is available at the polling place during voting hours.

### 4.3 Proof of Residence (Examples)

Common documents (name + current address):

- Utility bill.  
- Bank or credit union statement.  
- Pay stub or paycheck.  
- Lease or property tax bill.  
- Government or school correspondence with name and address.

The agent should **not** claim this is a complete legal list.  
It should provide examples and direct the user to MyVote or their clerk for the full official list.

---

## 5. Voter ID Requirements

Wisconsin is a **photo ID required** state for in-person voting and most absentee voting.

### 5.1 Common Acceptable Photo IDs

The agent should describe the **types** of IDs and always encourage the user to check the official list.

Common acceptable IDs include:

- Wisconsin driver license (DOT-issued).  
- Wisconsin state ID card (DOT-issued).  
- U.S. passport (book or card).  
- U.S. military or Uniformed Services ID.  
- U.S. Department of Veterans Affairs photo ID.  
- Tribal ID from a federally recognized Wisconsin tribe.  
- Certificate of naturalization issued within the last 2 years.  
- Wisconsin DMV-issued receipts:
  - Temporary driver license or ID card receipt.  
  - ID Petition Process photo receipt.  
- Approved **student voter ID** card from a Wisconsin college or university, which must:
  - Meet state rules for issuance date and expiration date.  
  - Typically be accompanied by separate proof of current enrollment if expired.

Key points:

- The **address on the ID does not need to match** the voter’s registration address.  
- Wisconsin offers a **free state ID for voting** through the DMV ID Petition Process if the voter lacks standard documents.

### 5.2 Who May Not Need Photo ID

Certain categories usually do **not** need to show photo ID, including:

- Certified **confidential electors**.  
- Active **military** and **permanent overseas** voters voting absentee.  
- Some **indefinitely confined** absentee voters (handled via specific clerk procedures).

For these cases, the agent should:

- Explain that special rules apply.  
- Direct users to MyVote Wisconsin or their municipal clerk because requirements and forms can be nuanced and may change.

### 5.3 Provisional Ballots

If a voter:

- Is otherwise eligible,  
- But does **not have acceptable photo ID** at the polling place, or  
- There is a question about ID validity that cannot be resolved at the polls,

Then:

- The voter may receive a **provisional ballot**.  
- They are typically given instructions and a deadline (often by the Friday after Election Day) to show valid ID to the municipal clerk so the ballot can be counted.

The agent should:

- Describe the provisional ballot option in simple terms.  
- Emphasize the importance of following up with the clerk by the deadline.  
- Encourage users to contact their clerk immediately for exact instructions.

---

## 6. Ways to Vote in Wisconsin

### 6.1 In-Person on Election Day

- Voter goes to their assigned polling place.  
- Standard hours are usually 7:00 a.m. to 8:00 p.m. local time, but the agent should tell users to confirm hours.  
- Photo ID is required unless the voter qualifies for one of the limited exemptions.

### 6.2 In-Person Absentee (“Early Voting”)

- Conducted at the municipal clerk’s office or designated satellite locations.  
- Early voting typically starts up to 2 weeks before Election Day and ends on the Sunday before Election Day, but exact dates and hours are set locally.  
- Photo ID is required (with same exemptions as above).

The agent should:

- Remind users that early voting locations and hours vary by municipality.  
- Suggest checking MyVote or clerk websites for exact times and addresses.

### 6.3 Absentee Voting by Mail

- Voter requests an absentee ballot:
  - Online, by mail, or via clerk’s office, within legal deadlines.  
- Many first-time absentee-by-mail voters must provide a copy of acceptable photo ID with their **first** absentee request.

Deadlines (patterns, not fixed):

- Request deadlines:
  - Often around 5:00 p.m. on the Thursday before Election Day for most voters (varies for military/overseas and some categories).  
- Return deadline:
  - The ballot must usually **arrive at the clerk’s office by 8:00 p.m. on Election Day** to count.

The agent should:

- Emphasize that users must follow the instructions with their absentee ballot envelope.  
- Warn that mailing the ballot too 