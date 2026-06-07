import { connectToDatabase } from "@/lib/server/mongodb";
import { ReportIssue } from "@/lib/server/models";
import { fail, ok } from "@/lib/server/api";

export async function GET() {
  try {
    await connectToDatabase();
    const issues = await ReportIssue.find().sort({ submitTime: -1 });

    return ok({
      status: true,
      data: issues.map((issue) => ({
        id: String(issue._id),
        user_id: issue.userId,
        title: issue.title,
        description: issue.description,
        status: issue.status || "open",
        resolution_note: issue.resolutionNote || "",
        submit_time: issue.submitTime,
        resolved_at: issue.resolvedAt || null,
      })),
    });
  } catch (error) {
    return fail("Failed to load issues", 500, error.message);
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const userId = Number(body.user_id);
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();

    if (!userId || !title || !description) {
      return fail("User, title, and description are required.", 422);
    }

    const latestIssue = await ReportIssue.findOne().sort({ legacyId: -1 }).select("legacyId");
    const nextLegacyId = (latestIssue?.legacyId || 0) + 1;

    await ReportIssue.create({
      legacyId: nextLegacyId,
      userId,
      title,
      description,
      submitTime: new Date(),
    });

    return ok({
      status: true,
      message: "Issue submitted successfully.",
    });
  } catch (error) {
    return fail("Failed to submit issue", 500, error.message);
  }
}

export async function PATCH(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const issueId = String(body.issue_id || "").trim();
    const status = String(body.status || "").trim().toLowerCase();
    const resolutionNote = String(body.resolution_note || "").trim();

    if (!issueId || !status) {
      return fail("Issue id and status are required.", 422);
    }

    if (!["open", "resolved"].includes(status)) {
      return fail("Status must be open or resolved.", 422);
    }

    const updated = await ReportIssue.findByIdAndUpdate(
      issueId,
      {
        status,
        resolutionNote: resolutionNote || "",
        resolvedAt: status === "resolved" ? new Date() : null,
      },
      { new: true }
    );

    if (!updated) {
      return fail("Issue not found", 404);
    }

    return ok({
      status: true,
      message: "Issue updated successfully.",
      data: {
        id: String(updated._id),
        status: updated.status,
        resolution_note: updated.resolutionNote || "",
        resolved_at: updated.resolvedAt || null,
      },
    });
  } catch (error) {
    return fail("Failed to update issue", 500, error.message);
  }
}
