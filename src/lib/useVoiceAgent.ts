"use client";

import { useConversation } from "@elevenlabs/react";
import { useCallback, useState, useRef } from "react";
import type { RenderedComponent, Candidate } from "@/types";
import { CANDIDATES } from "@/data/candidates";

interface UseVoiceAgentOptions {
  onComponentAdd: (component: RenderedComponent) => void;
  onStatusChange: (status: string) => void;
  onSelectCandidate: (id: string) => void;
  onSetFilter: (filter: string) => void;
  onClearResults: () => void;
  onCandidateResearch: (candidateId: string) => void;
  selectedCandidate: Candidate | null;
}

export function useVoiceAgent({
  onComponentAdd,
  onStatusChange,
  onSelectCandidate,
  onSetFilter,
  onClearResults,
  onCandidateResearch,
  selectedCandidate,
}: UseVoiceAgentOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const researchTriggeredRef = useRef<string | null>(null);

  // Helper: when any client tool mentions a candidate, ensure research is running
  const ensureResearch = useCallback((candidateName: string) => {
    if (!candidateName) return;
    const match = CANDIDATES.find(
      (c) =>
        c.name.toLowerCase() === candidateName.toLowerCase() ||
        candidateName.toLowerCase().includes(c.name.split(" ").pop()?.toLowerCase() ?? ""),
    );
    if (match && researchTriggeredRef.current !== match.id) {
      researchTriggeredRef.current = match.id;
      onCandidateResearch(match.id);
      onSelectCandidate(match.id);
    }
  }, [onCandidateResearch, onSelectCandidate]);

  // Shared voter lookup — fires fetch and renders component when done
  const voterLookup = useCallback((address: string, city: string, zip: string, action: string, componentType: string) => {
    fetch("/api/voter-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, city, zip, action }),
      signal: AbortSignal.timeout(110_000),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!data.success) {
          onStatusChange(`Voter lookup failed: ${data.error ?? "unknown error"}. Try myvote.wi.gov directly.`);
          return;
        }
        onComponentAdd({
          type: componentType as "pollingPlace",
          data: {
            address: `${address}, ${city}, WI ${zip}`,
            rawContent: data.rawContent ?? "",
            sourceUrl: data.sourceUrl ?? "https://myvote.wi.gov",
            nextElection: data.nextElection ?? "Tuesday, April 7, 2026",
            daysUntilElection: data.daysUntilElection ?? 14,
          },
        });
        const label = action === "ballot" ? "ballot" : action === "registration" ? "registration" : "polling place";
        onStatusChange(`Found your ${label} info.`);
      })
      .catch((err) => {
        console.error(`[voter-lookup] ${action} failed:`, err);
        onStatusChange("Couldn't look up voter info. Visit myvote.wi.gov directly.");
      });
  }, [onComponentAdd, onStatusChange]);

  const conversation = useConversation({
    onConnect: () => {
      setIsConnected(true);
      onStatusChange("Connected. Listening...");
    },
    onDisconnect: () => {
      setIsConnected(false);
      researchTriggeredRef.current = null;
      onStatusChange("Disconnected.");
    },
    onError: (error) => {
      console.error("ElevenAgents error:", error);
      onStatusChange("Voice error. Try again.");
    },
    onMessage: (message) => {
      // Detect candidate names in agent speech and auto-trigger search
      const msgStr = JSON.stringify(message);
      const msgLower = msgStr.toLowerCase();

      for (const c of CANDIDATES) {
        const lastName = c.name.split(" ").pop()?.toLowerCase() ?? "";
        if (lastName.length > 3 && msgLower.includes(lastName)) {
          ensureResearch(c.name);
          break;
        }
      }
    },
    onUnhandledClientToolCall: (toolCall) => {
      console.warn("Unhandled client tool call:", JSON.stringify(toolCall));
    },
    clientTools: {
      // Non-blocking client tools that render UI components
      show_candidate: (params: {
        name: string;
        party: string;
        office: string;
        currentRole: string;
        keyFact: string;
        findingsCount?: number;
        severity?: string;
      }) => {
        // Try to match against our local directory for consistent naming
        const match = CANDIDATES.find(
          (c) =>
            c.name.toLowerCase() === params.name?.toLowerCase() ||
            c.id === params.name?.toLowerCase().replace(/\s+/g, "-") ||
            params.name?.toLowerCase().includes(c.name.split(" ").pop()?.toLowerCase() ?? ""),
        );

        if (match) {
          onComponentAdd({ type: "candidate", data: match });
          // Use ensureResearch so the dedup guard prevents double-triggers
          ensureResearch(match.name);
        } else {
          onComponentAdd({
            type: "candidate",
            data: {
              id: params.name?.toLowerCase().replace(/\s+/g, "-") ?? "unknown",
              name: params.name ?? "Unknown",
              party: (params.party?.charAt(0).toUpperCase() ?? "D") as "D" | "R" | "M" | "X" | "NP",
              office: params.office ?? "",
              currentRole: params.currentRole ?? "",
              type: "challenger",
              raceCategory: "governor",
              photoUrl: null,
              keyFact: params.keyFact ?? "",
              findings: params.findingsCount ?? 0,
              severity: (params.severity as "high" | "medium" | "low") ?? "medium",
            },
          });
        }
        return "displayed";
      },

      show_vote: (params: {
        bill: string;
        vote: string;
        context: string;
        date?: string;
        source: string;
        sourceUrl?: string;
        candidate: string;
      }) => {
        ensureResearch(params.candidate);
        onComponentAdd({
          type: "vote",
          data: {
            bill: params.bill,
            vote: params.vote,
            context: params.context,
            date: params.date,
            source: params.source,
            sourceUrl: params.sourceUrl,
            candidate: params.candidate,
          },
        });
        return "displayed";
      },

      show_donors: (params: {
        candidate: string;
        donors: Array<{ name: string; amount: string; type: string; cycle: string }>;
        totalRaised?: string;
        source: string;
        sourceUrl?: string;
      }) => {
        ensureResearch(params.candidate);
        onComponentAdd({
          type: "donors",
          data: {
            candidate: params.candidate,
            donors: params.donors,
            totalRaised: params.totalRaised,
            source: params.source,
            sourceUrl: params.sourceUrl,
          },
        });
        return "displayed";
      },

      show_fact_check: (params: {
        claim: string;
        rating: string;
        source: string;
        sourceUrl?: string;
        year: string;
        candidate: string;
      }) => {
        ensureResearch(params.candidate);
        onComponentAdd({
          type: "factCheck",
          data: {
            claim: params.claim,
            rating: params.rating,
            source: params.source,
            sourceUrl: params.sourceUrl,
            year: params.year,
            candidate: params.candidate,
          },
        });
        return "displayed";
      },

      show_endorsement: (params: {
        endorser: string;
        type: string;
        context: string;
        sourceUrl?: string;
        candidate: string;
      }) => {
        ensureResearch(params.candidate);
        onComponentAdd({
          type: "endorsement",
          data: {
            endorser: params.endorser,
            type: params.type,
            context: params.context,
            sourceUrl: params.sourceUrl,
            candidate: params.candidate,
          },
        });
        return "displayed";
      },

      show_measure: (params: {
        title: string;
        summary: string;
        forArguments: string[];
        againstArguments: string[];
        sponsors?: string;
        funding?: string;
      }) => {
        onComponentAdd({
          type: "measure",
          data: {
            title: params.title,
            summary: params.summary,
            forArguments: params.forArguments ?? [],
            againstArguments: params.againstArguments ?? [],
            sponsors: params.sponsors,
            funding: params.funding,
          },
        });
        return "displayed";
      },

      // Race comparison carousel
      show_race_comparison: (params: { raceCategory: string; office: string }) => {
        onComponentAdd({
          type: "raceComparison",
          data: {
            raceCategory: params.raceCategory,
            office: params.office,
          },
        });
        return "displayed";
      },

      // === Voter services — three separate tools so the LLM can't pick the wrong action ===
      // NON-BLOCKING: each fires request and returns immediately

      // "Where do I vote?"
      lookup_polling_place: (params: { address: string; city?: string; zip?: string }) => {
        const city = params.city || "Milwaukee";
        onStatusChange(`Looking up your polling place for ${params.address}... This takes about 30 seconds.`);
        voterLookup(params.address, city, params.zip ?? "", "polling-place", "pollingPlace");
        return `Looking up polling place for ${params.address}, ${city}. Results will appear on screen in about 30 seconds. Tell the user their next election is Tuesday April 7, 2026 and remind them to bring a photo ID.`;
      },

      // "What's on my ballot?"
      lookup_ballot: (params: { address: string; city?: string; zip?: string }) => {
        const city = params.city || "Milwaukee";
        onStatusChange(`Checking what's on your ballot for ${params.address}... This takes about 60 seconds.`);
        voterLookup(params.address, city, params.zip ?? "", "ballot", "ballotPreview");
        return `Checking ballot for ${params.address}, ${city}. The ballot takes about 60 seconds to load. Tell the user their next election is Tuesday April 7, 2026 — Spring Election with Supreme Court, circuit court judges, and county supervisor races. Remind them to bring a photo ID.`;
      },

      // "Am I registered?"
      lookup_registration: (params: { address: string; city?: string; zip?: string }) => {
        const city = params.city || "Milwaukee";
        onStatusChange(`Checking voter registration for ${params.address}...`);
        voterLookup(params.address, city, params.zip ?? "", "registration", "registration");
        return `Checking registration for ${params.address}, ${city}. Results will appear on screen shortly.`;
      },

      // Keep old tool name as alias so existing agent config still works
      lookup_voter_info: (params: { address: string; city?: string; zip?: string; action?: string }) => {
        const city = params.city || "Milwaukee";
        const action = params.action ?? "polling-place";
        const componentType = action === "ballot" ? "ballotPreview" : action === "registration" ? "registration" : "pollingPlace";
        const label = action === "ballot" ? "ballot" : action === "registration" ? "registration" : "polling place";
        onStatusChange(`Looking up your ${label} for ${params.address}...`);
        voterLookup(params.address, city, params.zip ?? "", action, componentType);
        return `Looking up ${label} for ${params.address}, ${city}. Results will appear on screen in about 30 seconds. Tell the user their next election is Tuesday April 7, 2026 and remind them to bring a photo ID.`;
      },

      // Deep dive — "go deeper on donors", "tell me more about their votes"
      // NON-BLOCKING: fires request, returns immediately so voice keeps talking
      deep_dive: (params: { candidate: string; angle: string }) => {
        const match = CANDIDATES.find(
          (c) =>
            c.name.toLowerCase() === params.candidate?.toLowerCase() ||
            params.candidate?.toLowerCase().includes(c.name.split(" ").pop()?.toLowerCase() ?? ""),
        );
        const candidateId = match?.id ?? params.candidate?.toLowerCase().replace(/\s+/g, "-");
        const candidateName = match?.name ?? params.candidate;

        onStatusChange(`Digging deeper into ${candidateName}'s ${params.angle}...`);

        // Show progress card immediately
        onComponentAdd({
          type: "deepDiveProgress",
          data: { candidate: candidateName, angle: params.angle, status: "searching" as const },
        });

        fetch("/api/deep-dive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidate: candidateId, angle: params.angle }),
          signal: AbortSignal.timeout(60_000),
        })
          .then((res) => {
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            return res.json();
          })
          .then((data) => {
            const sourceCount = data.source_count ?? 0;

            // Mark progress as complete (hides the progress card)
            onComponentAdd({
              type: "deepDiveProgress",
              data: { candidate: candidateName, angle: params.angle, status: "complete" as const, sourceCount },
            });

            // Add ALL deep dive results as a single self-contained block
            onComponentAdd({
              type: "deepDiveResults",
              data: {
                candidate: candidateName,
                angle: params.angle,
                sourceCount,
                votes: data.votes ?? [],
                donors: data.donors ?? null,
                factChecks: data.factChecks ?? [],
                news: data.news ?? [],
                endorsements: data.endorsements ?? [],
                platform: data.platform ?? [],
              },
            });

            onStatusChange(`Deep dive complete. Found ${sourceCount} sources on ${params.angle}.`);
          })
          .catch((err) => {
            console.error("[deep_dive] Failed:", err);
            // Mark progress as complete to hide it
            onComponentAdd({
              type: "deepDiveProgress",
              data: { candidate: candidateName, angle: params.angle, status: "complete" as const },
            });
            onStatusChange("Deep dive failed. Try asking again.");
          });

        return `Digging deeper into ${candidateName}'s ${params.angle}. Results will appear on screen in about 15 seconds. In the meantime, share what you already know about this topic from the initial research.`;
      },

      // Navigation client tools — agent controls the UI
      select_candidate: (params: { candidate_id: string }) => {
        onSelectCandidate(params.candidate_id);
        return `Selected candidate ${params.candidate_id}`;
      },

      set_filter: (params: { filter: string }) => {
        onSetFilter(params.filter);
        return `Filter set to ${params.filter}`;
      },

      clear_results: () => {
        onClearResults();
        return "Results cleared";
      },
    },
  });

  const startVoiceSession = useCallback(async () => {
    try {
      // Request microphone permission (requires HTTPS or localhost)
      if (navigator.mediaDevices?.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } else {
        onStatusChange("Microphone not available (requires HTTPS). Using search mode.");
        return;
      }

      // Build dynamic variables
      const dynamicVars: Record<string, string> = selectedCandidate
        ? {
            candidate_name: selectedCandidate.name,
            candidate_id: selectedCandidate.id,
            candidate_type: selectedCandidate.type,
            candidate_office: selectedCandidate.office,
          }
        : {
            candidate_name: "",
            candidate_id: "",
            candidate_type: "",
            candidate_office: "",
          };

      // Get signed URL for secure connection
      const res = await fetch("/api/eleven-signed-url");
      const { signedUrl, error } = await res.json();

      if (error || !signedUrl) {
        const agentId = process.env.NEXT_PUBLIC_ELEVEN_AGENT_ID;
        if (agentId) {
          await conversation.startSession({
            agentId,
            connectionType: "webrtc",
            dynamicVariables: dynamicVars,
          });
        } else {
          onStatusChange("ElevenLabs agent not configured. Using click mode.");
          return;
        }
      } else {
        await conversation.startSession({
          signedUrl,
          dynamicVariables: dynamicVars,
        });
      }

      onStatusChange("Listening...");
    } catch (error) {
      console.error("Failed to start voice session:", error);
      onStatusChange("Microphone access denied. Using click mode.");
    }
  }, [conversation, selectedCandidate, onStatusChange]);

  const stopVoiceSession = useCallback(async () => {
    await conversation.endSession();
    onStatusChange(null as unknown as string);
  }, [conversation, onStatusChange]);

  return {
    isConnected,
    isSpeaking: conversation.isSpeaking,
    status: conversation.status,
    startVoiceSession,
    stopVoiceSession,
  };
}
