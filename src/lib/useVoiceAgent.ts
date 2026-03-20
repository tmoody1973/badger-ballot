"use client";

import { useConversation } from "@elevenlabs/react";
import { useCallback, useState } from "react";
import type { RenderedComponent, Candidate } from "@/types";

interface UseVoiceAgentOptions {
  onComponentAdd: (component: RenderedComponent) => void;
  onStatusChange: (status: string) => void;
  selectedCandidate: Candidate | null;
}

export function useVoiceAgent({
  onComponentAdd,
  onStatusChange,
  selectedCandidate,
}: UseVoiceAgentOptions) {
  const [isConnected, setIsConnected] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      setIsConnected(true);
      onStatusChange("Connected. Listening...");
    },
    onDisconnect: () => {
      setIsConnected(false);
      onStatusChange("Disconnected.");
    },
    onError: (error) => {
      console.error("ElevenAgents error:", error);
      onStatusChange("Voice error. Try again.");
    },
    onMessage: (message) => {
      console.log("Agent message:", message);
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
        onComponentAdd({
          type: "candidate",
          data: {
            id: params.name.toLowerCase().replace(/\s+/g, "-"),
            name: params.name,
            party: (params.party?.charAt(0).toUpperCase() ?? "D") as "D" | "R" | "M" | "X" | "NP",
            office: params.office ?? "",
            currentRole: params.currentRole ?? "",
            type: "challenger",
            raceCategory: "governor",
            photoUrl: selectedCandidate?.photoUrl ?? null,
            keyFact: params.keyFact ?? "",
            findings: params.findingsCount ?? 0,
            severity: (params.severity as "high" | "medium" | "low") ?? "medium",
          },
        });
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
    },
  });

  const startVoiceSession = useCallback(async () => {
    if (!selectedCandidate) return;

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get signed URL for secure connection
      const res = await fetch("/api/eleven-signed-url");
      const { signedUrl, error } = await res.json();

      if (error || !signedUrl) {
        // Fall back to public agent ID
        const agentId = process.env.NEXT_PUBLIC_ELEVEN_AGENT_ID;
        if (agentId) {
          await conversation.startSession({
            agentId,
            connectionType: "webrtc",
            dynamicVariables: {
              candidate_name: selectedCandidate.name,
              candidate_id: selectedCandidate.id,
              candidate_type: selectedCandidate.type,
              candidate_office: selectedCandidate.office,
            },
          });
        } else {
          onStatusChange("ElevenLabs agent not configured. Using click mode.");
          return;
        }
      } else {
        await conversation.startSession({
          signedUrl,
          dynamicVariables: {
            candidate_name: selectedCandidate.name,
            candidate_id: selectedCandidate.id,
            candidate_type: selectedCandidate.type,
            candidate_office: selectedCandidate.office,
          },
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
