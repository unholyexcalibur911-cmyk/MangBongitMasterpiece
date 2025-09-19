import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Login from "./Login";
import AdminDashboard from "./AdminDashboard";
import { io } from "socket.io-client";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Initialize socket.io client
const socket = io("http://localhost:3000", {
  autoConnect: false,
  transports: ["websocket"],
});

declare global {
  interface Window {
    socket: typeof socket;
  }
}

const queryClient = new QueryClient();
const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container missing in index.html");
}

const root = ReactDOM.createRoot(container as HTMLElement);

function Root() {
  const [authed, setAuthed] = React.useState(false);
  const [showAdmin, setShowAdmin] = React.useState(false);

  React.useEffect(() => {
    if (!authed) return;

    window.socket = socket;
    socket.connect();

    socket.on("team:created", (team: any) => {
      window.dispatchEvent(new CustomEvent("teamCreated", { detail: team }));
    });

    socket.on("team:updated", (team: any) => {
      window.dispatchEvent(new CustomEvent("teamUpdated", { detail: team }));
    });

    socket.on("activity:new", (activity: any) => {
      window.dispatchEvent(new CustomEvent("activityNew", { detail: activity }));
    });

    (async () => {
      try {
        const res = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });
        const txt = await res.text();
        const me = txt ? JSON.parse(txt) : null;
        if (me && me.id) {
          socket.emit("register", me.id);
        }
      } catch {}
    })();

    socket.on("ping", (payload: any) => {
      alert(`Ping from ${payload.from}: ${payload.message}`);
    });
    socket.on("msg:new", (payload: any) => {
      const event = new CustomEvent("socket:msg", { detail: payload });
      window.dispatchEvent(event);
    });

    return () => {
      socket.disconnect();
    };
  }, [authed]);

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        {!authed ? (
          <Login onSuccess={() => setAuthed(true)} />
        ) : showAdmin ? (
          <AdminDashboard onBack={() => setShowAdmin(false)} />
        ) : (
          <App
            onAdminClick={() => setShowAdmin(true)}
          />
        )}
      </QueryClientProvider>
    </React.StrictMode>
  );
}

window.socket = socket;

root.render(<Root />);
