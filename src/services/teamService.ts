import type { CreateTeamData } from "../types/team";

// Only use API-based functions
export async function getAllTeams() {
  const res = await fetch("/api/teams", {
    headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
  });
  return await res.json();
}

export async function getUserTeams(_id: string) {
  const res = await fetch("/api/teams/mine", {
    headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
  });
  return await res.json();
}

export async function createTeam(
  data: any,
  _email: string,
  _createForm: CreateTeamData,
) {
  const res = await fetch("/api/teams", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("authToken")}`,
    },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function joinTeam(
  teamId: string,
  _email: string,
  _joinTeamId: string,
) {
  const res = await fetch(`/api/teams/${teamId}/join`, {
    method: "POST",
    headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
  });
  return await res.json();
}
