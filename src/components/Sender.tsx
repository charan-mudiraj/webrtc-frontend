import { useEffect, useState } from "react";

export const Sender = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(import.meta.env.VITE_BACKEND_URL);
    setSocket(socket);
    socket.onopen = () => {
      console.log("WebSocket connected");
      socket.send(JSON.stringify({ type: "sender" }));
    };
  }, []);

  const initiateConn = async () => {
    if (!socket) {
      alert("Socket not found");
      return;
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:your.turn.server:3478",
          username: "username",
          credential: "password",
        },
      ],
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("ICE candidate:", event.candidate);
        socket.send(
          JSON.stringify({ type: "iceCandidate", candidate: event.candidate })
        );
      } else {
        console.log("All ICE candidates have been sent");
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", peerConnection.iceConnectionState);
    };

    peerConnection.onconnectionstatechange = () => {
      console.log("Connection state:", peerConnection.connectionState);
    };

    peerConnection.onnegotiationneeded = async () => {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.send(
        JSON.stringify({
          type: "createOffer",
          sdp: peerConnection.localDescription,
        })
      );
    };

    getCameraStreamAndSend(peerConnection);

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      console.log("Received message:", message);

      if (message.type === "createAnswer") {
        await peerConnection.setRemoteDescription(message.sdp);
      } else if (message.type === "iceCandidate") {
        peerConnection.addIceCandidate(message.candidate).catch((e) => {
          console.error("Error adding received ice candidate", e);
        });
      }
    };
  };

  const getCameraStreamAndSend = async (peerConnection) => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.createElement("video");
    video.srcObject = stream;
    video.play();
    document.body.appendChild(video);
    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });
  };

  return (
    <div>
      Sender
      <button onClick={initiateConn}> Send data </button>
    </div>
  );
};
