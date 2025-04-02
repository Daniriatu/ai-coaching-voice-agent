"use client";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { getToken } from "@/services/GlobalServices";
import { CoachingExpert } from "@/services/Options";
import { UserButton } from "@stackframe/stack";
import { AssemblyAI, RealtimeTranscriber } from "assemblyai";
import { useQuery } from "convex/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

// Use dynamic import with SSR disabled
const RecordRTC = dynamic(
  () => import("recordrtc").then((mod) => mod.default || mod),
  {
    ssr: false,
  }
);

function DiscussionRoom() {
  const { roomid } = useParams();
  const DiscussionRoomData = useQuery(api.DiscussionRoom.GetDiscussionRoom, {
    id: roomid,
  });
  const [expert, setExpert] = useState();
  const [enableMic, setEnableMic] = useState(false);
  const recorder = useRef(null);
  const silenceTimeout = useRef(null);
  const realtimeTranscriber = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (silenceTimeout.current) clearTimeout(silenceTimeout.current);
      if (recorder.current) {
        recorder.current.stopRecording();
        recorder.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (DiscussionRoomData) {
      const Expert = CoachingExpert.find(
        (item) => item.name === DiscussionRoomData.expertName
      );
      setExpert(Expert);
    }
  }, [DiscussionRoomData]);

  const connectToServer = async () => {
    try {
      setEnableMic(true);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Initialize Assembly AI
      realtimeTranscriber.current = new RealtimeTranscriber({
        token: await getToken,
        sample_rate: 16_000,
      });

      realtimeTranscriber.current.on("transcript", async (transcript) => {
        console.log(transcript);
      });

      await realtimeTranscriber.current.connect();

      // Initialize RecordRTC
      const { default: RecordRTC } = await import("recordrtc");

      recorder.current = new RecordRTC(stream, {
        type: "audio",
        mimeType: "audio/webm",
        timeSlice: 250,
        desiredSampRate: 16000,
        numberOfAudioChannels: 1,
        ondataavailable: async (blob) => {
          if (silenceTimeout.current) clearTimeout(silenceTimeout.current);

          try {
            const buffer = await blob.arrayBuffer();
            console.log("Audio chunk:", buffer);

            silenceTimeout.current = setTimeout(() => {
              console.log("User stopped talking");
            }, 2000);
          } catch (error) {
            console.error("Blob processing error:", error);
          }
        },
      });

      // Start recording
      recorder.current.startRecording();
      console.log("Recording started");
    } catch (error) {
      console.error("Recording setup failed:", error);
      setEnableMic(false);
    }
  };

  const disconnect = (e) => {
    e.preventDefault();
    try {
      if (recorder.current) {
        console.log("Stopping recording...");
        recorder.current.stopRecording(() => {
          console.log("Recording stopped");
          if (recorder.current.getBlob()) {
            console.log("Final blob:", recorder.current.getBlob());
          }
          recorder.current.destroy();
          recorder.current = null;
        });
      }
    } catch (error) {
      console.error("Disconnection error:", error);
    } finally {
      setEnableMic(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold">
        {DiscussionRoomData?.coachingOption}
      </h2>
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="relative h-[60vh] bg-secondary border rounded-4xl flex flex-col items-center justify-center">
            <Image
              src={expert?.avatar}
              alt="Avatar"
              width={200}
              height={200}
              className="h-[80px] w-[80px] rounded-full object-cover animate-pulse"
            />
            <h2 className="text-gray-400">{expert?.name}</h2>
            <div className="p-5 bg-gray-200 px-10 rounded-lg absolute bottom-10 right-10">
              <UserButton />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-center">
            {!enableMic ? (
              <Button onClick={connectToServer}>Connect</Button>
            ) : (
              <Button variant="destructive" onClick={disconnect}>
                Disconnect
              </Button>
            )}
          </div>
        </div>
        <div>
          <div className="h-[60vh] bg-secondary border rounded-4xl flex flex-col items-center justify-center relative">
            <h2>Chat Section</h2>
          </div>
          <h2 className="mt-4 text-gray-400 text-sm">
            At the end of your conversation, we will generate automatically
            feedback/notes from your conversation.
          </h2>
        </div>
      </div>
    </div>
  );
}

export default DiscussionRoom;
