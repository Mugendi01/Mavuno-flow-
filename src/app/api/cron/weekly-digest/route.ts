import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ReportService } from "@/lib/services/reportService";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const secret = process.env.CRON_SECRET || "farmpulse-cron-secret-token";

    if (authHeader !== `Bearer ${secret}`) {
      // In development we allow localhost requests
      const isDev = process.env.NODE_ENV !== "production";
      if (!isDev) {
        return NextResponse.json({ error: "Unauthorized cron call" }, { status: 401 });
      }
    }

    // Find all farms with enabled report preferences
    const activePreferences = await prisma.reportPreference.findMany({
      where: { isEnabled: true },
      include: { farm: true },
    });

    const executionResults: any[] = [];

    for (const pref of activePreferences) {
      try {
        const digest = await ReportService.compileWeeklyDigest(pref.farmId, new Date());
        const html = ReportService.generateEmailHTML(digest);
        const report = await ReportService.persistReport(digest);

        // Simulation / hook for Resend email sending
        let emailSent = false;
        if (process.env.RESEND_API_KEY) {
          // Send via Resend if API key is provided
          try {
            const resendRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "FarmPulse Reports <reports@farmpulse.co.ke>",
                to: [pref.emailAddress],
                subject: `Weekly Farm Digest: ${pref.farm.name} (Week ${digest.period.weekNumber})`,
                html,
              }),
            });
            emailSent = resendRes.ok;
          } catch (emailErr) {
            console.error("Resend API dispatch error:", emailErr);
          }
        } else {
          // Log simulated dispatch for local dev
          console.log(`[SIMULATED DISPATCH] Sent weekly digest to ${pref.emailAddress} for farm ${pref.farm.name}`);
          emailSent = true;
        }

        if (emailSent) {
          await prisma.weeklyReport.update({
            where: { id: report.id },
            data: { status: "SENT", sentAt: new Date() },
          });
        }

        executionResults.push({
          farmId: pref.farmId,
          farmName: pref.farm.name,
          email: pref.emailAddress,
          status: emailSent ? "SENT" : "FAILED",
        });
      } catch (err: any) {
        console.error(`Error processing weekly digest for farm ${pref.farmId}:`, err);
        executionResults.push({
          farmId: pref.farmId,
          farmName: pref.farm.name,
          error: err.message,
          status: "FAILED",
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedFarmsCount: activePreferences.length,
      results: executionResults,
    });
  } catch (error: any) {
    console.error("Cron weekly-digest failure:", error);
    return NextResponse.json({ error: error.message || "Cron failure" }, { status: 500 });
  }
}
