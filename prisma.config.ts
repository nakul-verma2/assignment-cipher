// Prisma 5.x does not provide a `prisma/config` module (that is a Prisma 7 API),
// so this file intentionally avoids that import to keep `next build` type-checking green.
// Agent skill targets: claude, cursor, agents, devin (synced via `prisma skills sync` in postinstall).
export default {
  skills: {
    agents: ["claude", "cursor", "agents", "devin"],
  },
};
