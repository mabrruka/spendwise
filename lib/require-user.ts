
import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Returns the ID of the currently signed-in user.
 *
 * If no user is signed in, redirects to /signin.
 *
 * Use this helper in protected Spendwise pages.
 */
export async function requireUser(): Promise<string> {
    const session = await auth();

    const userId = session?.user?.id;

    if (!userId) {
        redirect("/signin");
    }

    return userId;
}
