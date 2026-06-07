import { connectToDatabase } from "@/lib/server/mongodb";
import { Award, SocialLinks, UserAward, UserProfile } from "@/lib/server/models";
import { fail, ok } from "@/lib/server/api";

export async function GET(_request, { params }) {
  try {
    await connectToDatabase();
    const userId = Number(params.userId);
    const profile = await UserProfile.findOne({ legacyId: userId });

    if (!profile) {
      return fail("User not found", 404);
    }

    const socialLinks = await SocialLinks.findOne({ userId });
    const userAwards = await UserAward.find({ userId });
    const awards = userAwards.length
      ? await Award.find({ legacyId: { $in: userAwards.map((entry) => entry.awardId) } })
      : [];

    return ok({
      status: true,
      data: {
        name: profile.name,
        image: profile.profilePic || "",
        email: profile.email,
        phoneNumber: profile.phoneNumber || "",
        address: profile.address || "",
        nationality: profile.nationality || "",
        languages: profile.languages || "",
        socialLinks: socialLinks
          ? {
              facebook: socialLinks.facebook || "",
              instagram: socialLinks.instagram || "",
              linkedin: socialLinks.linkedin || "",
              youtube: socialLinks.youtube || "",
            }
          : null,
        awards: awards.map((award) => ({
          title: award.title,
          description: award.description,
          image: award.image,
        })),
      },
    });
  } catch (error) {
    return fail("Failed to load profile", 500, error.message);
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectToDatabase();
    const userId = Number(params.userId);
    const body = await request.json();

    const profile = await UserProfile.findOne({ legacyId: userId });
    if (!profile) {
      return fail("User not found", 404);
    }

    if (body.name !== undefined) profile.name = String(body.name).trim();
    if (body.phoneNumber !== undefined) profile.phoneNumber = String(body.phoneNumber).trim();
    if (body.address !== undefined) profile.address = String(body.address).trim();
    if (body.nationality !== undefined) profile.nationality = String(body.nationality).trim();
    if (body.languages !== undefined) profile.languages = String(body.languages).trim();
    await profile.save();

    if (
      body.socialLinks ||
      body.facebook !== undefined ||
      body.instagram !== undefined ||
      body.linkedin !== undefined ||
      body.youtube !== undefined
    ) {
      const links = body.socialLinks || body;
      await SocialLinks.findOneAndUpdate(
        { userId },
        {
          userId,
          facebook: String(links.facebook || "").trim(),
          instagram: String(links.instagram || "").trim(),
          linkedin: String(links.linkedin || "").trim(),
          youtube: String(links.youtube || "").trim(),
        },
        { upsert: true, new: true }
      );
    }

    const socialLinks = await SocialLinks.findOne({ userId });
    const userAwards = await UserAward.find({ userId });
    const awards = userAwards.length
      ? await Award.find({ legacyId: { $in: userAwards.map((entry) => entry.awardId) } })
      : [];

    return ok({
      status: true,
      message: "Profile updated successfully.",
      data: {
        name: profile.name,
        image: profile.profilePic || "",
        email: profile.email,
        phoneNumber: profile.phoneNumber || "",
        address: profile.address || "",
        nationality: profile.nationality || "",
        languages: profile.languages || "",
        socialLinks: socialLinks
          ? {
              facebook: socialLinks.facebook || "",
              instagram: socialLinks.instagram || "",
              linkedin: socialLinks.linkedin || "",
              youtube: socialLinks.youtube || "",
            }
          : null,
        awards: awards.map((award) => ({
          title: award.title,
          description: award.description,
          image: award.image,
        })),
      },
    });
  } catch (error) {
    return fail("Failed to update profile", 500, error.message);
  }
}
