import { useEffect, useState } from "react";

export const Receiver = () => {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null
  );

  useEffect(() => {
    const socket = new WebSocket(import.meta.env.VITE_BACKEND_URL);
    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: "receiver",
        })
      );
    };
    startReceiving(socket);
  }, []);

  function startReceiving(socket: WebSocket) {
    const video = document.createElement("video");
    setVideoElement(video);
    document.body.appendChild(video);

    const pc = new RTCPeerConnection();
    pc.ontrack = (event) => {
      video.srcObject = new MediaStream([event.track]);
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "createOffer") {
        pc.setRemoteDescription(message.sdp).then(() => {
          pc.createAnswer().then((answer) => {
            pc.setLocalDescription(answer);
            socket.send(
              JSON.stringify({
                type: "createAnswer",
                sdp: answer,
              })
            );
          });
        });
      } else if (message.type === "iceCandidate") {
        pc.addIceCandidate(message.candidate);
      }
    };
  }

  const handlePlayClick = () => {
    if (videoElement) {
      videoElement.play().catch((error) => {
        console.error("Error playing video:", error);
      });
    }
  };

  return (
    <div>
      <button onClick={handlePlayClick}>Play Video</button>
    </div>
  );
};
