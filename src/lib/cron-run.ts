import { prisma } from "@/lib/prisma";

export async function recordCronRun(
  job: string,
  opts?: { ok?: boolean; meta?: Record<string, unknown> }
) {
  try {
    await prisma.cronRun.upsert({
      where: { job },
      create: {
        job,
        lastRunAt: new Date(),
        ok: opts?.ok !== false,
        meta: opts?.meta ? JSON.stringify(opts.meta) : null,
      },
      update: {
        lastRunAt: new Date(),
        ok: opts?.ok !== false,
        meta: opts?.meta ? JSON.stringify(opts.meta) : null,
      },
    });
  } catch (e) {
    console.error("[cron-run] record failed", job, e);
  }
}

export async function listCronRuns() {
  try {
    return await prisma.cronRun.findMany({ orderBy: { job: "asc" } });
  } catch {
    return [];
  }
}
