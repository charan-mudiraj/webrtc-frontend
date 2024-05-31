import { useEffect, useRef } from "react";

export const Receiver = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const socket = new WebSocket(import.meta.env.VITE_BACKEND_URL);
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "receiver" }));
    };
    startReceiving(socket);
  }, []);

  function startReceiving(socket: WebSocket) {
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
            "stun:stun.l.google.com:19302",
            "stun:stun3.l.google.com:19302",
            "stun:stun4.l.google.com:19302",
          ],
        },
        {
          urls: "turn:your.turn.server:3478",
          username: "username",
          credential: "password",
        },
      ],
    });

    pc.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = new MediaStream([event.track]);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("ICE candidate:", event.candidate);
        socket.send(
          JSON.stringify({ type: "iceCandidate", candidate: event.candidate })
        );
      } else {
        console.log("All ICE candidates have been sent");
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log("ICE gathering state:", pc.iceGatheringState);
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "createOffer") {
        pc.setRemoteDescription(message.sdp).then(() => {
          pc.createAnswer().then((answer) => {
            pc.setLocalDescription(answer);
            socket.send(JSON.stringify({ type: "createAnswer", sdp: answer }));
          });
        });
      } else if (message.type === "iceCandidate") {
        pc.addIceCandidate(message.candidate).catch((e) => {
          console.error("Error adding received ice candidate", e);
        });
      }
    };
  }

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error("Error playing video:", error);
      });
    }
  };

  return (
    <div>
      <button onClick={handlePlayClick}>Play Video</button>
      <video controls ref={videoRef} />
    </div>
  );
};
