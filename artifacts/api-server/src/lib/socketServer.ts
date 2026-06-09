import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import { logger } from "./logger";
import {
  getRoom,
  startGame,
  updatePlayerPosition,
  damageMob,
  setEmote,
  advanceLevel,
  getRoomState,
  saveProgress,
  roomToJSON,
  LEVEL_CONFIGS,
  leaveRoom,
} from "./gameState";

let io: SocketServer;

export function initSocketServer(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/api/socket.io",
  });

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    socket.on("room:join", (data: { code: string; playerId: string }, ack) => {
      const room = getRoom(data.code);
      if (!room) {
        ack?.({ error: "Room not found" });
        return;
      }
      socket.join(`room:${data.code}`);
      socket.data.roomCode = data.code;
      socket.data.playerId = data.playerId;
      io.to(`room:${data.code}`).emit("room:updated", roomToJSON(room));
      ack?.({ ok: true, state: getRoomState(room) });
      logger.info({ code: data.code, playerId: data.playerId }, "Player joined socket room");
    });

    socket.on("game:start", (data: { code: string; playerId: string }, ack) => {
      const room = getRoom(data.code);
      if (!room) { ack?.({ error: "Room not found" }); return; }
      const player = room.players.get(data.playerId);
      if (!player?.isHost) { ack?.({ error: "Not host" }); return; }
      const ok = startGame(data.code);
      if (!ok) { ack?.({ error: "Cannot start" }); return; }
      io.to(`room:${data.code}`).emit("game:started", {
        state: getRoomState(room),
        levelConfig: LEVEL_CONFIGS[room.currentLevel],
      });
      ack?.({ ok: true });
    });

    socket.on("player:move", (data: { code: string; playerId: string; x: number; y: number; angle: number }) => {
      updatePlayerPosition(data.code, data.playerId, data.x, data.y, data.angle);
    });

    socket.on("player:attack", (data: { code: string; playerId: string; mobId: string; damage: number }, ack) => {
      const mob = damageMob(data.code, data.mobId, data.damage);
      if (!mob) { ack?.({ error: "Mob not found" }); return; }
      const room = getRoom(data.code);
      if (room) {
        io.to(`room:${data.code}`).emit("mob:damaged", { mobId: data.mobId, hp: mob.hp, isAlive: mob.isAlive });
        if (!mob.isAlive) {
          io.to(`room:${data.code}`).emit("mob:died", { mobId: data.mobId });
        }
      }
      ack?.({ ok: true, mob });
    });

    socket.on("player:emote", (data: { code: string; playerId: string; emote: string }) => {
      setEmote(data.code, data.playerId, data.emote);
      io.to(`room:${data.code}`).emit("player:emoted", { playerId: data.playerId, emote: data.emote });
    });

    socket.on("player:flashlight", (data: { code: string; playerId: string; on: boolean }) => {
      const room = getRoom(data.code);
      if (!room) return;
      const player = room.players.get(data.playerId);
      if (player) {
        player.flashlightOn = data.on;
        io.to(`room:${data.code}`).emit("player:flashlight", { playerId: data.playerId, on: data.on });
      }
    });

    socket.on("level:complete", (data: { code: string; playerId: string }, ack) => {
      const room = getRoom(data.code);
      if (!room) { ack?.({ error: "Room not found" }); return; }
      const player = room.players.get(data.playerId);
      if (!player?.isHost) { ack?.({ error: "Not host" }); return; }
      const continued = advanceLevel(data.code);
      if (!continued) {
        io.to(`room:${data.code}`).emit("game:won", { message: "Vous avez survécu aux Backrooms !" });
        ack?.({ won: true });
        return;
      }
      for (const p of room.players.values()) {
        if (room.difficulty !== "nightmare") {
          saveProgress(p.id, p.name, room.currentLevel, room.difficulty);
        }
      }
      io.to(`room:${data.code}`).emit("level:advanced", {
        newLevel: room.currentLevel,
        levelConfig: LEVEL_CONFIGS[room.currentLevel],
        state: getRoomState(room),
      });
      ack?.({ ok: true, newLevel: room.currentLevel });
    });

    socket.on("game:state:request", (data: { code: string }, ack) => {
      const room = getRoom(data.code);
      if (!room) { ack?.({ error: "Room not found" }); return; }
      ack?.({ state: getRoomState(room) });
    });

    socket.on("chat:message", (data: { code: string; playerId: string; message: string }) => {
      const room = getRoom(data.code);
      if (!room) return;
      const player = room.players.get(data.playerId);
      if (!player) return;
      io.to(`room:${data.code}`).emit("chat:message", {
        playerId: data.playerId,
        playerName: player.name,
        message: data.message.substring(0, 200),
        timestamp: Date.now(),
      });
    });

    socket.on("disconnect", () => {
      const { roomCode, playerId } = socket.data;
      if (roomCode && playerId) {
        leaveRoom(roomCode, playerId);
        io.to(`room:${roomCode}`).emit("player:left", { playerId });
        logger.info({ roomCode, playerId }, "Player disconnected and left room");
      }
    });

    setInterval(() => {
      const { roomCode } = socket.data;
      if (roomCode) {
        const room = getRoom(roomCode);
        if (room?.status === "playing") {
          socket.emit("game:tick", {
            players: Array.from(room.players.values()),
            mobs: Array.from(room.mobs.values()).filter(m => m.isAlive),
            tick: room.tick,
          });
        }
      }
    }, 50);
  });

  return io;
}

export function getIO(): SocketServer {
  return io;
}
