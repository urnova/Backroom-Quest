import { Router, type IRouter } from "express";
import {
  CreateRoomBody,
  GetRoomParams,
  JoinRoomParams,
  JoinRoomBody,
  GetRoomStateParams,
} from "@workspace/api-zod";
import {
  createRoom,
  getRoom,
  joinRoom,
  roomToJSON,
  getRoomState,
} from "../lib/gameState";

const router: IRouter = Router();

router.post("/rooms", async (req, res): Promise<void> => {
  const parsed = CreateRoomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { hostName, maxPlayers } = parsed.data;
  const difficulty = (req.body.difficulty as string) || "normal";
  const room = createRoom(
    hostName,
    maxPlayers ?? 4,
    difficulty as "easy" | "normal" | "hard" | "nightmare"
  );
  res.status(201).json(roomToJSON(room));
});

router.get("/rooms/:code", async (req, res): Promise<void> => {
  const params = GetRoomParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const room = getRoom(params.data.code);
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json(roomToJSON(room));
});

router.post("/rooms/:code/join", async (req, res): Promise<void> => {
  const params = JoinRoomParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = JoinRoomBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const result = joinRoom(params.data.code, body.data.playerName);
  if (!result) {
    res.status(400).json({ error: "Room not found, full, or already started" });
    return;
  }
  res.json({
    room: roomToJSON(result.room),
    playerId: result.player.id,
    playerName: result.player.name,
  });
});

router.get("/rooms/:code/state", async (req, res): Promise<void> => {
  const params = GetRoomStateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const room = getRoom(params.data.code);
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json(getRoomState(room));
});

export default router;
