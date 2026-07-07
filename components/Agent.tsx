"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Video, Mic, Monitor, AlertTriangle, ShieldCheck, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";
import { updateUserNotifications } from "@/lib/actions/user.action";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [volume, setVolume] = useState(0);
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [receiveNotifications, setReceiveNotifications] = useState(true);

  // --- Monitoring & Malpractice state ---
  const [switches, setSwitches] = useState(0);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const MAX_SWITCHES = 3;

  // --- Media elements ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
      
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
      stopMedia(); // Ensure media tracks are stopped
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };

    const onMessage = (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
        
        if (message.role === "user") {
          setIsAssistantThinking(true);
        } else {
          setIsAssistantThinking(false);
          setLastMessage(message.transcript);
        }
      }
    };

    const onSpeechStart = () => {
      setIsSpeaking(true);
      setIsAssistantThinking(false);
    };

    const onSpeechEnd = () => {
      setIsSpeaking(false);
      setVolume(0);
    };

    const onVolumeLevel = (level: number) => setVolume(level);

    const onError = (error: any) => {
  console.log("================================");
  console.log("VAPI ERROR");
  console.dir(error);
  console.log(JSON.stringify(error, null, 2));
};

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("volume-level", onVolumeLevel);
    vapi.on("error", onError);

    // --- Malpractice Monitoring ---
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && callStatus === CallStatus.ACTIVE) {
        setSwitches((prev) => {
          const next = prev + 1;
          if (next >= MAX_SWITCHES) {
            handleDisqualification();
            return next;
          }
          toast.warning(`Warning: Tab switched. (${next}/${MAX_SWITCHES} strikes)`, {
            icon: <AlertTriangle className="text-warning" />
          });
          return next;
        });
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleVisibilityChange);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("volume-level", onVolumeLevel);
      vapi.off("error", onError);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleVisibilityChange);
    };
  }, [callStatus]);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      if (!interviewId) {
        router.push("/");
        return;
      }
      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: messages,
        feedbackId,
      });
      setIsAnalyzing(false);

      if (success && id) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        router.push("/");
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        router.push("/");
      } else if (!isDisqualified) {
        setIsAnalyzing(true);
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId, isDisqualified]);

  const enterFullscreen = () => {
    if (containerRef.current) {
        containerRef.current.requestFullscreen().catch((err) => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    }
  };

  const stopMedia = () => {
    [videoRef, screenRef].forEach((ref) => {
      if (ref.current && ref.current.srcObject) {
         const stream = ref.current.srcObject as MediaStream;
         stream.getTracks().forEach((track) => track.stop());
         ref.current.srcObject = null;

      }
    });
  };

  const handleDisqualification = () => {
    setIsDisqualified(true);
    vapi.stop();
    setCallStatus(CallStatus.FINISHED);
    stopMedia();
    toast.error("Disqualified due to malpractice (tab switching).", {
      icon: <XCircle className="text-destructive font-black" />
    });
  };

  const getMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
      }
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Camera and microphone access is required to proceed.");
      return false;
    }
  };

  const startScreenShare = async () => {
    if (typeof MediaSource === "undefined" && typeof MediaStream === "undefined") return;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always", displaySurface: "monitor" },
        audio: false,
      });
      if (screenRef.current) {
        screenRef.current.srcObject = screenStream;
        screenRef.current.muted = true;
        await screenRef.current.play();
      }
      screenStream.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (screenRef.current) {
          screenRef.current.srcObject = null;
        }
      });
    } catch (error: any) {
      if (error.name === "NotAllowedError" || error.name === "NotSupportedError") {
        console.log("Screen share cancelled or not supported");
      } else {
        console.error("Screen share error:", error);
      }
    }
  };

  const handleCall = async () => {
    const hasPermission = await getMediaPermissions();
    if (!hasPermission) return;

    setCallStatus(CallStatus.CONNECTING);
    startScreenShare();

    let formattedQuestions = "";
    if (questions) {
      formattedQuestions = questions.map((question) => `- ${question}`).join("\n");
    }

    await vapi.start(interviewer, {
      variableValues: { questions: formattedQuestions },
    });
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
    stopMedia();
  };

  if (isAnalyzing) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-dark-400/90 backdrop-blur-2xl animate-in fade-in duration-500">
        <div className="relative flex flex-col items-center max-w-lg w-full p-10 gap-8">
          {/* Animated Analysis Icon */}
          <div className="relative h-32 w-32 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <div className="absolute inset-4 rounded-full border-4 border-success-100/20 border-b-success-100 animate-spin-slow" />
            <Loader2 className="w-12 h-12 text-primary animate-pulse" />
          </div>

          <div className="text-center space-y-3">
            <h1 className="text-4xl font-black gradient-text">Analyzing Your Answer</h1>
            <p className="text-muted-foreground text-lg px-6">
              Please wait while our AI reviewer evaluates your performance and generates constructive feedback.
            </p>
          </div>

          <div className="w-full space-y-4 text-left px-8">
             <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse-slow rounded-full w-2/3" />
             </div>
          </div>

          {/* Email Notification Sidebar-style Card */}
          <div className="w-full max-w-sm glassmorphism rounded-3xl p-5 flex items-center justify-between group transition-all shadow-xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-foreground text-sm">Email Results</span>
                <span className="text-[10px] text-muted-foreground">Receive PDF report</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="h-8 w-px bg-border" />
              <Checkbox 
                checked={receiveNotifications} 
                className="h-5 w-5 rounded-md border-2 border-primary/20"
                onCheckedChange={(checked) => {
                  setReceiveNotifications(checked as boolean);
                  updateUserNotifications(checked as boolean).then(() => {
                    toast.success(checked ? "Email notification enabled" : "Email notification disabled");
                  });
                }} 
              />
            </div>
          </div>

          <p className="text-[10px] uppercase tracking-[0.2em] font-black text-foreground/20 animate-pulse">
            Generating expert report...
          </p>
        </div>
      </div>
    );
  }

  if (isDisqualified) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-6 glassmorphism border-destructive-100 rounded-[40px] animate-in zoom-in-95">
        <XCircle className="w-24 h-24 text-destructive" />
        <h2 className="text-4xl font-black text-destructive">Disqualified</h2>
        <p className="text-lg text-muted-foreground max-w-sm text-center">
          You have been disqualified for switching tabs or minimizing the window multiple times during the interview.
        </p>
        <Button onClick={() => router.push("/")} size="lg" className="rounded-2xl px-10 font-bold gradient-btn">
          Return Home
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-6 w-full animate-in fade-in duration-1000 bg-background/50 p-6 rounded-[40px] border border-white/5 shadow-2xl backdrop-blur-xl relative overflow-hidden h-screen max-h-screen">
      
      {/* Top Bar: Status & Subtitles */}
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-success-100/10 border border-success-100/20 text-success-100 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            Secure Exam Mode
          </div>
          
          {switches > 0 && (
            <div className="font-black text-destructive animate-pulse flex items-center gap-2 text-sm">
              Warnings: {switches}/{MAX_SWITCHES}
            </div>
          )}
        </div>

        {/* Subtitles Area (Now at the top) */}
        <div className="w-full flex items-center justify-center min-h-[80px]">
          {(lastMessage || isAssistantThinking) && (
            <div className="w-full max-w-3xl p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/5 shadow-2xl flex items-center justify-center relative overflow-hidden">
              {isAssistantThinking && (
                <div className="flex items-center justify-center gap-2 animate-pulse">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                  </span>
                  <span className="text-primary font-black uppercase tracking-widest text-[10px]">AI Analyzing...</span>
                </div>
              )}
              {!isAssistantThinking && lastMessage && (
                <p className="text-lg text-center font-medium leading-tight italic text-white/90 animate-fadeIn">
                  &quot;{lastMessage}&quot;
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Layout: Meeting View */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Interviewer (Main View) */}
        <div className="col-span-8 relative group rounded-[32px] overflow-hidden blue-gradient-dark border border-white/5 flex flex-col items-center justify-center">
           <div className={cn("avatar transition-all duration-700", isSpeaking ? "scale-110" : "scale-100")}>
            <Image
              src="https://api.dicebear.com/9.x/adventurer/png?seed=interviewer_girl&flip=true&size=300"
              alt="Interviewer"
              width={180}
              height={180}
              className="z-20 object-cover rounded-full shadow-2xl relative"
            />
            {isSpeaking && (
              <>
                <div className="absolute inset-0 flex items-center justify-center">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute border-4 border-primary/20 rounded-full animate-ping"
                      style={{
                        animationDuration: `${1.5 + i}s`,
                        width: `${200 + volume * 150 * (i + 1)}px`,
                        height: `${200 + volume * 150 * (i + 1)}px`,
                        opacity: 0.15 / (i + 1),
                      }}
                    />
                  ))}
                </div>
                <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 flex items-end justify-center gap-[3px] z-30">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-[5px] bg-white rounded-full transition-all duration-75"
                      style={{
                        height: `${6 + volume * 100 * (0.6 + i * 0.2)}px`,
                        opacity: 0.3 + volume * 0.7,
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          <h3 className="mt-8 text-2xl font-black gradient-text uppercase tracking-tighter">AI Interviewer</h3>
          <div className="flex gap-2 h-10 items-end mt-4">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 bg-primary/40 rounded-full transition-all duration-100"
                style={{
                  height: `${Math.max(6, volume * 150 * (Math.random() * 0.4 + 0.6))}px`,
                  opacity: 0.3 + volume,
                }}
              />
            ))}
          </div>
        </div>

        {/* User Feeds (Sidebar Style) */}
        <div className="col-span-4 flex flex-col gap-4 min-h-0">
          <div className="flex-1 relative rounded-3xl overflow-hidden bg-dark-100/50 border border-white/5 shadow-xl">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
            <div className="absolute bottom-4 left-4 p-2 bg-black/60 backdrop-blur-md rounded-xl text-white text-[10px] uppercase font-black flex items-center gap-2">
              <Video className="w-3 h-3 text-success-100" /> My Camera
            </div>
          </div>
          
          <div className="flex-1 relative rounded-3xl overflow-hidden bg-dark-100/50 border border-white/5 shadow-xl min-h-[120px]">
            <video
              ref={screenRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              onLoadedMetadata={() => screenRef.current?.play()}
            />
            <div className="absolute bottom-4 left-4 p-2 bg-black/60 backdrop-blur-md rounded-xl text-white text-[10px] uppercase font-black flex items-center gap-2">
              <Monitor className="w-3 h-3 text-primary" /> My Screen
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex justify-center pb-2">
        {callStatus !== CallStatus.ACTIVE ? (
          <Button
            onClick={handleCall}
            disabled={callStatus === CallStatus.CONNECTING}
            size="lg"
            className="h-16 w-80 rounded-2xl font-black text-xl gradient-btn group transition-all"
          >
            {callStatus === CallStatus.CONNECTING ? (
              <div className="flex items-center gap-3">
                 <span className="h-5 w-5 animate-spin rounded-full border-4 border-white border-t-transparent" />
                 Connecting...
              </div>
            ) : (
              <div className="flex items-center gap-3 uppercase">
                <Mic className="w-6 h-6 group-hover:scale-110 transition-transform" />
                Final Ready
              </div>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleDisconnect}
            variant="destructive"
            size="lg"
            className="h-16 w-80 rounded-2xl font-black text-xl uppercase transition-all hover:scale-105 active:scale-95"
          >
            End Interview
          </Button>
        )}
      </div>
    </div>
  );
};

export default Agent;
